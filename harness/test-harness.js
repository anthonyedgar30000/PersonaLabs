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

  const LATEST_EVIDENCE_KEY = "personaLabsLatestEvidenceBundle";
  const REQUIRED_API_METHODS = Object.freeze([
    "runScenario",
    "runScenarioPack",
    "getLatestTraces",
    "getPipelineHealth",
    "exportEvidenceBundle"
  ]);
  const UNSAFE_MUTATION_METHODS = Object.freeze([
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
  ]);

  const DEFAULT_SCENARIO_PACK = Object.freeze({
    name: "PersonaLabs MVP smoke scenarios",
    category: "mvp-regression",
    description: "Small regression pack that exercises the core classification boundaries.",
    scenarios: Object.freeze([
      Object.freeze({
        id: "mvp-calm-animal",
        category: "benign",
        description: "Calm animal content should remain GREEN.",
        expectedLabel: "GREEN",
        expectedConfidenceRange: [90, 100],
        expectedGovernanceOutcomes: ["Calm/pet content detected"],
        expectedContradictionState: false,
        expectedMatchedSignalCategories: { positive: ["cute", "bunny"], friction: [] },
        input: { title: "Cute Baby Bunny Compilation", channel: "Wholesome Pets", duration: "12:00" }
      }),
      Object.freeze({
        id: "mvp-political-outrage",
        category: "inflammatory",
        description: "Outrage framing should classify as intense / attention-grabbing.",
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
      }),
      Object.freeze({
        id: "mvp-educational-tutorial",
        category: "educational",
        description: "Educational tutorial content should remain GREEN.",
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
      }),
      Object.freeze({
        id: "mvp-clickbait-manipulation",
        category: "manipulation",
        description: "Clickbait manipulation framing should classify as RED.",
        expectedLabel: "RED",
        expectedConfidenceRange: [70, 100],
        expectedGovernanceOutcomes: ["explicit escalation or distress framing detected"],
        expectedContradictionState: false,
        expectedMatchedSignalCategories: { friction: ["you won't believe", "secret", "this changes everything"] },
        input: { title: "You won't believe this secret that changes everything", channel: "Viral Secrets", duration: "6:40" }
      }),
      Object.freeze({
        id: "mvp-ambiguous-low-context",
        category: "low-context",
        description: "Ambiguous low-context content should stay uncertain.",
        expectedLabel: "YELLOW",
        expectedConfidenceRange: [35, 60],
        expectedGovernanceOutcomes: ["neutral default: no explicit escalation, but not enough GREEN evidence"],
        expectedContradictionState: false,
        expectedMatchedSignalCategories: { positive: [], friction: [] },
        input: { title: "Update from yesterday", channel: "Unknown Channel", duration: "5:00" }
      })
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

  function apiStatus(api) {
    if (!api) {
      return {
        available: false,
        missing: REQUIRED_API_METHODS.slice(),
        unsafe: [],
        message: "PersonaLabsTestAPI unavailable"
      };
    }

    const missing = REQUIRED_API_METHODS.filter((method) => typeof api[method] !== "function");
    const unsafe = getUnsafeMutationMethods(api);
    return {
      available: missing.length === 0,
      missing,
      unsafe,
      message: missing.length ? "PersonaLabsTestAPI incomplete" : "PersonaLabsTestAPI available"
    };
  }

  function renderApiStatus(api) {
    const status = apiStatus(api);
    return [
      `<p class='${status.available ? "status-ok" : "status-missing"}'>${escapeHtml(status.message)}</p>`,
      status.available ? "" : "<p>Enable <code>PERSONALABS_DEBUG=true</code> and load the debug API.</p>",
      `<p>Missing: ${escapeHtml(status.missing.join(", ") || "none")}</p>`,
      `<p>Unsafe mutation methods: ${escapeHtml(status.unsafe.join(", ") || "none")}</p>`
    ].join("");
  }

  function parseTitleLines(text, query) {
    return String(text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [title, channel] = line.split(/\s+\|\s+/);
        return {
          id: `pasted-title-${index + 1}`,
          category: "manual-observation",
          description: query ? `Pasted title for query: ${query}` : "Pasted title",
          expectedLabel: ["GREEN", "YELLOW", "RED"],
          expectedConfidenceRange: [0, 100],
          expectedGovernanceOutcomes: [],
          expectedContradictionState: false,
          input: {
            title: title.trim(),
            channel: (channel || "").trim(),
            duration: ""
          }
        };
      });
  }

  function confidenceBand(confidence) {
    const value = Number(confidence) || 0;
    if (value >= 80) {
      return "high";
    }
    if (value >= 55) {
      return "medium";
    }
    return "low";
  }

  function confidenceLabel(confidence) {
    const value = Number(confidence) || 0;
    return `${value} (${confidenceBand(value)} match)`;
  }

  function signalValues(signals) {
    const groups = signals || {};
    const labels = {
      positive: "Calm/explanatory signals",
      friction: "Intense/attention-grabbing signals"
    };
    return Object.keys(groups)
      .sort()
      .map((group) => {
        const values = groups[group] || [];
        return values.length ? `${labels[group] || group}: ${values.join(", ")}` : "";
      })
      .filter(Boolean);
  }

  function signalSummary(signals) {
    const values = signalValues(signals);
    return values.length ? values.join(" | ") : "none";
  }

  function flattenResults(result) {
    if (!result) {
      return [];
    }
    return Array.isArray(result.results) ? result.results : [result];
  }

  function renderResultsTable(result) {
    const results = flattenResults(result);
    if (!results.length) {
      return "<p>No classifications yet. Paste titles and run classification.</p>";
    }

    return [
      result && result.total != null
        ? `<p>${escapeHtml(result.passed)}/${escapeHtml(result.total)} scenario checks passing.</p>`
        : "",
      "<table class='classification-table'>",
      "<thead><tr><th>Title</th><th>Label</th><th>Match strength</th><th>Signals</th><th>Reason</th></tr></thead>",
      "<tbody>",
      results.map((item, index) => {
        const score = item.score || {};
        const input = score.input || {};
        const confidence = score.confidence == null ? "" : score.confidence;
        return [
          `<tr data-result-index='${index}'>`,
          `<td>${escapeHtml(input.title || item.name || item.scenarioId || "untitled")}</td>`,
          `<td><span class='label-badge label-${escapeHtml(String(item.actualLabel || score.label || "unknown").toLowerCase())}'>${escapeHtml(item.actualLabel || score.label || "UNKNOWN")}</span></td>`,
          `<td><span class='confidence-${confidenceBand(confidence)}'>${escapeHtml(confidenceLabel(confidence))}</span></td>`,
          `<td>${escapeHtml(signalSummary(score.matchedTerms))}</td>`,
          `<td>${escapeHtml(score.explanation || item.severity || "none")}</td>`,
          "</tr>"
        ].join("");
      }).join(""),
      "</tbody></table>"
    ].join("");
  }

  function compactTrace(result) {
    const score = result && result.score || {};
    return {
      finalLabel: result && result.actualLabel || score.label || "",
      confidence: score.confidence || 0,
      matchedSignals: score.matchedTerms || {},
      suppressedSignals: score.suppressedTerms || [],
      finalExplanation: score.explanation || "",
      rawTrace: score
    };
  }

  function renderSelectedDetails(result) {
    if (!result) {
      return "<p>Select a row to inspect its compact trace.</p>";
    }

    const trace = compactTrace(result);
    return [
      `<p><strong>Final label:</strong> ${escapeHtml(trace.finalLabel)}</p>`,
      `<p><strong>Match strength:</strong> ${escapeHtml(confidenceLabel(trace.confidence))}</p>`,
      `<p><strong>Matched signals:</strong> ${escapeHtml(signalSummary(trace.matchedSignals))}</p>`,
      `<p><strong>Ignored / downweighted signals:</strong> ${escapeHtml((trace.suppressedSignals || []).join(", ") || "none")}</p>`,
      `<p><strong>Final explanation:</strong> ${escapeHtml(trace.finalExplanation || "none")}</p>`,
      "<details><summary>Raw trace JSON</summary>",
      `<pre>${escapeHtml(stringifyJson(trace.rawTrace))}</pre>`,
      "</details>"
    ].join("");
  }

  function compactEvidence(bundle) {
    const source = bundle || {};
    const inputs = source.scenarioInputs || [];
    const matchedSuppressed = source.matchedSuppressedSignals || [];
    const governance = source.governanceDecisions || [];
    const results = (source.actualOutputs || []).map((result, index) => ({
      input: inputs[index] || {},
      label: result.actualLabel || "",
      confidence: result.confidence || 0,
      confidenceBand: confidenceBand(result.confidence),
      pass: Boolean(result.pass),
      matchedSignals: matchedSuppressed[index] && matchedSuppressed[index].matchedSignals || {},
      suppressedSignals: matchedSuppressed[index] && matchedSuppressed[index].suppressedSignals || [],
      explanation: result.explanation || governance[index] && governance[index].governanceDecisions && governance[index].governanceDecisions.explanation || "",
      traceId: result.traceId || ""
    }));
    return {
      appVersion: source.appVersion,
      pipelineVersion: source.pipelineVersion,
      generatedAt: source.exportedAt || source.timestamps && source.timestamps.exportedAt,
      results,
      traces: source.traceEvents || []
    };
  }

  function renderEvidence(bundle) {
    if (!bundle) {
      return "<p>No evidence bundle generated yet.</p>";
    }

    return `<pre>${escapeHtml(stringifyJson(compactEvidence(bundle)))}</pre>`;
  }

  function storeLatestEvidence(storage, bundle) {
    if (!storage || typeof storage.setItem !== "function" || !bundle) {
      return null;
    }
    const compact = compactEvidence(bundle);
    storage.setItem(LATEST_EVIDENCE_KEY, JSON.stringify(compact));
    return compact;
  }

  function readLatestEvidence(storage) {
    if (!storage || typeof storage.getItem !== "function") {
      return null;
    }
    try {
      return JSON.parse(storage.getItem(LATEST_EVIDENCE_KEY) || "null");
    } catch (error) {
      return null;
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
    link.download = filename || "personalabs-evidence.json";
    link.click();
    root.URL.revokeObjectURL(url);
    return true;
  }

  function setHtml(documentRef, id, html) {
    const element = documentRef && documentRef.getElementById(id);
    if (element) {
      element.innerHTML = html;
    }
  }

  function init(root) {
    const documentRef = root && root.document;
    if (!documentRef) {
      return null;
    }

    const state = {
      api: getApi(root),
      result: null,
      selectedIndex: 0,
      evidence: null
    };

    function currentResult() {
      return flattenResults(state.result)[state.selectedIndex] || null;
    }

    function captureEvidence() {
      if (!state.api) {
        return null;
      }
      state.evidence = state.api.exportEvidenceBundle();
      storeLatestEvidence(root.localStorage, state.evidence);
      return state.evidence;
    }

    function render() {
      state.api = getApi(root);
      setHtml(documentRef, "api-status", renderApiStatus(state.api));
      setHtml(documentRef, "classification-results", renderResultsTable(state.result));
      setHtml(documentRef, "selected-details", renderSelectedDetails(currentResult()));
      setHtml(documentRef, "evidence-viewer", renderEvidence(state.evidence || readLatestEvidence(root.localStorage)));
    }

    const input = documentRef.getElementById("title-input");
    if (input) {
      input.value = DEFAULT_SCENARIO_PACK.scenarios.map((scenario) => `${scenario.input.title} | ${scenario.input.channel}`).join("\n");
    }

    const classifyButton = documentRef.getElementById("classify-titles");
    if (classifyButton) {
      classifyButton.addEventListener("click", () => {
        if (!state.api) {
          render();
          return;
        }
        const query = documentRef.getElementById("query-input") && documentRef.getElementById("query-input").value || "";
        const scenarios = parseTitleLines(input && input.value || "", query);
        state.result = state.api.runScenarioPack({
          name: "Pasted title classifications",
          category: "manual-observation",
          scenarios
        });
        state.selectedIndex = 0;
        captureEvidence();
        render();
      });
    }

    const scenarioButton = documentRef.getElementById("run-scenarios");
    if (scenarioButton) {
      scenarioButton.addEventListener("click", () => {
        if (!state.api) {
          render();
          return;
        }
        state.result = state.api.runScenarioPack(DEFAULT_SCENARIO_PACK);
        state.selectedIndex = 0;
        captureEvidence();
        render();
      });
    }

    const results = documentRef.getElementById("classification-results");
    if (results) {
      results.addEventListener("click", (event) => {
        const row = event.target && event.target.closest && event.target.closest("[data-result-index]");
        if (!row) {
          return;
        }
        state.selectedIndex = Number(row.getAttribute("data-result-index")) || 0;
        render();
      });
    }

    const copyButton = documentRef.getElementById("copy-evidence");
    if (copyButton) {
      copyButton.addEventListener("click", () => copyJson(root, compactEvidence(state.evidence || {})));
    }

    const downloadButton = documentRef.getElementById("download-evidence");
    if (downloadButton) {
      downloadButton.addEventListener("click", () => downloadJson(root, compactEvidence(state.evidence || {}), "personalabs-evidence.json"));
    }

    render();
    return state;
  }

  return Object.freeze({
    DEFAULT_SCENARIO_PACK,
    LATEST_EVIDENCE_KEY,
    REQUIRED_API_METHODS,
    UNSAFE_MUTATION_METHODS,
    apiStatus,
    compactEvidence,
    compactTrace,
    confidenceBand,
    confidenceLabel,
    copyJson,
    downloadJson,
    escapeHtml,
    flattenResults,
    getApi,
    getUnsafeMutationMethods,
    init,
    parseTitleLines,
    readLatestEvidence,
    renderApiStatus,
    renderEvidence,
    renderResultsTable,
    renderSelectedDetails,
    signalSummary,
    storeLatestEvidence
  });
});
