(function attachPersonaLabsOpsRegression(root, factory) {
  const storage = typeof require === "function" ? require("./storage") : root.PersonaLabsOpsStorage;
  const api = factory(storage);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PersonaLabsOpsRegression = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsOpsRegression(storage) {
  "use strict";

  function normalizeClassification(record) {
    const item = record || {};
    return {
      observationId: item.observationId || "",
      actualCategory: item.actualCategory || item.actualLabel || "UNKNOWN",
      confidence: Number(item.confidence) || 0,
      pipelineVersion: item.pipelineVersion || "unknown",
      governanceDowngrades: item.governanceDecisions && item.governanceDecisions.downgradeReasons || [],
      contradictions: item.contradictionState && item.contradictionState.contradictions || [],
      matchedSignals: item.matchedSignals || {}
    };
  }

  function compareClassifications(before, after) {
    const previous = normalizeClassification(before);
    const current = normalizeClassification(after);
    const confidenceDelta = current.confidence - previous.confidence;
    const categoryChanged = previous.actualCategory !== current.actualCategory;
    const governanceChanged = JSON.stringify(previous.governanceDowngrades) !== JSON.stringify(current.governanceDowngrades);
    const contradictionChanged = JSON.stringify(previous.contradictions) !== JSON.stringify(current.contradictions);
    const signalChanged = JSON.stringify(previous.matchedSignals) !== JSON.stringify(current.matchedSignals);
    const pipelineChanged = previous.pipelineVersion !== current.pipelineVersion;

    return {
      observationId: current.observationId || previous.observationId,
      previousPipelineVersion: previous.pipelineVersion,
      currentPipelineVersion: current.pipelineVersion,
      previousCategory: previous.actualCategory,
      currentCategory: current.actualCategory,
      categoryChanged,
      previousConfidence: previous.confidence,
      currentConfidence: current.confidence,
      confidenceDelta,
      governanceChanged,
      contradictionChanged,
      signalChanged,
      pipelineChanged,
      driftDetected: categoryChanged || governanceChanged || contradictionChanged || Math.abs(confidenceDelta) >= 10,
      severity: categoryChanged
        ? "high"
        : governanceChanged || contradictionChanged || Math.abs(confidenceDelta) >= 10
          ? "medium"
          : signalChanged || confidenceDelta !== 0
            ? "low"
            : "none"
    };
  }

  function summarizeDiffs(diffs) {
    const items = diffs || [];
    return {
      total: items.length,
      driftCount: items.filter((item) => item.driftDetected).length,
      highSeverity: items.filter((item) => item.severity === "high").length,
      mediumSeverity: items.filter((item) => item.severity === "medium").length,
      lowSeverity: items.filter((item) => item.severity === "low").length,
      categoryChanges: items.filter((item) => item.categoryChanged).length,
      governanceChanges: items.filter((item) => item.governanceChanged).length,
      contradictionChanges: items.filter((item) => item.contradictionChanged).length,
      maxConfidenceDelta: items.reduce((max, item) => Math.max(max, Math.abs(item.confidenceDelta || 0)), 0)
    };
  }

  function createRegressionSnapshot(input) {
    const item = input || {};
    const diffs = item.diffs || [];
    const summary = summarizeDiffs(diffs);
    return {
      snapshotId: item.snapshotId || storage.createRecordId("regressionSnapshot"),
      createdAt: item.createdAt || storage.nowIso(),
      basePipelineVersion: item.basePipelineVersion || "unknown",
      comparisonPipelineVersion: item.comparisonPipelineVersion || "unknown",
      replayPackId: item.replayPackId || "",
      summary,
      diffs: storage.clone(diffs)
    };
  }

  async function storeRegressionSnapshot(adapter, input) {
    return adapter.put("regressionSnapshots", createRegressionSnapshot(input));
  }

  return Object.freeze({
    compareClassifications,
    createRegressionSnapshot,
    normalizeClassification,
    storeRegressionSnapshot,
    summarizeDiffs
  });
});
