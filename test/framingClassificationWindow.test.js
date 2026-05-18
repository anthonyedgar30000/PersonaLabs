"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  NEUTRAL_FRAMING_ID,
  buildFramingClassificationWindow,
  getDefaultFramingClassification,
  normalizeTitle
} = require("../src/framingClassificationWindow");

test("framing classification defaults to neutral", () => {
  assert.equal(getDefaultFramingClassification(), NEUTRAL_FRAMING_ID);
});

test("bank scammer video framing window starts with neutral selected", () => {
  const windowState = buildFramingClassificationWindow({
    title: "Infiltrating bank scammefs"
  });

  assert.equal(windowState.defaultClassification, NEUTRAL_FRAMING_ID);
  assert.equal(windowState.selectedClassification, NEUTRAL_FRAMING_ID);
  assert.equal(windowState.isDefaultSelection, true);
  assert.equal(windowState.videoTitle, "Infiltrating bank scammefs");
});

test("explicit user selection can override the neutral default", () => {
  const windowState = buildFramingClassificationWindow(
    { title: "Infiltrating bank scammefs" },
    { selectedClassification: "investigative" }
  );

  assert.equal(windowState.defaultClassification, NEUTRAL_FRAMING_ID);
  assert.equal(windowState.selectedClassification, "investigative");
  assert.equal(windowState.isDefaultSelection, false);
});

test("title normalization trims and collapses whitespace", () => {
  assert.equal(normalizeTitle("  Infiltrating   bank\t scammefs  "), "Infiltrating bank scammefs");
});

test("unknown selected classifications are rejected", () => {
  assert.throws(
    () =>
      buildFramingClassificationWindow(
        { title: "Infiltrating bank scammefs" },
        { selectedClassification: "unknown" }
      ),
    /Unknown framing classification: unknown/
  );
});
