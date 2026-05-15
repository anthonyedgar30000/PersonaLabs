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
