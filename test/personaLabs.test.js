import assert from "node:assert/strict";
import test from "node:test";

import {
  DOMAINS,
  LABELS,
  LENSES,
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
  assert.deepEqual(
    reasonTerms(result, "green.animal_engagement_neutralized"),
    ["funny", "compilation", "shorts"],
  );
});

test("animal engagement words do not create YELLOW under lower-friction aliases", () => {
  const result = labelContent({
    title: "Cute baby cat eating and playing viral shorts",
    channel: "Adorable Pet Channel",
    lens: "lower-friction",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.match(result.explanation, /defaults harmless animal\/pet\/nature content to GREEN/);
});

test("animal content turns YELLOW only for explicit chaotic-but-harmless terms", () => {
  const result = labelContent({
    title: "Loud Cat Zoomies Fail",
    channel: "Funny Pets",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.YELLOW);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.deepEqual(
    reasonTerms(result, "yellow.animal_chaotic_harmless"),
    ["loud", "fail", "zoomies"],
  );
});

test("animal distress and danger terms override the GREEN default", () => {
  const result = labelContent({
    title: "Injured puppy emergency rescue crisis",
    channel: "Animal Care",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.RED);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.deepEqual(
    reasonTerms(result, "red.distress_danger"),
    ["injured", "emergency", "rescue crisis"],
  );
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
  assert.equal(political.domain, DOMAINS.GENERAL);
  assert.deepEqual(
    reasonTerms(political, "yellow.general_calmer_friction"),
    ["debate", "meltdown", "political"],
  );
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

function reasonTerms(result, code) {
  return result.reasons.find((reason) => reason.code === code)?.terms ?? [];
}
