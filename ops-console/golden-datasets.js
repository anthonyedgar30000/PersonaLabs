(function attachPersonaLabsGoldenDatasets(root, factory) {
  const storage = typeof require === "function" ? require("./storage") : root.PersonaLabsOpsStorage;
  const api = factory(storage);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PersonaLabsGoldenDatasets = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsGoldenDatasets(storage) {
  "use strict";

  const PROMOTABLE_DECISIONS = Object.freeze(["approved", "acceptable-uncertainty"]);

  function promotableReview(review) {
    return Boolean(review && PROMOTABLE_DECISIONS.includes(review.reviewerDecision) && review.expectedCategory);
  }

  function createGoldenDataset(input) {
    const observations = input && input.observations || [];
    const classifications = input && input.classifications || [];
    const reviews = (input && input.reviews || []).filter(promotableReview);
    const entries = reviews.map((review) => {
      const observation = observations.find((item) => item.observationId === review.observationId) || {};
      const classification = classifications.find((item) => item.observationId === review.observationId) || {};
      return {
        observationId: review.observationId,
        reviewId: review.reviewId,
        title: observation.title || classification.title || "",
        query: observation.query || classification.query || "",
        channel: observation.channel || classification.channel || "",
        expectedCategory: review.expectedCategory,
        actualCategoryAtPromotion: review.actualCategory || classification.actualCategory || "",
        reviewerDecision: review.reviewerDecision,
        reviewerNotes: review.reviewerNotes || "",
        pipelineVersionAtPromotion: classification.pipelineVersion || input.pipelineVersion || "unknown",
        rawObservation: storage.clone(observation)
      };
    });

    return Object.freeze({
      goldenDatasetId: input && input.goldenDatasetId || storage.createRecordId("goldenDataset"),
      name: input && input.name || "Untitled golden dataset",
      description: input && input.description || "",
      createdAt: input && input.createdAt || storage.nowIso(),
      pipelineVersion: input && input.pipelineVersion || (entries[0] && entries[0].pipelineVersionAtPromotion) || "unknown",
      immutable: true,
      entryCount: entries.length,
      entries: Object.freeze(entries.map(Object.freeze))
    });
  }

  async function promoteGoldenDataset(adapter, input) {
    const dataset = createGoldenDataset(input);
    return adapter.put("goldenDatasets", dataset);
  }

  function createReplayPackInputFromGoldenDataset(dataset) {
    return {
      name: `${dataset.name} replay baseline`,
      description: `Replay baseline generated from immutable golden dataset ${dataset.goldenDatasetId}.`,
      sourcePipelineVersion: dataset.pipelineVersion,
      observationIds: (dataset.entries || []).map((entry) => entry.observationId),
      tags: ["golden-dataset", "immutable-baseline"]
    };
  }

  return Object.freeze({
    PROMOTABLE_DECISIONS,
    createGoldenDataset,
    createReplayPackInputFromGoldenDataset,
    promoteGoldenDataset,
    promotableReview
  });
});
