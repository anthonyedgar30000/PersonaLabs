(function attachPersonaLabsAdversarial(root, factory) {
  const storage = typeof require === "function" ? require("./storage") : root.PersonaLabsOpsStorage;
  const api = factory(storage);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PersonaLabsAdversarial = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsAdversarial(storage) {
  "use strict";

  const ATTACK_TEMPLATES = Object.freeze([
    Object.freeze({ attackFamily: "clickbait-inflation", suffix: " you won't believe what happens next" }),
    Object.freeze({ attackFamily: "emotional-wording-injection", prefix: "heartbreaking emotional " }),
    Object.freeze({ attackFamily: "outrage-amplification", prefix: "SHOCKING meltdown: ", suffix: " DESTROYS everyone" }),
    Object.freeze({ attackFamily: "token-stuffing", suffix: " analysis explained context tutorial educational calm calm calm" }),
    Object.freeze({ attackFamily: "ambiguity-flooding", prefix: "This update about that thing: " }),
    Object.freeze({ attackFamily: "contradictory-phrasing", suffix: " calm peaceful shocking crisis" }),
    Object.freeze({ attackFamily: "low-context-bait", prefix: "You need to see this: " })
  ]);

  function createAttackScenario(baseObservation, template) {
    const observation = baseObservation || {};
    const title = `${template.prefix || ""}${observation.title || ""}${template.suffix || ""}`.replace(/\s+/g, " ").trim();
    return {
      id: `${observation.observationId || "observation"}:${template.attackFamily}`,
      scenarioId: `${observation.observationId || "observation"}:${template.attackFamily}`,
      category: "adversarial-title",
      description: `Adversarial mutation: ${template.attackFamily}`,
      expectedLabel: ["GREEN", "YELLOW", "RED"],
      expectedConfidenceRange: [0, 100],
      expectedGovernanceOutcomes: [],
      expectedContradictionState: false,
      input: {
        title,
        channel: observation.channel || "",
        duration: observation.metadata && observation.metadata.duration || ""
      },
      metadata: {
        attackFamily: template.attackFamily,
        baseObservationId: observation.observationId || "",
        originalTitle: observation.title || ""
      }
    };
  }

  function createAdversarialScenarioPack(baseObservation) {
    return {
      name: `Adversarial semantic resilience pack for ${baseObservation && baseObservation.observationId || "observation"}`,
      category: "adversarial",
      description: "Deterministic attack simulations for semantic reliability inspection.",
      scenarios: ATTACK_TEMPLATES.map((template) => createAttackScenario(baseObservation, template))
    };
  }

  function evaluateAdversarialResults(baseResult, attackResults) {
    const baseline = baseResult || {};
    const attacks = attackResults || [];
    const labelChanges = attacks.filter((result) => result.actualLabel && baseline.actualLabel && result.actualLabel !== baseline.actualLabel);
    const confidenceValues = attacks.map((result) => result.score && result.score.confidence || 0);
    const governanceTriggered = attacks.filter((result) => result.score && result.score.reasoning && (result.score.reasoning.downgradeReasons || []).length);
    const contradictions = attacks.filter((result) => result.score && result.score.contradictions && result.score.contradictions.length);
    const maxConfidence = confidenceValues.length ? Math.max(...confidenceValues) : 0;
    const minConfidence = confidenceValues.length ? Math.min(...confidenceValues) : 0;

    return {
      totalAttacks: attacks.length,
      labelChangeRate: attacks.length ? labelChanges.length / attacks.length : 0,
      confidenceRange: maxConfidence - minConfidence,
      governanceEffectivenessRate: attacks.length ? governanceTriggered.length / attacks.length : 0,
      contradictionRate: attacks.length ? contradictions.length / attacks.length : 0,
      resilient: attacks.length ? labelChanges.length / attacks.length <= 0.35 && maxConfidence - minConfidence <= 35 : true,
      attackSummaries: attacks.map((result) => ({
        scenarioId: result.scenarioId,
        actualLabel: result.actualLabel,
        confidence: result.score && result.score.confidence || 0,
        driftDetected: Boolean(result.driftDetected),
        governanceReasons: result.score && result.score.reasoning && result.score.reasoning.downgradeReasons || []
      }))
    };
  }

  async function runAdversarialPack(adapter, testApi, baseObservation) {
    if (!testApi || typeof testApi.runScenario !== "function") {
      throw new Error("Adversarial simulation requires PersonaLabsTestAPI.runScenario.");
    }
    const baseline = testApi.runScenario({
      id: `${baseObservation.observationId}:baseline`,
      expectedLabel: ["GREEN", "YELLOW", "RED"],
      expectedConfidenceRange: [0, 100],
      input: {
        title: baseObservation.title,
        channel: baseObservation.channel || "",
        duration: baseObservation.metadata && baseObservation.metadata.duration || ""
      }
    });
    const pack = createAdversarialScenarioPack(baseObservation);
    const attackResults = pack.scenarios.map((scenario) => testApi.runScenario(scenario));
    const evaluation = evaluateAdversarialResults(baseline, attackResults);
    const record = {
      adversarialRunId: storage.createRecordId("adversarialRun"),
      createdAt: storage.nowIso(),
      pipelineVersion: baseline.pipelineVersion || "unknown",
      attackFamily: "mixed",
      baseObservationId: baseObservation.observationId,
      baseline,
      pack,
      attackResults,
      evaluation,
      immutable: true
    };
    return adapter.put("adversarialRuns", record);
  }

  return Object.freeze({
    ATTACK_TEMPLATES,
    createAdversarialScenarioPack,
    createAttackScenario,
    evaluateAdversarialResults,
    runAdversarialPack
  });
});
