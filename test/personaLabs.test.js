import assert from "node:assert/strict";
import test from "node:test";

import {
  DOMAINS,
  LABELS,
  LENSES,
  analyzeTone,
  detectDomain,
  labelContent,
} from "../src/personaLabs.js";

test("rabbit zoomies are interpreted as harmless animal chaos", () => {
  const result = labelContent({
    title: "Rabbit Zoomies in the Living Room",
    channel: "Cute Bunny Pets",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.deepEqual(result.globalSignals.signals.chaos, ["zoomies"]);
  assert.ok(hasModifier(result.suppressionModifiers, "suppress.animal_harmless_chaos"));
  assert.match(result.explanation, /harmless animal domain suppressed chaos signals/);
});

test("puppy screaming while playing is suppressed as harmless in animal context", () => {
  const result = labelContent({
    title: "Puppy Screaming While Playing With Toy",
    channel: "Happy Dog Clips",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.deepEqual(result.globalSignals.signals.chaos, ["screaming"]);
  assert.deepEqual(result.globalSignals.signals.playfulFunny, ["while playing", "playing"]);
  assert.equal(result.escalation.hasSevereDistress, false);
});

test("cute bunny compilation remains GREEN for CALMER", () => {
  const result = labelContent({
    title: "Cute Bunny Compilation",
    channel: "Adorable Animal Shorts",
    metadata: { category: "pets", playlist: "rabbit videos" },
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.ok(result.finalScore < 0);
  assert.ok(hasModifier(result.lensModifiers, "lens.calmer_animal_suppression"));
});

test("animal rescue emergency overrides animal GREEN default", () => {
  const result = labelContent({
    title: "Animal Rescue Crisis Emergency",
    channel: "Wildlife Rescue Updates",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.RED);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.equal(result.escalation.hasSevereDistress, true);
  assert.deepEqual([...result.escalation.signals.severeDistressTerms].sort(), [
    "emergency",
    "rescue crisis",
  ]);
  assert.match(result.explanation, /explicit danger or distress/);
});

test("political outrage clip receives high escalation under CALMER", () => {
  const result = labelContent({
    title: "BREAKING Outrage Political Reaction Clip EXPOSED Meltdown Destroyed",
    channel: "Daily Drama News",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.RED);
  assert.equal(result.domain, DOMAINS.DRAMA_REACTION);
  assert.ok(result.finalScore >= 10);
  assert.ok(result.sourceFormatSignals.higherFriction.length >= 3);
  assert.ok(hasModifier(result.lensModifiers, "lens.calmer_outrage_penalty"));
});

test("public radio interview is low-friction politics/news context", () => {
  const result = labelContent({
    title: "Public Radio Interview: Election Policy Context",
    channel: "NPR Politics",
    description: "Long-form discussion with analysis and calm explanation.",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.POLITICS_NEWS);
  assert.ok(result.format.lowerFrictionScore > result.format.higherFrictionScore);
  assert.ok(result.finalScore < 3);
});

test("educational lecture is prioritized by EDUCATIONAL lens", () => {
  const result = labelContent({
    title: "University Lecture: Climate Systems Explained",
    channel: "Open Course",
    metadata: { category: "education", playlist: "lectures" },
    lens: "educational",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.lens, LENSES.EDUCATIONAL);
  assert.equal(result.domain, DOMAINS.EDUCATIONAL);
  assert.ok(hasModifier(result.lensModifiers, "lens.educational_context"));
  assert.match(result.explanation, /Educational lens prioritized depth/);
});

test("dramatic harmless pet video remains GREEN through animal suppression", () => {
  const result = labelContent({
    title: "Dramatic Wild Puppy Screaming While Playing",
    channel: "Funny Pet Moments",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.deepEqual(result.globalSignals.signals.intensity, ["wild", "dramatic"]);
  assert.ok(hasModifier(result.suppressionModifiers, "suppress.animal_harmless_chaos"));
});

test("documentary with difficult topic stays contextual rather than RED for EDUCATIONAL", () => {
  const result = labelContent({
    title: "Documentary: Disaster Recovery and Community Crisis Explained",
    channel: "PBS University Documentary",
    description: "Long-form interview and analysis with context.",
    lens: "educational",
  });

  assert.equal(result.label, LABELS.YELLOW);
  assert.equal(result.domain, DOMAINS.DOCUMENTARY);
  assert.ok(result.globalSignals.signals.fear.includes("crisis"));
  assert.ok(result.format.lowerFrictionScore > 0);
  assert.match(result.explanation, /difficult topic is presented through explanatory or documentary context/);
});

test("comedy chaos suppresses playful chaos instead of treating it like outrage", () => {
  const result = labelContent({
    title: "Comedy Chaos Compilation",
    channel: "Goofy Sketch Club",
    metadata: { category: "comedy" },
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.COMEDY);
  assert.deepEqual(result.globalSignals.signals.chaos, ["chaos"]);
  assert.ok(hasModifier(result.suppressionModifiers, "suppress.comedy_playful_chaos"));
});

test("market panic is fear context, not harmless chaos", () => {
  const result = labelContent({
    title: "Market Panic After Breaking News",
    channel: "Finance News",
    lens: "calmer",
  });

  assert.equal(result.domain, DOMAINS.POLITICS_NEWS);
  assert.ok(result.globalSignals.signals.fear.includes("panic"));
  assert.equal(result.suppressionModifiers.some((modifier) => (
    modifier.code === "suppress.animal_harmless_chaos"
  )), false);
});

test("BARE_METAL minimizes interpretation", () => {
  const result = labelContent({
    title: "Political Meltdown Reaction Clip",
    channel: "Drama News",
    lens: "bare metal",
  });

  assert.equal(result.lens, LENSES.BARE_METAL);
  assert.equal(result.label, LABELS.GREEN);
  assert.ok(hasModifier(result.lensModifiers, "lens.bare_metal_metadata_only"));
  assert.match(result.finalColorReason, /minimal interpretation/);
});

test("explainability exposes required contextual sections", () => {
  const result = labelContent({
    title: "Rabbit Zoomies",
    channel: "Pet Channel",
    lens: "calmer",
  });

  assert.equal(result.detectedDomain.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.ok(result.toneSignals);
  assert.ok(result.escalationSignals);
  assert.ok(Array.isArray(result.suppressionModifiers));
  assert.ok(Array.isArray(result.lensModifiers));
  assert.equal(typeof result.finalScore, "number");
  assert.equal(result.finalColor, LABELS.GREEN);
  assert.match(result.explanation, /Marked GREEN/);
});

test("domain detection uses metadata, playlist, and category clues", () => {
  const domain = detectDomain({
    title: "Episode 4",
    channel: "Open Learning",
    metadata: { category: "tutorial", playlist: "university lecture walkthrough" },
  });

  assert.equal(domain.domain, DOMAINS.TUTORIAL);
  assert.ok(domain.matches.includes("tutorial"));
  assert.ok(domain.matches.includes("walkthrough"));
});

test("tone heuristics still expose all-caps intensity and punctuation", () => {
  const tone = analyzeTone("BREAKING SHOCKING PANIC!!!");

  assert.ok(tone.allCapsIntensity > 0.5);
  assert.equal(tone.exclamationCount, 3);
  assert.ok(tone.escalationScore > tone.regulationScore);
});

function hasModifier(modifiers, code) {
  return modifiers.some((modifier) => modifier.code === code);
}
