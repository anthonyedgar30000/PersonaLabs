import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { analyzeAndPersistVideo } from "../src/classification-persistence.js";
import { createLocalDatabase } from "../src/local-db.js";

test("lists recently analyzed videos with classification details", async () => {
  const { db, cleanup } = await openTempDatabase();

  try {
    analyzeAndPersistVideo({
      database: db,
      lens: "CALMER",
      video: {
        platform: "youtube",
        platformVideoId: "rabbit-1",
        title: "Funny Rabbit Compilation",
        channelName: "Bunny Clips",
      },
    });
    const second = analyzeAndPersistVideo({
      database: db,
      lens: "CALMER",
      video: {
        platform: "youtube",
        platformVideoId: "dog-1",
        title: "Injured Dog Emergency Rescue",
        channelName: "Animal Rescue",
      },
    });

    const recent = db.listRecentHistory();

    assert.equal(recent.length, 2);
    assert.equal(recent[0].classification_event_id, second.event.id);
    assert.equal(recent[0].title, "Injured Dog Emergency Rescue");
    assert.equal(recent[0].final_color, "RED");
    assert.equal(recent[0].lens, "CALMER");
    assert.equal(recent[0].domain, "ANIMAL_PET_NATURE");
    assert.match(recent[0].explanation, /RED/);
    assert.equal(typeof recent[0].created_at, "string");
  } finally {
    db.close();
    await cleanup();
  }
});

test("includes optional user correction in history rows", async () => {
  const { db, cleanup } = await openTempDatabase();

  try {
    const result = analyzeAndPersistVideo({
      database: db,
      lens: "CALMER",
      video: {
        platform: "youtube",
        platformVideoId: "cat-fails",
        title: "Funny Cat Fails",
        channelName: "Pet Clips",
      },
    });

    db.saveUserCorrection({
      classificationEventId: result.event.id,
      videoId: result.video.id,
      expectedColor: "GREEN",
      comment: "Harmless pet play.",
    });

    const [historyRow] = db.listRecentHistory();

    assert.equal(historyRow.user_correction, "GREEN");
    assert.equal(historyRow.user_correction_comment, "Harmless pet play.");
  } finally {
    db.close();
    await cleanup();
  }
});

test("reports simple local history stats", async () => {
  const { db, cleanup } = await openTempDatabase();

  try {
    analyzeAndPersistVideo({
      database: db,
      lens: "CALMER",
      video: {
        platform: "youtube",
        platformVideoId: "green-1",
        title: "Cute Bunny Eating Carrot",
      },
    });
    analyzeAndPersistVideo({
      database: db,
      lens: "CALMER",
      video: {
        platform: "youtube",
        platformVideoId: "red-1",
        title: "Animal Abuse Investigation",
      },
    });

    assert.deepEqual(db.getHistoryStats(), {
      total: 2,
      byColor: {
        GREEN: 1,
        RED: 1,
      },
    });
  } finally {
    db.close();
    await cleanup();
  }
});

test("deletes one history record without deleting the video", async () => {
  const { db, cleanup } = await openTempDatabase();

  try {
    const first = analyzeAndPersistVideo({
      database: db,
      lens: "CALMER",
      video: {
        platform: "youtube",
        platformVideoId: "repeat-1",
        title: "Bunny Room Makeover",
      },
    });
    analyzeAndPersistVideo({
      database: db,
      lens: "CALMER",
      video: {
        platform: "youtube",
        platformVideoId: "repeat-1",
        title: "Bunny Room Makeover",
      },
    });

    assert.equal(db.getClassificationHistory(first.video.id).length, 2);
    assert.equal(db.deleteHistoryRecord(first.event.id), true);
    assert.equal(db.getVideo(first.video.id).id, first.video.id);
    assert.equal(db.getClassificationHistory(first.video.id).length, 1);
  } finally {
    db.close();
    await cleanup();
  }
});

test("clears all local history", async () => {
  const { db, cleanup } = await openTempDatabase();

  try {
    const result = analyzeAndPersistVideo({
      database: db,
      lens: "CALMER",
      video: {
        platform: "youtube",
        platformVideoId: "clear-1",
        title: "Cute Puppy Shorts",
      },
    });
    db.createSearchSession({
      lens: "CALMER",
      queryText: "cute puppy shorts",
    });
    db.saveUserCorrection({
      classificationEventId: result.event.id,
      videoId: result.video.id,
      expectedColor: "GREEN",
    });

    assert.equal(db.clearLocalHistory(), 1);
    assert.equal(db.listRecentHistory().length, 0);
    assert.equal(db.listVideos().length, 0);
    assert.equal(db.getHistoryStats().total, 0);
    assert.equal(db.db.prepare("SELECT COUNT(*) AS count FROM search_sessions").get().count, 0);
    assert.equal(db.db.prepare("SELECT COUNT(*) AS count FROM user_feedback").get().count, 0);
  } finally {
    db.close();
    await cleanup();
  }
});

async function openTempDatabase() {
  const directory = await mkdtemp(path.join(tmpdir(), "personalabs-history-db-"));
  const filename = path.join(directory, "personalabs.sqlite");

  return {
    db: createLocalDatabase(filename),
    cleanup: () => rm(directory, {
      force: true,
      recursive: true,
    }),
  };
}
