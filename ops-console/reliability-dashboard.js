(function attachPersonaLabsReliabilityDashboard(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PersonaLabsReliabilityDashboard = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsReliabilityDashboard() {
  "use strict";

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function pct(value) {
    return `${Math.round((Number(value) || 0) * 100)}%`;
  }

  function renderReliabilityDashboard(snapshot, boundaryReport, adversarialRun) {
    if (!snapshot) {
      return "<p>No reliability snapshot generated yet.</p>";
    }

    const metrics = snapshot.metrics || {};
    const health = snapshot.health || {};
    const drift = snapshot.drift || {};
    const boundary = boundaryReport || {};
    const adversarial = adversarialRun && adversarialRun.evaluation || {};
    const panels = [
      ["Reliability score", `${snapshot.healthScore} / 100 (${snapshot.healthStatus})`],
      ["Replay consistency", pct(metrics.replayConsistency)],
      ["Reviewer disagreement", pct(metrics.reviewerDisagreementRate)],
      ["Unstable categories", boundary.highConfusionPairs && boundary.highConfusionPairs.length || 0],
      ["Drift trend", drift.cumulativeSlowDrift && drift.cumulativeSlowDrift.detected ? "slow drift detected" : "stable"],
      ["Confidence variance", Math.round(metrics.confidenceVariance || 0)],
      ["Governance interventions", pct(metrics.governanceSuppressionFrequency)],
      ["Semantic volatility", pct(metrics.signalVolatility)],
      ["Adversarial resilience", adversarial.resilient === false ? "attention" : "stable"]
    ];

    return [
      "<div class='reliability-grid'>",
      panels.map(([label, value]) => `<div class='reliability-card'><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join(""),
      "</div>",
      "<h4>Health scoring inputs</h4>",
      `<pre>${escapeHtml(JSON.stringify(health.inputs || {}, null, 2))}</pre>`
    ].join("");
  }

  function renderHealthStatusBadge(snapshot) {
    const status = snapshot && snapshot.healthStatus || "INVESTIGATE";
    return `<span class='health-status health-${escapeHtml(status.toLowerCase())}'>${escapeHtml(status)}</span>`;
  }

  return Object.freeze({
    renderHealthStatusBadge,
    renderReliabilityDashboard
  });
});
