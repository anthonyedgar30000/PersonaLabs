const assert = require("assert");
const queryRewriting = require("./query-rewriting");

const exposed = queryRewriting.rewriteTitle("Creator EXPOSED in shocking meltdown", "lessSensational");
assert.strictEqual(exposed.preset, "lessSensational");
assert(exposed.transformedQuery.includes("analysis"), "exposed/meltdown should become analysis");
assert(exposed.transformedQuery.includes("explained"), "shocking should become explained");
assert(exposed.transformedQuery.includes("balanced"), "lessSensational should add balanced intent");

const destroyed = queryRewriting.rewriteTitle("Debate opponent DESTROYED", "calmer");
assert.strictEqual(destroyed.preset, "calmer");
assert(destroyed.transformedQuery.includes("discussion"), "destroyed should become discussion");
assert(destroyed.transformedQuery.includes("calm"), "calmer should add calm intent");

const panic = queryRewriting.rewriteTitle("PANIC after breaking disaster", "moreEducational");
assert.strictEqual(panic.preset, "moreEducational");
assert(panic.transformedQuery.includes("overview"), "panic should become overview");
assert(panic.transformedQuery.includes("update"), "breaking should become update");
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

console.log("PersonaLabs query rewriting validation passed.");
