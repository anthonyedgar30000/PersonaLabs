import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { createLocalDatabase } from "../src/local-db.js";

test("database initializes requested tables", async () => {
  const { db, cleanup } = await openTempDatabase();

  try {
    const tables = db.db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type = 'table'
      ORDER BY name
    `).all().map((row) => row.name);

    assert.ok(tables.includes("videos"));
    assert.ok(tables.includes("classification_events"));
    assert.ok(tables.includes("detected_signals"));
    assert.ok(tables.includes("search_sessions"));
    assert.ok(tables.includes("user_feedback"));
  } finally {
    db.close();
    await cleanup();
  }
});

test("can save analyzed video, classification result, and detected signals", async () => {
  const { db, cleanup } = await openTempDatabase();

  try {
    const video = db.createVideo({
      platform: "youtube",
      platformVideoId: "rabbit-123",
      url: "https://youtube.example/watch?v=rabbit-123",
      title: "Funny Rabbit Compilation",
      channelName: "Cozy Bunny Clips",
      durationSeconds: 420,
      metadata: {
        source: "local-test",
      },
    });

    assert.equal(video.id, 1);
    assert.equal(video.title, "Funny Rabbit Compilation");
    assert.deepEqual(video.metadata, { source: "local-test" });

    const event = db.createClassificationEvent({
      videoId: video.id,
      lens: "CALMER",
      domain: "ANIMAL_PET_NATURE",
      finalColor: "GREEN",
      finalScore: -3,
      explanation: "Marked GREEN because safe animal baseline applies.",
      classifierVersion: "semantic-core-test",
      heuristicConfigHash: "hash:test",
      rawResult: {
        label: "GREEN",
        suppressedSignals: ["funny", "compilation"],
      },
    });

    assert.equal(event.video_id, video.id);
    assert.equal(event.final_color, "GREEN");
    assert.deepEqual(event.raw_result, {
      label: "GREEN",
      suppressedSignals: ["funny", "compilation"],
    });

    db.createDetectedSignal({
      classificationEventId: event.id,
      signalType: "domain",
      signalValue: "rabbit",
      severity: "positive",
      weight: -1,
      suppressed: false,
      reason: "Animal/pet/nature domain match.",
    });
    db.createDetectedSignal({
      classificationEventId: event.id,
      signalType: "suppressed_low_severity",
      signalValue: "funny",
      severity: "low",
      weight: 0,
      suppressed: true,
      reason: "Harmless animal engagement.",
    });

    const signals = db.listDetectedSignals(event.id);

    assert.equal(signals.length, 2);
    assert.equal(signals[0].signal_value, "rabbit");
    assert.equal(signals[1].suppressed, 1);
  } finally {
    db.close();
    await cleanup();
  }
});

test("supports basic CRUD helpers for videos, search sessions, and feedback", async () => {
  const { db, cleanup } = await openTempDatabase();

  try {
    const video = db.createVideo({
      platform: "youtube",
      platformVideoId: "aquarium-1",
      title: "Relaxing Aquarium Fish",
    });
    const updatedVideo = db.updateVideo(video.id, {
      channelName: "Peaceful Pets",
      metadata: { category: "pets" },
    });

    assert.equal(updatedVideo.channel_name, "Peaceful Pets");
    assert.deepEqual(updatedVideo.metadata, { category: "pets" });
    assert.equal(db.findVideoByPlatformId("youtube", "aquarium-1").id, video.id);
    assert.equal(db.listVideos().length, 1);

    const session = db.createSearchSession({
      lens: "CALMER",
      queryText: "relaxing aquarium",
      resultCount: 10,
      metadata: { intent: "calm browsing" },
    });
    const updatedSession = db.updateSearchSession(session.id, {
      endedAt: "2026-05-16T00:00:00.000Z",
      notes: "completed",
    });

    assert.equal(updatedSession.notes, "completed");
    assert.deepEqual(updatedSession.metadata, { intent: "calm browsing" });

    const event = db.createClassificationEvent({
      videoId: video.id,
      lens: "CALMER",
      domain: "ANIMAL_PET_NATURE",
      finalColor: "GREEN",
      classifierVersion: "semantic-core-test",
      rawResult: { label: "GREEN" },
    });
    const feedback = db.createUserFeedback({
      classificationEventId: event.id,
      videoId: video.id,
      feedbackType: "color_confirmed",
      expectedColor: "GREEN",
      comment: "Looks right.",
    });

    assert.equal(db.getUserFeedback(feedback.id).feedback_type, "color_confirmed");
    assert.equal(db.listUserFeedbackForVideo(video.id).length, 1);
    assert.equal(db.deleteUserFeedback(feedback.id), true);
    assert.equal(db.deleteSearchSession(session.id), true);
    assert.equal(db.deleteVideo(video.id), true);
    assert.equal(db.getVideo(video.id), undefined);
    assert.equal(db.listClassificationEventsForVideo(video.id).length, 0);
  } finally {
    db.close();
    await cleanup();
  }
});

async function openTempDatabase() {
  const directory = await mkdtemp(path.join(tmpdir(), "personalabs-db-"));
  const filename = path.join(directory, "personalabs.sqlite");

  return {
    db: createLocalDatabase(filename),
    cleanup: () => rm(directory, {
      force: true,
      recursive: true,
    }),
  };
}
