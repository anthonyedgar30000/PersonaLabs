# PersonaLabs Source Framework

PersonaLabs uses deterministic word and phrase analysis as a local, explainable media observability aid. The dictionaries are heuristic media-environment signal categories. They are not clinical instruments, truth classifiers, or claims about a user's character, intent, health, or beliefs.

This document records the source concepts that should guide the scoring architecture, UI behavior, documentation, and future governance reviews.

## Reference categories

### 1. NIST AI RMF / NIST AI Risk Management Framework

Relevant concepts:

- governance and accountability
- risk identification and risk management
- measurement and monitoring
- transparency and documentation
- trustworthy AI characteristics
- human oversight and contestability

How PersonaLabs applies these concepts:

- Keep deterministic scoring rules documented and inspectable.
- Treat scores as risk/fit estimates relative to a user-selected mode.
- Show observed positive and negative signals behind each score.
- Preserve user agency through override actions and Bare Metal mode.
- Avoid hidden cloud processing in the MVP.

### 2. Microsoft Human-AI Interaction Guidelines

Relevant concepts:

- make clear what the system can do
- make clear how well the system can do it
- support efficient invocation and dismissal
- show contextually relevant explanations
- support uncertainty handling
- allow graceful recovery and correction
- keep the user in control

How PersonaLabs applies these concepts:

- Use confidence labels and calm explanations.
- Let users switch modes, continue, snooze, or enter Bare Metal.
- Keep prompts non-blocking and recoverable.
- Explain scores with observed lexical/duration signals.
- Avoid overclaiming model ability.

### 3. Nielsen Norman Group usability and cognitive load principles

Relevant concepts:

- minimize cognitive load
- use clear status indicators
- avoid unnecessary interruption
- keep interfaces subtle and scannable
- support recognition over recall
- provide feedback without overwhelming the user

How PersonaLabs applies these concepts:

- Use simple green/yellow/red alignment states.
- Keep badges short and make details available through hover tooltips.
- Use a small drift prompt only after aggregate evidence accumulates.
- Avoid blocking, modal lock-in, repeated nagging, or shame language.

### 4. Medical and behavioral boundary guidance

PersonaLabs is not a medical, diagnostic, treatment, or clinical profiling tool.

Required boundaries:

- Do not diagnose, treat, or clinically profile users.
- Do not infer mental health conditions.
- Do not make addiction, attention, disorder, or pathology claims.
- Do not claim a user is irrational, manipulated, or unwell.
- Do not truth-police content or assert that a video is true or false.
- Support reflection, intentionality, and observability only.

Acceptable framing:

- "Your recent browsing trajectory appears less aligned with your declared Study mode."
- "Observed signals: Shorts format, clickbait wording, low evidence density."
- "Confidence: medium."
- "Want to continue, switch modes, enter Bare Metal, or snooze?"

Avoid:

- "This content is false."
- "You are addicted."
- "This proves you are distracted."
- "This is medically risky for you."

## Lexical scoring plan

Dictionary matches are local heuristic indicators. They are signals used to estimate alignment with the current mode. They are not truth claims, clinical judgments, or judgments about the user.

### Deterministic dictionary categories

1. **Educational / study-positive terms**
   - Examples: lecture, course, fundamentals, study, lesson, tutorial, walkthrough, guide.
   - Intended signal: content may support Study Mode.

2. **Technical / cyber / AI terms**
   - Examples: programming, python, api, database, security, machine learning, system design, linux.
   - Intended signal: content may support Study, Research, or Project modes when paired with educational or build context.

3. **Evidence and grounding terms**
   - Examples: evidence, data, report, source, case study, expert, paper, interview, analysis.
   - Intended signal: content may support Research Mode or reduce low-evidence concern.

4. **Calm / low-conflict terms**
   - Examples: calm, ambient, lofi, nature, meditation, cozy, cooking, travel.
   - Intended signal: content may support Chill Mode.

5. **Clickbait / urgency terms**
   - Examples: must watch, secret, shocking, breaking, urgent, you won't believe.
   - Intended signal: content may be optimized for urgency or impulse, depending on mode.

6. **Outrage / rage-bait terms**
   - Examples: exposed, destroyed, meltdown, slammed, they lied, humiliates, culture war.
   - Intended signal: content may be high-conflict or emotionally activating.

7. **Outrage escalation terms**
   - Examples: destroyed, annihilates, obliterated, crushed, panic mode, total disaster.
   - Intended signal: content may use escalating emotional conflict framing.

