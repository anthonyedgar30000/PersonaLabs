# Persona Labs Chrome Extension MVP

This is a local-only Manifest V3 Chrome extension demo for explainable cognitive observability on YouTube. Persona Labs helps users notice when media browsing patterns may be drifting away from a stated mode or intent. It flags; it does not block.

There is no AI service, backend, telemetry upload, account system, or network integration.

## Features

- Detects common YouTube video card renderers on Home, Search, channel grids, playlists, and sidebars.
- Applies mock Persona alignment scores with color-coded borders:
  - Green: aligned
  - Yellow: neutral
  - Red: misaligned
- Adds a score badge to each decorated card with classification, confidence, top scoring reasons, and a hover tooltip.
- Uses deterministic, explainable scoring profiles for each mode.
- Tracks lightweight session aggregates locally in `chrome.storage.local`.
- Shows a small non-blocking drift prompt when session patterns appear misaligned with the active mode.
- Popup mode selector:
  - Study
  - Chill
  - Research
  - Project
  - Bare Metal
- Stores the selected mode in `chrome.storage.local`.
- Bare Metal hides Persona styling and suppresses drift prompts without changing YouTube content.

## Product framing

Persona Labs is a cognitive observability and intentionality support layer. The goal is not to judge content or determine truth. The goal is to make browsing patterns visible enough that users can choose whether to continue, change modes, or step out of overlays.

Tone principles:

- Calm buddy-tone prompts.
- No shaming or nagging.
- User agency first.
- Explain all scores.
- Flag, do not block.

## Local install

1. Open Chrome and go to `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select this repository's `extension` directory.
5. Open `https://www.youtube.com`.

## Demo flow

1. Load the extension unpacked.
2. Visit YouTube Home or Search.
3. Open the Persona Labs extension popup.
4. Switch between Study, Chill, Research, and Project to see cards rescored with different explanations.
5. Hover a badge to inspect positive signals, negative signals, confidence, and a short explanation.
6. Switch to Bare Metal to hide borders, badges, and prompts.

## Mode definitions

### Study

Rewards long-form technical or educational content, tutorial/guide/walkthrough language, coherent topic learning, low emotional volatility, and technical terminology.

Flags Shorts, rage/clickbait/outrage wording, rapid novelty content, unrelated entertainment, and high emotional volatility.

### Research

Allows opposing viewpoints, high-complexity topics, and news/current events. It rewards evidence/source density, analysis, interviews, reports, and enough duration for context.

Flags rage framing, low evidence density for complex/current topics, Shorts format, and emotional manipulation cues.

### Chill

Rewards calming, low-conflict content such as music, nature, cozy/light entertainment, travel, and casual recovery browsing.

Flags outrage-heavy framing, conflict-heavy titles, panic/fear language, humiliation framing, and high-emotion wording. Political or current-events content is not treated as inherently bad, but high emotional volatility can outweigh long-form duration in Chill Mode.

### Project

Rewards build/debug/implementation language, technical terminology, project execution language, and practical how-to support.

Flags Shorts, unrelated entertainment, and manipulation/clickbait cues.

### Bare Metal

Hides overlays and suppresses drift prompts. It is always available.

## Scoring model

Scoring is deterministic and heuristic-based. Each card receives:

- score
- mode
- classification: aligned, neutral, or misaligned
- top positive signals
- top negative signals
- confidence level
- `EMOTIONAL_VOLATILITY_SCORE`
- title signals
- thumbnail signals
- metadata/duration signals
- long-form duration bonus
- topic continuity bonus
- strongest positive and negative contributors
- short buddy-tone explanation

Example tooltip shape:

```text
Study 84 - aligned
Confidence: high
EMOTIONAL_VOLATILITY_SCORE: 0/100
Long-form bonus: +14
Continuity bonus: +8
Strongest positive contributor: long-form duration: 20+ minutes
Strongest negative contributor: no strong negative signals
Title signals:
- educational/study-positive: study
Thumbnail signals:
- technical/cyber/AI: python, api
Metadata/duration signals:
- no metadata dictionary signals
Top positive signals:
+ long-form duration: 20+ minutes
+ technical terminology: python, api
Top negative signals:
- no strong negative signals
Looks aligned with this mode. Study Mode is tuned for calm, long-form learning and technical depth.
```

