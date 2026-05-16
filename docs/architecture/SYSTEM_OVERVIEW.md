# PersonaLabs System Overview

PersonaLabs is a deterministic, local-first YouTube observability layer. It annotates visible videos with calm, explainable semantic classifications and provides a side panel for subject-preserving exploration paths.

This project is currently a Chrome extension runtime composed of:

- `src/semantic-core.js`: canonical semantic analysis, transformed exploration paths, scoring, filtering, and classification contracts.
- `src/retrieval-pipeline.js`: structured retrieval adapter and score-first/filter-second exploration pipeline.
- `src/content.js`: YouTube DOM extraction, overlay rendering, side panel rendering, debug trace collection, and optional trace persistence attempts.
- `src/content.css`: overlay and panel styling.
- `lib/headlineAnalyzer.js`: legacy isolated headline analyzer retained for tests, not loaded by the extension runtime.

## Overall architecture

```text
YouTube DOM / visible metadata
  -> content metadata extraction
  -> canonical semantic scoring: semantic.scoreContent(...)
  -> canonical semantic result / trace object
  -> overlay rendering
  -> panel recommendation rendering
  -> optional debug trace console/panel/export
  -> optional trace database adapter
```

All active UI decisions must consume the canonical result produced by `semantic.scoreContent(...)`.

## Major pipelines

### Semantic scoring flow

1. Normalize candidate metadata: title, channel, duration, URL/video id.
2. Resolve anchor and selected lens.
3. Detect observability signals.
4. Calculate score components.
5. Classify with deterministic label rules.
6. Calculate confidence components.
7. Detect contradictions.
8. Return canonical semantic result.

### Retrieval flow

1. Build a subject-preserving transformed query from the active anchor and lens.
2. Retrieve structured metadata from the visible-page adapter or configured provider.
3. Score each candidate through `semantic.scoreCandidates(...)`.
4. Filter/rerank using canonical labels and score components.
5. Return scored results and allowed suggestions.

### Overlay flow

1. Detect candidate YouTube card nodes.
2. Extract candidate metadata from DOM.
3. Call `semantic.scoreContent({ scoringPath: "overlay" })`.
4. Render the overlay and title badge from the canonical result.
5. Record debug trace stages when `PERSONALABS_DEBUG` is enabled.

The overlay must not independently rescore content or choose labels from non-canonical data.

### Panel flow

1. Render active anchor and exploration paths.
2. Run retrieval pipeline for the selected lens.
3. Render suggestions from canonical scoring results.
4. Render debug traces when debug mode is enabled.

The panel must not compute labels independently of canonical scoring.

### Debugging flow

When `window.PERSONALABS_DEBUG === true`:

- structured traces are logged to console;
- the last 50 traces are kept in memory as `window.PersonaLabsDebugTraces`;
- the side panel exposes "Debug Traces";
- traces can be copied/exported as JSON.

### Canonical data flow

The canonical semantic result is the single source of truth for:

- overlay label and explanation;
- overlay confidence and matched terms;
- panel label and confidence;
- retrieval filtering;
- contradiction reporting;
- debug trace display;
- optional persistence attempts.

Compatibility fields may exist, but they must mirror the canonical fields and must not become alternate scoring paths.

## UI components

- **Thumbnail overlay**: compact classification label, confidence, score/domain summary, reason, and matched terms.
- **Title badge**: short label near the title with tooltip details.
- **Side panel**: anchor context, exploration paths, suggestions, principles, and optional debug trace export.
- **Debug traces panel section**: shown only when `PERSONALABS_DEBUG` is enabled.

