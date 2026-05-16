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

test("GREEN: Funny Parrots Screaming suppresses playful animal screaming", () => {
  const result = classifySemanticContent({
    title: "Funny Parrots Screaming",
    channel: "Bird Clips",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.ANIMAL_PET_NATURE);
  assert.deepEqual(result.escalationSignals.yellow, []);
  assert.ok(result.suppressedSignals.includes("screaming"));
});

test("GREEN: Loud Puppy Playing suppresses loud harmless play", () => {
  const result = classifySemanticContent({
    title: "Loud Puppy Playing",
    channel: "Dog Clips",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.deepEqual(result.escalationSignals.yellow, []);
  assert.ok(result.suppressedSignals.includes("loud"));
});

test("GREEN: Funny Cat Fails suppresses playful animal fails", () => {
  const result = classifySemanticContent({
    title: "Funny Cat Fails",
    channel: "Pet Clips",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.deepEqual(result.escalationSignals.yellow, []);
  assert.ok(result.suppressedSignals.includes("fails"));
});

test("GREEN: Chaotic Bunny Zoomies suppresses harmless chaos", () => {
  const result = classifySemanticContent({
    title: "Chaotic Bunny Zoomies",
    channel: "Rabbit Clips",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.deepEqual(result.escalationSignals.yellow, []);
  assert.ok(result.suppressedSignals.includes("chaotic"));
});

test("YELLOW: Chaotic Animal Prank keeps escalation without harmless context", () => {
  const result = classifySemanticContent({
    title: "Chaotic Animal Prank",
    channel: "Animal Clips",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.YELLOW);
  assert.deepEqual(result.escalationSignals.yellow, ["chaotic", "prank"]);
});

test("RED: Animal Abuse Investigation remains RED", () => {
  const result = classifySemanticContent({
    title: "Animal Abuse Investigation",
    channel: "Animal Reports",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.RED);
  assert.deepEqual(result.escalationSignals.red, ["abuse"]);
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


test("semantic ontology exposes animal taxonomies, relationships, and weights", () => {
  const result = classifySemanticContent({
    title: "Funny Rabbit Compilation",
    channel: "Bunny Clips",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.debug.domain.detected, DOMAINS.ANIMAL_PET_NATURE);
  assert.ok(result.debug.semanticTaxonomies.some((taxonomy) => (
    taxonomy.family === "domain" && taxonomy.name === DOMAINS.ANIMAL_PET_NATURE
  )));
  assert.ok(result.debug.semanticTaxonomies.some((taxonomy) => (
    taxonomy.family === "tone" && taxonomy.name === "PLAYFUL_ENERGY"
  )));
  assert.ok(result.debug.semanticRelationships.some((relationship) => (
    relationship.source === "rabbit"
      && relationship.type === "belongs_to"
      && relationship.target === DOMAINS.ANIMAL_PET_NATURE
  )));
  assert.ok(result.debug.semanticWeights.weightedBoosts.some((boost) => (
    boost.taxonomy === DOMAINS.ANIMAL_PET_NATURE
  )));
});

test("educational long-form content uses safe educational taxonomy", () => {
  const result = classifySemanticContent({
    title: "Lecture Explained With Context",
    channel: "University Course",
    lens: "educational",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.EDUCATIONAL);
  assert.ok(result.baselineSafe);
  assert.ok(result.debug.semanticTaxonomies.some((taxonomy) => taxonomy.name === "EDUCATIONAL_TONE"));
  assert.match(result.explanation, /EDUCATIONAL safe semantic baseline/);
});

test("public radio political interview remains explainable as politics/news", () => {
  const result = classifySemanticContent({
    title: "Public Radio Political Interview",
    channel: "NPR News",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.GREEN);
  assert.equal(result.domain, DOMAINS.POLITICS_NEWS);
  assert.deepEqual(result.debug.sourceChannelSignals.channelDomainMatches, ["news"]);
  assert.ok(result.debug.semanticTaxonomies.some((taxonomy) => taxonomy.name === "CONSTRUCTIVE"));
});

test("outrage clickbait uses escalation taxonomy", () => {
  const result = classifySemanticContent({
    title: "Funny Political Meltdown Exposed",
    channel: "Drama News",
    lens: "calmer",
  });

  assert.equal(result.label, LABELS.YELLOW);
  assert.equal(result.domain, DOMAINS.DRAMA_REACTION);
  assert.deepEqual(result.escalationSignals.yellow, ["meltdown", "exposed"]);
  assert.ok(result.debug.semanticTaxonomies.some((taxonomy) => taxonomy.name === "ESCALATION"));
  assert.ok(result.debug.semanticRelationships.some((relationship) => (
    relationship.source === "meltdown" && relationship.target === "ESCALATION"
  )));
});

test("documentaries, tutorials, and ambient videos default GREEN as safe domains", () => {
  const documentary = classifySemanticContent({
    title: "Documentary Interview With Local Farmers",
    channel: "Longform Stories",
    lens: "calmer",
  });
  const tutorial = classifySemanticContent({
    title: "Beginner Drawing Tutorial",
    channel: "Art Guide",
    lens: "educational",
  });
  const ambient = classifySemanticContent({
    title: "Rain Sounds Ambient Nature Sounds",
    channel: "Sleep Music",
    lens: "calmer",
  });

  assert.equal(documentary.label, LABELS.GREEN);
  assert.equal(documentary.domain, DOMAINS.DOCUMENTARY);
  assert.ok(documentary.baselineSafe);
  assert.equal(tutorial.label, LABELS.GREEN);
  assert.equal(tutorial.domain, DOMAINS.TUTORIAL);
  assert.ok(tutorial.baselineSafe);
  assert.equal(ambient.label, LABELS.GREEN);
  assert.equal(ambient.domain, DOMAINS.MUSIC_AMBIENT);
  assert.ok(ambient.baselineSafe);
});
