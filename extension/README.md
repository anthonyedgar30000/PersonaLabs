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

Rewards calming, low-conflict content such as bunny/nature/sleep ambience, aquarium videos, relaxing piano, soft music, meditation, lofi, gentle rain, forest/bird ambience, and casual recovery browsing.

Flags conflict-framed attention capture patterns: tribal/domination framing, owning/humiliation language, revenge/punishment framing, collapse/catastrophe framing, disturbing/violent subject matter, and high cognitive fragmentation. Smiles/playfulness signals are positive for Chill only when they are not paired with disturbing subject matter or domination framing. Low emotional tone is not treated as low emotional impact: a restrained title such as "Military strike hits convoy in Lebanon" can still reduce Chill alignment because the subject matter is psychologically heavy. Political or current-events content is not treated as inherently bad, but tribal domination framing, disturbing subject matter, rage framing, or fragmented live-update formats can outweigh long-form duration in Chill Mode.

### Project

Rewards build/debug/implementation language, technical terminology, project execution language, and practical how-to support.

Flags Shorts, unrelated entertainment, and manipulation/clickbait cues.

### Bare Metal

Hides overlays and suppresses drift prompts. It is always available.

## Scoring model

Scoring is deterministic and heuristic-based. Each card is first separated into deterministic signal layers, then weighted against the selected persona:

1. **Smiles / Playfulness Signals** - first-class positive signals such as smile, smiling, laughter, happy, joyful, playful, adorable, cute, fun, funny, wholesome, heartwarming, giggle, or LOL.
2. **Calm / Ambient Signals** - recovery-oriented signals such as bunny, aquarium, relaxing music, sleep ambience, nature, rain, birds, meditation, piano, ocean, waterfall, cozy, and lofi.
3. **Violence / Disturbing Subject Matter** - disturbing/heavy themes such as attacked, injured, execution, gore, explosion, burning alive, war footage, massacre, hostage, raid, war crime, murdered, bombing, slaughter, terror, brutality, violent, killed, airstrike, blood, crisis, stabbed, chaos, dead, military strike, graphic, disaster, beaten, or panic.
4. **Tribal Domination Framing** - conflict/dominance attention patterns such as owned, destroys, crushed, humiliates, wrecked, revenge, slams, annihilates, meltdown, collapse, disastrous, final note, bombshell, cringe, caught lying, takedown, epic fail, or backfires badly.
5. **Cognitive Load** - attentional complexity and fragmentation such as debate, analysis, politics, breaking news, investigation, controversy, live coverage, multi-topic, rapid updates, complex, technical, economic, policy, deep dive, or long form analysis.
6. **Persona Alignment** - persona-specific weighting over the observed layers and mode-positive signals.

Each card receives objective dimension scores, a persona-weighted intent alignment score, mode, classification, alignment signals, evidence signals, media environment signals, title/thumbnail/metadata provenance, confidence level, selected study persona where applicable, matched topic keywords, long-form and continuity bonuses, primary supporting/friction signals, and a short calm explanation.

Objective dimensions are measured independently from persona alignment:

- `emotionalVolatility`
- `emotionalTone`
- `smilesPlayfulness`
- `subjectMatterImpact`
- `tribalDomination`
- `calmAmbient`
- `driftRisk`
- `educationalDepth`
- `exploratoryValue`
- `continuityAlignment`
- `evidenceQuality`
- `cognitiveLoad`
- `intentAlignment`

Persona profiles weight those dimensions differently. For example, Study personas weight educational depth, continuity, and low emotional volatility; Research weights evidence quality and exploratory value; Chill strongly weights smiles/playfulness, calm ambient support, low disturbing subject matter, low tribal/domination framing, and low cognitive fragmentation. Bare Metal disables alignment scoring and overlays.

Example tooltip shape:

```text
AI/ML 84 - aligned
Media Observability Panel
intentAlignment: aligned
Final Alignment Score: 84
Selected study persona: Study - AI/ML
Matched topic keywords: llm, agents
Educational format signals: explained
Smiles / Playfulness Signals:
Smiles/playfulness support: Low (0/100)
Calm / Ambient Signals:
Calm ambient support: Low (0/100)
Violence / Disturbing Subject Matter:
Disturbing/heavy subject matter: Low (0/100)
Tribal Domination Framing:
Tribal/conflict framing: Low (0/100)
Cognitive Load:
Cognitive load / fragmentation: Low (15/100)
Persona Alignment:
Intent alignment: aligned (84/100)
Drift risk: Low (18/100)
Signals:
+ long-form analysis
+ evidence-oriented language
- no strong friction signals
evidenceQuality: High (82/100)
educationalDepth: High (76/100)
emotionalVolatility: Moderate (44/100)
smilesPlayfulness: Low (0/100)
subjectMatterImpact: Low (0/100)
tribalDomination: Low (0/100)
calmAmbient: Low (0/100)
driftRisk: Low (18/100)
noveltyPressure: Low (18/100)
cognitiveLoad: Low (15/100)
continuityAlignment: High (73/100)
exploratoryValue: Moderate (48/100)
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
Signal Provenance:
- title: "study"
- thumbnail OCR: "python", "api"
- duration: long-form (20m)
- channel metadata: none
- transcript: unavailable
Looks aligned with this mode. Study Mode is tuned for calm, long-form learning and technical depth.
```

