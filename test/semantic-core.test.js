import assert from "node:assert/strict";
import test from "node:test";

import {
  DOMAINS,
  LABELS,
  classifySemanticContent,
} from "../src/semantic-core.js";

test("GREEN: Cute Bunny Eating Carrot defaults to safe animal baseline", () => {
  const result = classifySemanticContent({
    title: "Cute Bunny Eating Carrot",
    channel: "Rabbit Room",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.equal(result.baselineSafe, true);
  assert.deepEqual(result.escalationSignals.red, []);
  assert.deepEqual(result.escalationSignals.yellow, []);
});

test("GREEN: Funny Rabbit Compilation does not escalate generic engagement", () => {
  const result = classifySemanticContent({
    title: "Funny Rabbit Compilation",
    channel: "Bunny Clips",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.deepEqual(result.suppressedSignals, ["funny", "compilation"]);
  assert.match(result.explanation, /safe animal baseline/i);
});

test("GREEN: Mini Lop Rabbits Playing suppresses harmless play", () => {
  const result = classifySemanticContent({
    title: "Mini Lop Rabbits Playing",
    channel: "Pet Channel",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.deepEqual(result.suppressedSignals, ["playing"]);
});

test("GREEN: Cute Puppy Shorts remains GREEN under CALMER", () => {
  const result = classifySemanticContent({
    title: "Cute Puppy Shorts",
    channel: "Dog Videos",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.deepEqual(result.suppressedSignals, ["shorts"]);
});

test("GREEN: Relaxing Aquarium Fish inherits animal/nature baseline", () => {
  const result = classifySemanticContent({
    title: "Relaxing Aquarium Fish",
    channel: "Peaceful Pets",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
});

test("GREEN: How I Care for My Senior Hamster detects animal safe baseline", () => {
  const result = classifySemanticContent({
    title: "How I Care for My Senior Hamster",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.equal(result.baselineSafe, true);
});

test("GREEN: Bunny Room Makeover remains safe animal content", () => {
  const result = classifySemanticContent({
    title: "Bunny Room Makeover",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.deepEqual(result.escalationSignals.yellow, []);
});

test("GREEN: How Much I Spend on My Pets Yearly detects plural pets", () => {
  const result = classifySemanticContent({
    title: "How Much I Spend on My Pets Yearly",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.equal(result.baselineSafe, true);
});

test("YELLOW: Loud Cat Screaming Meme has meaningful animal escalation", () => {
  const result = classifySemanticContent({
    title: "Loud Cat Screaming Meme",
    channel: "Pet Clips",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.YELLOW);
  assert.deepEqual(result.escalationSignals.yellow, ["screaming", "loud"]);
});

test("GREEN: Hyper Dog Zoomies Compilation suppresses harmless animal stimulation", () => {
  const result = classifySemanticContent({
    title: "Hyper Dog Zoomies Compilation",
    channel: "Dog Clips",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.deepEqual(result.escalationSignals.yellow, []);
  assert.deepEqual(result.suppressedSignals, ["zoomies", "compilation", "hyper"]);
});

test("RED: Shocking Animal Attack overrides safe baseline", () => {
  const result = classifySemanticContent({
    title: "Shocking Animal Attack",
    channel: "Wildlife Updates",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.RED);
  assert.deepEqual(result.escalationSignals.red, ["attack"]);
});

test("RED: Injured Dog Emergency Rescue overrides safe baseline", () => {
  const result = classifySemanticContent({
    title: "Injured Dog Emergency Rescue",
    channel: "Animal Rescue",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.RED);
  assert.deepEqual(result.escalationSignals.red, ["injured", "emergency"]);
});
