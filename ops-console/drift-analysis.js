(function attachPersonaLabsDriftAnalysis(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PersonaLabsDriftAnalysis = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsDriftAnalysis() {
  "use strict";

  function mean(values) {
    const items = (values || []).map(Number).filter(Number.isFinite);
    return items.length ? items.reduce((total, value) => total + value, 0) / items.length : 0;
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

  function detectSuddenDrift(regressionSnapshots) {
    const latest = (regressionSnapshots || [])[0];
    const summary = latest && latest.summary || {};
    const total = Number(summary.total) || 0;
    const driftRate = total ? (Number(summary.driftCount) || 0) / total : 0;
    return {
      detected: driftRate >= 0.25 || (Number(summary.highSeverity) || 0) > 0,
      driftRate,
      highSeverity: Number(summary.highSeverity) || 0,
      snapshotId: latest && latest.snapshotId || ""
    };
  }

  function detectCumulativeSlowDrift(regressionSnapshots) {
    const snapshots = (regressionSnapshots || []).slice(0, 5);
    if (snapshots.length < 3) {
      return { detected: false, driftRates: [] };
    }
    const driftRates = snapshots.map((snapshot) => {
      const total = Number(snapshot.summary && snapshot.summary.total) || 0;
      return total ? (Number(snapshot.summary.driftCount) || 0) / total : 0;
    }).reverse();
    const increasing = driftRates.every((rate, index) => index === 0 || rate >= driftRates[index - 1]);
    return {
      detected: increasing && driftRates[driftRates.length - 1] - driftRates[0] >= 0.1,
      driftRates
    };
  }

  function detectConfidenceInflation(classifications) {
    const ordered = (classifications || []).slice().sort((a, b) => String(a.classifiedAt || "").localeCompare(String(b.classifiedAt || "")));
    if (ordered.length < 4) {
      return { detected: false, earlyMean: 0, lateMean: 0, delta: 0 };
    }
    const midpoint = Math.floor(ordered.length / 2);
    const earlyMean = mean(ordered.slice(0, midpoint).map((item) => item.confidence));
    const lateMean = mean(ordered.slice(midpoint).map((item) => item.confidence));
    const delta = lateMean - earlyMean;
    return {
      detected: delta >= 12,
      earlyMean,
      lateMean,
      delta
    };
  }

  function detectCategoryBoundaryCollapse(classifications) {
    const total = (classifications || []).length;
    if (!total) {
      return { detected: false, dominantCategory: "", dominantRate: 0 };
    }
    const groups = groupBy(classifications, (item) => item.actualCategory || "UNKNOWN");
    const dominant = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length)[0];
    const dominantRate = groups[dominant].length / total;
    return {
      detected: dominantRate >= 0.85 && total >= 10,
      dominantCategory: dominant,
      dominantRate
    };
  }

  function detectOscillatingOutputs(classifications) {
    const groups = groupBy(classifications, (item) => item.observationId || item.title || "unknown");
    const oscillating = Object.values(groups).filter((records) => {
      const categories = records
        .slice()
        .sort((a, b) => String(a.classifiedAt || "").localeCompare(String(b.classifiedAt || "")))
        .map((item) => item.actualCategory);
      let transitions = 0;
      for (let index = 1; index < categories.length; index += 1) {
        if (categories[index] !== categories[index - 1]) {
          transitions += 1;
        }
      }
      return transitions >= 2;
    });
    return {
      detected: oscillating.length > 0,
      oscillatingObservationCount: oscillating.length
    };
  }

  function detectContradictorySignalOverlap(classifications) {
    const overlaps = (classifications || []).filter((item) => {
      const matched = item.matchedSignals || {};
      return (matched.positive || []).length && (matched.friction || []).length;
    });
    return {
      detected: overlaps.length > 0,
      overlapCount: overlaps.length,
      overlapRate: classifications && classifications.length ? overlaps.length / classifications.length : 0
    };
  }

  function detectRuleTriggerPatterns(classifications, knownSignals) {
    const counts = {};
    (classifications || []).forEach((item) => {
      const matched = item.matchedSignals || {};
      Object.keys(matched).forEach((category) => {
        (matched[category] || []).forEach((signal) => {
          counts[signal] = (counts[signal] || 0) + 1;
        });
      });
    });
    const total = classifications && classifications.length || 0;
    const overTriggering = Object.keys(counts).filter((signal) => total && counts[signal] / total >= 0.45);
    const deadUnused = (knownSignals || []).filter((signal) => !counts[signal]);
    return {
      overTriggering,
      deadUnused,
      counts
    };
  }

  function analyzeSemanticDrift(input) {
    const classifications = input && input.classifications || [];
    const regressionSnapshots = input && input.regressionSnapshots || [];
    return {
      suddenDrift: detectSuddenDrift(regressionSnapshots),
      cumulativeSlowDrift: detectCumulativeSlowDrift(regressionSnapshots),
      confidenceInflation: detectConfidenceInflation(classifications),
      categoryBoundaryCollapse: detectCategoryBoundaryCollapse(classifications),
      oscillatingOutputs: detectOscillatingOutputs(classifications),
      contradictorySignalOverlap: detectContradictorySignalOverlap(classifications),
      ruleTriggerPatterns: detectRuleTriggerPatterns(classifications, input && input.knownSignals || [])
    };
  }

  return Object.freeze({
    analyzeSemanticDrift,
    detectCategoryBoundaryCollapse,
    detectConfidenceInflation,
    detectContradictorySignalOverlap,
    detectCumulativeSlowDrift,
    detectOscillatingOutputs,
    detectRuleTriggerPatterns,
    detectSuddenDrift
  });
});
