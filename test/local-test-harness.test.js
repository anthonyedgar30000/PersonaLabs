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

test("local harness parses pasted titles into permissive classification scenarios", () => {
  const scenarios = app.parseTitleLines("Cute Bunny | Pet Channel\nUpdate from yesterday", "pets");

  assert.equal(scenarios.length, 2);
  assert.equal(scenarios[0].input.title, "Cute Bunny");
  assert.equal(scenarios[0].input.channel, "Pet Channel");
  assert.deepEqual(scenarios[0].expectedLabel, ["GREEN", "YELLOW", "RED"]);
  assert.equal(scenarios[1].description, "Pasted title for query: pets");
});

test("local harness renders compact classification results", () => {
  const html = app.renderResultsTable({
    total: 2,
    passed: 2,
    results: [
      {
        scenarioId: "calm",
        actualLabel: "GREEN",
        score: {
          confidence: 96,
          explanation: "Calm/pet content detected.",
          input: { title: "Cute Bunny" }
        }
      },
      {
        scenarioId: "ambiguous",
        actualLabel: "YELLOW",
        score: {
          confidence: 45,
          explanation: "Not enough GREEN evidence.",
          input: { title: "Update from yesterday" }
        }
      }
    ]
  });

  assert.match(html, /2\/2 scenario checks passing/);
  assert.match(html, /Cute Bunny/);
  assert.match(html, /label-green/);
  assert.match(html, /confidence-high/);
  assert.match(html, /Update from yesterday/);
  assert.match(html, /label-yellow/);
});

test("local harness renders compact trace hierarchy with raw JSON disclosure", () => {
  const html = app.renderSelectedDetails({
    actualLabel: "GREEN",
    score: {
      label: "GREEN",
      confidence: 96,
      matchedTerms: { positive: ["cute"], friction: [] },
      suppressedTerms: ["drama"],
      explanation: "Calm/pet content detected.",
      traceEvents: [{ stage: "final label selection" }]
    }
  });

  assert.match(html, /Final label/);
  assert.match(html, /Confidence/);
  assert.match(html, /Matched signals/);
  assert.match(html, /Suppressed signals/);
  assert.match(html, /Final explanation/);
  assert.match(html, /Raw trace JSON/);
});

test("local harness compacts and stores only latest evidence", () => {
  const storage = fakeStorage();
  const compact = app.storeLatestEvidence(storage, {
    appVersion: "0.1.0",
    pipelineVersion: "canonical-semantic-v1",
    exportedAt: "2026-01-01T00:00:00.000Z",
    scenarioInputs: [{ title: "Cute Bunny" }],
    actualOutputs: [{ actualLabel: "GREEN" }],
    traceEvents: [{ stage: "final label selection" }],
    replayDriftResults: [{ replayAgreementState: "drift" }]
  });

  assert.equal(compact.pipelineVersion, "canonical-semantic-v1");
  assert.equal(compact.inputs.length, 1);
  assert.equal(compact.results.length, 1);
  assert.equal(compact.traces.length, 1);
  assert.equal(compact.replayDriftResults, undefined);
  assert.equal(app.readLatestEvidence(storage).pipelineVersion, "canonical-semantic-v1");
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
      "mvp-calm-animal",
      "mvp-political-outrage",
      "mvp-educational-tutorial",
      "mvp-clickbait-manipulation",
      "mvp-ambiguous-low-context"
    ]
  );
});
