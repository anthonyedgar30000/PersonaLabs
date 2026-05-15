const assert = require("assert");
const queryRewriting = require("./query-rewriting");

const exposed = queryRewriting.rewriteTitle("Creator EXPOSED in shocking meltdown", "lowerFriction");
assert.strictEqual(exposed.preset, "lowerFriction");
assert(exposed.transformedQuery.includes("analysis"), "exposed/meltdown should become analysis");
assert(exposed.transformedQuery.includes("explained"), "shocking should become explained");
assert(exposed.transformedQuery.includes("long-form"), "lowerFriction should add long-form intent");

const destroyed = queryRewriting.rewriteTitle("Debate opponent DESTROYED", "calmer");
assert.strictEqual(destroyed.preset, "calmer");
assert(destroyed.transformedQuery.includes("discussion"), "destroyed should become discussion");
assert(destroyed.transformedQuery.includes("calm"), "calmer should add calm intent");

const panic = queryRewriting.rewriteTitle("PANIC after breaking disaster", "moreEducational");
assert.strictEqual(panic.preset, "moreEducational");
assert(panic.transformedQuery.includes("overview"), "panic should become overview");
assert(panic.transformedQuery.includes("context"), "breaking/disaster should become context");
assert(panic.transformedQuery.includes("context"), "disaster should become context");
assert(panic.transformedQuery.includes("educational"), "moreEducational should add educational intent");

const beginner = queryRewriting.searchUrlFor("Humiliation story explained", "beginnerFriendly");
assert.strictEqual(beginner.preset, "beginnerFriendly");
assert(beginner.transformedQuery.includes("interview"), "humiliation should become interview");
assert(beginner.transformedQuery.includes("beginner"), "beginnerFriendly should add beginner intent");
assert(
  beginner.url.startsWith("https://www.youtube.com/results?search_query="),
  "searchUrlFor should produce a YouTube search URL"
);

const deeper = queryRewriting.rewriteTitle("Tucker Carlson DESTROYS Debate", "deeperDive");
assert.strictEqual(deeper.preset, "deeperDive");
assert(deeper.transformedQuery.includes("discussion"), "destroys should become discussion");
assert(deeper.transformedQuery.includes("documentary"), "deeperDive should turn debate toward documentary");

const lowerFriction = queryRewriting.rewriteTitle("Tucker Carlson DESTROYS Debate", "lowerFriction");
assert.strictEqual(lowerFriction.preset, "lowerFriction");
assert(lowerFriction.transformedQuery.includes("discussion"), "lowerFriction should soften destroys");
assert(lowerFriction.transformedQuery.includes("Debate"), "lowerFriction should preserve the topic wording");
assert(lowerFriction.transformedQuery.includes("long-form"), "lowerFriction should add long-form context");

const longerForm = queryRewriting.rewriteTitle("SCANDAL after debate", "longerForm");
assert.strictEqual(longerForm.preset, "longerForm");
assert(longerForm.transformedQuery.includes("interview"), "scandal should become interview");
assert(longerForm.transformedQuery.includes("long-form"), "longerForm should add long-form framing");
assert(longerForm.transformedQuery.includes("documentary"), "longerForm should include documentary framing");

assert.deepStrictEqual(queryRewriting.PRESET_ORDER, [
  "calmer",
  "moreEducational",
  "lowerFriction",
  "deeperDive",
  "beginnerFriendly",
  "longerForm"
]);

console.log("PersonaLabs query rewriting validation passed.");
