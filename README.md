# PersonaLabs

PersonaLabs is a deterministic-first, human-centered media observability browser
extension.

The v0.1 MVP helps users browse more intentionally by adding explainable,
local-first overlays to YouTube video cards. It classifies visible video titles
with deterministic lexical scoring, shows calm/non-judgmental alignment labels,
and keeps user-facing controls simple.

PersonaLabs is not a truth engine, not a diagnosis tool, and not censorship. It
does not decide whether content is true, healthy, allowed, or forbidden. It
shows locally computed signals so users can make their own choices.

## Current MVP

- Manifest V3 Chrome extension for YouTube.
- Visible-title-only card detection and classification.
- Explainable lexical scoring using deterministic local dictionaries.
- Color-coded overlay labels and hover tooltips.
- Local popup settings for:
  - Adaptive Guidance on/off.
  - Lightweight user goal selection.
  - Developer Mode debug details.
- Tooltip explanations showing:
  - current goal
  - Adaptive Guidance state
  - matched positive signals
  - matched negative signals
  - confidence
  - current label
- Guided Discovery scaffold with local query rewriting.
- No cloud AI, backend service, transcript fetching, embeddings, or LLM calls in
  v0.1.

## Intentional Browsing

PersonaLabs is designed to support intentional browsing rather than maximize
engagement. The extension surfaces lightweight context about the media in front
of the user and keeps control in the user's hands.

The current popup includes a user goal selector:

- Relax / Decompress
- Reduce Doomscrolling
- Focus / Learn
- Lower Screen Time
- Curiosity-Guided Learning

The selected goal is stored locally and displayed in tooltips. It does not yet
change scoring weights.

## Explainable Lexical Scoring

The MVP uses deterministic title matching instead of opaque ranking models.
Scoring dictionaries live in `extension/dictionaries.js` and include:

- `calm_positive`
- `educational_low_friction`
- `high_friction`
- `violence_disturbing`
- `tribal_domination`
- `urgency_novelty`

Each category has deterministic terms and phrases. The tooltip explains matched
positive and negative signals, score impact, confidence, and the current label.
Developer Mode can show raw extracted titles and internal signal terminology for
debugging.

## Local-First Processing

Core v0.1 behavior runs locally in the browser extension:

- Title extraction happens on the YouTube page.
- Lexical scoring happens in the content script.
- User settings are stored in `chrome.storage.local`.
- Guided Discovery query rewriting is deterministic and local.

PersonaLabs v0.1 does not send browsing content to cloud AI services.

## Adaptive Guidance Toggle

Adaptive Guidance is currently an optional local setting. The toggle is stored
locally and shown in overlay tooltips as `on` or `off`.

In v0.1, Adaptive Guidance is a scaffold for user-controlled guidance. It does
not override choices, change scoring weights, call AI, or create new browsing
modes.

## Guided Discovery Scaffold

Guided Discovery is a local scaffold for curiosity expansion. Each tooltip can
offer:

- Calmer
- More educational
- Less sensational
- More beginner-friendly

Clicking a Guided Discovery option creates a YouTube search URL from the current
video title using deterministic query rewriting. High-friction terms are mapped
to lower-friction alternatives, for example:

- `exposed` -> `analysis`
- `destroyed` -> `discussion`
- `panic` -> `overview`
- `shocking` -> `explained`
- `meltdown` -> `analysis`
- `humiliation` -> `interview`
- `breaking` -> `update`
- `disaster` -> `context`

The tooltip debug output shows the original title, transformed query, and
transformation preset used. Guided Discovery does not call AI or external APIs.

## Boundaries for v0.1

PersonaLabs v0.1 intentionally avoids:

- truth scoring
- factuality ranking
- diagnosis or mental health assessment
- censorship framing
- automatic blocking
- transcript analysis
- telemetry collection
- backend services
- cloud AI calls
- embeddings or LLM-based personalization

The extension flags and explains local lexical signals; it does not judge,
diagnose, censor, or enforce.

## Bounded AI Future Roadmap

AI may become an optional future enrichment layer, but it is not part of the
v0.1 core. Future AI-assisted features, if added, should remain bounded,
inspectable, opt-in, and secondary to deterministic local scoring.

Potential future areas include:

- clearer explanation phrasing
- goal refinement assistance
- privacy-preserving sync for user preferences
- richer Guided Discovery suggestions
- audit views showing why labels and suggestions appeared

The roadmap keeps user control, local-first processing, and explainability as
core constraints.

## Local Validation

Run:

```sh
node extension/scoring-validation.js
node extension/query-rewriting-validation.js
```

See [`extension/README.md`](extension/README.md) for local installation and
extension-specific controls.
