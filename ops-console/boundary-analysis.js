(function attachPersonaLabsBoundaryAnalysis(root, factory) {
  const storage = typeof require === "function" ? require("./storage") : root.PersonaLabsOpsStorage;
  const api = factory(storage);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PersonaLabsBoundaryAnalysis = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsBoundaryAnalysis(storage) {
  "use strict";

  const CATEGORIES = Object.freeze(["GREEN", "YELLOW", "RED"]);

  function emptyMatrix() {
    return CATEGORIES.reduce((matrix, left) => {
      matrix[left] = CATEGORIES.reduce((row, right) => {
        row[right] = 0;
        return row;
      }, {});
      return matrix;
    }, {});
  }

  function createConfusionMap(classifications, reviews) {
    const byObservation = (classifications || []).reduce((map, item) => {
      map[item.observationId] = item;
      return map;
    }, {});
    const matrix = emptyMatrix();
    (reviews || []).forEach((review) => {
      const actual = review.actualCategory || (byObservation[review.observationId] && byObservation[review.observationId].actualCategory);
      const expected = review.expectedCategory;
      if (matrix[expected] && matrix[expected][actual] != null) {
        matrix[expected][actual] += 1;
      }
    });
    return matrix;
  }

  function createOverlapMatrix(classifications) {
    const matrix = emptyMatrix();
    (classifications || []).forEach((item) => {
      const actual = item.actualCategory;
      const matched = item.matchedSignals || {};
      const hasPositive = (matched.positive || []).length > 0;
      const hasFriction = (matched.friction || []).length > 0;
      if (hasPositive && hasFriction && matrix[actual]) {
        CATEGORIES.forEach((category) => {
          if (category !== actual) {
            matrix[actual][category] += 1;
          }
        });
      }
    });
    return matrix;
  }

  function unstableBoundaryTokens(classifications) {
    const tokenCategories = {};
    (classifications || []).forEach((item) => {
      const matched = item.matchedSignals || {};
      Object.keys(matched).forEach((group) => {
        (matched[group] || []).forEach((token) => {
          if (!tokenCategories[token]) {
            tokenCategories[token] = new Set();
          }
          tokenCategories[token].add(item.actualCategory || "UNKNOWN");
        });
      });
    });
    return Object.keys(tokenCategories)
      .filter((token) => tokenCategories[token].size > 1)
      .map((token) => ({ token, categories: Array.from(tokenCategories[token]).sort() }));
  }

  function highConfusionPairs(confusionMap) {
    const pairs = [];
    CATEGORIES.forEach((expected) => {
      CATEGORIES.forEach((actual) => {
        if (expected !== actual && confusionMap[expected] && confusionMap[expected][actual] > 0) {
          pairs.push({ expected, actual, count: confusionMap[expected][actual] });
        }
      });
    });
    return pairs.sort((a, b) => b.count - a.count);
  }

  function createBoundaryReport(input) {
    const classifications = input && input.classifications || [];
    const reviews = input && input.reviews || [];
    const confusionMap = createConfusionMap(classifications, reviews);
    const overlapMatrix = createOverlapMatrix(classifications);
    return {
      boundaryReportId: input && input.boundaryReportId || storage.createRecordId("boundaryReport"),
      createdAt: input && input.createdAt || storage.nowIso(),
      pipelineVersion: input && input.pipelineVersion || "unknown",
      confusionMap,
      overlapMatrix,
      highConfusionPairs: highConfusionPairs(confusionMap),
      unstableBoundaryTokens: unstableBoundaryTokens(classifications),
      lowSeparationCategories: highConfusionPairs(confusionMap).filter((pair) => pair.count >= 2),
      categoryCollisionCount: highConfusionPairs(confusionMap).reduce((total, pair) => total + pair.count, 0),
      immutable: true
    };
  }

  async function storeBoundaryReport(adapter, input) {
    return adapter.put("boundaryReports", createBoundaryReport(input));
  }

  return Object.freeze({
    CATEGORIES,
    createBoundaryReport,
    createConfusionMap,
    createOverlapMatrix,
    highConfusionPairs,
    storeBoundaryReport,
    unstableBoundaryTokens
  });
});
