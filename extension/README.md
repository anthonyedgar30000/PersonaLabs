# PersonaLabs Chill Mode Extension

This is a deliberately small Chrome extension MVP for YouTube.

It keeps only:

- a Manifest V3 Chrome extension shell
- YouTube card detection
- Chill Mode overlays
- hover tooltips that explain the title keyword match
- a Bare Metal toggle that hides overlays
- an optional Developer Mode that exposes internal signal terminology

It does not include Research Mode, Study Mode, evidence scoring, exploratory
scoring, persona weighting, transcript analysis, telemetry, backend calls, or AI
API calls.

## How it works

1. Load `extension/` as an unpacked extension in Chrome.
2. Open YouTube.
3. The content script scans visible YouTube video card renderers.
4. Each card title is classified locally with the same deterministic title
   heuristic, then mapped to a friendly label band.
5. Hover the badge to see a friendly summary, explainable reasoning, and
   confidence.

Classification uses the visible card title only. If a card has no readable
title, no overlay is shown.

## Friendly label bands

| Band | User-facing label | Alternate |
| --- | --- | --- |
| Strong Green | ultra chill | vibes immaculate |
| Green | good vibes | - |
| Yellow-Green | mostly chill | - |
| Yellow | mixed energy | - |
| Orange | drama creeping in | - |
| Red | high friction | - |
| Dark Red | doomscroll fuel | cortisol cannon, reserved/rare |

The labels are intentionally lightweight and non-judgmental. They do not make
mental health claims and do not use political framing.

## Tooltip examples

Default tooltip:

```text
GOOD VIBES
Relaxed title signals are leading.

Why:
+ calm signals: relaxing, peaceful
+ low conflict intensity
+ title-only metadata confidence is high

Confidence: medium
```

Higher-friction tooltip:

```text
DOOMSCROLL FUEL
Multiple escalation signals are present.

Why:
- escalation signals: shocking, scandal
- high cognitive friction
- low calm alignment

Confidence: high
```

## Internal terminology

Developer Mode preserves professional terminology for debugging and technical
review:

- `rawExtractedTitle`
- `matchedTerms`
- `internalCategoryWeights`
- `calmAlignment`
- `conflictIntensity`
- `cognitiveFriction`
- `signalConfidence`
- `volatilitySignals`
- `escalationSignals`
- `metadataConfidence`

These values are derived from the same title keyword matches used by the MVP
classifier. They are presentation/debug metadata only; this refactor does not
change the underlying title-based classification branches or thresholds.

## Popup controls

- **Chill Mode**: show simple title-based overlays.
- **Bare Metal**: hide all PersonaLabs overlays.
- **Developer Mode**: show raw extracted title, matched terms, internal category
  weights, and professional signal names inside tooltips.
