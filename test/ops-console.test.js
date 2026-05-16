const assert = require("node:assert/strict");
const test = require("node:test");

const storage = require("../ops-console/storage");
const ingestion = require("../ops-console/ingestion");
const classification = require("../ops-console/classification");
const regression = require("../ops-console/regression");
const replay = require("../ops-console/replay");
const app = require("../ops-console/app");

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

function createAdapter() {
  return storage.createLocalStorageAdapter({ storage: fakeStorage(), prefix: `test-${Date.now()}-${Math.random()}` });
}

function stubApi(version = "test-pipeline-v1") {
  return {
    runScenario(scenario) {
      const title = scenario.input && scenario.input.title || "";
      const red = /shocking|destroys|meltdown/i.test(title);
      const label = red ? "RED" : "GREEN";
      const confidence = red ? 91 : 88;
      return {
        scenarioId: scenario.id,
        actualLabel: label,
        confidenceDelta: 0,
        governanceAgreement: true,
        contradictionAgreement: true,
        matchedSignalAgreement: true,
        suppressedSignalAgreement: true,
        driftDetected: false,
        severity: "none",
        pipelineVersion: version,
        pass: true,
        labelAgreement: true,
        confidenceAgreement: true,
        replayResults: [],
        score: {
          traceId: `trace-${scenario.id}`,
          input: { title },
          anchor: { keyTerms: title.toLowerCase().split(/\s+/).slice(0, 3) },
          label,
          confidence,
          pipelineVersion: version,
          scoringPath: `scenario:${scenario.id}`,
          explanation: red ? "explicit escalation or distress framing detected" : "low-friction deterministic classification",
          matchedTerms: red ? { friction: ["shocking", "destroys"], positive: [] } : { positive: ["tutorial"], friction: [] },
          suppressedTerms: [],
          contradictions: [],
          semanticSignals: { confidenceDeltas: { friction: red ? 40 : 0, positiveSignal: red ? 0 : 20 } },
          reasoning: {
            reasons: red ? [] : ["explanatory framing"],
            downgradeReasons: red ? ["explicit escalation or distress framing detected"] : [],
            finalReason: red ? "explicit escalation" : "low friction"
          },
          confidenceValidation: { valid: true },
          traceEvents: [
            { stage: "tokenization", order: 1 },
            { stage: "final label selection", order: 8 }
          ]
        }
      };
    },
    runScenarioPack() {},
    getLatestTraces() { return []; },
    getPipelineHealth() { return { pipelineVersion: version }; },
    exportEvidenceBundle() { return {}; }
  };
}

test("ops storage declares local-first stores for future backend migration", () => {
  assert.deepEqual(storage.STORE_NAMES, [
    "observations",
    "classifications",
    "traces",
    "reviews",
    "replayPacks",
    "regressionSnapshots",
    "reliabilitySnapshots",
    "goldenDatasets",
    "adversarialRuns",
    "boundaryReports"
  ]);
  assert.equal(storage.STORE_SCHEMAS.observations.keyPath, "observationId");
  assert(storage.STORE_SCHEMAS.classifications.indexes.includes("pipelineVersion"));
  assert(storage.STORE_SCHEMAS.reviews.indexes.includes("reviewerDecision"));
});

test("ingestion creates timestamped observations without classifying", async () => {
  const adapter = createAdapter();
  const observations = ingestion.parseBatchTitles("Cute Bunny Compilation | Wholesome Pets", {
    query: "cute bunny",
    sourceType: "youtube-search",
    pipelineVersion: "canonical-semantic-v1"
  });
  await ingestion.ingestObservations(adapter, observations);
  const storedObservations = await adapter.list("observations");
  const storedClassifications = await adapter.list("classifications");

  assert.equal(storedObservations.length, 1);
  assert.equal(storedClassifications.length, 0);
  assert.equal(storedObservations[0].sourceType, "youtube-search");
  assert.equal(storedObservations[0].query, "cute bunny");
  assert.equal(storedObservations[0].title, "Cute Bunny Compilation");
  assert.equal(storedObservations[0].channel, "Wholesome Pets");
  assert.equal(storedObservations[0].pipelineVersion, "canonical-semantic-v1");
  assert.equal(typeof storedObservations[0].observedAt, "string");
  assert.deepEqual(storedObservations[0].rawSourceData, { line: "Cute Bunny Compilation | Wholesome Pets" });
});

test("classification stores operational records and deterministic trace details separately", async () => {
  const adapter = createAdapter();
  const [observation] = ingestion.parseBatchTitles("SHOCKING political meltdown: senator DESTROYS rivals | Outrage Daily", {
    query: "senator hearing",
    pipelineVersion: "test-pipeline-v1"
  });
  await adapter.put("observations", observation);
  const [output] = await classification.classifyObservations(adapter, stubApi(), [observation]);
  const classifications = await adapter.list("classifications");
  const traces = await adapter.list("traces");

  assert.equal(output.classification.actualCategory, "RED");
  assert.equal(classifications.length, 1);
  assert.equal(traces.length, 1);
  assert.equal(traces[0].observationId, observation.observationId);
  assert.deepEqual(traces[0].matchedRules.friction, ["shocking", "destroys"]);
  assert.deepEqual(traces[0].confidenceAdjustments, { friction: 40, positiveSignal: 0 });
});

