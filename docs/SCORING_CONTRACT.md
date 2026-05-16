# PersonaLabs Scoring Contract

PersonaLabs classifications must be represented as one canonical semantic result object.

## Canonical semantic result object

```js
{
  traceId,
  videoId,
  title,
  channel,
  lens,
  domain,
  label,
  confidence,
  scores,
  matchedTerms,
  suppressedTerms,
  semanticSignals,
  observabilitySignals,
  reasoning,
  pipelineVersion,
  scoringPath,
  contradictions,
  domainContext,
  traceEvents,
  downgradeReasons,
  explanation,
  timestamp
}
```

Runtime canonical scores may also expose compatibility fields such as
`classification`, `score`, `breakdown`, `matchedSignals`,
`suppressedSignals`, and `debug` while older call sites are migrated. These
fields must mirror the canonical fields and must not become alternate decision
sources.

## Field definitions

- `traceId`: Unique trace identifier for the classification event.
- `videoId`: YouTube video id when available.
- `title`: Extracted visible title used for scoring.
- `channel`: Extracted channel/source name used for source and metadata signals.
- `lens`: Selected PersonaLabs exploration lens or mode.
- `domain`: Detected content domain, such as `animal-pet-nature`, `educational/explanatory`, `low-friction-source`, or `general`.
- `label`: Final visible classification label: `GREEN`, `YELLOW`, or `RED`.
- `confidence`: Numeric 0-100 confidence for the final label.
- `scores`: Score components used to select or explain the label.
- `matchedTerms`: Structured matched terms, at minimum `{ positive: [], friction: [] }`.
- `suppressedTerms`: Terms suppressed by safe-domain or contextual rules.
- `semanticSignals`: Semantic contributions such as domain boosts, confidence deltas, semantic overrides, and final decision source.
- `observabilitySignals`: Raw matched observability signal groups from the canonical semantic pipeline.
- `reasoning`: Structured reasoning, including human-readable reasons, final reason, and downgrade reasons.
- `pipelineVersion`: Version string for the canonical semantic pipeline.
- `scoringPath`: Runtime path consuming the canonical score, such as `overlay`, `retrieval-panel`, or `retrieval-ranking`.
- `contradictions`: Explicit contradictions detected between label, explanation, and matched terms.
- `domainContext`: Domain classification context, boosts, and confidence source.
- `traceEvents`: Ordered semantic telemetry events emitted by the canonical scoring pipeline.
- `downgradeReasons`: Human-readable reasons a candidate was downgraded, capped, or kept from a stronger positive label.
- `explanation`: Final user-facing or debug-facing classification reason.
- `timestamp`: ISO timestamp for the classification event.

## Canonical function

All active runtime classification decisions must originate from:

```js
semantic.scoreContent({
  candidate,
  anchor,
  lens,
  scoringPath,
  expectedLabel
})
```

`semantic.scoreCandidate(...)` and `semantic.scoreCandidates(...)` are
compatibility adapters that delegate to `scoreContent(...)`.

## Current scoring path audit

The active runtime now routes overlay, retrieval, and panel decisions through
`semantic.scoreContent(...)`.

- `src/content.js` overlay rendering calls `semantic.scoreContent(...)`.
- `src/retrieval-pipeline.js` panel/retrieval scoring calls `semantic.scoreCandidates(...)`, which delegates to `semantic.scoreContent(...)`.
- `src/content.js` panel recommendations render the same canonical label and confidence from `suggestion.scoring`.

## Remaining legacy scoring code

`lib/headlineAnalyzer.js` still exists as legacy isolated code with regression
tests, but it is no longer loaded by the extension manifest and is not used by
the overlay or panel rendering paths. It should not be reintroduced as a UI
decision source.

## Required convergence rule

New code must not add another label source. Overlay, retrieval filtering, panel
recommendations, trace logging, and persistence attempts must consume the
canonical semantic result object.

