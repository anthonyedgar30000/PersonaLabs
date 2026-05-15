import assert from "node:assert/strict";
import test from "node:test";

import {
  DOMAINS,
  LABELS,
  LENSES,
  SAFE_BASELINE_DOMAINS,
  analyzeTone,
  detectDomain,
  labelContent,
} from "../src/personaLabs.js";

test("safe baseline domains are exported and include requested domains", () => {
  assert.deepEqual(SAFE_BASELINE_DOMAINS, [
    DOMAINS.ANIMAL_PET_NATURE,
    DOMAINS.RELAXING_AMBIENT,
    DOMAINS.EDUCATIONAL_TUTORIAL,
    DOMAINS.DOCUMENTARY_LONGFORM,
    DOMAINS.HOBBY_CRAFTING,
  ]);
});

test("GREEN: Cute Bunny Eating Carrot defaults GREEN without calm words", () => {
  const result = labelContent({
    title: "Cute Bunny Eating Carrot",
    channel: "Pet Shorts",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.equal(result.baselineStatus.status, "SAFE_BASELINE");
  assert.equal(result.frictionTerms.significant.length, 0);
  assert.match(result.explanation, /safe baseline domain detected/i);
});

test("GREEN: Mini Lop Rabbits Playing inherits animal harmlessness", () => {
  const result = labelContent({
    title: "Mini Lop Rabbits Playing",
    channel: "Rabbit Room",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.ok(result.suppressionModifiers.some((modifier) => (
    modifier.code === "suppress.animal_harmless_energy"
  )));
});

test("GREEN: Funny Puppy Zoomies suppresses harmless animal energy", () => {
  const result = labelContent({
    title: "Funny Puppy Zoomies",
    channel: "Dog Clips",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.deepEqual(result.frictionTerms.suppressed, ["funny", "zoomies"]);
  assert.match(result.explanation, /contextual suppression removed harmless energy signals/);
});

test("GREEN: Relaxing Rainforest Ambience uses relaxing ambient safe baseline", () => {
  const result = labelContent({
    title: "Relaxing Rainforest Ambience",
    channel: "Sleep Sounds",
    category: "ambient",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.RELAXING_AMBIENT);
  assert.equal(result.baselineStatus.isSafeBaseline, true);
  assert.equal(result.frictionTerms.significant.length, 0);
});

test("GREEN: Beginner Guitar Tutorial is a safe educational/tutorial baseline", () => {
  const result = labelContent({
    title: "Beginner Guitar Tutorial",
    channel: "Calm Music Lessons",
    metadata: { category: "education", playlist: "beginner guitar" },
    lens: "educational",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.lens, LENSES.EDUCATIONAL);
  assert.equal(result.domain, DOMAINS.EDUCATIONAL_TUTORIAL);
  assert.equal(result.baselineStatus.isSafeBaseline, true);
});

test("YELLOW: Crazy Puppy Compilation has mild frenetic wording without playful context", () => {
  const result = labelContent({
    title: "Crazy Puppy Compilation",
    channel: "Pet Videos",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.YELLOW);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.deepEqual(result.frictionTerms.significant, ["crazy"]);
  assert.match(result.explanation, /mild drama\/clickbait wording/);
});

test("YELLOW: Wild Animal Fails keeps unsuppressed mild clickbait friction", () => {
  const result = labelContent({
    title: "Wild Animal Fails",
    channel: "Wildlife Clips",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.YELLOW);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.deepEqual(result.frictionTerms.significant, ["wild", "fails"]);
});

test("YELLOW: Political Debate Highlights is not baseline-safe", () => {
  const result = labelContent({
    title: "Political Debate Highlights",
    channel: "Election News",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.YELLOW);
  assert.equal(result.domain, DOMAINS.POLITICS_NEWS);
  assert.equal(result.baselineStatus.isSafeBaseline, false);
  assert.ok(result.frictionTerms.significant.includes("debate"));
});

test("YELLOW: Drama Reaction Stream carries elevated non-safe friction", () => {
  const result = labelContent({
    title: "Drama Reaction Stream",
    channel: "Reaction Channel",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.YELLOW);
  assert.equal(result.domain, DOMAINS.DRAMA_REACTION);
  assert.ok(result.sourceFormatSignals.higherFriction.includes("reaction"));
});

test("RED: Animal Abuse Investigation overrides safe animal baseline", () => {
  const result = labelContent({
    title: "Animal Abuse Investigation",
    channel: "Wildlife Documentary",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.RED);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.equal(result.escalationOverrides.hasRedOverride, true);
  assert.deepEqual(result.escalationOverrides.severeDistressTerms, ["abuse"]);
  assert.match(result.explanation, /severe distress terms overrode safe domain baseline/i);
});

test("RED: Market Panic Emergency is severe non-animal escalation", () => {
  const result = labelContent({
    title: "Market Panic Emergency",
    channel: "Finance News",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.RED);
  assert.equal(result.domain, DOMAINS.POLITICS_NEWS);
  assert.equal(result.escalationOverrides.hasRedOverride, true);
  assert.ok(result.escalationOverrides.severeDistressTerms.includes("emergency"));
});

test("RED: Violent Meltdown Compilation triggers severe distress override", () => {
  const result = labelContent({
    title: "Violent Meltdown Compilation",
    channel: "Drama Clips",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.RED);
  assert.equal(result.domain, DOMAINS.DRAMA_REACTION);
  assert.ok(result.escalationOverrides.severeDistressTerms.includes("violent"));
});

test("RED: Crisis/Disaster Coverage overrides documentary baseline", () => {
  const result = labelContent({
    title: "Crisis Disaster Coverage",
    channel: "Longform Documentary Reports",
    lens: "educational",
  });

  assert.equal(result.label, LABELS.RED);
  assert.equal(result.domain, DOMAINS.DOCUMENTARY_LONGFORM);
  assert.equal(result.baselineStatus.isSafeBaseline, true);
  assert.ok(result.escalationOverrides.severeDistressTerms.includes("crisis"));
});

test("animal play context suppresses crazy wording when behavior is clearly playful", () => {
  const result = labelContent({
    title: "Crazy Puppy Playing",
    channel: "Funny Dog Clips",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.ok(result.frictionTerms.suppressed.includes("crazy"));
});

test("funny cat fails is suppressed by animal playful context", () => {
  const result = labelContent({
    title: "Funny Cat Fails",
    channel: "Cute Pet Videos",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.ok(result.frictionTerms.suppressed.includes("fails"));
});

test("explainability exposes baseline status, overrides, suppression, friction, score, and color", () => {
  const result = labelContent({
    title: "Funny Puppy Zoomies",
    channel: "Dog Clips",
    lens: "calmer",
  });

  assert.ok(result.detectedDomain);
  assert.ok(result.baselineStatus);
  assert.ok(result.escalationOverrides);
  assert.ok(Array.isArray(result.suppressionModifiers));
  assert.ok(result.frictionTerms);
  assert.equal(typeof result.finalScore, "number");
  assert.equal(result.finalColor, LABELS.GREEN);
  assert.match(result.explanation, /Marked GREEN/);
});

test("domain detection uses metadata clues for hobby/crafting safe baseline", () => {
  const domain = detectDomain({
    title: "Weekend Project",
    channel: "Quiet Workshop",
    metadata: { category: "hobby", playlist: "woodworking diy" },
  });

  assert.equal(domain.domain, DOMAINS.HOBBY_CRAFTING);
  assert.ok(domain.matches.includes("hobby"));
  assert.ok(domain.matches.includes("woodworking"));
});

test("tone analysis still exposes stimulation metadata", () => {
  const tone = analyzeTone("SHOCKING PANIC!!!");

  assert.equal(tone.exclamationCount, 3);
  assert.ok(tone.allCapsIntensity > 0.5);
  assert.ok(tone.excessiveStimulationScore > 0);
});
