import assert from "node:assert/strict";
import test from "node:test";

import {
  DOMAINS,
  EMOTION_CATEGORIES,
  LABELS,
  LENSES,
  analyzeTone,
  detectDomain,
  labelContent,
} from "../src/personaLabs.js";

test("calm animal content stays GREEN under CALMER", () => {
  const result = labelContent({
    title: "Quiet Bunny Evening Routine",
    channel: "Cozy Pet Care",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.finalColor, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.equal(result.scores.baseline.label, "strongly GREEN");
  assert.ok(result.tone.regulationScore > result.tone.escalationScore);
  assert.match(result.reason, /harmless animal content GREEN/);
});

test("public radio political interview is lower-friction despite politics domain", () => {
  const result = labelContent({
    title: "Public Radio Political Interview with Policy Context",
    channel: "NPR Politics",
    description: "A long-form discussion with calm analysis and context.",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.POLITICS_NEWS);
  assert.deepEqual(result.sourceFormat.signals.lowerFriction, [
    "public radio",
    "npr",
    "interview",
    "long-form discussion",
    "analysis",
    "context",
  ]);
  assert.ok(result.scores.sourceRegulation > result.scores.sourceFriction);
});

test("outrage political reaction clip becomes RED under CALMER", () => {
  const result = labelContent({
    title: "Breaking Outrage Political Reaction Clip Meltdown Exposed Debate Fight",
    channel: "Daily Drama News",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.RED);
  assert.equal(result.domain, DOMAINS.DRAMA_REACTION);
  assert.ok(result.escalation.score >= 10);
  assert.ok(result.sourceFormat.signals.higherFriction.length >= 3);
  assert.match(result.reason, /high deterministic friction/);
});

test("educational tutorial is GREEN for EDUCATIONAL lens", () => {
  const result = labelContent({
    title: "University Calculus Tutorial Explained Step by Step",
    channel: "Open University Lecture Series",
    lens: "educational",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.lens, LENSES.EDUCATIONAL);
  assert.equal(result.domain, DOMAINS.EDUCATIONAL_TUTORIAL);
  assert.ok(result.emotions.categories[EMOTION_CATEGORIES.TRUST_INFORMATIONAL].score > 0);
  assert.match(result.reason, /explanatory, contextual, or lecture-style/);
});

test("educational lens preserves intense explanatory subject anchor as YELLOW", () => {
  const result = labelContent({
    title: "Emergency Preparedness Documentary Explained",
    channel: "University Public Safety Lecture",
    description: "Context and analysis for a serious emergency topic.",
    lens: "educational",
  });

  assert.equal(result.label, LABELS.YELLOW);
  assert.equal(result.lens, LENSES.EDUCATIONAL);
  assert.ok(result.escalation.hasExplicitDistress);
  assert.ok(result.sourceFormat.lowerFrictionScore > 0);
  assert.match(result.reason, /preserves the subject anchor/);
});

test("chaotic harmless animal short remains GREEN under CALMER animal default", () => {
  const result = labelContent({
    title: "Funny Chaotic Puppy Zoomies Shorts",
    channel: "Cute Pet Compilation",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.ok(result.emotions.joyPlayfulnessScore >= 3);
  assert.equal(result.escalation.hasExplicitDistress, false);
  assert.match(result.reason, /unless explicit distress terms exist/);
});

test("animal distress and emergency video overrides GREEN baseline", () => {
  const result = labelContent({
    title: "TERRIFYING Pet Emergency Breakdown",
    channel: "Animal Updates",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.RED);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.equal(result.escalation.hasExplicitDistress, true);
  assert.deepEqual(result.escalation.signals.distressTerms, [
    "terrifying",
    "emergency",
  ]);
  assert.match(result.reason, /overrides the strong GREEN baseline/);
});

test("VADER-style tone heuristics expose all caps and exclamation intensity", () => {
  const tone = analyzeTone("YOU WON'T BELIEVE THIS INSANE DISASTER!!!");

  assert.ok(tone.allCapsIntensity > 0.5);
  assert.equal(tone.exclamationCount, 3);
  assert.deepEqual(tone.signals.urgencyPhrases, ["you won't believe"]);
  assert.ok(tone.escalationScore >= 8);
});

test("explainability includes required deterministic score sections", () => {
  const result = labelContent({
    title: "PBS Interview: Election Policy Context",
    channel: "Public Radio News",
    lens: "calmer",
  });

  assert.equal(result.detectedDomain.domain, DOMAINS.POLITICS_NEWS);
  assert.ok(result.toneSignals);
  assert.ok(result.sourceFormatSignals);
  assert.ok(result.escalationSignals);
  assert.equal(result.finalColor, result.label);
  assert.match(result.explanation, /Detected domain/);
  assert.match(result.explanation, /Tone signals/);
  assert.match(result.explanation, /Source\/format signals/);
  assert.match(result.explanation, /Final color/);
});

test("domain detection happens before tone scoring", () => {
  const domain = detectDomain({
    title: "Funny Rabbit Compilation",
    channel: "Cute Animal Shorts",
  });

  assert.equal(domain.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.deepEqual(domain.matches, ["rabbit", "animal", "cute"]);
});
