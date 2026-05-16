const assert = require("node:assert/strict");
const test = require("node:test");

const storage = require("../ops-console/storage");
const metrics = require("../ops-console/reliability-metrics");
const drift = require("../ops-console/drift-analysis");
const health = require("../ops-console/health-scoring");
const golden = require("../ops-console/golden-datasets");
const adversarial = require("../ops-console/adversarial");
const boundary = require("../ops-console/boundary-analysis");
const reliabilityTrace = require("../ops-console/reliability-trace");
const dashboard = require("../ops-console/reliability-dashboard");

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
  return storage.createLocalStorageAdapter({ storage: fakeStorage(), prefix: `reliability-${Date.now()}-${Math.random()}` });
}

function sampleClassifications() {
  return [
    {
      classificationId: "c1",
      observationId: "o1",
      title: "Cute Bunny",
      actualCategory: "GREEN",
      confidence: 80,
      classifiedAt: "2026-01-01T00:00:00.000Z",
      matchedSignals: { positive: ["cute"], friction: [] },
      suppressions: [],
      governanceDecisions: { downgradeReasons: [] },
      contradictionState: { hasContradictions: false, contradictions: [] },
      pipelineVersion: "v1"
    },
    {
      classificationId: "c2",
      observationId: "o1",
      title: "Cute Bunny",
      actualCategory: "YELLOW",
      confidence: 58,
      classifiedAt: "2026-01-02T00:00:00.000Z",
      matchedSignals: { positive: ["cute"], friction: ["shocking"] },
      suppressions: ["warning"],
      governanceDecisions: { downgradeReasons: ["mixed signal overlap"] },
      contradictionState: { hasContradictions: true, contradictions: ["positive/friction overlap"] },
      pipelineVersion: "v2"
    },
    {
      classificationId: "c3",
      observationId: "o2",
      title: "Political meltdown",
      actualCategory: "RED",
      confidence: 96,
      classifiedAt: "2026-01-03T00:00:00.000Z",
      matchedSignals: { positive: [], friction: ["meltdown"] },
      suppressions: [],
      governanceDecisions: { downgradeReasons: ["explicit escalation"] },
      contradictionState: { hasContradictions: false, contradictions: [] },
      pipelineVersion: "v2"
    }
  ];
}

test("reliability metrics quantify stability, variance, ambiguity, and disagreement", () => {
  const snapshot = metrics.createReliabilitySnapshot({
    classifications: sampleClassifications(),
    reviews: [
      { observationId: "o1", expectedCategory: "GREEN", actualCategory: "YELLOW", reviewerDecision: "rejected" },
      { observationId: "o2", expectedCategory: "RED", actualCategory: "RED", reviewerDecision: "approved" }
    ],
    regressionSnapshots: [
      {
        summary: { total: 2, driftCount: 1, highSeverity: 1, mediumSeverity: 0, lowSeverity: 0 },
        diffs: [{ driftDetected: true }, { driftDetected: false }]
      }
    ],
    pipelineVersion: "v2"
  });

  assert.equal(snapshot.pipelineVersion, "v2");
  assert.equal(snapshot.immutable, true);
  assert(snapshot.metrics.categoryStability < 1);
  assert(snapshot.metrics.confidenceVariance > 0);
  assert.equal(snapshot.metrics.contradictionFrequency, 1 / 3);
  assert.equal(snapshot.metrics.governanceSuppressionFrequency, 2 / 3);
  assert.equal(snapshot.metrics.reviewerDisagreementRate, 0.5);
  assert.equal(snapshot.metrics.replayConsistency, 0.5);
  assert.equal(snapshot.health.status !== undefined, true);
});

