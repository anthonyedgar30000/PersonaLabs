import { DatabaseSync } from "node:sqlite";

export const SCHEMA_VERSION = 1;

export class PersonaLabsDatabase {
  constructor(filename = ":memory:") {
    this.db = new DatabaseSync(filename);
    this.db.exec("PRAGMA foreign_keys = ON");
    this.initialize();
  }

  initialize() {
    this.db.exec(SCHEMA_SQL);
  }

  close() {
    this.db.close();
  }

  createVideo(video) {
    const result = this.db.prepare(`
      INSERT INTO videos (
        platform,
        platform_video_id,
        url,
        title,
        channel_name,
        duration_seconds,
        published_at,
        metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      video.platform,
      video.platformVideoId ?? null,
      video.url ?? null,
      video.title,
      video.channelName ?? null,
      video.durationSeconds ?? null,
      video.publishedAt ?? null,
      toJson(video.metadata),
    );

    return this.getVideo(Number(result.lastInsertRowid));
  }

  saveVideo(video) {
    const existing = video.platformVideoId
      ? this.findVideoByPlatformId(video.platform, video.platformVideoId)
      : undefined;

    if (!existing) {
      return this.createVideo(video);
    }

    return this.updateVideo(existing.id, video);
  }

  getVideo(id) {
    return hydrateJsonFields(this.db.prepare("SELECT * FROM videos WHERE id = ?").get(id));
  }

  findVideoByPlatformId(platform, platformVideoId) {
    return hydrateJsonFields(
      this.db.prepare(`
        SELECT * FROM videos
        WHERE platform = ? AND platform_video_id = ?
      `).get(platform, platformVideoId),
    );
  }

  listVideos() {
    return this.db.prepare("SELECT * FROM videos ORDER BY id").all().map(hydrateJsonFields);
  }

  updateVideo(id, updates) {
    const existing = this.getVideo(id);

    if (!existing) {
      return undefined;
    }

    this.db.prepare(`
      UPDATE videos
      SET
        platform = ?,
        platform_video_id = ?,
        url = ?,
        title = ?,
        channel_name = ?,
        duration_seconds = ?,
        published_at = ?,
        metadata_json = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      updates.platform ?? existing.platform,
      updates.platformVideoId ?? existing.platform_video_id,
      updates.url ?? existing.url,
      updates.title ?? existing.title,
      updates.channelName ?? existing.channel_name,
      updates.durationSeconds ?? existing.duration_seconds,
      updates.publishedAt ?? existing.published_at,
      updates.metadata === undefined ? existing.metadata_json : toJson(updates.metadata),
      id,
    );

    return this.getVideo(id);
  }

  deleteVideo(id) {
    return this.db.prepare("DELETE FROM videos WHERE id = ?").run(id).changes > 0;
  }

