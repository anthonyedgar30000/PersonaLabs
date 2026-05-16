const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("runtime UI does not load or call the legacy headline analyzer", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  const runtimeScripts = manifest.content_scripts.flatMap((entry) => entry.js || []);
  const contentRuntime = fs.readFileSync(path.join(root, "src", "content.js"), "utf8");

  assert(!runtimeScripts.includes("lib/headlineAnalyzer.js"));
  assert(!/headlineAnalyzer|analyzeHeadline/.test(contentRuntime));
});

test("debug trace collection is gated by PERSONALABS_DEBUG", () => {
  const contentRuntime = fs.readFileSync(path.join(root, "src", "content.js"), "utf8");

  assert.match(contentRuntime, /window\.PERSONALABS_DEBUG = false/);
  assert.match(contentRuntime, /function personaLabsDebugEnabled\(\)/);
  assert.match(contentRuntime, /if \(!personaLabsDebugEnabled\(\)\) \{\s*return null;\s*\}/);
  assert.match(contentRuntime, /window\.PersonaLabsDebugTraces = state\.traces/);
});

test("semantic trace inspector exposes debug-only inspection utilities", () => {
  const contentRuntime = fs.readFileSync(path.join(root, "src", "content.js"), "utf8");

  assert.match(contentRuntime, /Semantic Trace Inspector/);
  assert.match(contentRuntime, /<summary>/);
  assert.match(contentRuntime, /renderPipelineHealth/);
  assert.match(contentRuntime, /Pipeline Health/);
  assert.match(contentRuntime, /data-action='clear-traces'/);
  assert.match(contentRuntime, /data-action='toggle-verbose'/);
  assert.match(contentRuntime, /data-action='filter-traces'/);
  assert.match(contentRuntime, /data-action='replay-visible-traces'/);
  assert.match(contentRuntime, /data-action='load-replay-json'/);
  assert.match(contentRuntime, /data-action='run-scenarios'/);
  assert.match(contentRuntime, /Replay Analysis/);
  assert.match(contentRuntime, /Scenario Validation/);
  assert.match(contentRuntime, /value='retrieval'/);
  assert.match(contentRuntime, /value='governance'/);
  assert.match(contentRuntime, /renderInspectorSection\("Input"/);
  assert.match(contentRuntime, /renderInspectorListSection\("Extracted Terms"/);
  assert.match(contentRuntime, /renderInspectorListSection\("Detected Signals"/);
  assert.match(contentRuntime, /renderInspectorSection\("Confidence Deltas"/);
  assert.match(contentRuntime, /renderInspectorListSection\("Governance Decisions"/);
  assert.match(contentRuntime, /renderInspectorListSection\("Contradictions"/);
  assert.match(contentRuntime, /renderInspectorEvents\("Trace Events"/);
});

test("overlays stay compact while detailed debugging stays in the inspector", () => {
  const contentRuntime = fs.readFileSync(path.join(root, "src", "content.js"), "utf8");
  const overlayFunction = contentRuntime.match(/function renderCanonicalOverlay[\s\S]*?function upsertTitleBadge/)[0];

  assert.match(overlayFunction, /personalabs-overlay-label/);
  assert.match(overlayFunction, /personalabs-overlay-confidence/);
  assert.match(overlayFunction, /personalabs-overlay-reason/);
  assert(!/personalabs-overlay-breakdown/.test(overlayFunction));
  assert(!/personalabs-overlay-terms/.test(overlayFunction));
  assert(!/matchedTerms/.test(overlayFunction));
  assert.match(contentRuntime, /Canonical Trace JSON/);
});

test("inspector observes traces without participating in scoring", () => {
  const contentRuntime = fs.readFileSync(path.join(root, "src", "content.js"), "utf8");
  const inspectorFunction = contentRuntime.match(/function renderDebugTraces[\s\S]*?function filteredDebugTraces/)[0];
  const pipelineHealthFunction = contentRuntime.match(/function renderPipelineHealth[\s\S]*?function healthItem/)[0];

  assert(!/scoreContent|scoreCandidate|scoreCandidates/.test(inspectorFunction));
  assert(!/scoreContent|scoreCandidate|scoreCandidates/.test(pipelineHealthFunction));
  assert.match(pipelineHealthFunction, /Overlay\/panel agreement/);
  assert.match(pipelineHealthFunction, /Retrieval agreement/);
  assert.match(pipelineHealthFunction, /Semantic drift warning/);
});

test("replay UI delegates to canonical replay helpers", () => {
  const contentRuntime = fs.readFileSync(path.join(root, "src", "content.js"), "utf8");
  const inspectorFunction = contentRuntime.match(/function renderDebugTraces[\s\S]*?function renderReplayAnalysis/)[0];

  assert.match(inspectorFunction, /semantic\.replayTraces/);
  assert(!/scoreContent|scoreCandidate|scoreCandidates/.test(inspectorFunction));
});

test("scenario validation delegates to canonical scenario runner", () => {
  const contentRuntime = fs.readFileSync(path.join(root, "src", "content.js"), "utf8");
  const inspectorFunction = contentRuntime.match(/function renderDebugTraces[\s\S]*?function renderReplayAnalysis/)[0];

  assert.match(inspectorFunction, /semantic\.runScenarioPack/);
  assert.match(inspectorFunction, /semantic\.defaultScenarioPack/);
  assert(!/scoreContent|scoreCandidate|scoreCandidates/.test(inspectorFunction));
});

