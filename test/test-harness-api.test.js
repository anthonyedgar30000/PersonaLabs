const assert = require("node:assert/strict");
const test = require("node:test");

const semantic = require("../src/semantic-core");
const harness = require("../src/test-harness-api");

function sampleScenario(overrides = {}) {
  return {
    id: "api-calm-bunny",
    category: "benign",
    description: "Calm pet content remains green.",
    expectedLabel: "GREEN",
    expectedConfidenceRange: [70, 100],
    expectedGovernanceOutcomes: ["Calm/pet content detected"],
    expectedContradictionState: false,
    expectedMatchedSignalCategories: { positive: ["cute", "bunny"], friction: [] },
    input: {
      title: "Cute Baby Bunny Compilation",
      channel: "Wholesome Pets",
      duration: "12:00",
      url: "https://www.youtube.com/watch?v=abc123&token=secret-token"
    },
    ...overrides
  };
}

test("PersonaLabsTestAPI only exists in debug mode", () => {
  const nonDebugRoot = {
    PERSONALABS_DEBUG: false,
    PersonaLabsSemantic: semantic
  };

  assert.equal(harness.install(nonDebugRoot), null);
  assert.equal(Object.hasOwn(nonDebugRoot, "PersonaLabsTestAPI"), false);

  const debugRoot = {
    PERSONALABS_DEBUG: true,
    PersonaLabsSemantic: semantic
  };
  const api = harness.install(debugRoot);

  assert.equal(debugRoot.PersonaLabsTestAPI, api);
  assert.equal(Object.isFrozen(api), true);
  assert.deepEqual(Object.keys(api), [
    "runScenario",
    "runScenarioPack",
    "getLatestTraces",
    "getPipelineHealth",
    "exportEvidenceBundle"
  ]);
});

test("runScenario delegates through canonical scoreContent without alternate scoring", () => {
  let scoreContentCalls = 0;
  let scoreCandidateCalls = 0;
  const root = { PERSONALABS_DEBUG: true };
  const stubSemantic = {
    PIPELINE_VERSION: "stub-pipeline",
    scoreContent(input) {
      scoreContentCalls += 1;
      return {
        traceId: "trace-1",
        label: input.candidate.title ? "GREEN" : "YELLOW",
        confidence: 88,
        pipelineVersion: "stub-pipeline",
        scoringPath: "scenario:stub",
        explanation: "stub canonical score",
        traceEvents: [{ stage: "final label selection", timestamp: "2026-01-01T00:00:00.000Z" }],
        matchedTerms: { positive: ["cute"], friction: [] },
        suppressedTerms: [],
        reasoning: { reasons: ["canonical"], downgradeReasons: [], finalReason: "canonical" },
        confidenceValidation: { valid: true },
        contradictions: []
      };
    },
    scoreCandidate() {
      scoreCandidateCalls += 1;
      throw new Error("alternate scoring must not be called");
    },
    runScenario(scenario) {
      const score = this.scoreContent({ candidate: scenario.input, scoringPath: `scenario:${scenario.id}` });
      return {
        scenarioId: scenario.id,
        actualLabel: score.label,
        confidenceDelta: 0,
        governanceAgreement: true,
        contradictionAgreement: true,
        matchedSignalAgreement: true,
        suppressedSignalAgreement: true,
        driftDetected: false,
        severity: "none",
        pipelineVersion: "stub-pipeline",
        pass: true,
        labelAgreement: true,
        confidenceAgreement: true,
        replayResults: [],
        score
      };
    },
    runScenarioPack(pack) {
      const results = pack.scenarios.map((scenario) => this.runScenario(scenario));
      return {
        name: pack.name,
        pipelineVersion: "stub-pipeline",
        total: results.length,
        passed: results.length,
        failed: 0,
        driftDetected: false,
        severity: "none",
        results
      };
    },
    getPipelineHealth() {
      return { pipelineVersion: "stub-pipeline", canonicalScoringFunction: "scoreContent" };
    }
  };
  root.PersonaLabsSemantic = stubSemantic;
  const api = harness.install(root);

  const result = api.runScenario(sampleScenario());

  assert.equal(result.actualLabel, "GREEN");
  assert.equal(scoreContentCalls, 1);
  assert.equal(scoreCandidateCalls, 0);
});

