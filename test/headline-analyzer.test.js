const assert = require("node:assert/strict");
const test = require("node:test");

const { analyzeHeadline, normalizeText } = require("../lib/headlineAnalyzer");

test("normalizes text for deterministic token and phrase matching", () => {
  const normalized = normalizeText("Public Radio: DOG rescued after storm!");

  assert.equal(normalized.text, "public radio dog rescued after storm");
  assert.deepEqual(normalized.tokens, ["public", "radio", "dog", "rescued", "after", "storm"]);
});

test("classifies chill-aligned wholesome and animal headlines as GREEN", () => {
  const cases = [
    ["Dog rescued after storm finds forever home", "Local Animal Rescue"],
    ["Bunny room makeover", "Rabbit Room"],
    ["Mini Lop Rabbits Playing", "Pet Channel"],
    ["Relaxing Aquarium Fish", "Peaceful Pets"],
    ["How I Care for My Senior Hamster", "Hamster Home"],
    ["Public radio explains how birds migrate", "Public Radio Education"],
    ["Relaxing cooking video for a quiet Sunday", "Cozy Kitchen"]
  ];

  cases.forEach(([title, source]) => {
    const analysis = analyzeHeadline(title, source, "chill");

    assert.equal(analysis.label, "GREEN", title);
    assert(analysis.scores.green_score > analysis.scores.yellow_score);
    assert(analysis.scores.green_score > analysis.scores.red_score);
    assert(analysis.reasons.length > 0);
  });
});

test("safe-domain animal headlines suppress weak harmless friction before visible overlay selection", () => {
  const analysis = analyzeHeadline("Bunny drama warning during funny zoomies", "Rabbit Clips", "chill");

  assert.equal(analysis.label, "GREEN");
  assert.equal(analysis.visibleOverlay.label, "GREEN");
  assert.equal(analysis.governance.safeDomain.isSafeAnimalDomain, true);
  assert.deepEqual(analysis.governance.suppressedWeakTerms, ["drama", "warning"]);
  assert.match(analysis.reasons.join(" "), /Suppressed weak harmless-context terms/);
});

test("safe-domain animal YELLOW is reserved for unresolved uncertainty, not weak pet friction", () => {
  const analysis = analyzeHeadline("Animal controversy investigation", "Wildlife News", "chill");

  assert.equal(analysis.label, "YELLOW");
  assert.equal(analysis.visibleOverlay.label, "YELLOW");
  assert.equal(analysis.confidence, "uncertain");
  assert.equal(analysis.governance.safeDomain.isSafeAnimalDomain, true);
  assert(analysis.governance.unresolvedYellowScore >= analysis.governance.thresholds.safeDomainYellowStrong);
  assert.match(analysis.explanation, /uncertain/i);
});

test("classifies controversy and allegation language as YELLOW or RED based on score", () => {
  const analysis = analyzeHeadline("Politician denies shocking allegations", "Public Radio", "chill");

  assert(["YELLOW", "RED"].includes(analysis.label));
  assert(analysis.matchedTerms.yellow.some((match) => match.term === "denies"));
  assert(analysis.matchedTerms.yellow.some((match) => match.term === "allegations"));
  assert(analysis.matchedTerms.red.some((match) => match.term === "shocking"));
  assert.match(analysis.reasons[0], /Marked (yellow|red)/);
});

test("classifies high-intensity distress headlines as RED", () => {
  const analysis = analyzeHeadline("Terrifying footage shows attack during war", "Outrage Clips", "chill");

  assert.equal(analysis.label, "RED");
  assert(analysis.matchedTerms.red.some((match) => match.term === "terrifying"));
  assert(analysis.matchedTerms.red.some((match) => match.term === "attack"));
  assert(analysis.matchedTerms.red.some((match) => match.term === "war"));
});

test("strong animal distress still overrides safe-domain GREEN default", () => {
  const analysis = analyzeHeadline("Injured dog attack warning", "Animal Rescue", "chill");

  assert.equal(analysis.label, "RED");
  assert.equal(analysis.visibleOverlay.label, "RED");
  assert(analysis.matchedTerms.red.some((match) => match.term === "attack"));
});
