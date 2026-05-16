(function attachPersonaLabsReliabilityMetrics(root, factory) {
  const storage = typeof require === "function" ? require("./storage") : root.PersonaLabsOpsStorage;
  const healthScoring = typeof require === "function" ? require("./health-scoring") : root.PersonaLabsHealthScoring;
  const api = factory(storage, healthScoring);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PersonaLabsReliabilityMetrics = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsReliabilityMetrics(storage, healthScoring) {
  "use strict";

  function mean(values) {
    const items = (values || []).filter((value) => Number.isFinite(Number(value))).map(Number);
    if (!items.length) {
      return 0;
    }
    return items.reduce((total, value) => total + value, 0) / items.length;
  }

  function variance(values) {
    const items = (values || []).filter((value) => Number.isFinite(Number(value))).map(Number);
    if (items.length < 2) {
      return 0;
    }
    const avg = mean(items);
    return items.reduce((total, value) => total + Math.pow(value - avg, 2), 0) / items.length;
  }

  function groupBy(items, keyFn) {
    return (items || []).reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }

  function signalSet(record) {
    const matched = record && record.matchedSignals || {};
    return Object.keys(matched).flatMap((category) => (matched[category] || []).map((signal) => `${category}:${signal}`));
  }

  function jaccardDistance(left, right) {
    const a = new Set(left || []);
    const b = new Set(right || []);
    const union = new Set([...a, ...b]);
    if (!union.size) {
      return 0;
    }
    const intersection = [...a].filter((value) => b.has(value)).length;
    return 1 - intersection / union.size;
  }

  function categoryStability(classifications) {
    const groups = groupBy(classifications, (item) => item.observationId || item.title || "unknown");
    let comparisons = 0;
    let changes = 0;
    Object.values(groups).forEach((records) => {
      const ordered = records.slice().sort((a, b) => String(a.classifiedAt || "").localeCompare(String(b.classifiedAt || "")));
      for (let index = 1; index < ordered.length; index += 1) {
        comparisons += 1;
        if (ordered[index - 1].actualCategory !== ordered[index].actualCategory) {
          changes += 1;
        }
      }
    });
    return comparisons ? 1 - changes / comparisons : 1;
  }

  function signalVolatility(classifications) {
    const groups = groupBy(classifications, (item) => item.observationId || item.title || "unknown");
    const distances = [];
    Object.values(groups).forEach((records) => {
      const ordered = records.slice().sort((a, b) => String(a.classifiedAt || "").localeCompare(String(b.classifiedAt || "")));
      for (let index = 1; index < ordered.length; index += 1) {
        distances.push(jaccardDistance(signalSet(ordered[index - 1]), signalSet(ordered[index])));
      }
    });
    return mean(distances);
  }

  function categoryEntropy(classifications) {
    const total = (classifications || []).length;
    if (!total) {
      return 0;
    }
    const counts = groupBy(classifications, (item) => item.actualCategory || "UNKNOWN");
    const categories = Object.keys(counts);
    if (categories.length <= 1) {
      return 0;
    }
    const entropy = categories.reduce((sum, category) => {
      const p = counts[category].length / total;
      return sum - p * Math.log2(p);
    }, 0);
    return entropy / Math.log2(categories.length);
  }

  function reviewerDisagreementRate(reviews) {
    const items = reviews || [];
    if (!items.length) {
      return 0;
    }
    const disagreements = items.filter((review) => {
      const decision = review.reviewerDecision || "";
      return decision === "rejected" ||
        decision === "false-positive" ||
        decision === "false-negative" ||
        Boolean(review.expectedCategory && review.actualCategory && review.expectedCategory !== review.actualCategory);
    });
    return disagreements.length / items.length;
  }

  function replayConsistency(regressionSnapshots) {
    const diffs = (regressionSnapshots || []).flatMap((snapshot) => snapshot.diffs || []);
    if (!diffs.length) {
      return 1;
    }
    return 1 - diffs.filter((diff) => diff.driftDetected).length / diffs.length;
  }

  function regressionSeverityTrend(regressionSnapshots) {
    return (regressionSnapshots || []).reduce((summary, snapshot) => {
      const item = snapshot.summary || {};
      summary.total += Number(item.total) || 0;
      summary.driftCount += Number(item.driftCount) || 0;
      summary.highSeverity += Number(item.highSeverity) || 0;
      summary.mediumSeverity += Number(item.mediumSeverity) || 0;
      summary.lowSeverity += Number(item.lowSeverity) || 0;
      return summary;
    }, { total: 0, driftCount: 0, highSeverity: 0, mediumSeverity: 0, lowSeverity: 0 });
  }

  function calculateReliabilityMetrics(input) {
    const classifications = input && input.classifications || [];
    const reviews = input && input.reviews || [];
    const regressionSnapshots = input && input.regressionSnapshots || [];
    const total = classifications.length || 1;
    const contradictions = classifications.filter((item) => item.contradictionState && item.contradictionState.hasContradictions).length;
    const suppressions = classifications.filter((item) => (item.suppressions || []).length || (item.governanceDecisions && (item.governanceDecisions.downgradeReasons || []).length)).length;
    const ambiguous = classifications.filter((item) => item.actualCategory === "YELLOW" || Number(item.confidence) < 55).length;

    return {
      classificationCount: classifications.length,
      categoryStability: categoryStability(classifications),
      confidenceMean: mean(classifications.map((item) => item.confidence)),
      confidenceVariance: variance(classifications.map((item) => item.confidence)),
      contradictionFrequency: contradictions / total,
      governanceSuppressionFrequency: suppressions / total,
      reviewerDisagreementRate: reviewerDisagreementRate(reviews),
      replayConsistency: replayConsistency(regressionSnapshots),
      regressionSeverityTrend: regressionSeverityTrend(regressionSnapshots),
      signalVolatility: signalVolatility(classifications),
      categoryEntropy: categoryEntropy(classifications),
      ambiguousClassificationFrequency: ambiguous / total
    };
  }

  function createReliabilitySnapshot(input) {
    const metrics = calculateReliabilityMetrics(input);
    const drift = input && input.drift || {};
    const health = healthScoring.scorePipelineHealth({ metrics, drift });
    return {
      reliabilitySnapshotId: input && input.reliabilitySnapshotId || storage.createRecordId("reliabilitySnapshot"),
      createdAt: input && input.createdAt || storage.nowIso(),
      pipelineVersion: input && input.pipelineVersion || "unknown",
      healthStatus: health.status,
      healthScore: health.score,
      metrics,
      drift,
      health,
      immutable: true
    };
  }

  async function storeReliabilitySnapshot(adapter, input) {
    return adapter.put("reliabilitySnapshots", createReliabilitySnapshot(input));
  }

  return Object.freeze({
    calculateReliabilityMetrics,
    categoryEntropy,
    categoryStability,
    createReliabilitySnapshot,
    jaccardDistance,
    replayConsistency,
    reviewerDisagreementRate,
    signalSet,
    signalVolatility,
    storeReliabilitySnapshot
  });
});