The model is intentionally transparent and limited. It does not diagnose, infer mental health state, or claim whether content is true.

The lexical dictionaries are heuristic signal categories, not clinical or truth judgments. See [`../docs/source-framework.md`](../docs/source-framework.md) for the source concepts, dictionary categories, explanation requirements, and governance boundaries.

Long-form does not necessarily mean low-conflict. The scoring hierarchy prioritizes emotional volatility and outrage framing first, then topic continuity, content type/Shorts signals, and finally duration bonuses. This keeps extended outrage/commentary videos from being treated as relaxing simply because they are long.

Thumbnail text is a major attention-signal surface. The MVP analyzes accessible thumbnail-related text only: image alt text, ARIA labels, title attributes, nearby thumbnail container text, and card metadata. It does not perform OCR, image recognition, or multimodal analysis yet. If thumbnail text is unavailable, tooltips say: "Thumbnail text unavailable; score based on title/metadata only."

## Drift detection logic

The extension keeps aggregate counters for the current local session:

- session start time
- video cards scanned
- Shorts detected
- misaligned items scanned
- misaligned items visible
- rapid switching estimate from YouTube navigation events
- mode changes
- aligned/neutral/misaligned counts
- per-mode versions of the same counters

When the active mode accumulates enough evidence of drift, a small non-blocking prompt appears:

```text
Looks like your activity may be drifting away from Study Mode.
Want to continue, switch modes, enter Bare Metal, or snooze?
```

Prompt actions:

- Continue current mode
- Switch to Chill
- Switch to Research
- Enter Bare Metal
- Snooze 30 min

The prompt never blocks content. Continue/dismiss briefly quiets the prompt; Snooze quiets it for 30 minutes.

Drift detection is based on trajectory and signal density, not political alignment. Repeated high-volatility signals during Chill Mode increase prompt likelihood even when videos are long-form.

## Schedule-ready structure

The extension seeds a `personaLabsScheduleConfig` object in `chrome.storage.local` so future work can connect modes to calendar-like windows without adding an integration yet.

The current structure includes configurable windows for:

- work hours
- study/project time
- family time
- chill time
- recovery time
- intentional news window

No calendar data is imported or synced.

## Privacy and storage

All state is stored with `chrome.storage.local`:

- `personaLabsMode`
- `personaLabsSessionTelemetry`
- `personaLabsScheduleConfig`

The MVP stores aggregate counters and mode configuration only. It does not use a backend, cloud sync, external APIs, AI API calls, account identity, or telemetry upload.

## Governance constraints

- Flag, do not block.
- User override always.
- Bare Metal always available.
- No medical diagnosis.
- No truth-policing claims.
- Explain all scores.
- Avoid nagging or shaming tone.
- Local-first storage.
- No cloud/API integration yet.

The scoring architecture is grounded in the repository source framework: NIST AI RMF concepts for governance and trustworthy measurement, Microsoft Human-AI Interaction Guidelines for user control and uncertainty handling, Nielsen Norman Group usability/cognitive load principles for subtle UI, and explicit medical/behavioral boundaries.

## Capstone relevance

This MVP demonstrates a small but complete human-centered observability loop:

1. stated user mode
2. explainable local scoring
3. lightweight local telemetry
4. drift detection
5. calm user choice
6. documented governance boundaries

## Implementation notes

- `content.js` owns all card detection and mock scoring.
- `content.css` owns card borders, badges, and drift prompt styling.
- `popup.html`, `popup.css`, and `popup.js` own mode selection.
- All scoring is deterministic and explainable.
- Long-form technical tutorials should normally land in the aligned range in Study Mode unless Shorts, clickbait, or high-emotion penalties apply.
