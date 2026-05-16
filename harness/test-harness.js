(function attachPersonaLabsHarnessApp(root, factory) {
  const app = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = app;
  } else {
    root.PersonaLabsHarnessApp = app;
    app.init(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsHarnessApp() {
  "use strict";

  const STORAGE_KEY = "personaLabsEvidenceBundles";
  const MAX_STORED_BUNDLES = 10;
  const UNSAFE_MUTATION_METHODS = [
    "setScoringRules",
    "updateScoringRules",
    "mutateScoringRules",
    "setDictionary",
    "updateDictionary",
    "addDictionaryTerm",
    "removeDictionaryTerm",
    "setLabel",
    "changeLabel",
    "overrideLabel",
    "bypassGovernance",
    "disableGovernance"
  ];

  const DEFAULT_SCENARIO_PACK = Object.freeze({
    name: "PersonaLabs local harness MVP pack",
    category: "stabilization",
    description: "Five smoke scenarios for the external debug harness.",
    scenarios: Object.freeze([
      {
        id: "harness-calm-animal",
        category: "benign",
        description: "Calm animal content should remain GREEN.",
        expectedLabel: "GREEN",
        expectedConfidenceRange: [90, 100],
        expectedGovernanceOutcomes: ["Calm/pet content detected"],
        expectedContradictionState: false,
        expectedMatchedSignalCategories: { positive: ["cute", "bunny"], friction: [] },
        input: {
          title: "Cute Baby Bunny Compilation",
          channel: "Wholesome Pets",
          duration: "12:00"
        }
      },
      {
        id: "harness-political-outrage",
        category: "inflammatory",
        description: "Political outrage framing should be high-friction.",
        expectedLabel: "RED",
        expectedConfidenceRange: [80, 100],
        expectedGovernanceOutcomes: ["explicit escalation or distress framing detected"],
        expectedContradictionState: false,
        expectedMatchedSignalCategories: { friction: ["shocking", "meltdown", "destroys", "furious"] },
        input: {
          title: "SHOCKING political meltdown: senator DESTROYS rivals in furious hearing",
          channel: "Outrage Daily",
          duration: "8:30"
        }
      },
      {
        id: "harness-educational-tutorial",
        category: "educational",
        description: "Clear educational tutorial content should remain GREEN.",
        expectedLabel: "GREEN",
        expectedConfidenceRange: [90, 100],
        expectedGovernanceOutcomes: ["low-friction candidate with continuity and trusted explanatory/format signals"],
        expectedContradictionState: false,
        expectedMatchedSignalCategories: { positive: ["tutorial", "explained"] },
        input: {
          title: "Beginner JavaScript async await tutorial explained step by step",
          channel: "Code Classroom",
          duration: "18:00"
        }
      },
      {
        id: "harness-clickbait-manipulation",
        category: "manipulation",
        description: "Clickbait manipulation framing should be RED.",
        expectedLabel: "RED",
        expectedConfidenceRange: [70, 100],
        expectedGovernanceOutcomes: ["explicit escalation or distress framing detected"],
        expectedContradictionState: false,
        expectedMatchedSignalCategories: { friction: ["you won't believe", "secret", "this changes everything"] },
        input: {
          title: "You won't believe this secret that changes everything",
          channel: "Viral Secrets",
          duration: "6:40"
        }
      },
      {
        id: "harness-ambiguous-low-context",
        category: "low-context",
        description: "Ambiguous low-context content should stay uncertain rather than GREEN.",
        expectedLabel: "YELLOW",
        expectedConfidenceRange: [35, 60],
        expectedGovernanceOutcomes: ["neutral default: no explicit escalation, but not enough GREEN evidence"],
        expectedContradictionState: false,
        expectedMatchedSignalCategories: { positive: [], friction: [] },
        input: {
          title: "Update from yesterday",
          channel: "Unknown Channel",
          duration: "5:00"
        }
      }
    ])
  });

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function stringifyJson(value) {
    return JSON.stringify(value || null, null, 2);
  }

  function getApi(root) {
    return root && root.PersonaLabsTestAPI || null;
  }

  function getUnsafeMutationMethods(api) {
    if (!api) {
      return [];
    }

    return UNSAFE_MUTATION_METHODS.filter((name) => typeof api[name] === "function");
  }

  function readStoredBundles(storage) {
    if (!storage || typeof storage.getItem !== "function") {
      return [];
    }

    try {
      const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function storeEvidenceBundle(storage, bundle) {
    if (!storage || typeof storage.setItem !== "function" || !bundle) {
      return readStoredBundles(storage);
    }

    const next = [
      {
        storedAt: new Date().toISOString(),
        bundle
      },
      ...readStoredBundles(storage)
    ].slice(0, MAX_STORED_BUNDLES);

    storage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function renderApiStatus(api) {
    if (!api) {
      return [
        "<p class='status-missing'>PersonaLabsTestAPI unavailable.</p>",
        "<p>Enable <code>PERSONALABS_DEBUG=true</code> and load the debug API before opening this harness.</p>"
      ].join("");
    }

    const missing = ["runScenario", "runScenarioPack", "getLatestTraces", "getPipelineHealth", "exportEvidenceBundle"]
      .filter((name) => typeof api[name] !== "function");
    const unsafe = getUnsafeMutationMethods(api);

    return [
      `<p class='${missing.length ? "status-warning" : "status-ok"}'>${missing.length ? "API incomplete" : "API available"}</p>`,
      `<p>Missing methods: ${escapeHtml(missing.join(", ") || "none")}</p>`,
      `<p>Unsafe mutation methods exposed: ${escapeHtml(unsafe.join(", ") || "none")}</p>`
    ].join("");
  }

  function renderPipelineHealth(health) {
    if (!health) {
      return "<p class='status-warning'>Pipeline health has not been loaded.</p>";
    }

    const canonical = health.canonicalState || {};
    const runtime = health.runtimeState || {};
    const safety = health.safety || {};
    const items = [
      ["Pipeline version", health.pipelineVersion || "unknown"],
      ["Canonical scoring", canonical.canonicalScoringFunction || "unknown"],
      ["Governance bypass", safety.governanceBypassAllowed ? "exposed" : "blocked"],
      ["Rule mutation", safety.exposesScoringRuleMutation ? "exposed" : "blocked"],
      ["Dictionary mutation", safety.exposesDictionaryMutation ? "exposed" : "blocked"],
      ["Direct label mutation", safety.exposesDirectLabelMutation ? "exposed" : "blocked"],
      ["Latest label", runtime.latestCanonicalLabel || "pending"],
      ["Trace events", runtime.traceEventCount == null ? "0" : runtime.traceEventCount]
    ];

    return `<ul class='health-list'>${items.map(([label, value]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`).join("")}</ul>`;
  }

  function renderScenarioResults(result) {
    if (!result) {
      return "<p>No scenario results yet.</p>";
    }

    const results = Array.isArray(result.results) ? result.results : [result];
    return [
      result.total == null ? "" : `<p>${escapeHtml(result.passed)}/${escapeHtml(result.total)} passing. Drift detected: ${escapeHtml(Boolean(result.driftDetected))}</p>`,
      `<ul class='result-list'>${results.map((item) => {
        const pass = Boolean(item.pass);
        return [
          `<li class='${pass ? "result-pass" : "result-fail"}'>`,
          `<strong>${escapeHtml(item.scenarioId || item.name || "scenario")}</strong>`,
          `<div>Actual: ${escapeHtml(item.actualLabel || "unknown")} | Expected: ${escapeHtml(item.expectedLabel || "see scenario")}</div>`,
          `<div>Pass: ${escapeHtml(pass)} | Severity: ${escapeHtml(item.severity || "none")} | Drift: ${escapeHtml(Boolean(item.driftDetected))}</div>`,
          "</li>"
        ].join("");
      }).join("")}</ul>`
    ].join("");
  }

  function renderEvidenceBundle(bundle, storedBundles) {
    if (!bundle) {
      const count = storedBundles && storedBundles.length || 0;
      return `<p>No active evidence bundle. Stored bundles: ${escapeHtml(count)}</p>`;
    }

    const summary = [
      ["App version", bundle.appVersion || "unknown"],
      ["Pipeline version", bundle.pipelineVersion || "unknown"],
      ["Scenario inputs", bundle.scenarioInputs && bundle.scenarioInputs.length || 0],
      ["Expected outputs", bundle.expectedOutputs && bundle.expectedOutputs.length || 0],
      ["Actual outputs", bundle.actualOutputs && bundle.actualOutputs.length || 0],
      ["Trace events", bundle.traceEvents && bundle.traceEvents.length || 0],
      ["Governance decisions", bundle.governanceDecisions && bundle.governanceDecisions.length || 0],
      ["Replay/drift results", bundle.replayDriftResults && bundle.replayDriftResults.length || 0]
    ];

    return [
      `<ul class='health-list'>${summary.map(([label, value]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`).join("")}</ul>`,
      `<pre>${escapeHtml(stringifyJson(bundle))}</pre>`
    ].join("");
  }

  function renderTraceViewer(traces) {
    const items = Array.isArray(traces) ? traces : [];
    if (!items.length) {
      return "<p>No traces captured yet.</p>";
    }

    return `<pre>${escapeHtml(stringifyJson(items))}</pre>`;
  }

  function renderDriftSummary(source) {
    const bundle = source || {};
    const results = (bundle.testResults || []).flatMap((item) => {
      if (!item.evidence) {
        return [];
      }

      return Array.isArray(item.evidence) ? item.evidence : [item.evidence];
    });
    const actualOutputs = bundle.actualOutputs || results.map((item) => item.actualOutputs).filter(Boolean);
    const failed = actualOutputs.filter((item) => item && item.pass === false);
    const replayDrifts = (bundle.replayDriftResults || []).filter((item) => item && item.replayAgreementState === "drift");
    const contradictions = (bundle.contradictionState || []).filter((item) => item && item.contradictionState && item.contradictionState.hasContradictions);

    return [
      "<ul class='drift-list'>",
      `<li><strong>Scenario failures:</strong> ${escapeHtml(failed.length)}</li>`,
      `<li><strong>Replay drifts:</strong> ${escapeHtml(replayDrifts.length)}</li>`,
      `<li><strong>Contradiction states:</strong> ${escapeHtml(contradictions.length)}</li>`,
      `<li><strong>Overall drift:</strong> ${escapeHtml(failed.length || replayDrifts.length || contradictions.length ? "attention" : "clear")}</li>`,
      "</ul>"
    ].join("");
  }

  function setHtml(documentRef, id, html) {
    const element = documentRef && documentRef.getElementById(id);
    if (element) {
      element.innerHTML = html;
    }
  }

  function copyJson(root, value) {
    const payload = stringifyJson(value);
    if (root.navigator && root.navigator.clipboard && typeof root.navigator.clipboard.writeText === "function") {
      return root.navigator.clipboard.writeText(payload);
    }

    return Promise.resolve(payload);
  }

  function downloadJson(root, value, filename) {
    const documentRef = root.document;
    if (!documentRef || typeof Blob === "undefined" || !root.URL || typeof root.URL.createObjectURL !== "function") {
      return false;
    }

    const blob = new Blob([stringifyJson(value)], { type: "application/json" });
    const url = root.URL.createObjectURL(blob);
    const link = documentRef.createElement("a");
    link.href = url;
    link.download = filename || "personalabs-evidence-bundle.json";
    link.click();
    root.URL.revokeObjectURL(url);
    return true;
  }

  function init(root) {
    const documentRef = root && root.document;
    if (!documentRef) {
      return null;
    }

    const state = {
      api: getApi(root),
      latestResult: null,
      latestBundle: null,
      latestTraces: []
    };

    function refreshAll() {
      state.api = getApi(root);
      setHtml(documentRef, "api-status", renderApiStatus(state.api));
      const stored = readStoredBundles(root.localStorage);
      setHtml(documentRef, "pipeline-health", state.api ? renderPipelineHealth(state.api.getPipelineHealth()) : renderPipelineHealth(null));
      setHtml(documentRef, "scenario-results", renderScenarioResults(state.latestResult));
      setHtml(documentRef, "evidence-viewer", renderEvidenceBundle(state.latestBundle, stored));
      setHtml(documentRef, "trace-viewer", renderTraceViewer(state.latestTraces));
      setHtml(documentRef, "drift-summary", renderDriftSummary(state.latestBundle));
    }

    function captureEvidence() {
      if (!state.api) {
        return null;
      }

      state.latestBundle = state.api.exportEvidenceBundle();
      storeEvidenceBundle(root.localStorage, state.latestBundle);
      state.latestTraces = state.api.getLatestTraces();
      return state.latestBundle;
    }

    function runScenarioFromTextarea() {
      if (!state.api) {
        return;
      }

      const input = documentRef.getElementById("scenario-json");
      const parsed = JSON.parse(input && input.value || stringifyJson(DEFAULT_SCENARIO_PACK));
      state.latestResult = Array.isArray(parsed.scenarios) ? state.api.runScenarioPack(parsed) : state.api.runScenario(parsed);
      captureEvidence();
      refreshAll();
    }

    const scenarioInput = documentRef.getElementById("scenario-json");
    if (scenarioInput) {
      scenarioInput.value = stringifyJson(DEFAULT_SCENARIO_PACK);
    }

    const firstScenarioButton = documentRef.getElementById("run-default-scenario");
    if (firstScenarioButton) {
      firstScenarioButton.addEventListener("click", () => {
        if (!state.api) {
          refreshAll();
          return;
        }
        state.latestResult = state.api.runScenario(DEFAULT_SCENARIO_PACK.scenarios[0]);
        captureEvidence();
        refreshAll();
      });
    }

    const packButton = documentRef.getElementById("run-default-pack");
    if (packButton) {
      packButton.addEventListener("click", () => {
        if (!state.api) {
          refreshAll();
          return;
        }
        state.latestResult = state.api.runScenarioPack(DEFAULT_SCENARIO_PACK);
        captureEvidence();
        refreshAll();
      });
    }

    const jsonButton = documentRef.getElementById("run-json");
    if (jsonButton) {
      jsonButton.addEventListener("click", runScenarioFromTextarea);
    }

    const refreshEvidenceButton = documentRef.getElementById("refresh-evidence");
    if (refreshEvidenceButton) {
      refreshEvidenceButton.addEventListener("click", () => {
        captureEvidence();
        refreshAll();
      });
    }

    const refreshTracesButton = documentRef.getElementById("refresh-traces");
    if (refreshTracesButton) {
      refreshTracesButton.addEventListener("click", () => {
        state.latestTraces = state.api ? state.api.getLatestTraces() : [];
        refreshAll();
      });
    }

    const copyButton = documentRef.getElementById("copy-evidence");
    if (copyButton) {
      copyButton.addEventListener("click", () => copyJson(root, state.latestBundle || {}));
    }

    const downloadButton = documentRef.getElementById("download-evidence");
    if (downloadButton) {
      downloadButton.addEventListener("click", () => downloadJson(root, state.latestBundle || {}, "personalabs-evidence-bundle.json"));
    }

    refreshAll();
    return state;
  }

  return Object.freeze({
    DEFAULT_SCENARIO_PACK,
    STORAGE_KEY,
    UNSAFE_MUTATION_METHODS,
    copyJson,
    downloadJson,
    escapeHtml,
    getApi,
    getUnsafeMutationMethods,
    init,
    readStoredBundles,
    renderApiStatus,
    renderDriftSummary,
    renderEvidenceBundle,
    renderPipelineHealth,
    renderScenarioResults,
    renderTraceViewer,
    storeEvidenceBundle
  });
});