Chill-specific friction example:

```text
Chill 42 - mixed
Media Observability Panel
Smiles / Playfulness Signals:
- no smiles/playfulness signals detected
Calm / Ambient Signals:
- no calm ambient signals detected
Violence / Disturbing Subject Matter:
- title disturbing subject matter: attacked, horrifying footage
Tribal Domination Framing:
- no tribal/conflict framing detected
Cognitive Load:
- low cognitive-fragmentation signals detected
Persona Alignment:
Drift risk: Moderate (52/100)
Explanation: Chill alignment reduced due to disturbing subject matter signals: attacked, horrifying footage.
```

If a thumbnail or title contains smiles/playfulness terms alongside violent subject matter, the positive affect layer is shown but does not turn the card green:

```text
Smiles / Playfulness Signals:
- thumbnail smiles/playfulness signals: smiling, happy
Violence / Disturbing Subject Matter:
- title disturbing subject matter: attacked, horrifying footage
Persona Alignment:
Explanation: Smiles/playfulness signals detected, but disturbing subject matter prevents green Chill alignment.
```

The model is intentionally transparent and limited. It does not diagnose, infer mental health state, or claim whether content is true. PersonaLabs models attentional friction and intentional alignment, not political correctness or objective truth.

The lexical dictionaries are heuristic signal categories, not clinical or truth judgments. See [`../docs/source-framework.md`](../docs/source-framework.md) for the source concepts, dictionary categories, explanation requirements, and governance boundaries.

The scoring architecture is multi-axis. Evidence Signals, Smiles / Playfulness Signals, Calm / Ambient Signals, Violence / Disturbing Subject Matter, Tribal Domination Framing, Novelty Pressure, Cognitive Load / Fragmentation, Intentionality Alignment, Drift Risk, and Exploratory Diversity are evaluated separately before the final border classification is assigned. This lets a high-evidence major world event remain valuable in Research mode even if it carries disturbing subject matter, while preventing restrained violent content or domination-framed commentary from being treated as Chill-aligned.

High volatility, low evidence, disturbing subject matter, tribal domination framing, and educational/opinion framing are separate dimensions. PersonaLabs does not treat emotional intensity as the same thing as low evidence, and it does not treat conflict, politics, military topics, or serious world events as inherently negative. The model estimates fit relative to a declared intent, not objective truth, morality, misinformation, political correctness, or viewpoint correctness.

PersonaLabs evaluates alignment relative to a specific declared intent, not generic "good content." An educational Kubernetes tutorial can be aligned with Study - Cloud/DevOps while being less aligned with Study - AI/ML or Study - Cybersecurity.

Personas are intended to be user-authored and editable as the product matures. The current MVP ships deterministic starter personas so the media observability loop is inspectable and demoable.

Long-form does not necessarily mean low-conflict. The scoring hierarchy prioritizes tribal/domination framing, disturbing subject matter, emotional volatility, and cognitive fragmentation before topic continuity, content type/Shorts signals, and duration bonuses. This keeps extended outrage/commentary videos from being treated as relaxing simply because they are long.

Border colors primarily reflect Intentionality Alignment. Red requires multiple strong negative dimensions, while yellow/orange indicate limited or mixed evidence where the user may want to inspect the panel.

Thumbnail text is a major attention-signal surface. The MVP analyzes accessible thumbnail-related text only: image alt text, ARIA labels, title attributes, nearby thumbnail container text, and card metadata. It does not perform OCR, image recognition, or multimodal analysis yet. If thumbnail text is unavailable, tooltips say: "Thumbnail text unavailable; score based on title/metadata only."

## Signal provenance and debug mode

Extraction is card-local. Title, thumbnail-accessible text, visible metadata, channel metadata, and duration are collected from the current card only. Channel metadata is shown separately and is not used as an inherited topic label.

Tooltip provenance lists exact matched terms by source:

- title
- thumbnail OCR/accessibility text
- duration
- channel metadata
- transcript
- browsing continuity/session

Developer debug mode can be toggled from the popup. It shows a local debug panel with raw extracted card fields, dimension scores, strongest contributors, matched dictionaries, and the final persona weighting path. This is local-only and intended for inspecting signal provenance.

The onboarding survey foundation stores local persona preferences for goals, learning domains, stress/drift triggers, desired exploration level, volatility tolerance, and preferred cognitive mode. These preferences are stored locally and provide the base for future user-authored/editable personas.

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

Drift detection is based on trajectory and signal density, not political alignment. Repeated high drift-risk signals during Chill Mode, including tribal/domination framing or disturbing subject matter, increase prompt likelihood even when videos are long-form.

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
- Run `node extension/scoring-validation.js` from the repository root to validate representative scoring cases for Chill ambience, calm educational content, violent/disturbing subject matter, tribal/domination framing, outrage thumbnails, analytical long-form content, and Research-mode conflict coverage.
