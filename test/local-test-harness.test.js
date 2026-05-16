const assert = require("node:assert/strict");
const test = require("node:test");

const app = require("../harness/test-harness");

function fakeStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    }
  };
}

test("local harness renders API missing state", () => {
  const html = app.renderApiStatus(null);

  assert.match(html, /PersonaLabsTestAPI unavailable/);
  assert.match(html, /PERSONALABS_DEBUG=true/);
});

test("local harness renders evidence bundle details", () => {
  const html = app.renderEvidenceBundle({
    appVersion: "0.1.0",
    pipelineVersion: "canonical-semantic-v1",
    scenarioInputs: [{ title: "Cute Baby Bunny Compilation" }],
    expectedOutputs: [{ expectedLabel: "GREEN" }],
    actualOutputs: [{ actualLabel: "GREEN", pass: true }],
    traceEvents: [{ stage: "final label selection" }],
    governanceDecisions: [{ scenarioId: "one" }],
    replayDriftResults: []
  }, []);

  assert.match(html, /App version/);
  assert.match(html, /canonical-semantic-v1/);
  assert.match(html, /Scenario inputs/);
  assert.match(html, /Trace events/);
  assert.match(html, /Cute Baby Bunny Compilation/);
});

test("local harness renders scenario results", () => {
  const html = app.renderScenarioResults({
    total: 2,
    passed: 1,
    driftDetected: true,
    results: [
      { scenarioId: "calm", actualLabel: "GREEN", expectedLabel: "GREEN", pass: true, severity: "none", driftDetected: false },
      { scenarioId: "outrage", actualLabel: "YELLOW", expectedLabel: "RED", pass: false, severity: "high", driftDetected: true }
    ]
  });

  assert.match(html, /1\/2 passing/);
  assert.match(html, /calm/);
  assert.match(html, /outrage/);
  assert.match(html, /result-pass/);
  assert.match(html, /result-fail/);
  assert.match(html, /Severity: high/);
});

test("local harness renders drift summary", () => {
  const html = app.renderDriftSummary({
    actualOutputs: [
      { scenarioId: "pass", pass: true },
      { scenarioId: "fail", pass: false }
    ],
    replayDriftResults: [{ replayAgreementState: "drift" }],
    contradictionState: [
      { scenarioId: "contradiction", contradictionState: { hasContradictions: true, contradictions: ["warning"] } }
    ]
  });

  assert.match(html, /Scenario failures:<\/strong> 1/);
  assert.match(html, /Replay drifts:<\/strong> 1/);
  assert.match(html, /Contradiction states:<\/strong> 1/);
  assert.match(html, /Overall drift:<\/strong> attention/);
});

test("local harness exposes no mutation methods in safe API surface", () => {
  const safeApi = {
    runScenario() {},
    runScenarioPack() {},
    getLatestTraces() {},
    getPipelineHealth() {},
    exportEvidenceBundle() {}
  };
  const unsafeApi = {
    ...safeApi,
    setLabel() {},
    setDictionary() {}
  };

  assert.deepEqual(app.getUnsafeMutationMethods(safeApi), []);
  assert.deepEqual(app.getUnsafeMutationMethods(unsafeApi), ["setDictionary", "setLabel"]);
  assert.equal(app.DEFAULT_SCENARIO_PACK.scenarios.length, 5);
  assert.deepEqual(
    app.DEFAULT_SCENARIO_PACK.scenarios.map((scenario) => scenario.id),
    [
      "harness-calm-animal",
      "harness-political-outrage",
      "harness-educational-tutorial",
      "harness-clickbait-manipulation",
      "harness-ambiguous-low-context"
    ]
  );
});

test("local harness stores evidence bundles in localStorage-compatible storage", () => {
  const storage = fakeStorage();
  const stored = app.storeEvidenceBundle(storage, {
    appVersion: "0.1.0",
    pipelineVersion: "canonical-semantic-v1",
    actualOutputs: []
  });

  assert.equal(stored.length, 1);
  assert.equal(app.readStoredBundles(storage).length, 1);
  assert.equal(app.readStoredBundles(storage)[0].bundle.pipelineVersion, "canonical-semantic-v1");
});
