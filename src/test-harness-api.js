(function attachPersonaLabsTestHarness(root, factory) {
  const harness = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = harness;
  } else {
    harness.install(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsTestHarness() {
  "use strict";

  const APP_VERSION = "0.1.0";
  const API_SCHEMA_VERSION = "personalabs-test-api-v1";
  const RESULT_STORE_KEY = "__PersonaLabsTestResults";
  const TRACE_STORE_KEY = "__PersonaLabsTestTraces";
  const SENSITIVE_KEY_PATTERN = /cookie|token|authorization|password|secret|session|account|email/i;
  const SAFE_CONTROL_KEY_PATTERN = /^(.*Included|.*Allowed|.*Enabled|includes.*|exposes.*|evidenceExports.*|governanceBypassAllowed|readOnlyExceptTestExecution)$/;

  function debugEnabled(root) {
    return Boolean(root && (root.PERSONALABS_DEBUG === true || root.PERSONALABS_DEBUG === "true"));
  }

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

    return JSON.parse(JSON.stringify(value));
  }

  function sanitizeUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return "";
    }

    try {
      const parsed = new URL(raw, "https://www.youtube.com");
      return `${parsed.origin}${parsed.pathname}`;
    } catch (error) {
      return "";
    }
  }

  function sanitizeValue(value) {
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }

    if (!value || typeof value !== "object") {
      return value;
    }

    return Object.keys(value).reduce((safe, key) => {
      if (SENSITIVE_KEY_PATTERN.test(key) && !SAFE_CONTROL_KEY_PATTERN.test(key)) {
        safe[key] = "[REDACTED]";
        return safe;
      }

      safe[key] = key === "url" ? sanitizeUrl(value[key]) : sanitizeValue(value[key]);
      return safe;
    }, {});
  }

  function sanitizeCandidate(input) {
    const candidate = input || {};
    return {
      videoId: String(candidate.videoId || ""),
      title: String(candidate.title || ""),
      channel: String(candidate.channel || ""),
      duration: String(candidate.duration || ""),
      url: sanitizeUrl(candidate.url),
      publishedAt: String(candidate.publishedAt || ""),
      source: String(candidate.source || "")
    };
  }

  function sanitizeExpectedOutputs(scenario) {
    const item = scenario || {};
    return sanitizeValue({
      expectedLabel: item.expectedLabel,
      expectedConfidenceRange: item.expectedConfidenceRange,
      expectedGovernanceOutcomes: item.expectedGovernanceOutcomes,
      expectedContradictionState: item.expectedContradictionState,
      expectedMatchedSignalCategories: item.expectedMatchedSignalCategories,
      expectedSuppressedSignalCategories: item.expectedSuppressedSignalCategories
    });
  }

  function sanitizeReplayTrace(trace) {
    const source = trace || {};
    return sanitizeValue({
      traceId: source.traceId || "",
      videoId: source.videoId || (source.input && source.input.videoId) || "",
      title: source.title || (source.input && source.input.title) || "",
      channel: source.channel || (source.input && source.input.channel) || "",
      duration: source.duration || (source.input && source.input.duration) || "",
      url: source.url || (source.input && source.input.url) || "",
      label: source.label || source.canonicalLabel || "",
      confidence: source.confidence,
      pipelineVersion: source.pipelineVersion || "",
      scoringPath: source.scoringPath || "",
      contradictions: source.contradictions || [],
      reasoning: source.reasoning || null,
      input: source.input ? sanitizeCandidate(source.input) : undefined
    });
  }

  function sanitizeScenarioForExecution(rawScenario) {
    const item = clone(rawScenario || {});
    const input = item.input || item.inputMetadata || {};

    return sanitizeValue({
      id: item.id || item.scenarioId || item.name || "unnamed-scenario",
      scenarioId: item.scenarioId,
      name: item.name || item.id || "Unnamed scenario",
      category: item.category,
      description: item.description || "",
      lens: item.lens || item.selectedLens,
      selectedLens: item.selectedLens,
      input: sanitizeCandidate(input),
      expectedLabel: item.expectedLabel,
      expectedConfidenceRange: item.expectedConfidenceRange,
      expectedGovernanceOutcomes: item.expectedGovernanceOutcomes,
      expectedContradictionState: item.expectedContradictionState,
      expectedMatchedSignalCategories: item.expectedMatchedSignalCategories,
      expectedSuppressedSignalCategories: item.expectedSuppressedSignalCategories,
      replayTraces: Array.isArray(item.replayTraces) ? item.replayTraces.map(sanitizeReplayTrace) : undefined
    });
  }

  function sanitizeScenarioPackForExecution(rawPack) {
    const pack = clone(rawPack || {});
    return sanitizeValue({
      name: pack.name || "Unnamed scenario pack",
      category: pack.category || "mixed",
      description: pack.description || "",
      scenarios: Array.isArray(pack.scenarios) ? pack.scenarios.map(sanitizeScenarioForExecution) : []
    });
  }

  function compactActualOutput(result) {
    const score = result && result.score ? result.score : {};
    return sanitizeValue({
      scenarioId: result && result.scenarioId,
      actualLabel: result && result.actualLabel,
      confidence: score.confidence,
      confidenceDelta: result && result.confidenceDelta,
      pass: result && result.pass,
      driftDetected: result && result.driftDetected,
      severity: result && result.severity,
      labelAgreement: result && result.labelAgreement,
      confidenceAgreement: result && result.confidenceAgreement,
      governanceAgreement: result && result.governanceAgreement,
      contradictionAgreement: result && result.contradictionAgreement,
      matchedSignalAgreement: result && result.matchedSignalAgreement,
      suppressedSignalAgreement: result && result.suppressedSignalAgreement,
      pipelineVersion: result && result.pipelineVersion,
      traceId: score.traceId,
      scoringPath: score.scoringPath,
      explanation: score.explanation,
      evidenceSummary: score.evidenceSummary || null
    });
  }

  function extractGovernanceDecisions(score) {
    const reasoning = score && score.reasoning ? score.reasoning : {};
    const validation = score && score.confidenceValidation ? score.confidenceValidation : null;
    return sanitizeValue({
      reasons: reasoning.reasons || [],
      downgradeReasons: reasoning.downgradeReasons || [],
      finalReason: reasoning.finalReason || "",
      confidenceValidation: validation,
      explanation: score && score.explanation || ""
    });
  }

  function evidenceForScenario(scenario, result, executedAt) {
    const score = result && result.score ? result.score : {};
    return sanitizeValue({
      scenarioId: result && result.scenarioId || scenario.id || "unnamed-scenario",
      executedAt,
      scenarioInputs: scenario.input || {},
      expectedOutputs: sanitizeExpectedOutputs(scenario),
      actualOutputs: compactActualOutput(result),
      traceEvents: score.traceEvents || [],
      matchedSignals: score.matchedTerms || {},
      suppressedSignals: score.suppressedTerms || [],
      governanceDecisions: extractGovernanceDecisions(score),
      contradictionState: {
        hasContradictions: Boolean(score.contradictions && score.contradictions.length),
        contradictions: score.contradictions || [],
        agreement: result && result.contradictionAgreement
      },
      replayDriftResults: result && result.replayResults || []
    });
  }

  function ensureStore(root, key) {
    if (!Array.isArray(root[key])) {
      root[key] = [];
    }

    return root[key];
  }

  function appendTraceEvidence(root, scenarioEvidence) {
    const store = ensureStore(root, TRACE_STORE_KEY);
    const traceEvents = scenarioEvidence.traceEvents || [];
    store.unshift({
      scenarioId: scenarioEvidence.scenarioId,
      executedAt: scenarioEvidence.executedAt,
      traceEvents,
      matchedSignals: scenarioEvidence.matchedSignals,
      suppressedSignals: scenarioEvidence.suppressedSignals,
      governanceDecisions: scenarioEvidence.governanceDecisions,
      contradictionState: scenarioEvidence.contradictionState
    });
    root[TRACE_STORE_KEY] = store.slice(0, 50);
  }

  function latestRuntimeTraces(root) {
    const runtimeTraces = Array.isArray(root.PersonaLabsDebugTraces) ? root.PersonaLabsDebugTraces : [];
    const testTraces = Array.isArray(root[TRACE_STORE_KEY]) ? root[TRACE_STORE_KEY] : [];
    return sanitizeValue([...testTraces, ...runtimeTraces].slice(0, 50));
  }

  function deriveTraceHealth(traces) {
    const latest = traces[0] || {};
    const labels = traces.reduce((groups, trace) => {
      const key = trace.renderingTarget || trace.scoringPath || "test";
      groups[key] = trace.label || trace.actualLabel || "";
      return groups;
    }, {});
    const overlayLabel = labels.overlay || "";
    const panelLabel = labels.panel || "";
    const retrievalTrace = traces.find((trace) => /^retrieval/.test(trace.scoringPath || ""));
    const retrievalLabel = retrievalTrace && retrievalTrace.label || panelLabel;
    const contradictionCount = traces.reduce((total, trace) => {
      const contradictions = trace.contradictions || (trace.contradictionState && trace.contradictionState.contradictions) || [];
      return total + contradictions.length;
    }, 0);
    const traceEventCount = traces.reduce((total, trace) => total + ((trace.traceEvents && trace.traceEvents.length) || 0), 0);

    return {
      latestCanonicalLabel: latest.label || latest.actualLabel || "pending",
      overlayPanelAgreement: overlayLabel && panelLabel ? (overlayLabel === panelLabel ? "agree" : "drift") : "pending",
      retrievalAgreement: retrievalLabel && panelLabel ? (retrievalLabel === panelLabel ? "agree" : "drift") : "pending",
      fallbackActive: traces.some((trace) => /legacy|fallback|headline/i.test(`${trace.scoringPath || ""} ${trace.reasoning && trace.reasoning.finalReason || ""}`)),
      contradictionCount,
      traceEventCount,
      semanticDriftWarning: contradictionCount > 0
    };
  }

  function evidenceEntries(item) {
    if (!item || !item.evidence) {
      return [];
    }

    return Array.isArray(item.evidence) ? item.evidence : [item.evidence];
  }

  function createApi(options) {
    const root = options && options.root || {};
    const semantic = options && options.semantic || root.PersonaLabsSemantic;

    if (!debugEnabled(root)) {
      return null;
    }

    if (!semantic || typeof semantic.runScenario !== "function" || typeof semantic.runScenarioPack !== "function") {
      throw new Error("PersonaLabs Test API requires the canonical semantic scenario runners.");
    }

    const api = {
      runScenario(scenario) {
        const safeScenario = sanitizeScenarioForExecution(scenario);
        const executedAt = new Date().toISOString();
        const result = semantic.runScenario(safeScenario);
        const evidence = evidenceForScenario(safeScenario, result, executedAt);
        ensureStore(root, RESULT_STORE_KEY).unshift({
          kind: "scenario",
          apiSchemaVersion: API_SCHEMA_VERSION,
          appVersion: APP_VERSION,
          pipelineVersion: result.pipelineVersion,
          executedAt,
          evidence
        });
        appendTraceEvidence(root, evidence);
        return clone(result);
      },

      runScenarioPack(pack) {
        const safePack = sanitizeScenarioPackForExecution(pack);
        const executedAt = new Date().toISOString();
        const report = semantic.runScenarioPack(safePack);
        const scenarios = safePack.scenarios || [];
        const evidence = (report.results || []).map((result, index) => evidenceForScenario(scenarios[index] || {}, result, executedAt));
        ensureStore(root, RESULT_STORE_KEY).unshift({
          kind: "scenario-pack",
          apiSchemaVersion: API_SCHEMA_VERSION,
          appVersion: APP_VERSION,
          pipelineVersion: report.pipelineVersion,
          executedAt,
          pack: {
            name: safePack.name,
            category: safePack.category,
            description: safePack.description
          },
          summary: {
            total: report.total,
            passed: report.passed,
            failed: report.failed,
            driftDetected: report.driftDetected,
            severity: report.severity
          },
          evidence
        });
        evidence.forEach((item) => appendTraceEvidence(root, item));
        return clone(report);
      },

      getLatestTraces() {
        return clone(latestRuntimeTraces(root));
      },

      getPipelineHealth() {
        const traces = latestRuntimeTraces(root);
        const canonicalState = typeof semantic.getPipelineHealth === "function"
          ? semantic.getPipelineHealth()
          : {
              pipelineVersion: semantic.PIPELINE_VERSION || "unknown",
              canonicalScoringFunction: "scoreContent",
              governanceBypassAllowed: false
            };

        return sanitizeValue({
          apiSchemaVersion: API_SCHEMA_VERSION,
          appVersion: APP_VERSION,
          pipelineVersion: canonicalState.pipelineVersion,
          debugEnabled: true,
          canonicalState,
          runtimeState: deriveTraceHealth(traces),
          safety: {
            readOnlyExceptTestExecution: true,
            exposesScoringRuleMutation: false,
            exposesDictionaryMutation: false,
            exposesDirectLabelMutation: false,
            governanceBypassAllowed: false,
            includesCookiesTokensOrAccountData: false,
            includesDomDump: false
          },
          generatedAt: new Date().toISOString()
        });
      },

      exportEvidenceBundle() {
        const canonicalState = typeof semantic.getPipelineHealth === "function"
          ? semantic.getPipelineHealth()
          : { pipelineVersion: semantic.PIPELINE_VERSION || "unknown" };
        const testResults = Array.isArray(root[RESULT_STORE_KEY]) ? root[RESULT_STORE_KEY] : [];
        const allEvidence = testResults.flatMap(evidenceEntries);
        const exportedAt = new Date().toISOString();

        return sanitizeValue({
          apiSchemaVersion: API_SCHEMA_VERSION,
          appVersion: APP_VERSION,
          pipelineVersion: canonicalState.pipelineVersion,
          exportedAt,
          timestamps: {
            exportedAt,
            latestScenarioAt: testResults[0] && testResults[0].executedAt || null
          },
          scenarioInputs: allEvidence.map((entry) => entry.scenarioInputs).filter(Boolean),
          expectedOutputs: allEvidence.map((entry) => entry.expectedOutputs).filter(Boolean),
          actualOutputs: allEvidence.map((entry) => entry.actualOutputs).filter(Boolean),
          traceEvents: latestRuntimeTraces(root).flatMap((trace) => trace.traceEvents || []),
          matchedSuppressedSignals: allEvidence.map((entry) => ({
            scenarioId: entry.scenarioId,
            matchedSignals: entry.matchedSignals,
            suppressedSignals: entry.suppressedSignals
          })),
          governanceDecisions: allEvidence.map((entry) => ({
            scenarioId: entry.scenarioId,
            governanceDecisions: entry.governanceDecisions
          })),
          contradictionState: allEvidence.map((entry) => ({
            scenarioId: entry.scenarioId,
            contradictionState: entry.contradictionState
          })),
          replayDriftResults: allEvidence.flatMap((entry) => entry.replayDriftResults || []),
          testResults: clone(testResults),
          safety: {
            cookiesIncluded: false,
            tokensIncluded: false,
            accountDataIncluded: false,
            domDumpIncluded: false
          }
        });
      }
    };

    return Object.freeze(api);
  }

  function install(root, options) {
    if (!root) {
      return null;
    }

    if (!debugEnabled(root)) {
      try {
        delete root.PersonaLabsTestAPI;
      } catch (error) {
        root.PersonaLabsTestAPI = undefined;
      }
      return null;
    }

    const api = createApi({
      root,
      semantic: options && options.semantic || root.PersonaLabsSemantic
    });

    Object.defineProperty(root, "PersonaLabsTestAPI", {
      configurable: true,
      enumerable: false,
      writable: false,
      value: api
    });

    return api;
  }

  return Object.freeze({
    APP_VERSION,
    API_SCHEMA_VERSION,
    createApi,
    debugEnabled,
    install
  });
});