8. **Humiliation framing terms**
   - Examples: humiliated, humiliates, owned, shuts down, smoked, embarrassed.
   - Intended signal: content may be framed around interpersonal or tribal dominance.

9. **Tribal conflict language**
   - Examples: culture war, us vs them, enemy, traitor, mob, war on.
   - Intended signal: content may invite group conflict rather than low-conflict reflection.

10. **Panic/fear framing**
    - Examples: panic, freakout, disaster, catastrophe, crisis, losing their minds, complete shock.
    - Intended signal: content may be emotionally activating or fear-forward.

11. **Absolutist/emotional wording**
    - Examples: always, never, everyone, no one, totally, unbelievable, worst.
    - Intended signal: content may use strong certainty or emotional amplification.

12. **Novelty intensity language**
    - Examples: urgent, breaking, must watch, can't stop watching, everything is collapsing.
    - Intended signal: content may invite rapid checking, urgency, or escalating novelty.

13. **Speculation / low-evidence terms**
   - Examples: rumor, allegedly, theory, what if, could be, maybe, anonymous source.
   - Intended signal: content may need lower Research confidence unless grounded by evidence terms.

14. **Short-form / novelty-risk terms**
   - Examples: Shorts, TikTok, viral, compilation, top 10, random.
   - Intended signal: content may be rapid novelty or low-context browsing, especially in Study or Project modes.

## Scoring hierarchy

The deterministic architecture separates observable dimensions before assigning a final alignment classification:

1. Evidence Signals
   - source/reputation indicators
   - analytical terminology
   - citations/references
   - specificity
   - opposing viewpoints
   - low speculation framing
   - long-form analysis

2. Emotional Volatility
   - outrage language
   - humiliation framing
   - panic wording
   - emotionally amplified thumbnails

3. Novelty Pressure
   - breaking/urgent framing
   - must-watch-now language
   - shocking/rapid novelty cues

4. Cognitive Load / Fragmentation
   - Shorts
   - hyper-short clips
   - fragmented browsing behavior
   - high stimulation density

5. Intentional Alignment
   - fit relative to the current persona or mode

6. Exploratory Value
   - opposing viewpoints
   - analytical debate
   - critical discussion
   - broader perspective exploration

These dimensions prevent emotional intensity from being treated as identical to low evidence. A major geopolitical event can show high Evidence Signals, moderate Emotional Volatility, and high Research value. A clickbait segment can show low Evidence Signals, high Emotional Volatility, and high Novelty Pressure.

PersonaLabs separates objective measurable signals from user-defined subjective intent alignment. Objective dimensions describe observed properties of a card. `intentAlignment` estimates fit against the user's currently declared persona and its local dimension weights. This means the system estimates "how aligned this content is with my current intent," not whether the content is true, moral, healthy, or allowed.

High volatility, low evidence, and educational/opinion framing are separate dimensions. A high-volatility item may still have strong evidence quality. A low-volatility item may still be low evidence. Educational formatting is not the same as truth verification.

The deterministic hierarchy should generally prioritize:

1. emotional volatility / outrage framing
2. topic continuity
3. content type and Shorts/novelty risk
4. duration bonuses

Long-form does not necessarily mean low-conflict. A long video with dense outrage, humiliation, panic, or novelty-intensity language should score lower in Chill Mode than a shorter low-conflict video. Emotional volatility can outweigh duration when signals are severe, but high Evidence Signals can still support Research alignment.

Drift detection is based on trajectory and signal density, not political alignment. PersonaLabs should not classify conflict, politics, military topics, ideology, parties, or current-events categories as inherently good or bad. It should evaluate how the content is framed and only flag observed lexical and behavioral signals relative to the user's selected mode.

## Thumbnail signal layer

Thumbnail text is a major attention-signal surface on video platforms. For the current local MVP, PersonaLabs may analyze only accessible text tied to the card or thumbnail:

- image alt text
- ARIA labels
- title attributes
- nearby thumbnail container text
- accessible card metadata

This is not OCR and not image understanding. OCR, multimodal image analysis, or model-based thumbnail interpretation are future roadmap items that require separate governance review. The current implementation must not call external APIs or send thumbnail data off-device.

Thumbnail lexical signals are still heuristic indicators. Outrage, humiliation, panic, or novelty-intensity terms appearing in thumbnail-accessible text may carry higher weight because thumbnails are designed as rapid attention surfaces. This weighting must target emotional framing signals, not viewpoint, ideology, or political topic.

When thumbnail text is unavailable, scoring must continue using title and metadata. Explanations should explicitly say that thumbnail text was unavailable rather than failing or silently pretending it was analyzed.

