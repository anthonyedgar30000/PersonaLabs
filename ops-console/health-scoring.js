(function attachPersonaLabsHealthScoring(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PersonaLabsHealthScoring = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsHealthScoring() {
  "use strict";

  const HEALTH_STATUSES = Object.freeze(["HEALTHY", "DEGRADED", "UNSTABLE", "INVESTIGATE"]);

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function percentPenalty(rate, weight) {
    return clamp(Number(rate) || 0, 0, 1) * weight;
  }

  function regressionPenalty(summary) {
    const item = summary || {};
    const total = Number(item.total) || 0;
    if (!total) {
      return 0;
    }

    return clamp(
      ((Number(item.highSeverity) || 0) * 1 + (Number(item.mediumSeverity) || 0) * 0.55 + (Number(item.lowSeverity) || 0) * 0.2) / total,
      0,
      1
    ) * 20;
  }

  function healthStatus(score, criticalFlags) {
    const flags = criticalFlags || {};
    if (flags.categoryCollapse || flags.oscillation || score < 45) {
      return "UNSTABLE";
    }
    if (flags.suddenDrift || flags.confidenceInflation || score < 70) {
      return "INVESTIGATE";
    }
    if (score < 85) {
      return "DEGRADED";
    }
    return "HEALTHY";
  }

  function scorePipelineHealth(input) {
    const metrics = input && input.metrics || {};
    const drift = input && input.drift || {};
    const regressionSummary = metrics.regressionSeverityTrend || {};
    const replayInstability = 1 - clamp(metrics.replayConsistency == null ? 1 : metrics.replayConsistency, 0, 1);
    const volatility = clamp(metrics.signalVolatility || 0, 0, 1);
    const confidenceVariance = clamp((metrics.confidenceVariance || 0) / 1000, 0, 1);

    const score = Math.round(clamp(
      100 -
        percentPenalty(replayInstability, 22) -
        percentPenalty(metrics.contradictionFrequency, 14) -
        percentPenalty(metrics.reviewerDisagreementRate, 18) -
        percentPenalty(volatility, 12) -
        percentPenalty(metrics.ambiguousClassificationFrequency, 8) -
        percentPenalty(confidenceVariance, 6) -
        regressionPenalty(regressionSummary),
      0,
      100
    ));
    const criticalFlags = {
      suddenDrift: Boolean(drift.suddenDrift && drift.suddenDrift.detected),
      confidenceInflation: Boolean(drift.confidenceInflation && drift.confidenceInflation.detected),
      categoryCollapse: Boolean(drift.categoryBoundaryCollapse && drift.categoryBoundaryCollapse.detected),
      oscillation: Boolean(drift.oscillatingOutputs && drift.oscillatingOutputs.detected)
    };

    return {
      score,
      status: healthStatus(score, criticalFlags),
      criticalFlags,
      inputs: {
        replayInstability,
        contradictionFrequency: metrics.contradictionFrequency || 0,
        reviewerDisagreementRate: metrics.reviewerDisagreementRate || 0,
        signalVolatility: volatility,
        ambiguousClassificationFrequency: metrics.ambiguousClassificationFrequency || 0,
        confidenceVariance: metrics.confidenceVariance || 0,
        regressionSeverityTrend: regressionSummary
      }
    };
  }

  return Object.freeze({
    HEALTH_STATUSES,
    healthStatus,
    scorePipelineHealth
  });
});
