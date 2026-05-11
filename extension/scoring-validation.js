const assert = require("assert");
const dictionaries = require("./dictionaries");
const scoring = require("./scoring");

const REQUIRED_MIN_TERMS = 75;
const REQUIRED_MAX_TERMS = 150;

Object.entries(dictionaries.categories).forEach(([categoryName, category]) => {
  assert(
    category.terms.length >= REQUIRED_MIN_TERMS && category.terms.length <= REQUIRED_MAX_TERMS,
    `${categoryName} should contain ${REQUIRED_MIN_TERMS}-${REQUIRED_MAX_TERMS} terms`
  );
});

assertGreen("Cute bunny aquarium nature stream");
assertGreen("Peaceful ocean waves and relaxing rain sounds");
assertNotGreen("ATTACKED and HORRIFYING footage sparks PANIC");
assertNotGreen("HUMILIATED and EXPOSED in shocking meltdown");
["ATTACKED footage", "HORRIFYING footage", "PANIC update", "HUMILIATED clip", "EXPOSED story"]
  .forEach(assertFrictionBand);

const missingTitle = scoring.classifyTitle("");
assert.strictEqual(missingTitle.presentation.signalConfidence, "low");
assert.strictEqual(missingTitle.internalSignals.metadataConfidence, "low");

function assertGreen(title) {
  const result = scoring.classifyTitle(title);
  assert(
    result.presentation.labelBand === "green" || result.presentation.labelBand === "strongGreen",
    `${title} should classify as green; got ${result.presentation.labelBand}`
  );
}

function assertNotGreen(title) {
  const result = scoring.classifyTitle(title);
  assert(
    result.presentation.labelBand !== "green" && result.presentation.labelBand !== "strongGreen",
    `${title} should not classify as green; got ${result.presentation.labelBand}`
  );
}

function assertFrictionBand(title) {
  const result = scoring.classifyTitle(title);
  assert(
    ["yellow", "orange", "red", "darkRed"].includes(result.presentation.labelBand),
    `${title} should classify as yellow/orange/red; got ${result.presentation.labelBand}`
  );
}

console.log("PersonaLabs Chill Mode scoring validation passed.");