test("semantic drift analysis detects sudden, slow, inflation, collapse, oscillation, overlap, and rule patterns", () => {
  const classifications = [
    ...sampleClassifications(),
    { observationId: "low-1", actualCategory: "YELLOW", confidence: 30, classifiedAt: "2026-01-03T01:00:00.000Z", matchedSignals: {} },
    { observationId: "low-2", actualCategory: "YELLOW", confidence: 32, classifiedAt: "2026-01-03T02:00:00.000Z", matchedSignals: {} },
    { observationId: "low-3", actualCategory: "YELLOW", confidence: 35, classifiedAt: "2026-01-03T03:00:00.000Z", matchedSignals: {} },
    ...Array.from({ length: 36 }, (_, index) => ({
      observationId: `collapse-${index}`,
      actualCategory: "RED",
      confidence: 88 + index,
      classifiedAt: `2026-01-${String(index + 4).padStart(2, "0")}T00:00:00.000Z`,
      matchedSignals: { friction: ["meltdown"] },
      contradictionState: { hasContradictions: false }
    })),
    { observationId: "o1", actualCategory: "GREEN", confidence: 99, classifiedAt: "2026-02-01T00:00:00.000Z", matchedSignals: { positive: ["cute"] } }
  ];
  const report = drift.analyzeSemanticDrift({
    classifications,
    regressionSnapshots: [
      { snapshotId: "s3", summary: { total: 10, driftCount: 5, highSeverity: 1 } },
      { snapshotId: "s2", summary: { total: 10, driftCount: 3, highSeverity: 0 } },
      { snapshotId: "s1", summary: { total: 10, driftCount: 1, highSeverity: 0 } }
    ],
    knownSignals: ["meltdown", "never-used-signal"]
  });

  assert.equal(report.suddenDrift.detected, true);
  assert.equal(report.cumulativeSlowDrift.detected, true);
  assert.equal(report.confidenceInflation.detected, true);
  assert.equal(report.categoryBoundaryCollapse.detected, true);
  assert.equal(report.oscillatingOutputs.detected, true);
  assert.equal(report.contradictorySignalOverlap.detected, true);
  assert(report.ruleTriggerPatterns.overTriggering.includes("meltdown"));
  assert(report.ruleTriggerPatterns.deadUnused.includes("never-used-signal"));
});

test("health scoring produces deterministic status from reliability inputs", () => {
  const healthy = health.scorePipelineHealth({
    metrics: {
      replayConsistency: 1,
      contradictionFrequency: 0,
      reviewerDisagreementRate: 0,
      signalVolatility: 0,
      ambiguousClassificationFrequency: 0,
      confidenceVariance: 0,
      regressionSeverityTrend: { total: 0 }
    },
    drift: {}
  });
  const unstable = health.scorePipelineHealth({
    metrics: {
      replayConsistency: 0.2,
      contradictionFrequency: 0.5,
      reviewerDisagreementRate: 0.5,
      signalVolatility: 0.8,
      ambiguousClassificationFrequency: 0.7,
      confidenceVariance: 900,
      regressionSeverityTrend: { total: 10, highSeverity: 4, mediumSeverity: 3, lowSeverity: 2 }
    },
    drift: { categoryBoundaryCollapse: { detected: true } }
  });

  assert.equal(healthy.status, "HEALTHY");
  assert.equal(unstable.status, "UNSTABLE");
  assert(unstable.score < healthy.score);
});

test("golden dataset promotion requires human-reviewed immutable entries", async () => {
  const adapter = createAdapter();
  const dataset = await golden.promoteGoldenDataset(adapter, {
    name: "Reviewed smoke anchors",
    pipelineVersion: "v2",
    observations: [{ observationId: "o1", title: "Cute Bunny", query: "pets", channel: "Pets", rawSourceData: { title: "Cute Bunny" } }],
    classifications: [{ observationId: "o1", actualCategory: "GREEN", pipelineVersion: "v2" }],
    reviews: [
      { reviewId: "r1", observationId: "o1", expectedCategory: "GREEN", actualCategory: "GREEN", reviewerDecision: "approved" },
      { reviewId: "r2", observationId: "o2", expectedCategory: "", actualCategory: "RED", reviewerDecision: "rejected" }
    ]
  });

  assert.equal(dataset.immutable, true);
  assert.equal(dataset.entryCount, 1);
  assert.equal(dataset.entries[0].reviewId, "r1");
  assert.equal((await adapter.list("goldenDatasets")).length, 1);
  assert.deepEqual(golden.createReplayPackInputFromGoldenDataset(dataset).observationIds, ["o1"]);
});

