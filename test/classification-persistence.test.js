import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { analyzeAndPersistVideo } from "../src/classification-persistence.js";
import { createLocalDatabase } from "../src/local-db.js";

test("analyzing a video creates video, classification, and signal records", async () => {
  const { db, cleanup } = await openTempDatabase();

  try {
    const result = analyzeAndPersistVideo({
      database: db,
      lens: "CALMER",
      video: {
        platform: "youtube",
        platformVideoId: "rabbit-zoomies",
        title: "Funny Rabbit Compilation",
        channelName: "Bunny Clips",
      },
      classifierVersion: "semantic-core-test",
    });

    assert.equal(result.video.id, 1);
    assert.equal(result.classification.label, "GREEN");
    assert.equal(result.event.video_id, result.video.id);
    assert.equal(result.event.lens, "CALMER");
    assert.equal(result.event.domain, "ANIMAL_PET_NATURE");
    assert.equal(result.event.final_color, "GREEN");
    assert.equal(result.event.explanation, result.classification.explanation);

    const signals = db.listDetectedSignals(result.event.id);

    assert.deepEqual(signals.map((signal) => signal.signal_type), [
      "domain",
      "suppressed_low_severity",
      "suppressed_low_severity",
    ]);
    assert.deepEqual(signals.map((signal) => signal.signal_value), [
      "ANIMAL_PET_NATURE",
      "funny",
      "compilation",
    ]);
  } finally {
    db.close();
    await cleanup();
  }
});

test("repeated videos reuse the video record and append classification history", async () => {
  const { db, cleanup } = await openTempDatabase();

  try {
    const first = analyzeAndPersistVideo({
      database: db,
      lens: "CALMER",
      video: {
        platform: "youtube",
        platformVideoId: "pet-spend",
        title: "How Much I Spend on My Pets Yearly",
        channelName: "Pet Budget",
      },
    });
    const second = analyzeAndPersistVideo({
      database: db,
      lens: "CALMER",
      video: {
        platform: "youtube",
        platformVideoId: "pet-spend",
        title: "How Much I Spend on My Pets Yearly",
        channelName: "Updated Pet Budget",
      },
    });

    assert.equal(first.video.id, second.video.id);
    assert.equal(db.listVideos().length, 1);
    assert.equal(db.getVideo(first.video.id).channel_name, "Updated Pet Budget");

    const history = db.getClassificationHistory(first.video.id);

    assert.equal(history.length, 2);
    assert.deepEqual(history.map((event) => event.final_color), ["GREEN", "GREEN"]);
  } finally {
    db.close();
    await cleanup();
  }
});

test("classification history includes escalation signals for later audit", async () => {
  const { db, cleanup } = await openTempDatabase();

  try {
    const result = analyzeAndPersistVideo({
      database: db,
      lens: "CALMER",
      video: {
        platform: "youtube",
        platformVideoId: "animal-emergency",
        title: "Injured Dog Emergency Rescue",
        channelName: "Animal Rescue",
      },
    });

    assert.equal(result.classification.label, "RED");
    assert.equal(db.getClassificationHistory(result.video.id).length, 1);

    const signals = db.listDetectedSignals(result.event.id);

    assert.deepEqual(
      signals
        .filter((signal) => signal.signal_type === "red_escalation")
        .map((signal) => signal.signal_value),
      ["injured", "emergency"],
    );
  } finally {
    db.close();
    await cleanup();
  }
});

async function openTempDatabase() {
  const directory = await mkdtemp(path.join(tmpdir(), "personalabs-classification-db-"));
  const filename = path.join(directory, "personalabs.sqlite");

  return {
    db: createLocalDatabase(filename),
    cleanup: () => rm(directory, {
      force: true,
      recursive: true,
    }),
  };
}
