import assert from "node:assert/strict";
import test from "node:test";

import {
  classifySemanticContent,
  exportClassificationDebugJson,
} from "../src/semantic-core.js";
import { renderClassificationDebugPanel } from "../src/debug-panel.js";

test("classification includes structured debug pipeline log", () => {
  const result = classifySemanticContent({
    title: "Funny Rabbit Compilation",
    channel: "Bunny Clips",
    lens: "calmer",
  });

  assert.equal(result.label, "GREEN");
  assert.equal(result.debug.pipelineVersion, "semantic-core-debug-v1");
  assert.equal(result.debug.domain.detected, "ANIMAL_PET_NATURE");
  assert.deepEqual(result.debug.domain.matches, ["bunny", "rabbit"]);
  assert.deepEqual(result.debug.signals.matchedPositiveTerms, [
    "bunny",
    "rabbit",
    "funny",
    "compilation",
  ]);
  assert.deepEqual(result.debug.signals.matchedFrictionTerms, []);
  assert.deepEqual(result.debug.contextualSuppressions.map((entry) => entry.term), [
    "funny",
    "compilation",
  ]);
  assert.deepEqual(result.debug.score, {
    baselineWeight: -1,
    yellowWeight: 0,
    redWeight: 0,
    finalWeightedScore: -1,
  });
});

test("debug log exposes threshold decisions and false positive markers", () => {
  const result = classifySemanticContent({
    title: "Loud Cat Screaming Meme",
    channel: "Pet Clips",
    lens: "calmer",
  });

  assert.equal(result.label, "YELLOW");
  assert.deepEqual(result.debug.signals.matchedFrictionTerms, ["screaming", "loud"]);
  assert.deepEqual(
    result.debug.thresholdDecisions.map((decision) => decision.rule),
    [
      "redSignals.length > 0",
      "yellowSignals.length > 0",
      "baselineSafe === true",
    ],
  );
  assert.deepEqual(result.debug.falsePositiveMarkers, [
    {
      type: "animal_safe_baseline_yellow",
      message: "Animal safe-baseline content became YELLOW; review active friction terms.",
      activeTerms: ["screaming", "loud"],
    },
  ]);
});

test("debug JSON export is parseable and complete", () => {
  const result = classifySemanticContent({
    title: "Injured Dog Emergency Rescue",
    channel: "Animal Rescue",
    lens: "calmer",
  });
  const exported = exportClassificationDebugJson(result.debug);
  const parsed = JSON.parse(exported);

  assert.equal(result.debugJson, exported);
  assert.equal(parsed.finalClassification.color, "RED");
  assert.deepEqual(parsed.signals.redTerms, ["injured", "emergency"]);
});

test("debug panel renders collapsible why section and export JSON", () => {
  const result = classifySemanticContent({
    title: "Chaotic Bunny Zoomies",
    channel: "Rabbit Clips",
    lens: "calmer",
  });
  const html = renderClassificationDebugPanel(result.debug);

  assert.match(html, /^<details class="personalabs-debug-panel">/);
  assert.match(html, /<summary>Why was this classified this way\?<\/summary>/);
  assert.match(html, /Final weighted score/);
  assert.match(html, /Contextual suppressions/);
  assert.match(html, /Export debug JSON/);
  assert.match(html, /suppressed_yellow_terms/);
});
