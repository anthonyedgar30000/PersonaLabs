# PersonaLabs System Overview

PersonaLabs is a deterministic, local-first YouTube title-framing helper. It annotates visible video cards with explainable wording labels and provides a side panel for optional subject-preserving rewritten searches.

This project is currently a Chrome extension runtime composed of:

- `src/semantic-core.js`: deterministic title-framing analysis, rewritten search paths, scoring, filtering, and classification contracts.
- `src/retrieval-pipeline.js`: structured retrieval adapter and score-first/filter-second exploration pipeline.
- `src/content.js`: YouTube DOM extraction, overlay rendering, side panel rendering, debug trace collection, and optional trace persistence attempts.
- `src/content.css`: overlay and panel styling.
- `lib/headlineAnalyzer.js`: legacy isolated headline analyzer retained for tests, not loaded by the extension runtime.

## Overall architecture

```text
YouTube DOM / visible metadata
  -> content metadata extraction
  -> deterministic rule scoring: semantic.scoreContent(...)
  -> deterministic result / trace object
  -> overlay rendering
  -> panel recommendation rendering
  -> optional debug trace console/panel/export
  -> optional trace database adapter
```

All active UI decisions must consume the deterministic result produced by `semantic.scoreContent(...)`.

## Major pipelines

### Title-framing scoring flow

1. Normalize candidate metadata: title, channel, duration, URL/video id.
2. Resolve anchor and selected lens.
3. Detect wording cue groups.
4. Calculate score components.
5. Classify with deterministic label rules.
6. Calculate rule-score components.
7. Detect contradictions.
8. Return deterministic title-framing result.

### Retrieval flow

1. Build a subject-preserving rewritten query from the active anchor and lens.
2. Retrieve structured metadata from the visible-page adapter or configured provider.
3. Score each candidate through `semantic.scoreCandidates(...)`.
4. Filter using deterministic labels and score components.
5. Return scored titles and allowed suggestions.

### Overlay flow

1. Detect candidate YouTube card nodes.
2. Extract candidate metadata from DOM.
3. Call `semantic.scoreContent({ scoringPath: "overlay" })`.
4. Render the overlay and title badge from the deterministic result.
5. Record debug trace stages when `PERSONALABS_DEBUG` is enabled.

The overlay must not independently rescore content or choose labels from alternate data.

### Panel flow

1. Render active anchor and rewritten search paths.
2. Run retrieval pipeline for the selected lens.
3. Render suggestions from deterministic scoring results.
4. Render debug traces when debug mode is enabled.

The panel must not compute labels independently of deterministic scoring.

### Debugging flow

When `window.PERSONALABS_DEBUG === true`:

- structured traces are logged to console;
- the last 50 traces are kept in memory as `window.PersonaLabsDebugTraces`;
- the side panel exposes "Debug Traces";
- traces can be copied/exported as JSON.

### Deterministic data flow

The deterministic title-framing result is the single source for:

- overlay label and explanation;
- overlay rule-match score and matched terms;
- panel label and rule-match score;
- retrieval filtering;
- contradiction reporting;
- debug trace display;
- optional persistence attempts.

Compatibility fields may exist, but they must mirror the deterministic result fields and must not become alternate scoring paths.

## UI components

- **Thumbnail overlay**: compact framing label, rule-match score, wording-cue summary, reason, and matched terms.
- **Title badge**: short label near the title with tooltip details.
- **Side panel**: anchor context, rewritten search paths, suggestions, principles, and optional debug trace export.
- **Debug traces panel section**: shown only when `PERSONALABS_DEBUG` is enabled.