test("exportEvidenceBundle contains required evidence fields without sensitive data", () => {
  const root = {
    PERSONALABS_DEBUG: true,
    PersonaLabsSemantic: semantic
  };
  const api = harness.install(root);

  api.runScenario(sampleScenario({
    accountId: "account-123",
    input: {
      title: "Cute Baby Bunny Compilation",
      channel: "Wholesome Pets",
      duration: "12:00",
      url: "https://www.youtube.com/watch?v=abc123&token=secret-token",
      authToken: "secret-token"
    }
  }));
  const bundle = api.exportEvidenceBundle();
  const serialized = JSON.stringify(bundle);

  assert.equal(bundle.appVersion, "0.1.0");
  assert.equal(bundle.pipelineVersion, semantic.PIPELINE_VERSION);
  assert.equal(bundle.scenarioInputs.length, 1);
  assert.equal(bundle.expectedOutputs.length, 1);
  assert.equal(bundle.actualOutputs.length, 1);
  assert(bundle.traceEvents.length > 0);
  assert.equal(bundle.matchedSuppressedSignals.length, 1);
  assert.equal(bundle.governanceDecisions.length, 1);
  assert.equal(bundle.contradictionState.length, 1);
  assert(Array.isArray(bundle.replayDriftResults));
  assert.equal(typeof bundle.timestamps.exportedAt, "string");
  assert.equal(bundle.safety.cookiesIncluded, false);
  assert.equal(bundle.safety.tokensIncluded, false);
  assert.equal(bundle.safety.accountDataIncluded, false);
  assert.equal(bundle.safety.domDumpIncluded, false);
  assert(!serialized.includes("secret-token"));
  assert(!serialized.includes("account-123"));
  assert(!serialized.includes("outerHTML"));
  assert(!serialized.includes("documentElement"));
});

test("test API cannot mutate scoring rules or dictionaries", () => {
  const originalTaxonomy = JSON.stringify(semantic.STYLE_TAXONOMY);
  const originalCalmTerms = JSON.stringify(semantic.CALM_POSITIVE_TERMS);
  const root = {
    PERSONALABS_DEBUG: true,
    PersonaLabsSemantic: semantic
  };
  const api = harness.install(root);

  assert.equal(api.STYLE_TAXONOMY, undefined);
  assert.equal(api.CALM_POSITIVE_TERMS, undefined);
  assert.equal(api.setScoringRules, undefined);
  assert.equal(api.setDictionary, undefined);
  assert.equal(api.setLabel, undefined);

  api.runScenario(sampleScenario({
    STYLE_TAXONOMY: { escalation: ["mutated"] },
    CALM_POSITIVE_TERMS: ["mutated"],
    expectedLabel: "GREEN"
  }));

  assert.equal(JSON.stringify(semantic.STYLE_TAXONOMY), originalTaxonomy);
  assert.equal(JSON.stringify(semantic.CALM_POSITIVE_TERMS), originalCalmTerms);
});

test("pipeline health reports canonical state and safety controls", () => {
  const root = {
    PERSONALABS_DEBUG: true,
    PersonaLabsSemantic: semantic
  };
  const api = harness.install(root);

  const health = api.getPipelineHealth();

  assert.equal(health.pipelineVersion, semantic.PIPELINE_VERSION);
  assert.equal(health.canonicalState.canonicalScoringFunction, "scoreContent");
  assert.deepEqual(health.canonicalState.activeScoringEntrypoints, ["scoreContent"]);
  assert.equal(health.canonicalState.governanceBypassAllowed, false);
  assert.equal(health.canonicalState.scoringRuleMutationAllowed, false);
  assert.equal(health.canonicalState.dictionaryMutationAllowed, false);
  assert.equal(health.canonicalState.directLabelMutationAllowed, false);
  assert.equal(health.safety.readOnlyExceptTestExecution, true);
  assert.equal(health.safety.exposesScoringRuleMutation, false);
  assert.equal(health.safety.exposesDictionaryMutation, false);
  assert.equal(health.safety.exposesDirectLabelMutation, false);
  assert.equal(health.safety.governanceBypassAllowed, false);
  assert.equal(health.safety.includesCookiesTokensOrAccountData, false);
  assert.equal(health.safety.includesDomDump, false);
});
