"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  INFILTRATING_FRAMING_ID,
  NEUTRAL_FRAMING_ID,
  buildFramingClassificationWindow,
  getFramingClassificationTriggers,
  getDefaultFramingClassification,
  normalizeTitle
} = require("../src/framingClassificationWindow");

test("framing classification defaults to neutral", () => {
  assert.equal(getDefaultFramingClassification(), NEUTRAL_FRAMING_ID);
});

test("bank scammers video framing window starts with neutral selected", () => {
  const windowState = buildFramingClassificationWindow({
    title: "Infiltrating bank scammers"
  });

  assert.equal(windowState.defaultClassification, NEUTRAL_FRAMING_ID);
  assert.equal(windowState.selectedClassification, NEUTRAL_FRAMING_ID);
  assert.equal(windowState.isDefaultSelection, true);
  assert.equal(windowState.videoTitle, "Infiltrating bank scammers");
});

test("Infiltrating is flagged as a trigger word for the infiltrating classification", () => {
  const windowState = buildFramingClassificationWindow({
    title: "Infiltrating bank scammers"
  });

  assert.deepEqual(windowState.triggers, [
    {
      triggerWord: "infiltrating",
      classification: INFILTRATING_FRAMING_ID
    }
  ]);
});

test("explicit user selection can override the neutral default", () => {
  const windowState = buildFramingClassificationWindow(
    { title: "Infiltrating bank scammers" },
    { selectedClassification: "investigative" }
  );

  assert.equal(windowState.defaultClassification, NEUTRAL_FRAMING_ID);
  assert.equal(windowState.selectedClassification, "investigative");
  assert.equal(windowState.isDefaultSelection, false);
});

test("trigger words are matched case-insensitively as whole words", () => {
  assert.deepEqual(getFramingClassificationTriggers({ title: "INFILTRATING bank scammers" }), [
    {
      triggerWord: "infiltrating",
      classification: INFILTRATING_FRAMING_ID
    }
  ]);
  assert.deepEqual(getFramingClassificationTriggers({ title: "Preinfiltrating bank scammers" }), []);
});

test("title normalization trims and collapses whitespace", () => {
  assert.equal(normalizeTitle("  Infiltrating   bank\t scammers  "), "Infiltrating bank scammers");
});

test("unknown selected classifications are rejected", () => {
  assert.throws(
    () =>
      buildFramingClassificationWindow(
        { title: "Infiltrating bank scammers" },
        { selectedClassification: "unknown" }
      ),
    /Unknown framing classification: unknown/
  );
});