test("adversarial scenario packs measure manipulation susceptibility", () => {
  const observation = { observationId: "o1", title: "Cute Bunny", channel: "Pets", metadata: {} };
  const pack = adversarial.createAdversarialScenarioPack(observation);
  const evaluation = adversarial.evaluateAdversarialResults(
    { actualLabel: "GREEN", score: { confidence: 85 } },
    [
      { scenarioId: "a1", actualLabel: "GREEN", score: { confidence: 88, reasoning: { downgradeReasons: [] }, contradictions: [] } },
      { scenarioId: "a2", actualLabel: "RED", score: { confidence: 99, reasoning: { downgradeReasons: ["explicit escalation"] }, contradictions: ["overlap"] } }
    ]
  );

  assert.equal(pack.scenarios.length, adversarial.ATTACK_TEMPLATES.length);
  assert(pack.scenarios.some((scenario) => /won't believe|SHOCKING|calm peaceful shocking crisis/i.test(scenario.input.title)));
  assert.equal(evaluation.labelChangeRate, 0.5);
  assert.equal(evaluation.governanceEffectivenessRate, 0.5);
  assert.equal(evaluation.contradictionRate, 0.5);
});

test("boundary analysis reports confusion pairs and unstable tokens", () => {
  const report = boundary.createBoundaryReport({
    pipelineVersion: "v2",
    classifications: [
      { observationId: "o1", actualCategory: "GREEN", matchedSignals: { positive: ["cute"], friction: [] } },
      { observationId: "o2", actualCategory: "RED", matchedSignals: { positive: ["cute"], friction: ["meltdown"] } }
    ],
    reviews: [
      { observationId: "o1", expectedCategory: "GREEN", actualCategory: "GREEN" },
      { observationId: "o2", expectedCategory: "YELLOW", actualCategory: "RED" }
    ]
  });

  assert.equal(report.confusionMap.YELLOW.RED, 1);
  assert.equal(report.highConfusionPairs[0].expected, "YELLOW");
  assert(report.unstableBoundaryTokens.some((item) => item.token === "cute"));
  assert.equal(report.categoryCollisionCount, 1);
});

test("reliability trace mode annotates conflict density and unstable tokens", () => {
  const annotations = reliabilityTrace.annotateTrace({
    matchedRules: { positive: ["cute"], friction: ["cute", "meltdown"] },
    confidenceAdjustments: { positiveSignal: 20, friction: -55 }
  }, {
    unstableBoundaryTokens: [{ token: "cute", categories: ["GREEN", "RED"] }],
    driftWarnings: ["suddenDrift"]
  });
  const html = reliabilityTrace.renderReliabilityAnnotations(annotations);

  assert(annotations.conflictDensity > 0);
  assert.equal(annotations.confidenceChangeOverlay.warning, true);
  assert.equal(annotations.unstableTokenIndicators[0].token, "cute");
  assert.match(html, /Reliability Trace Mode/);
  assert.match(html, /suddenDrift/);
});

test("dashboard renders reliability panels and health inputs", () => {
  const html = dashboard.renderReliabilityDashboard({
    healthScore: 83,
    healthStatus: "DEGRADED",
    metrics: {
      replayConsistency: 0.9,
      reviewerDisagreementRate: 0.1,
      confidenceVariance: 120,
      governanceSuppressionFrequency: 0.2,
      signalVolatility: 0.15
    },
    health: { inputs: { replayInstability: 0.1 } },
    drift: { cumulativeSlowDrift: { detected: true } }
  }, {
    highConfusionPairs: [{ expected: "GREEN", actual: "YELLOW", count: 2 }]
  }, {
    evaluation: { resilient: false }
  });

  assert.match(html, /Reliability score/);
  assert.match(html, /Replay consistency/);
  assert.match(html, /slow drift detected/);
  assert.match(html, /Adversarial resilience/);
  assert.match(dashboard.renderHealthStatusBadge({ healthStatus: "DEGRADED" }), /DEGRADED/);
});
