(function attachPersonaLabsOpsIngestion(root, factory) {
  const storage = typeof require === "function" ? require("./storage") : root.PersonaLabsOpsStorage;
  const api = factory(storage);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PersonaLabsOpsIngestion = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsOpsIngestion(storage) {
  "use strict";

  function clone(value) {
    return storage.clone(value);
  }

  function normalizeWhitespace(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function sanitizeMetadata(metadata) {
    const source = metadata || {};
    return Object.keys(source).reduce((safe, key) => {
      if (/cookie|token|authorization|password|secret|session|account|email/i.test(key)) {
        safe[key] = "[REDACTED]";
      } else {
        safe[key] = clone(source[key]);
      }
      return safe;
    }, {});
  }

  function createObservation(input, options) {
    const item = input || {};
    const observedAt = item.observedAt || storage.nowIso();
    const sourceType = item.sourceType || options && options.sourceType || "manual-batch";
    const rawSourceData = clone(item.rawSourceData || item);

    return {
      observationId: item.observationId || storage.createRecordId("observation"),
      sourceType,
      query: normalizeWhitespace(item.query || options && options.query || ""),
      title: normalizeWhitespace(item.title),
      channel: normalizeWhitespace(item.channel),
      metadata: sanitizeMetadata(item.metadata || {}),
      rawSourceData,
      observedAt,
      pipelineVersion: item.pipelineVersion || options && options.pipelineVersion || "unknown"
    };
  }

  function parseBatchTitles(batchText, options) {
    return String(batchText || "")
      .split(/\r?\n/)
      .map((line) => normalizeWhitespace(line))
      .filter(Boolean)
      .map((line) => {
        const [title, channel] = line.split(/\s+\|\s+/);
        return createObservation({
          sourceType: options && options.sourceType || "manual-batch",
          query: options && options.query || "",
          title,
          channel: channel || "",
          rawSourceData: { line }
        }, options);
      });
  }

  function observationToScenario(observation) {
    const item = observation || {};
    return {
      id: item.observationId,
      scenarioId: item.observationId,
      category: "live-observation",
      description: `Live semantic ops observation for query: ${item.query || "none"}`,
      expectedLabel: ["GREEN", "YELLOW", "RED"],
      expectedConfidenceRange: [0, 100],
      expectedGovernanceOutcomes: [],
      expectedContradictionState: false,
      input: {
        title: item.title || "",
        channel: item.channel || "",
        duration: item.metadata && item.metadata.duration || "",
        url: item.metadata && item.metadata.url || "",
        videoId: item.metadata && item.metadata.videoId || ""
      }
    };
  }

  async function ingestObservations(adapter, observations) {
    return adapter.bulkPut("observations", observations || []);
  }

  async function ingestBatch(adapter, batchText, options) {
    const observations = parseBatchTitles(batchText, options);
    return ingestObservations(adapter, observations);
  }

  return Object.freeze({
    createObservation,
    ingestBatch,
    ingestObservations,
    normalizeWhitespace,
    observationToScenario,
    parseBatchTitles,
    sanitizeMetadata
  });
});
