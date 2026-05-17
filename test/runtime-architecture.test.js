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
  assert.match(contentRuntime, /const DEBUG_RENDERING = false/);
  assert.match(contentRuntime, /function personaLabsDebugEnabled\(\)/);
  assert.match(contentRuntime, /if \(!DEBUG_RENDERING && !personaLabsDebugEnabled\(\)\)/);
  assert.match(contentRuntime, /if \(window\.PERSONALABS_DEBUG === true\) \{\s*console\.info\(LOG_PREFIX, "content\.js executing"/);
  assert.match(contentRuntime, /if \(!personaLabsDebugEnabled\(\)\) \{\s*return null;\s*\}/);
  assert.match(contentRuntime, /window\.PersonaLabsDebugTraces = state\.traces/);
});

test("capstone demo controls preserve privacy and user agency", () => {
  const contentRuntime = fs.readFileSync(path.join(root, "src", "content.js"), "utf8");

  assert.match(contentRuntime, /function clearStoredState\(\)/);
  assert.match(contentRuntime, /window\.localStorage\.removeItem\(STORAGE_KEY\)/);
  assert.match(contentRuntime, /chrome\.storage\.local\.remove\(STORAGE_KEY\)/);
  assert.match(contentRuntime, /Clear saved context/);
  assert.match(contentRuntime, /function handleLoadDemoStyle\(styleId\)/);
  assert.match(contentRuntime, /Guided demo videos/);
  assert.match(contentRuntime, /Neutral explainer/);
  assert.match(contentRuntime, /Urgency \+ risk/);
  assert(!/Optional rewritten searches/.test(contentRuntime));
  assert.match(contentRuntime, /window\.open\(url, "_blank", "noopener,noreferrer"\)/);
  assert.match(contentRuntime, /window\.location\.assign\(url\)/);
});

test("semantic trace inspector exposes debug-only inspection utilities", () => {
  const contentRuntime = fs.readFileSync(path.join(root, "src", "content.js"), "utf8");

  assert.match(contentRuntime, /Developer trace inspector/);
  assert.match(contentRuntime, /<summary>/);
  assert.match(contentRuntime, /renderPipelineHealth/);
  assert.match(contentRuntime, /Developer: pipeline check/);
  assert.match(contentRuntime, /data-action='clear-traces'/);
  assert.match(contentRuntime, /data-action='toggle-verbose'/);
  assert.match(contentRuntime, /data-action='filter-traces'/);
  assert.match(contentRuntime, /data-action='replay-visible-traces'/);
  assert.match(contentRuntime, /data-action='load-replay-json'/);
  assert.match(contentRuntime, /data-action='run-scenarios'/);
  assert.match(contentRuntime, /data-action='run-golden-pack'/);
  assert.match(contentRuntime, /Replay Analysis/);
  assert.match(contentRuntime, /Scenario Validation/);
  assert.match(contentRuntime, /Golden Regression Pack/);
  assert.match(contentRuntime, /value='retrieval'/);
  assert.match(contentRuntime, /value='governance'/);
  assert.match(contentRuntime, /renderInspectorSection\("Input"/);
  assert.match(contentRuntime, /renderInspectorListSection\("Extracted Terms"/);
  assert.match(contentRuntime, /renderInspectorListSection\("Detected Signals"/);
  assert.match(contentRuntime, /renderInspectorSection\("Rule-match components"/);
  assert.match(contentRuntime, /renderInspectorListSection\("Rule Checks"/);
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
  assert.match(contentRuntime, /Rule-match Trace JSON/);
});

test("overlay candidates are scoped to video surfaces only", () => {
  const contentRuntime = fs.readFileSync(path.join(root, "src", "content.js"), "utf8");
  const getCandidateCardsFunction = contentRuntime.match(/function getCandidateCards[\s\S]*?function findTitleElement/)[0];
  const clickFunction = contentRuntime.match(/function handleDocumentClick[\s\S]*?function handleLoadDemoStyle/)[0];
  const titleBadgeFunction = contentRuntime.match(/function upsertTitleBadge[\s\S]*?function findThumbnailHost/)[0];
  const thumbnailOverlayFunction = contentRuntime.match(/function upsertThumbnailOverlay[\s\S]*?function createPanel/)[0];

  assert.match(contentRuntime, /NON_VIDEO_TEXT_SURFACE_SELECTOR/);
  assert.match(contentRuntime, /ytd-comments/);
  assert.match(contentRuntime, /ytd-comment-replies-renderer/);
  assert.match(contentRuntime, /yt-live-chat-text-message-renderer/);
  assert.match(contentRuntime, /#description-inline-expander/);
  assert.match(getCandidateCardsFunction, /TITLE_LINK_FALLBACK_SELECTOR/);
  assert.match(getCandidateCardsFunction, /\.filter\(isEligibleVideoAnnotationTarget\)/);
  assert(!/querySelectorAll\("a\[href\*='watch'\], a\[href\*='\/shorts\/'\]"\)/.test(getCandidateCardsFunction));
  assert.match(clickFunction, /resolveVideoAnnotationTarget\(target\)/);
  assert.match(titleBadgeFunction, /isEligibleVideoAnnotationTarget\(card\)/);
  assert.match(thumbnailOverlayFunction, /isEligibleVideoAnnotationTarget\(card\)/);
});

test("inspector observes traces without participating in scoring", () => {
  const contentRuntime = fs.readFileSync(path.join(root, "src", "content.js"), "utf8");
  const inspectorFunction = contentRuntime.match(/function renderDebugTraces[\s\S]*?function filteredDebugTraces/)[0];
  const pipelineHealthFunction = contentRuntime.match(/function renderPipelineHealth[\s\S]*?function healthItem/)[0];

  assert(!/scoreContent|scoreCandidate|scoreCandidates/.test(inspectorFunction));
  assert(!/scoreContent|scoreCandidate|scoreCandidates/.test(pipelineHealthFunction));
  assert.match(pipelineHealthFunction, /Overlay\/panel agreement/);
  assert.match(pipelineHealthFunction, /Retrieval agreement/);
  assert.match(pipelineHealthFunction, /Label mismatch warning/);
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

test("golden validation delegates to canonical golden runner", () => {
  const contentRuntime = fs.readFileSync(path.join(root, "src", "content.js"), "utf8");
  const inspectorFunction = contentRuntime.match(/function renderDebugTraces[\s\S]*?function renderReplayAnalysis/)[0];

  assert.match(inspectorFunction, /semantic\.runGoldenRegressionPack/);
  assert.match(inspectorFunction, /semantic\.defaultGoldenRegressionPack/);
  assert(!/scoreContent|scoreCandidate|scoreCandidates/.test(inspectorFunction));
});

