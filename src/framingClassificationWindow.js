"use strict";

const NEUTRAL_FRAMING_ID = "neutral";
const INFILTRATING_FRAMING_ID = "infiltrating";

const FRAMING_OPTIONS = Object.freeze([
  Object.freeze({
    id: NEUTRAL_FRAMING_ID,
    label: "Neutral",
    description: "No framing assumption has been selected for this video yet."
  }),
  Object.freeze({
    id: "alarmist",
    label: "Alarmist",
    description: "The video appears to heighten urgency, fear, or threat."
  }),
  Object.freeze({
    id: "investigative",
    label: "Investigative",
    description: "The video appears to frame events as an inquiry or exposé."
  }),
  Object.freeze({
    id: INFILTRATING_FRAMING_ID,
    label: "Infiltrating",
    description: "The video appears to frame the content around covert entry or access."
  }),
  Object.freeze({
    id: "promotional",
    label: "Promotional",
    description: "The video appears to frame the content as marketing or persuasion."
  })
]);

const VALID_FRAMING_IDS = new Set(FRAMING_OPTIONS.map((option) => option.id));
const FRAMING_TRIGGER_WORDS = Object.freeze([
  Object.freeze({
    word: "infiltrating",
    classification: INFILTRATING_FRAMING_ID
  })
]);

function normalizeTitle(title) {
  return String(title ?? "").trim().replace(/\s+/g, " ");
}

function getDefaultFramingClassification() {
  return NEUTRAL_FRAMING_ID;
}

function getFramingClassificationTriggers(video = {}) {
  const normalizedTitle = normalizeTitle(video.title).toLowerCase();

  return FRAMING_TRIGGER_WORDS.filter((trigger) => {
    const escapedWord = trigger.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escapedWord}\\b`, "i").test(normalizedTitle);
  }).map((trigger) =>
    Object.freeze({
      triggerWord: trigger.word,
      classification: trigger.classification
    })
  );
}

function buildFramingClassificationWindow(video = {}, selection = {}) {
  const defaultClassification = getDefaultFramingClassification(video);
  const selectedClassification = selection.selectedClassification ?? defaultClassification;
  const triggers = Object.freeze(getFramingClassificationTriggers(video));

  if (!VALID_FRAMING_IDS.has(selectedClassification)) {
    throw new RangeError(`Unknown framing classification: ${selectedClassification}`);
  }

  return Object.freeze({
    kind: "framing-classification-window",
    videoTitle: normalizeTitle(video.title) || "Untitled video",
    defaultClassification,
    selectedClassification,
    isDefaultSelection: selectedClassification === defaultClassification,
    triggers,
    options: FRAMING_OPTIONS
  });
}

module.exports = {
  FRAMING_OPTIONS,
  FRAMING_TRIGGER_WORDS,
  INFILTRATING_FRAMING_ID,
  NEUTRAL_FRAMING_ID,
  buildFramingClassificationWindow,
  getFramingClassificationTriggers,
  getDefaultFramingClassification,
  normalizeTitle
};
