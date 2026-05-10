# PersonaLabs Chill Mode Extension

This is a deliberately small Chrome extension MVP for YouTube.

It keeps only:

- a Manifest V3 Chrome extension shell
- YouTube card detection
- Chill Mode overlays
- hover tooltips that explain the title keyword match
- a Bare Metal toggle that hides overlays

It does not include Research Mode, Study Mode, evidence scoring, exploratory
scoring, persona weighting, transcript analysis, telemetry, backend calls, or AI
API calls.

## How it works

1. Load `extension/` as an unpacked extension in Chrome.
2. Open YouTube.
3. The content script scans visible YouTube video card renderers.
4. Each card title is classified locally into:
   - `Chill fit`
   - `Maybe chill`
   - `No clear signal`
   - `Focus content`
   - `Not chill`
5. Hover the badge to see which title keywords matched.

Classification uses the visible card title only. If a card has no readable
title, no overlay is shown.

## Popup controls

- **Chill Mode**: show simple title-based overlays.
- **Bare Metal**: hide all PersonaLabs overlays.
