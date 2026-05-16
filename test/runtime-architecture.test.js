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