test("classification table is searchable filterable sortable and renders governance fields", () => {
  const rows = [
    {
      classificationId: "one",
      title: "Cute Bunny",
      query: "pets",
      actualCategory: "GREEN",
      confidence: 88,
      matchedSignals: { positive: ["cute"] },
      suppressions: [],
      governanceDecisions: { explanation: "low friction" },
      driftIndicators: { severity: "none" },
      contradictionState: { hasContradictions: false },
      pipelineVersion: "v1"
    },
    {
      classificationId: "two",
      title: "SHOCKING meltdown",
      query: "politics",
      actualCategory: "RED",
      confidence: 91,
      matchedSignals: { friction: ["shocking"] },
      suppressions: [],
      governanceDecisions: { downgradeReasons: ["explicit escalation"] },
      driftIndicators: { severity: "medium" },
      contradictionState: { hasContradictions: true },
      pipelineVersion: "v1"
    }
  ];

  const filtered = app.filterAndSortRows(rows, { search: "explicit", category: "RED", sort: "confidence:desc" });
  const html = app.renderClassificationTable(filtered, {});

  assert.equal(filtered.length, 1);
  assert.match(html, /data-classification-id='two'/);
  assert.match(html, /category-red/);
  assert.match(html, /confidence-high/);
  assert.match(html, /explicit escalation/);
  assert.match(html, /medium \/ contradiction/);
});

test("trace inspector renders explainable deterministic execution sections", () => {
  const html = app.renderTraceInspector({
    traceId: "trace-one",
    pipelineVersion: "v1",
    tokenization: { titleTokens: ["cute", "bunny"] },
    matchedRules: { positive: ["cute"] },
    suppressedSignals: [],
    contradictionHandling: [],
    confidenceAdjustments: { positiveSignal: 20 },
    governanceDowngradesEscalations: { reasons: ["explanatory framing"] },
    finalReasoningChain: { finalReason: "low friction" },
    traceEvents: [{ stage: "final label selection" }]
  }, { title: "Cute Bunny" });

  assert.match(html, /Tokenization/);
  assert.match(html, /Matched Rules/);
  assert.match(html, /Suppressed Signals/);
  assert.match(html, /Contradiction Handling/);
  assert.match(html, /Confidence Adjustments/);
  assert.match(html, /Governance Downgrades/);
  assert.match(html, /Final Reasoning Chain/);
});

test("human reviews are modeled separately from raw observations", async () => {
  const adapter = createAdapter();
  const observation = ingestion.createObservation({ title: "Update from yesterday" }, { query: "updates" });
  await adapter.put("observations", observation);
  const review = app.createReview({
    observationId: observation.observationId,
    expectedCategory: "YELLOW",
    actualCategory: "GREEN",
    reviewerDecision: "false-negative",
    reviewerNotes: "Low context title needs uncertainty."
  });
  await adapter.put("reviews", review);

  assert.equal((await adapter.list("observations")).length, 1);
  assert.equal((await adapter.list("reviews")).length, 1);
  assert.equal((await adapter.list("classifications")).length, 0);
  assert.match(app.renderReviewPanel({ observationId: observation.observationId, actualCategory: "GREEN" }, [review]), /false-negative/);
});

test("replay packs and regression snapshots compare pipeline outputs", async () => {
  const adapter = createAdapter();
  const [observation] = ingestion.parseBatchTitles("Cute Bunny Tutorial | Wholesome Pets", {
    query: "pets",
    pipelineVersion: "test-pipeline-v1"
  });
  await adapter.put("observations", observation);
  const [baseline] = await classification.classifyObservations(adapter, stubApi("test-pipeline-v1"), [observation]);
  const pack = await replay.createReplayPackFromObservations(adapter, {
    name: "golden smoke pack",
    observations: [observation],
    classifications: [baseline.classification],
    sourcePipelineVersion: "test-pipeline-v1"
  });
  const replayResult = await replay.replayPack(adapter, stubApi("test-pipeline-v2"), pack);

  assert.equal(replayResult.diffs.length, 1);
  assert.equal(replayResult.diffs[0].pipelineChanged, true);
  assert.equal(replayResult.snapshot.basePipelineVersion, "test-pipeline-v1");
  assert.equal(replayResult.snapshot.comparisonPipelineVersion, "test-pipeline-v2");
  assert.equal((await adapter.list("regressionSnapshots")).length, 1);
});

test("regression comparison detects category and confidence drift", () => {
  const diff = regression.compareClassifications({
    observationId: "one",
    actualCategory: "GREEN",
    confidence: 90,
    pipelineVersion: "v1",
    governanceDecisions: { downgradeReasons: [] },
    contradictionState: { contradictions: [] },
    matchedSignals: { positive: ["cute"] }
  }, {
    observationId: "one",
    actualCategory: "RED",
    confidence: 70,
    pipelineVersion: "v2",
    governanceDecisions: { downgradeReasons: ["explicit escalation"] },
    contradictionState: { contradictions: [] },
    matchedSignals: { friction: ["shocking"] }
  });

  assert.equal(diff.categoryChanged, true);
  assert.equal(diff.confidenceDelta, -20);
  assert.equal(diff.driftDetected, true);
  assert.equal(diff.severity, "high");
});

test("ops console reports unsafe mutation methods when present", () => {
  const safeStatus = app.apiStatus(stubApi());
  const unsafeStatus = app.apiStatus({ ...stubApi(), setDictionary() {}, bypassGovernance() {} });

  assert.equal(safeStatus.available, true);
  assert.deepEqual(safeStatus.unsafeMethods, []);
  assert.deepEqual(unsafeStatus.unsafeMethods, ["setDictionary", "bypassGovernance"]);
  assert.match(app.renderApiStatus({ ...stubApi(), setDictionary() {}, bypassGovernance() {} }), /Unsafe mutation APIs: setDictionary, bypassGovernance/);
});
