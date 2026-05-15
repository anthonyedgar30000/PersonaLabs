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

test("calmer lens defaults harmless animal engagement content to GREEN", () => {
  const result = labelContent({
    title: "Funny Rabbit Compilation",
    channel: "Cozy Bunny Shorts",
    lens: "CALMER",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.equal(result.lens, LENSES.CALMER);
  assert.deepEqual(result.tone.matchedSignals.harmlessEnergy, [
    "funny",
    "compilation",
  ]);
  assert.match(result.finalReason, /no escalation framing/);
});

test("animal engagement words do not create YELLOW under lower-friction aliases", () => {
  const result = labelContent({
    title: "Cute baby cat eating and playing viral shorts",
    channel: "Adorable Pet Channel",
    lens: "lower-friction",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.equal(result.tone.baselineWeighting.label, "strongly GREEN");
});

test("animal content turns YELLOW for explicit chaotic-but-harmless pacing", () => {
  const result = labelContent({
    title: "Loud Cat Zoomies Fail",
    channel: "Funny Pets",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.YELLOW);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.deepEqual(result.tone.matchedSignals.animalChaoticHarmless, [
    "loud",
    "fail",
    "zoomies",
  ]);
  assert.match(result.finalReason, /pacing, not danger/);
});

test("animal distress and danger terms override the GREEN default", () => {
  const result = labelContent({
    title: "Injured puppy emergency rescue crisis",
    channel: "Animal Care",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.RED);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.deepEqual(result.tone.matchedSignals.distressDanger, [
    "injured",
    "emergency",
    "rescue crisis",
  ]);
});

test("same engagement word is lens and domain aware for non-animal content", () => {
  const animal = labelContent({
    title: "Funny Rabbit Compilation",
    channel: "Nature Clips",
    lens: "calmer",
  });
  const political = labelContent({
    title: "Funny Political Meltdown Compilation",
    channel: "Daily Debate",
    lens: "calmer",
  });

  assert.equal(animal.label, LABELS.GREEN);
  assert.equal(political.label, LABELS.YELLOW);
  assert.equal(political.domain, DOMAINS.OUTRAGE_DRAMA);
  assert.ok(political.tone.escalationToneScore > animal.tone.escalationToneScore);
});

test("domain detection uses title and channel domain terms", () => {
  assert.deepEqual(detectDomain({
    title: "Relaxing aquarium ambience",
    channel: "Peaceful Forest",
  }), {
    domain: DOMAINS.ANIMAL_PET_NATURE,
    matches: ["aquarium", "forest", "relaxing", "peaceful"],
  });
});

test("tone heuristics detect high escalation pacing", () => {
  const tone = analyzeTone({
    title: "YOU WON'T BELIEVE THIS INSANE DISASTER!!!",
    lens: "calmer",
  });

  assert.ok(tone.escalationToneScore >= 5);
  assert.ok(tone.heuristics.exclamationScore > 0);
  assert.ok(tone.heuristics.allCapsScore > 0);
  assert.ok(tone.heuristics.heuristicEscalationScore >= 5);
});

test("tone heuristics keep quiet animal routine low escalation", () => {
  const result = labelContent({
    title: "Quiet evening routine with my rabbits",
    channel: "Cozy Pet Care",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.tone.escalationToneScore, 0);
  assert.equal(result.tone.heuristics.heuristicEscalationScore, 0);
  assert.ok(result.tone.calmToneScore >= 2);
});

test("requested GREEN animal and nature examples stay GREEN", () => {
  const greenTitles = [
    "Quiet Bunny Evening Routine",
    "Cozy Rabbit Room Setup",
    "Relaxing Aquarium Fish",
    "Gentle Bird Sounds",
    "Calm Cat Bonding Time",
  ];

  for (const title of greenTitles) {
    const result = labelContent({
      title,
      channel: "Peaceful Pet Nature",
      lens: "calmer",
    });

    assert.equal(result.label, LABELS.GREEN, title);
    assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE, title);
    assert.equal(result.tone.baselineWeighting.label, "strongly GREEN", title);
  }
});

test("requested YELLOW animal examples show harmless high-energy pacing", () => {
  const yellowTitles = [
    "Silly Hyper Puppy Zoomies",
    "Funny Chaotic Cat Compilation",
  ];

  for (const title of yellowTitles) {
    const result = labelContent({
      title,
      channel: "Pet Clips",
      lens: "calmer",
    });

    assert.equal(result.label, LABELS.YELLOW, title);
    assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE, title);
    assert.ok(result.tone.harmlessEnergyScore >= 2, title);
    assert.match(result.finalReason, /pacing, not danger/, title);
  }
});

test("requested RED animal examples override animal GREEN baseline", () => {
  const redTitles = [
    "SHOCKING Animal Attack!!!",
    "TERRIFYING Pet Emergency Breakdown",
  ];

  for (const title of redTitles) {
    const result = labelContent({
      title,
      channel: "Animal Updates",
      lens: "calmer",
    });

    assert.equal(result.label, LABELS.RED, title);
    assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE, title);
    assert.ok(result.tone.matchedSignals.distressDanger.length > 0, title);
    assert.match(result.finalReason, /overrides the strong GREEN baseline/, title);
  }
});

test("explainability includes required tone and baseline fields", () => {
  const result = labelContent({
    title: "Calm Cat Bonding Time",
    channel: "Pet Care",
    lens: "calmer",
  });

  assert.equal(typeof result.tone.calmToneScore, "number");
  assert.equal(typeof result.tone.escalationToneScore, "number");
  assert.equal(typeof result.tone.harmlessEnergyScore, "number");
  assert.equal(result.tone.baselineWeighting.label, "strongly GREEN");
  assert.ok(result.finalReason.length > 0);
  assert.match(result.explanation, /Baseline weighting/);
});
