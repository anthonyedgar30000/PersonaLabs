(function attachPersonaLabsOpsClassification(root, factory) {
  const storage = typeof require === "function" ? require("./storage") : root.PersonaLabsOpsStorage;
  const ingestion = typeof require === "function" ? require("./ingestion") : root.PersonaLabsOpsIngestion;
  const api = factory(storage, ingestion);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PersonaLabsOpsClassification = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsOpsClassification(storage, ingestion) {
  "use strict";

  function clone(value) {
    return storage.clone(value);
  }

  function getGovernanceDecisions(score) {
    const reasoning = score && score.reasoning || {};
    return {
      reasons: reasoning.reasons || [],
      downgradeReasons: reasoning.downgradeReasons || [],
      finalReason: reasoning.finalReason || "",
      confidenceValidation: score && score.confidenceValidation || null,
      explanation: score && score.explanation || ""
    };
  }

  function createClassificationRecord(observation, scenarioResult) {
    const score = scenarioResult && scenarioResult.score || {};
    const classifiedAt = storage.nowIso();

    return {
      classificationId: storage.createRecordId("classification"),
      observationId: observation.observationId,
      sourceType: observation.sourceType,
      query: observation.query,
      title: observation.title,
      channel: observation.channel,
      actualCategory: scenarioResult && scenarioResult.actualLabel || score.label || "UNKNOWN",
      confidence: Number(score.confidence) || 0,
      matchedSignals: clone(score.matchedTerms || {}),
      suppressions: clone(score.suppressedTerms || []),
      governanceDecisions: getGovernanceDecisions(score),
      contradictionState: {
        hasContradictions: Boolean(score.contradictions && score.contradictions.length),
        contradictions: clone(score.contradictions || [])
      },
      driftIndicators: {
        driftDetected: Boolean(scenarioResult && scenarioResult.driftDetected),
        replayDrifts: (scenarioResult && scenarioResult.replayResults || []).filter((item) => item.replayAgreementState === "drift").length,
        severity: scenarioResult && scenarioResult.severity || "none"
      },
      pipelineVersion: scenarioResult && scenarioResult.pipelineVersion || score.pipelineVersion || observation.pipelineVersion || "unknown",
      traceId: score.traceId || "",
      classifiedAt,
      rawScenarioResult: clone(scenarioResult)
    };
  }

  function createTraceRecord(observation, classification, scenarioResult) {
    const score = scenarioResult && scenarioResult.score || {};
    return {
      traceRecordId: storage.createRecordId("trace"),
      observationId: observation.observationId,
      classificationId: classification.classificationId,
      traceId: score.traceId || "",
      pipelineVersion: classification.pipelineVersion,
      capturedAt: classification.classifiedAt,
      tokenization: {
        titleTokens: score.input && score.input.title ? String(score.input.title).toLowerCase().split(/\s+/).filter(Boolean) : [],
        anchorTerms: score.anchor && score.anchor.keyTerms || []
      },
      matchedRules: clone(score.matchedTerms || {}),
      suppressedSignals: clone(score.suppressedTerms || []),
      contradictionHandling: clone(score.contradictions || []),
      confidenceAdjustments: clone(score.semanticSignals && score.semanticSignals.confidenceDeltas || {}),
      governanceDowngradesEscalations: getGovernanceDecisions(score),
      finalReasoningChain: clone(score.reasoning || {}),
      traceEvents: clone(score.traceEvents || []),
      rawScore: clone(score)
    };
  }

  function requireApi(testApi) {
    if (!testApi || typeof testApi.runScenario !== "function") {
      throw new Error("PersonaLabs semantic ops classification requires window.PersonaLabsTestAPI.runScenario.");
    }

    return testApi;
  }

  async function classifyObservation(adapter, testApi, observation) {
    const api = requireApi(testApi);
    const scenario = ingestion.observationToScenario(observation);
    const result = api.runScenario(scenario);
    const classification = await adapter.put("classifications", createClassificationRecord(observation, result));
    const trace = await adapter.put("traces", createTraceRecord(observation, classification, result));

    return {
      observation: clone(observation),
      classification,
      trace,
      scenarioResult: clone(result)
    };
  }

  async function classifyObservations(adapter, testApi, observations) {
    const outputs = [];
    for (const observation of observations || []) {
      outputs.push(await classifyObservation(adapter, testApi, observation));
    }
    return outputs;
  }

  function confidenceBand(confidence) {
    const value = Number(confidence) || 0;
    if (value >= 80) {
      return "high";
    }
    if (value >= 55) {
      return "medium";
    }
    return "low";
  }

  return Object.freeze({
    classifyObservation,
    classifyObservations,
    confidenceBand,
    createClassificationRecord,
    createTraceRecord,
    getGovernanceDecisions,
    requireApi
  });
});
