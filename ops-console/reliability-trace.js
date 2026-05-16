(function attachPersonaLabsReliabilityTrace(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PersonaLabsReliabilityTrace = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsReliabilityTrace() {
  "use strict";

  function annotateTrace(trace, context) {
    const item = trace || {};
    const reliability = context || {};
    const matchedRules = item.matchedRules || {};
    const unstableTokens = reliability.unstableBoundaryTokens || [];
    const matchedTokens = Object.keys(matchedRules).flatMap((group) => matchedRules[group] || []);
    const overlappingUnstableTokens = unstableTokens.filter((entry) => matchedTokens.includes(entry.token));
    const positiveCount = (matchedRules.positive || []).length;
    const frictionCount = (matchedRules.friction || []).length;
    const conflictDensity = matchedTokens.length ? Math.min(1, Math.min(positiveCount, frictionCount) / matchedTokens.length) : 0;
    const confidenceAdjustments = item.confidenceAdjustments || {};
    const confidenceDeltaTotal = Object.keys(confidenceAdjustments).reduce((total, key) => total + (Number(confidenceAdjustments[key]) || 0), 0);

    return {
      driftWarnings: reliability.driftWarnings || [],
      unstableTokenIndicators: overlappingUnstableTokens,
      conflictDensity,
      replayDelta: reliability.replayDelta || null,
      confidenceChangeOverlay: {
        adjustments: confidenceAdjustments,
        total: confidenceDeltaTotal,
        warning: Math.abs(confidenceDeltaTotal) >= 30
      },
      reliabilityAnnotations: [
        conflictDensity > 0 ? "positive/friction signal overlap" : "",
        overlappingUnstableTokens.length ? "unstable boundary tokens present" : "",
        Math.abs(confidenceDeltaTotal) >= 30 ? "large confidence adjustment" : ""
      ].filter(Boolean)
    };
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderReliabilityAnnotations(annotation) {
    const item = annotation || annotateTrace({});
    return [
      "<div class='trace-section reliability-trace-mode'><h4>Reliability Trace Mode</h4>",
      `<p><strong>Conflict density:</strong> ${escapeHtml(item.conflictDensity)}</p>`,
      `<p><strong>Confidence delta total:</strong> ${escapeHtml(item.confidenceChangeOverlay.total)}</p>`,
      `<p><strong>Drift warnings:</strong> ${escapeHtml((item.driftWarnings || []).join(" | ") || "none")}</p>`,
      `<p><strong>Unstable tokens:</strong> ${escapeHtml((item.unstableTokenIndicators || []).map((entry) => entry.token).join(", ") || "none")}</p>`,
      `<pre>${escapeHtml(JSON.stringify(item, null, 2))}</pre>`,
      "</div>"
    ].join("");
  }

  return Object.freeze({
    annotateTrace,
    renderReliabilityAnnotations
  });
});
