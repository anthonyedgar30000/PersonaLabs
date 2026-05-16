(function attachPersonaLabsOpsReplay(root, factory) {
  const storage = typeof require === "function" ? require("./storage") : root.PersonaLabsOpsStorage;
  const classification = typeof require === "function" ? require("./classification") : root.PersonaLabsOpsClassification;
  const regression = typeof require === "function" ? require("./regression") : root.PersonaLabsOpsRegression;
  const api = factory(storage, classification, regression);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PersonaLabsOpsReplay = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsOpsReplay(storage, classification, regression) {
  "use strict";

  function createReplayPack(input) {
    const item = input || {};
    return {
      replayPackId: item.replayPackId || storage.createRecordId("replayPack"),
      name: item.name || "Untitled replay pack",
      description: item.description || "",
      createdAt: item.createdAt || storage.nowIso(),
      sourcePipelineVersion: item.sourcePipelineVersion || "unknown",
      observationIds: (item.observationIds || []).slice(),
      classificationIds: (item.classificationIds || []).slice(),
      tags: (item.tags || []).slice()
    };
  }

  async function createReplayPackFromObservations(adapter, input) {
    const observations = input && input.observations || [];
    const classifications = input && input.classifications || [];
    const pack = createReplayPack({
      name: input && input.name,
      description: input && input.description,
      sourcePipelineVersion: input && input.sourcePipelineVersion || (classifications[0] && classifications[0].pipelineVersion) || "unknown",
      observationIds: observations.map((item) => item.observationId),
      classificationIds: classifications.map((item) => item.classificationId),
      tags: input && input.tags || []
    });
    return adapter.put("replayPacks", pack);
  }

  async function loadPackObservations(adapter, replayPack) {
    const observations = [];
    for (const observationId of replayPack.observationIds || []) {
      const observation = await adapter.get("observations", observationId);
      if (observation) {
        observations.push(observation);
      }
    }
    return observations;
  }

  async function loadPackClassifications(adapter, replayPack) {
    const classifications = [];
    for (const classificationId of replayPack.classificationIds || []) {
      const record = await adapter.get("classifications", classificationId);
      if (record) {
        classifications.push(record);
      }
    }
    return classifications;
  }

  async function replayPack(adapter, testApi, replayPack) {
    const observations = await loadPackObservations(adapter, replayPack);
    const baselineClassifications = await loadPackClassifications(adapter, replayPack);
    const replays = await classification.classifyObservations(adapter, testApi, observations);
    const diffs = replays.map((item) => {
      const baseline = baselineClassifications.find((record) => record.observationId === item.observation.observationId);
      return regression.compareClassifications(baseline, item.classification);
    });
    const snapshot = await regression.storeRegressionSnapshot(adapter, {
      replayPackId: replayPack.replayPackId,
      basePipelineVersion: replayPack.sourcePipelineVersion,
      comparisonPipelineVersion: replays[0] && replays[0].classification.pipelineVersion || "unknown",
      diffs
    });

    return {
      replayPack: storage.clone(replayPack),
      observations: storage.clone(observations),
      replays: storage.clone(replays),
      diffs,
      snapshot
    };
  }

  return Object.freeze({
    createReplayPack,
    createReplayPackFromObservations,
    loadPackClassifications,
    loadPackObservations,
    replayPack
  });
});
