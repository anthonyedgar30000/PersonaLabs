# PersonaLabs Scoring Contract

PersonaLabs classifications must be represented as one canonical semantic result object.

## Canonical result object

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
  matchedSignals,
  suppressedSignals,
  downgradeReasons,
  explanation,
  timestamp
}
```

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
- `matchedSignals`: Structured matched signals, at minimum `{ positive: [], friction: [] }`.
- `suppressedSignals`: Signals suppressed by safe-domain or contextual rules.
- `downgradeReasons`: Human-readable reasons a candidate was downgraded, capped, or kept from a stronger positive label.
- `explanation`: Final user-facing or debug-facing classification reason.
- `timestamp`: ISO timestamp for the classification event.

## Current scoring path audit

As of this branch, duplicate scoring paths still exist:

1. **Overlay path**
   - `src/content.js` calls `headlineAnalyzer.analyzeHeadline(...)`.
   - It also calls `semantic.scoreCandidate(...)` when an anchor exists.
   - `resolveVisibleOverlay(...)` selects the visible overlay label from headline governance, with a semantic safe-domain override.

2. **Panel recommendation path**
   - `src/retrieval-pipeline.js` calls `semantic.scoreCandidates(...)`.
   - `src/content.js` renders panel recommendations from `suggestion.scoring.classification.color`.

This split is documented before any replacement work. The current stabilization pass does not rewrite scoring. It adds canonical trace objects around both paths so output differences are inspectable.

## Required convergence rule

New code must not add another label source. Any future overlay/panel unification should make both rendering paths consume the canonical semantic result object rather than independently computing visible labels.