## Score interpretation

Scores estimate alignment with the current user-selected mode:

- Green / aligned: Intentional Alignment is strong and negative dimensions are low.
- Yellow / neutral: observed signals are limited or weak.
- Orange / mixed: Evidence/Research value and friction signals coexist.
- Red / misaligned: multiple strong negative dimensions appear with weak Intentional Alignment.

Scores must not be presented as:

- content truth ratings
- health or diagnosis ratings
- moral judgments
- generic worth or value judgments
- claims about user intent

For Study modes, alignment is relative to the declared study persona. Educational content is not automatically aligned with every study goal. A Kubernetes YAML tutorial may align with Study - Cloud/DevOps, while an LLM agents explanation may align with Study - AI/ML and a SOC detection lab may align with Study - Cybersecurity.

## Explanation requirements

Every score should expose:

- score
- mode
- classification: aligned, neutral, mixed, or misaligned
- alignment signals
- evidence signals
- media environment signals
- Evidence Signals dimension
- emotional volatility estimate
- novelty pressure estimate
- cognitive load / fragmentation estimate
- exploratory value estimate
- title signals
- thumbnail signals
- metadata/duration signals
- selected study persona, when applicable
- matched topic keywords, when applicable
- educational format signals, when applicable
- long-form duration bonus
- topic continuity bonus
- strongest positive and negative contributors
- confidence level
- short calm explanation

Topic classification is not the same as framing analysis, cognitive environment analysis, evidence assessment, or intentional alignment. A video may discuss serious geopolitical, conflict, or military topics while still being analytically framed, lower volatility, long-form, educational, and appropriate for Research mode.

## Provenance and card-local isolation

Each video card must be analyzed independently. Signal extraction should be scoped to the current card/video only:

- title analysis: card-local title node and title ARIA text
- thumbnail OCR/accessibility text: current card thumbnail alt/title/ARIA/container text only
- visible metadata: current card metadata only
- channel metadata: current card channel/byline text only, explicitly marked as channel-level
- duration: current card duration overlay or accessible duration text
- transcript: unavailable until a future local/transcript pipeline exists
- browsing continuity/session: aggregate session telemetry, never copied into a card's topic labels

Avoid page-level keyword contamination, neighboring-card leakage, cached/shared card classifications, or implicit channel-wide topic inheritance. Channel metadata can be displayed as provenance, but it must not silently become a topic match unless explicitly modeled as channel-level evidence.

Tooltip and debug output should expose exact matched terms and their source. This is both an explainability feature and a debugging safeguard against topic leakage.

## Future thumbnail hooks

The thumbnail layer currently uses accessible text only; no OCR or image model is used. Future local/governed hooks may include:

- thumbnail OCR
- thumbnail emotional intensity analysis
- thumbnail typography analysis
- color saturation/emergency cue detection
- sensational framing detection
- excessive arrows/circles
- rage expressions

These signals should influence Emotional Volatility, Novelty Pressure, and Cognitive Load / Fragmentation. They should not directly determine Evidence Quality or topic value.

## Local survey/persona foundation

The popup includes a local survey foundation for:

- user goals
- preferred learning domains
- stress/drift triggers
- desired exploration level
- tolerance for volatility
- preferred cognitive mode

These preferences are stored locally and prepare for user-authored/editable personas. They should remain reversible, transparent, and inspectable.

## Media observability framing

PersonaLabs should feel closer to a media-bias or source-analysis panel than a behavioral correction system. It evaluates heuristic media-environment signals relative to a user-declared intent:

- Alignment Signals
- Evidence Signals
- Emotional Volatility
- Novelty Intensity
- Topic Continuity
- Session Drift
- Cognitive Load Indicators
- Intentionality Alignment
- Exploratory Research Signals
- Media Environment Signals

Personas are user-authored and should remain editable as the product matures. The system emphasizes observability over coercion: explain the signals, show uncertainty, preserve override controls, and keep Bare Metal available.

Explanations should use cautious language:

- "may"
- "appears"
- "observed signals"
- "relative to this mode"
- "confidence"

## User agency requirements

The interface must preserve:

- user override
- Continue current mode
- mode switching
- Snooze
- Bare Metal mode
- no blocking

Bare Metal must remain available as an explicit opt-out from overlays and prompts.

## Local-first implementation requirements

For the current MVP:

- no external API calls
- no backend
- no AI API calls
- no account system
- no telemetry upload
- deterministic scoring only
- storage limited to `chrome.storage.local`

Future AI or cloud features must be reviewed against this framework before implementation.
