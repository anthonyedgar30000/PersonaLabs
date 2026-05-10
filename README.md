# PersonaLabs

PersonaLabs is currently a simple Chill Mode Chrome extension MVP for YouTube.

The extension adds lightweight overlays to YouTube cards and classifies each
card from its visible title only. The goal is reliable local feedback without
multi-mode scoring, transcript assumptions, telemetry, or AI calls.

## Current MVP

- Chrome extension shell
- YouTube card detection
- Title-based Chill Mode classification
- Color-coded overlays
- Hover tooltips explaining matched title keywords
- Bare Metal toggle to hide all overlays

## Out of scope for this MVP

- Study Mode
- Research Mode
- evidence scoring
- exploratory scoring
- persona weighting
- transcript analysis
- backend services
- telemetry

## Classification labels

- **Chill fit**: relaxed entertainment signals in the title.
- **Maybe chill**: both relaxed and focused title signals.
- **No clear signal**: no keyword match in the title.
- **Focus content**: study, news, analysis, or learning signals.
- **Not chill**: high-intensity title signals.

See [`extension/README.md`](extension/README.md) for local installation and
popup controls.
