export function renderClassificationDebugPanel(debugLog) {
  return `
<details class="personalabs-debug-panel">
  <summary>Why was this classified this way?</summary>
  <section>
    <h3>Classification</h3>
    <p>${escapeHtml(debugLog.finalClassification.explanation)}</p>
    <dl>
      <dt>Final color</dt>
      <dd>${escapeHtml(debugLog.finalClassification.color)}</dd>
      <dt>Detected domain</dt>
      <dd>${escapeHtml(debugLog.domain.detected)}</dd>
      <dt>Final weighted score</dt>
      <dd>${debugLog.score.finalWeightedScore}</dd>
    </dl>
  </section>
  <section>
    <h3>Signals</h3>
    ${renderList("Positive terms", debugLog.signals.matchedPositiveTerms)}
    ${renderList("Friction terms", debugLog.signals.matchedFrictionTerms)}
    ${renderList(
      "Contextual suppressions",
      debugLog.contextualSuppressions.map((entry) => `${entry.term}: ${entry.reason}`),
    )}
    ${renderList("Domain matches", debugLog.domain.matches)}
    ${renderList("Channel/source signals", debugLog.sourceChannelSignals.channelDomainMatches)}
  </section>
  <section>
    <h3>Threshold decisions</h3>
    <ol>
      ${debugLog.thresholdDecisions.map((decision) => `
        <li>${escapeHtml(decision.rule)} => ${decision.matched ? "matched" : "not matched"} (${escapeHtml(decision.result)})</li>
      `).join("")}
    </ol>
  </section>
  <section>
    <h3>False positive markers</h3>
    ${renderList(
      "Markers",
      debugLog.falsePositiveMarkers.map((marker) => `${marker.type}: ${marker.message}`),
    )}
  </section>
  <section>
    <h3>Export debug JSON</h3>
    <pre>${escapeHtml(JSON.stringify(debugLog, null, 2))}</pre>
  </section>
</details>`.trim();
}

function renderList(label, values) {
  if (!values || values.length === 0) {
    return `<p><strong>${escapeHtml(label)}:</strong> none</p>`;
  }

  return `
    <p><strong>${escapeHtml(label)}:</strong></p>
    <ul>
      ${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}
    </ul>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
