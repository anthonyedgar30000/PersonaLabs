# PersonaLabs

PersonaLabs is currently a simple Chill Mode Chrome extension MVP for YouTube.

The extension adds lightweight overlays to YouTube cards and classifies each
card from its visible title only. The goal is reliable local feedback without
multi-mode scoring, transcript assumptions, telemetry, or AI calls.

## Current MVP

- Chrome extension shell
- YouTube card detection
- Weighted title-based Chill Mode classification
- Color-coded overlays
- Hover tooltips explaining matched categories, terms, score impact, and confidence
- Bare Metal toggle to hide all overlays
- Optional Developer Mode for raw title/debug signals

## Out of scope for this MVP

- Study Mode
- Research Mode
- evidence scoring
- exploratory scoring
- persona weighting
- transcript analysis
- backend services
- telemetry

## User-facing label bands

- **ultra chill** / **vibes immaculate**: strong green calm fit.
- **good vibes**: green calm fit.
- **mostly chill**: yellow-green, chill signals with some focus energy.
- **mixed energy**: yellow, ambiguous or low-confidence title signals.
- **drama creeping in**: orange, higher friction for Chill Mode.
- **high friction**: red, strong friction signals.
- **doomscroll fuel**: dark red, multiple escalation signals.

## Weighted dictionary categories

The local scoring dictionaries are stored in `extension/dictionaries.js`:

- `calm_positive`
- `educational_low_friction`
- `high_friction`
- `violence_disturbing`
- `tribal_domination`
- `urgency_novelty`

Each category has 75-150 deterministic terms/phrases. Multi-word phrases carry
higher weight than single words, and strong `violence_disturbing` or
`tribal_domination` matches prevent green Chill Mode labels.

## Internal technical terminology

The UI can stay playful while the implementation remains explainable. Developer
Mode and technical docs preserve professional signal names:

- `calmAlignment`
- `conflictIntensity`
- `cognitiveFriction`
- `signalConfidence`
- `volatilitySignals`
- `escalationSignals`
- `metadataConfidence`

This is a presentation refactor. It preserves deterministic, title-based
heuristics, local-only processing, explainable overlays, Chill Mode focus, and
confidence display. It does not add AI APIs, transcripts, backend services,
embeddings, or LLMs.

See [`extension/README.md`](extension/README.md) for local installation and
popup controls.
