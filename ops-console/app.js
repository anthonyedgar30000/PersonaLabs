(function attachPersonaLabsOpsApp(root, factory) {
  const storage = typeof require === "function" ? require("./storage") : root.PersonaLabsOpsStorage;
  const ingestion = typeof require === "function" ? require("./ingestion") : root.PersonaLabsOpsIngestion;
  const classification = typeof require === "function" ? require("./classification") : root.PersonaLabsOpsClassification;
  const regression = typeof require === "function" ? require("./regression") : root.PersonaLabsOpsRegression;
  const replay = typeof require === "function" ? require("./replay") : root.PersonaLabsOpsReplay;
  const api = factory(storage, ingestion, classification, regression, replay);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PersonaLabsOpsApp = api;
    api.init(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsOpsApp(storage, ingestion, classification, regression, replay) {
  "use strict";

  const REQUIRED_TEST_API_METHODS = Object.freeze([
    "runScenario",
    "runScenarioPack",
    "getLatestTraces",
    "getPipelineHealth",
    "exportEvidenceBundle"
  ]);

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function stringify(value) {
    return JSON.stringify(value || null, null, 2);
  }

  function apiStatus(testApi) {
    if (!testApi) {
      return {
        available: false,
        missing: REQUIRED_TEST_API_METHODS.slice(),
        unsafeMethods: [],
        message: "window.PersonaLabsTestAPI unavailable"
      };
    }

    const missing = REQUIRED_TEST_API_METHODS.filter((method) => typeof testApi[method] !== "function");
    const unsafeMethods = [
      "setScoringRules",
      "updateDictionary",
      "setDictionary",
      "setLabel",
      "overrideLabel",
      "bypassGovernance",
      "disableGovernance"
    ].filter((method) => typeof testApi[method] === "function");

    return {
      available: missing.length === 0,
      missing,
      unsafeMethods,
      message: missing.length ? "PersonaLabsTestAPI incomplete" : "PersonaLabsTestAPI ready"
    };
  }

  function renderApiStatus(testApi) {
    const status = apiStatus(testApi);
    return [
      `<strong class='${status.available ? "status-ok" : "status-error"}'>${escapeHtml(status.message)}</strong>`,
      `<div>Missing: ${escapeHtml(status.missing.join(", ") || "none")}</div>`,
      `<div>Unsafe mutation APIs: ${escapeHtml(status.unsafeMethods.join(", ") || "none")}</div>`,
      "<div>Safety: tests and evidence collection only; no direct rules, dictionaries, label, or governance mutation controls.</div>"
    ].join("");
  }

  function flattenSearchText(row) {
    return [
      row.title,
      row.query,
      row.actualCategory,
      JSON.stringify(row.matchedSignals || {}),
      JSON.stringify(row.suppressions || {}),
      JSON.stringify(row.governanceDecisions || {})
    ].join(" ").toLowerCase();
  }

  function filterAndSortRows(rows, view) {
    const state = view || {};
    const search = String(state.search || "").toLowerCase().trim();
    const category = String(state.category || "").trim();
    const [sortKey, sortDirection] = String(state.sort || "classifiedAt:desc").split(":");
    const direction = sortDirection === "asc" ? 1 : -1;

    return (rows || [])
      .filter((row) => !category || row.actualCategory === category)
      .filter((row) => !search || flattenSearchText(row).includes(search))
      .sort((left, right) => {
        const a = left[sortKey] == null ? "" : left[sortKey];
        const b = right[sortKey] == null ? "" : right[sortKey];
        if (sortKey === "confidence") {
          return (Number(a) - Number(b)) * direction;
        }
        return String(a).localeCompare(String(b)) * direction;
      });
  }

  function categoryClass(category) {
    return `category-${String(category || "unknown").toLowerCase()}`;
  }

  function renderClassificationTable(rows, view) {
    const filtered = filterAndSortRows(rows, view);
    if (!filtered.length) {
      return "<p>No classifications match the current filters.</p>";
    }

    return [
      "<table class='classification-table'>",
      "<thead><tr><th>Title</th><th>Query</th><th>Category</th><th>Confidence</th><th>Signals</th><th>Governance</th><th>Drift</th><th>Pipeline</th></tr></thead>",
      "<tbody>",
      filtered.map((row) => {
        const confidence = Number(row.confidence) || 0;
        const band = classification.confidenceBand(confidence);
        const governance = row.governanceDecisions || {};
        const drift = row.driftIndicators || {};
        const contradictions = row.contradictionState && row.contradictionState.hasContradictions ? "contradiction" : "clear";
        return [
          `<tr data-classification-id='${escapeHtml(row.classificationId)}'>`,
          `<td><strong>${escapeHtml(row.title || "untitled")}</strong><div class='row-details'>${escapeHtml(row.channel || "unknown channel")}</div></td>`,
          `<td>${escapeHtml(row.query || "none")}</td>`,
          `<td><span class='category-badge ${categoryClass(row.actualCategory)}'>${escapeHtml(row.actualCategory || "UNKNOWN")}</span></td>`,
          `<td><span class='confidence-band confidence-${band}'>${escapeHtml(confidence)}</span></td>`,
          `<td>${escapeHtml(JSON.stringify(row.matchedSignals || {}))}<div class='row-details'>Suppressed: ${escapeHtml((row.suppressions || []).join(", ") || "none")}</div></td>`,
          `<td>${escapeHtml((governance.downgradeReasons || []).join(" | ") || governance.explanation || "none")}</td>`,
          `<td>${escapeHtml(drift.severity || "none")} / ${escapeHtml(contradictions)}</td>`,
          `<td>${escapeHtml(row.pipelineVersion || "unknown")}</td>`,
          "</tr>"
        ].join("");
      }).join(""),
      "</tbody></table>"
    ].join("");
  }

  function renderTraceInspector(trace, classificationRecord) {
    if (!trace) {
      return "<p>Select a classification row to inspect deterministic execution trace details.</p>";
    }

    const record = classificationRecord || {};
    return [
      `<h3>${escapeHtml(record.title || trace.traceId || "Trace")}</h3>`,
      `<p><strong>Pipeline:</strong> ${escapeHtml(trace.pipelineVersion)} | <strong>Trace ID:</strong> ${escapeHtml(trace.traceId || "none")}</p>`,
      "<div class='trace-section'><h4>Tokenization</h4>",
      `<pre>${escapeHtml(stringify(trace.tokenization))}</pre></div>`,
      "<div class='trace-section'><h4>Matched Rules / Signals</h4>",
      `<pre>${escapeHtml(stringify(trace.matchedRules))}</pre></div>`,
      "<div class='trace-section'><h4>Suppressed Signals</h4>",
      `<pre>${escapeHtml(stringify(trace.suppressedSignals))}</pre></div>`,
      "<div class='trace-section'><h4>Contradiction Handling</h4>",
      `<pre>${escapeHtml(stringify(trace.contradictionHandling))}</pre></div>`,
      "<div class='trace-section'><h4>Confidence Adjustments</h4>",
      `<pre>${escapeHtml(stringify(trace.confidenceAdjustments))}</pre></div>`,
      "<div class='trace-section'><h4>Governance Downgrades / Escalations</h4>",
      `<pre>${escapeHtml(stringify(trace.governanceDowngradesEscalations))}</pre></div>`,
      "<div class='trace-section'><h4>Final Reasoning Chain</h4>",
      `<pre>${escapeHtml(stringify(trace.finalReasoningChain))}</pre></div>`,
      "<div class='trace-section'><h4>Trace Events</h4>",
      `<pre>${escapeHtml(stringify(trace.traceEvents))}</pre></div>`
    ].join("");
  }

  function createReview(input) {
    const item = input || {};
    return {
      reviewId: item.reviewId || storage.createRecordId("review"),
      observationId: item.observationId || "",
      expectedCategory: item.expectedCategory || "",
      actualCategory: item.actualCategory || "",
      reviewerDecision: item.reviewerDecision || "ambiguous",
      reviewerNotes: item.reviewerNotes || "",
      reviewedAt: item.reviewedAt || storage.nowIso()
    };
  }

  function renderReviewPanel(classificationRecord, existingReviews) {
    if (!classificationRecord) {
      return "<p>Select a classification to review.</p>";
    }

    const reviews = (existingReviews || []).filter((review) => review.observationId === classificationRecord.observationId);
    return [
      `<p><strong>Observation:</strong> ${escapeHtml(classificationRecord.observationId)}</p>`,
      "<div class='review-grid'>",
      "<label>Expected Category <select id='review-expected'><option></option><option>GREEN</option><option>YELLOW</option><option>RED</option></select></label>",
      "<label>Decision <select id='review-decision'><option value='approved'>approve classification</option><option value='rejected'>reject classification</option><option value='false-positive'>false positive</option><option value='false-negative'>false negative</option><option value='ambiguous'>ambiguous</option><option value='acceptable-uncertainty'>acceptable uncertainty</option></select></label>",
      "<label>Review Notes <textarea id='review-notes' placeholder='Human review notes'></textarea></label>",
      "<button type='button' id='save-review'>Save Review</button>",
      "</div>",
      "<h4>Prior Reviews</h4>",
      reviews.length
        ? `<pre>${escapeHtml(stringify(reviews))}</pre>`
        : "<p>No reviews for this observation yet.</p>"
    ].join("");
  }

  function renderRegressionSummary(snapshot) {
    if (!snapshot) {
      return "<p>No replay or regression snapshot has been generated.</p>";
    }

    return [
      `<p><strong>Snapshot:</strong> ${escapeHtml(snapshot.snapshotId)}</p>`,
      `<p><strong>Pipeline:</strong> ${escapeHtml(snapshot.basePipelineVersion)} -> ${escapeHtml(snapshot.comparisonPipelineVersion)}</p>`,
      `<pre>${escapeHtml(stringify(snapshot.summary))}</pre>`
    ].join("");
  }

  function setHtml(documentRef, id, html) {
    const element = documentRef && documentRef.getElementById(id);
    if (element) {
      element.innerHTML = html;
    }
  }

  function selectedClassification(state) {
    return state.classifications.find((item) => item.classificationId === state.selectedClassificationId) || null;
  }

  async function selectedTrace(state, adapter) {
    const selected = selectedClassification(state);
    if (!selected) {
      return null;
    }

    const traces = await adapter.list("traces");
    return traces.find((trace) => trace.classificationId === selected.classificationId) || null;
  }

  async function refreshState(state, adapter) {
    state.observations = await adapter.list("observations");
    state.classifications = await adapter.list("classifications");
    state.reviews = await adapter.list("reviews");
    state.replayPacks = await adapter.list("replayPacks");
    state.regressionSnapshots = await adapter.list("regressionSnapshots");
  }

  async function render(state, adapter, root) {
    const documentRef = root.document;
    const selected = selectedClassification(state);
    const trace = await selectedTrace(state, adapter);
    setHtml(documentRef, "api-status", renderApiStatus(root.PersonaLabsTestAPI));
    setHtml(documentRef, "classification-table", renderClassificationTable(state.classifications, state.view));
    setHtml(documentRef, "table-summary", `${filterAndSortRows(state.classifications, state.view).length}/${state.classifications.length} classifications shown`);
    setHtml(documentRef, "trace-inspector", renderTraceInspector(trace, selected));
    setHtml(documentRef, "review-panel", renderReviewPanel(selected, state.reviews));
    setHtml(documentRef, "regression-summary", renderRegressionSummary(state.regressionSnapshots[0]));
  }

  async function init(root) {
    const documentRef = root && root.document;
    if (!documentRef) {
      return null;
    }

    const adapter = storage.createStorage({ root });
    const state = {
      observations: [],
      classifications: [],
      reviews: [],
      replayPacks: [],
      regressionSnapshots: [],
      selectedClassificationId: "",
      view: {
        search: "",
        category: "",
        sort: "classifiedAt:desc"
      }
    };

    await refreshState(state, adapter);
    await render(state, adapter, root);

    const ingestButton = documentRef.getElementById("ingest-classify");
    if (ingestButton) {
      ingestButton.addEventListener("click", async () => {
        const query = documentRef.getElementById("query-input").value;
        const sourceType = documentRef.getElementById("source-type").value;
        const batch = documentRef.getElementById("batch-input").value;
        const health = root.PersonaLabsTestAPI && root.PersonaLabsTestAPI.getPipelineHealth ? root.PersonaLabsTestAPI.getPipelineHealth() : {};
        const observations = ingestion.parseBatchTitles(batch, {
          query,
          sourceType,
          pipelineVersion: health.pipelineVersion || "unknown"
        });
        await ingestion.ingestObservations(adapter, observations);
        await classification.classifyObservations(adapter, root.PersonaLabsTestAPI, observations);
        await refreshState(state, adapter);
        await render(state, adapter, root);
      });
    }

    const refreshButton = documentRef.getElementById("refresh-console");
    if (refreshButton) {
      refreshButton.addEventListener("click", async () => {
        await refreshState(state, adapter);
        await render(state, adapter, root);
      });
    }

    const table = documentRef.getElementById("classification-table");
    if (table) {
      table.addEventListener("click", async (event) => {
        const row = event.target && event.target.closest && event.target.closest("[data-classification-id]");
        if (!row) {
          return;
        }
        state.selectedClassificationId = row.getAttribute("data-classification-id");
        await render(state, adapter, root);
      });
    }

    const searchInput = documentRef.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener("input", async () => {
        state.view.search = searchInput.value;
        await render(state, adapter, root);
      });
    }

    const categoryFilter = documentRef.getElementById("category-filter");
    if (categoryFilter) {
      categoryFilter.addEventListener("change", async () => {
        state.view.category = categoryFilter.value;
        await render(state, adapter, root);
      });
    }

    const sortSelect = documentRef.getElementById("sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", async () => {
        state.view.sort = sortSelect.value;
        await render(state, adapter, root);
      });
    }

    const reviewPanel = documentRef.getElementById("review-panel");
    if (reviewPanel) {
      reviewPanel.addEventListener("click", async (event) => {
        if (!event.target || event.target.id !== "save-review") {
          return;
        }
        const selected = selectedClassification(state);
        if (!selected) {
          return;
        }
        const expected = documentRef.getElementById("review-expected").value;
        const decision = documentRef.getElementById("review-decision").value;
        const notes = documentRef.getElementById("review-notes").value;
        await adapter.put("reviews", createReview({
          observationId: selected.observationId,
          expectedCategory: expected,
          actualCategory: selected.actualCategory,
          reviewerDecision: decision,
          reviewerNotes: notes
        }));
        await refreshState(state, adapter);
        await render(state, adapter, root);
      });
    }

    const packButton = documentRef.getElementById("create-replay-pack");
    if (packButton) {
      packButton.addEventListener("click", async () => {
        const pack = await replay.createReplayPackFromObservations(adapter, {
          name: "Current classification replay pack",
          observations: state.observations,
          classifications: state.classifications,
          sourcePipelineVersion: state.classifications[0] && state.classifications[0].pipelineVersion || "unknown",
          tags: ["local-first", "semantic-ops"]
        });
        state.replayPacks.unshift(pack);
        await render(state, adapter, root);
      });
    }

    const replayButton = documentRef.getElementById("run-replay");
    if (replayButton) {
      replayButton.addEventListener("click", async () => {
        const latestPack = state.replayPacks[0] || (await adapter.list("replayPacks"))[0];
        if (!latestPack) {
          return;
        }
        await replay.replayPack(adapter, root.PersonaLabsTestAPI, latestPack);
        await refreshState(state, adapter);
        await render(state, adapter, root);
      });
    }

    return { adapter, state };
  }

  return Object.freeze({
    REQUIRED_TEST_API_METHODS,
    apiStatus,
    createReview,
    escapeHtml,
    filterAndSortRows,
    flattenSearchText,
    init,
    render,
    renderApiStatus,
    renderClassificationTable,
    renderRegressionSummary,
    renderReviewPanel,
    renderTraceInspector,
    selectedClassification
  });
});
