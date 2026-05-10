# Persona Labs Chrome Extension MVP

This is a local-only Manifest V3 Chrome extension demo for explainable media observability on YouTube. Persona Labs helps users inspect whether media environment signals align with a stated mode or intent. It flags; it does not block.

There is no AI service, backend, telemetry upload, account system, or network integration.

## Features

- Detects common YouTube video card renderers on Home, Search, channel grids, playlists, and sidebars.
- Applies mock Persona alignment signals with color-coded borders:
  - Green: aligned
  - Yellow: neutral
  - Orange: mixed-signal ambiguity
  - Red: misaligned
- Adds a signal badge to each decorated card with classification, confidence, media signals, and a hover observability panel.
- Uses deterministic, explainable scoring profiles for each mode.
- Tracks lightweight session aggregates locally in `chrome.storage.local`.
- Shows a small non-blocking session drift prompt when media-environment patterns appear less aligned with the active mode.
- Popup mode selector:
  - Study - Cybersecurity
  - Study - AI/ML
  - Study - Cloud/DevOps
  - Study - General
  - Chill
  - Research
  - Project
  - Bare Metal
- Stores the selected mode in `chrome.storage.local`.
- Bare Metal hides Persona styling and suppresses drift prompts without changing YouTube content.

## Product framing

Persona Labs is an explainable media observability layer, intentionality alignment assistant, and local cognitive telemetry system. The goal is not to judge content or determine truth. The goal is to make media-environment signals visible enough that users can choose whether to continue, change modes, or step out of overlays.

Tone principles:

- Calm, non-nagging prompts.
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
4. Switch between specific Study personas, Chill, Research, and Project to see cards rescored with different explanations.
5. Hover a badge to inspect positive signals, negative signals, confidence, and a short explanation.
6. Switch to Bare Metal to hide borders, badges, and prompts.

## Mode definitions

### Study - Cybersecurity

Rewards educational/study format plus cybersecurity topic terms such as SOC, SIEM, EDR, XDR, threat detection, incident response, malware, phishing, IAM, Zero Trust, CVE, MITRE, NIST, logging, authentication, authorization, OAuth, Entra, firewall, and network security.

### Study - AI/ML

Rewards educational/study format plus AI/ML topic terms such as AI, machine learning, LLMs, transformers, RAG, embeddings, vector databases, prompt engineering, agents, inference, training, evaluation, hallucination, alignment, Gemini, OpenAI, Claude, LangChain, and MCP.

### Study - Cloud/DevOps

Rewards educational/study format plus cloud/DevOps topic terms such as cloud, Azure, AWS, GCP, Kubernetes, Docker, Linux, Terraform, CI/CD, YAML, containers, networking, load balancers, observability, monitoring, logs, infrastructure, servers, and homelab.

### Study - General

Rewards general educational/study format such as tutorials, guides, courses, lectures, explanations, walkthroughs, lessons, fundamentals, introductions, overviews, documentation, examples, labs, and demos.

All Study personas flag Shorts, rage/clickbait/outrage wording, rapid novelty content, unrelated entertainment, and high emotional volatility. A video should score highest when it matches both the educational format and the selected study topic.

Study badge labels use compact persona names, for example `AI/ML 84`, `Cyber 78`, `Cloud 81`, or `General 65`.

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

- final alignment score
- mode
- classification: aligned, neutral, mixed, or misaligned
- Alignment Signals
- Evidence Signals
- Media Environment Signals
- Evidence
- Emotional Volatility
- Novelty Pressure
- Cognitive Load / Fragmentation
- Topic Continuity
- Exploratory Diversity
- confidence level
- `EMOTIONAL_VOLATILITY_SCORE`
- title signals
- thumbnail signals
- metadata/duration signals
- selected study persona
- matched topic keywords
- educational format signals
- long-form duration bonus
- topic continuity bonus
- primary supporting and friction signals
- short calm explanation

Example tooltip shape:

```text
AI/ML 84 - aligned
Media Observability Panel
Intentionality Alignment: aligned
Final Alignment Score: 84
Selected study persona: Study - AI/ML
Matched topic keywords: llm, agents
Educational format signals: explained
Signals:
+ long-form analysis
+ evidence-oriented language
- elevated emotional framing
Evidence: High (82/100)
Volatility: Moderate (44/100)
Novelty Pressure: Low (18/100)
Cognitive Load / Fragmentation: Low (15/100)
Continuity: High
Exploratory Diversity: Moderate (48/100)
Confidence: High
Primary supporting signal: long-form duration: 20+ minutes
Primary friction signal: no strong friction signals
Evidence Signals:
Title signals:
- educational/study-positive: study
Thumbnail signals:
- technical/cyber/AI: python, api
Metadata/duration signals:
- no metadata dictionary signals
Looks aligned with this mode. Study Mode is tuned for calm, long-form learning and technical depth.
```

The model is intentionally transparent and limited. It does not diagnose, infer mental health state, or claim whether content is true.

The lexical dictionaries are heuristic signal categories, not clinical or truth judgments. See [`../docs/source-framework.md`](../docs/source-framework.md) for the source concepts, dictionary categories, explanation requirements, and governance boundaries.

The scoring architecture is multi-axis. Evidence Signals, Emotional Volatility, Novelty Pressure, Cognitive Load / Fragmentation, Intentionality Alignment, and Exploratory Diversity are evaluated separately before the final border classification is assigned. This lets a high-evidence major world event remain valuable in Research mode even if it carries moderate emotional intensity.

PersonaLabs evaluates alignment relative to a specific declared intent, not generic "good content." An educational Kubernetes tutorial can be aligned with Study - Cloud/DevOps while being less aligned with Study - AI/ML or Study - Cybersecurity.

Personas are intended to be user-authored and editable as the product matures. The current MVP ships deterministic starter personas so the media observability loop is inspectable and demoable.

Long-form does not necessarily mean low-conflict. The scoring hierarchy prioritizes emotional volatility and outrage framing first, then topic continuity, content type/Shorts signals, and finally duration bonuses. This keeps extended outrage/commentary videos from being treated as relaxing simply because they are long.

Border colors primarily reflect Intentionality Alignment. Red requires multiple strong negative dimensions, while yellow/orange indicate limited or mixed evidence where the user may want to inspect the panel.

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

When the active mode accumulates enough session drift evidence, a small non-blocking prompt appears:

```text
Your recent browsing trajectory appears less aligned with your declared Research mode.
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
