# PersonaLabs Chill Mode Extension

This is a deliberately small Chrome extension MVP for YouTube.

It keeps only:

- a Manifest V3 Chrome extension shell
- YouTube card detection
- Chill Mode overlays
- hover tooltips that explain matched categories, matched terms, score impact,
  and confidence
- a Bare Metal toggle that hides overlays
- an optional Developer Mode that exposes internal signal terminology

It does not include Research Mode, Study Mode, evidence scoring, exploratory
scoring, persona weighting, transcript analysis, telemetry, backend calls, or AI
API calls.

## How it works

1. Load `extension/` as an unpacked extension in Chrome.
2. Open YouTube.
3. The content script scans visible YouTube video card renderers.
4. Each card title is classified locally with weighted deterministic
   dictionaries, then mapped to a friendly label band.
5. Hover the badge to see a friendly summary, explainable reasoning, and
   confidence.

Classification uses the visible card title only. If a card has no readable
title, no overlay is shown on the page; internally, missing title metadata caps
classification confidence at `low`.

## Weighted dictionaries

The expanded dictionaries live in [`dictionaries.js`](dictionaries.js). Each
category has 75-150 deterministic terms/phrases and local weights. Multi-word
phrases carry higher weight than single words.

| Category | Terms | Direction | Purpose |
| --- | ---: | --- | --- |
| `calm_positive` | 78 | positive | Relaxed, nature, animal, sleep, meditation, cozy, and ambience signals. |
| `educational_low_friction` | 88 | positive | Tutorials, courses, labs, Linux/RHCSA/Python/networking, and calm learning signals. |
| `high_friction` | 75 | negative | Panic, meltdown, exposed, shocking, revenge, chaos, and outrage signals. |
| `violence_disturbing` | 75 | negative | Attack, murder, shooting, war, graphic footage, and disturbing violence signals. |
| `tribal_domination` | 75 | negative | Owned/destroys/humiliates/takedown style domination framing. |
| `urgency_novelty` | 76 | negative | Breaking/urgent/watch-now/revealed/warning novelty pressure. |

Strong `violence_disturbing` or `tribal_domination` matches activate a hard
negative override so Chill Mode does not show a green label, even when weak calm
or long-form signals are also present.

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
matched category: calm_positive
+ calm signals: relaxing, peaceful (+2.4)
net score impact: +2.4

Confidence: medium
```

Higher-friction tooltip:

```text
DOOMSCROLL FUEL
Multiple escalation signals are present.

Why:
matched category: violence_disturbing
- disturbing/violence signals: attacked, horrifying, horrifying footage (-11.4)
- high-friction signals: panic (-2.4)
- strong negative category override prevents a green label
net score impact: -16.7

Confidence: high
```

## Internal terminology

Developer Mode preserves professional terminology for debugging and technical
review:

- `rawExtractedTitle`
- `matchedTerms`
- `internalCategoryWeights`
- `scoreImpact`
- `calmAlignment`
- `conflictIntensity`
- `cognitiveFriction`
- `signalConfidence`
- `volatilitySignals`
- `escalationSignals`
- `metadataConfidence`

These values are derived from the same local title keyword matches used by the
MVP classifier. No APIs, transcript fetching, embeddings, LLMs, backend
services, truth claims, or content blocking are used.

## Popup controls

- **Chill Mode**: show simple title-based overlays.
- **Bare Metal**: hide all PersonaLabs overlays.
- **Developer Mode**: show raw extracted title, matched terms, internal category
  weights, and professional signal names inside tooltips.

## Local validation

Run:

```sh
node extension/scoring-validation.js
```

The validation checks dictionary sizes, green outcomes for bunny/aquarium/nature
titles, non-green outcomes for attacked/horrifying/panic/humiliated/exposed
titles, and low confidence for missing title metadata.