  createClassificationEvent(event) {
    const result = this.db.prepare(`
      INSERT INTO classification_events (
        video_id,
        lens,
        domain,
        final_color,
        final_score,
        explanation,
        classifier_version,
        heuristic_config_hash,
        raw_result_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      event.videoId,
      event.lens,
      event.domain,
      event.finalColor,
      event.finalScore ?? null,
      event.explanation ?? null,
      event.classifierVersion,
      event.heuristicConfigHash ?? null,
      toJson(event.rawResult ?? {}),
    );

    return this.getClassificationEvent(Number(result.lastInsertRowid));
  }

  getClassificationEvent(id) {
    return hydrateJsonFields(
      this.db.prepare("SELECT * FROM classification_events WHERE id = ?").get(id),
    );
  }

  listClassificationEventsForVideo(videoId) {
    return this.db.prepare(`
      SELECT * FROM classification_events
      WHERE video_id = ?
      ORDER BY id
    `).all(videoId).map(hydrateJsonFields);
  }

  getClassificationHistory(videoId) {
    return this.listClassificationEventsForVideo(videoId);
  }

  listRecentHistory(limit = 25) {
    return this.db.prepare(`
      SELECT
        ce.id AS classification_event_id,
        ce.video_id,
        v.platform,
        v.platform_video_id,
        v.url,
        v.title,
        v.channel_name,
        ce.final_color,
        ce.lens,
        ce.domain,
        ce.explanation,
        ce.created_at,
        (
          SELECT expected_color
          FROM user_feedback uf
          WHERE uf.classification_event_id = ce.id
          ORDER BY uf.id DESC
          LIMIT 1
        ) AS user_correction,
        (
          SELECT comment
          FROM user_feedback uf
          WHERE uf.classification_event_id = ce.id
          ORDER BY uf.id DESC
          LIMIT 1
        ) AS user_correction_comment
      FROM classification_events ce
      JOIN videos v ON v.id = ce.video_id
      ORDER BY ce.id DESC
      LIMIT ?
    `).all(limit);
  }

  getHistoryStats() {
    const totalsByColor = this.db.prepare(`
      SELECT final_color, COUNT(*) AS count
      FROM classification_events
      GROUP BY final_color
      ORDER BY final_color
    `).all();
    const total = this.db.prepare(`
      SELECT COUNT(*) AS count
      FROM classification_events
    `).get().count;

    return {
      total,
      byColor: Object.fromEntries(totalsByColor.map((row) => [row.final_color, row.count])),
    };
  }

  deleteHistoryRecord(classificationEventId) {
    return this.deleteClassificationEvent(classificationEventId);
  }

  clearLocalHistory() {
    this.db.prepare("DELETE FROM user_feedback").run();
    const result = this.db.prepare("DELETE FROM videos").run();
    this.db.prepare("DELETE FROM search_sessions").run();

    return result.changes;
  }

  saveUserCorrection({ classificationEventId, videoId, expectedColor, comment }) {
    return this.createUserFeedback({
      classificationEventId,
      videoId,
      feedbackType: "color_correction",
      expectedColor,
      comment,
    });
  }

  deleteClassificationEvent(id) {
    return this.db.prepare("DELETE FROM classification_events WHERE id = ?").run(id).changes > 0;
  }

  createDetectedSignal(signal) {
    const result = this.db.prepare(`
      INSERT INTO detected_signals (
        classification_event_id,
        signal_type,
        signal_value,
        severity,
        weight,
        suppressed,
        reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      signal.classificationEventId,
      signal.signalType,
      signal.signalValue,
      signal.severity ?? null,
      signal.weight ?? null,
      signal.suppressed ? 1 : 0,
      signal.reason ?? null,
    );

    return this.getDetectedSignal(Number(result.lastInsertRowid));
  }

  getDetectedSignal(id) {
    return this.db.prepare("SELECT * FROM detected_signals WHERE id = ?").get(id);
  }

  listDetectedSignals(classificationEventId) {
    return this.db.prepare(`
      SELECT * FROM detected_signals
      WHERE classification_event_id = ?
      ORDER BY id
    `).all(classificationEventId);
  }

  deleteDetectedSignal(id) {
    return this.db.prepare("DELETE FROM detected_signals WHERE id = ?").run(id).changes > 0;
  }

  createSearchSession(session) {
    const result = this.db.prepare(`
      INSERT INTO search_sessions (
        lens,
        query_text,
        ended_at,
        result_count,
        notes,
        metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      session.lens,
      session.queryText ?? null,
      session.endedAt ?? null,
      session.resultCount ?? null,
      session.notes ?? null,
      toJson(session.metadata),
    );

    return this.getSearchSession(Number(result.lastInsertRowid));
  }

  getSearchSession(id) {
    return hydrateJsonFields(this.db.prepare("SELECT * FROM search_sessions WHERE id = ?").get(id));
  }

  updateSearchSession(id, updates) {
    const existing = this.getSearchSession(id);

    if (!existing) {
      return undefined;
    }

    this.db.prepare(`
      UPDATE search_sessions
      SET
        lens = ?,
        query_text = ?,
        ended_at = ?,
        result_count = ?,
        notes = ?,
        metadata_json = ?
      WHERE id = ?
    `).run(
      updates.lens ?? existing.lens,
      updates.queryText ?? existing.query_text,
      updates.endedAt ?? existing.ended_at,
      updates.resultCount ?? existing.result_count,
      updates.notes ?? existing.notes,
      updates.metadata === undefined ? existing.metadata_json : toJson(updates.metadata),
      id,
    );

    return this.getSearchSession(id);
  }

  deleteSearchSession(id) {
    return this.db.prepare("DELETE FROM search_sessions WHERE id = ?").run(id).changes > 0;
  }

  createUserFeedback(feedback) {
    const result = this.db.prepare(`
      INSERT INTO user_feedback (
        classification_event_id,
        video_id,
        feedback_type,
        expected_color,
        comment
      ) VALUES (?, ?, ?, ?, ?)
    `).run(
      feedback.classificationEventId ?? null,
      feedback.videoId ?? null,
      feedback.feedbackType,
      feedback.expectedColor ?? null,
      feedback.comment ?? null,
    );

    return this.getUserFeedback(Number(result.lastInsertRowid));
  }

  getUserFeedback(id) {
    return this.db.prepare("SELECT * FROM user_feedback WHERE id = ?").get(id);
  }

  listUserFeedbackForVideo(videoId) {
    return this.db.prepare(`
      SELECT * FROM user_feedback
      WHERE video_id = ?
      ORDER BY id
    `).all(videoId);
  }

  deleteUserFeedback(id) {
    return this.db.prepare("DELETE FROM user_feedback WHERE id = ?").run(id).changes > 0;
  }
}

export function createLocalDatabase(filename = ":memory:") {
  return new PersonaLabsDatabase(filename);
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  platform_video_id TEXT,
  url TEXT,
  title TEXT NOT NULL,
  channel_name TEXT,
  duration_seconds INTEGER,
  published_at TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform, platform_video_id)
);

CREATE TABLE IF NOT EXISTS classification_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  lens TEXT NOT NULL,
  domain TEXT NOT NULL,
  final_color TEXT NOT NULL,
  final_score REAL,
  explanation TEXT,
  classifier_version TEXT NOT NULL,
  heuristic_config_hash TEXT,
  raw_result_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS detected_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  classification_event_id INTEGER NOT NULL,
  signal_type TEXT NOT NULL,
  signal_value TEXT NOT NULL,
  severity TEXT,
  weight REAL,
  suppressed INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (classification_event_id) REFERENCES classification_events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS search_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lens TEXT NOT NULL,
  query_text TEXT,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TEXT,
  result_count INTEGER,
  notes TEXT,
  metadata_json TEXT
);

CREATE TABLE IF NOT EXISTS user_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  classification_event_id INTEGER,
  video_id INTEGER,
  feedback_type TEXT NOT NULL,
  expected_color TEXT,
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (classification_event_id) REFERENCES classification_events(id) ON DELETE SET NULL,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_videos_platform_video_id
  ON videos(platform, platform_video_id);

CREATE INDEX IF NOT EXISTS idx_classification_events_video_id
  ON classification_events(video_id);

CREATE INDEX IF NOT EXISTS idx_detected_signals_event
  ON detected_signals(classification_event_id);

CREATE INDEX IF NOT EXISTS idx_user_feedback_video
  ON user_feedback(video_id);
`;

function toJson(value) {
  return value === undefined ? null : JSON.stringify(value);
}

function hydrateJsonFields(row) {
  if (!row) {
    return undefined;
  }

  return {
    ...row,
    metadata: parseJson(row.metadata_json),
    raw_result: parseJson(row.raw_result_json),
  };
}

function parseJson(value) {
  return value == null ? undefined : JSON.parse(value);
}
