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

4. **Emotional tone / rage-escalation terms**
   - Examples: insane, destroyed, humiliated, meltdown, panic, shocking, exposed, cringe, evil, lies, outrage, furious, obliterated, disaster, owned.
   - Intended signal: content may use ragebait, escalation, dominance, or high-arousal framing.

5. **Disturbing / violent subject matter terms**
   - Examples: attacked, injured, execution, gore, explosion, burning alive, assault, war footage, horrifying footage, massacre, hostage, raid, war crime, murdered, bombing, slaughter, terror, brutality, violent, killed, airstrike, blood, crisis, stabbed, chaos, dead, military strike, graphic, disaster, beaten, panic.
   - Intended signal: content may carry psychologically heavy or disturbing subject matter even when the tone is restrained.

6. **Calm ambient terms**
   - Examples: relaxing, nature, gentle, soft music, peaceful, ambience, sleep, calming, meditation, forest, rain, birds, aquarium, bunny, cat tv, dog tv, piano, ocean, waterfall, cozy, lofi, healing, mindful.
   - Intended signal: content may support Chill Mode recovery, low-friction ambience, or stable calming attention.

7. **Smiles / playfulness terms**
   - Examples: smile, smiles, smiling, laughter, laughing, happy, joyful, playful, adorable, cute, fun, funny, wholesome, heartwarming, giggle, LOL.
   - Intended signal: content may carry positive affect or playful low-friction cues that support Chill Mode when not paired with disturbing subject matter or domination framing.

8. **Cognitive load terms**
   - Examples: debate, analysis, politics, breaking news, investigation, controversy, drama, reaction, argument, live coverage, multi-topic, rapid updates, complex, technical, economic, policy, deep dive, long form analysis.
   - Intended signal: content may increase mental processing burden, switching cost, or attentional fragmentation.

9. **Tribal domination framing terms**
   - Examples: owned, destroyed, humiliated, revenge, meltdown, obliterated, crushed, wrecked, slams, annihilates, exposed, collapse, disastrous, panic, losing minds, unhinged, final note, bombshell, cringe, fails badly, disaster, destroys, embarrassed, caught lying, takedown, rage, epic fail, backfires badly.
   - Intended signal: content may use conflict-framed attention capture patterns such as enemies vs allies, winners vs losers, humiliation vs dominance, revenge vs punishment, or collapse vs catastrophe.

10. **Calm / low-conflict terms**
   - Examples: calm, ambient, lofi, nature, meditation, cozy, cooking, travel.
   - Intended signal: content may support Chill Mode.

11. **Clickbait / urgency terms**
   - Examples: must watch, secret, shocking, breaking, urgent, you won't believe.
   - Intended signal: content may be optimized for urgency or impulse, depending on mode.

12. **Outrage / rage-bait terms**
   - Examples: exposed, destroyed, meltdown, slammed, they lied, humiliates, culture war.
   - Intended signal: content may be high-conflict or emotionally activating.

13. **Outrage escalation terms**
   - Examples: destroyed, annihilates, obliterated, crushed, panic mode, total disaster.
   - Intended signal: content may use escalating emotional conflict framing.

14. **Humiliation framing terms**
   - Examples: humiliated, humiliates, owned, shuts down, smoked, embarrassed.
   - Intended signal: content may be framed around interpersonal or tribal dominance.

15. **Tribal conflict language**
   - Examples: culture war, us vs them, enemy, traitor, mob, war on.
   - Intended signal: content may invite group conflict rather than low-conflict reflection.

16. **Panic/fear framing**
    - Examples: panic, freakout, disaster, catastrophe, crisis, losing their minds, complete shock.
    - Intended signal: content may be emotionally activating or fear-forward.

17. **Absolutist/emotional wording**
    - Examples: always, never, everyone, no one, totally, unbelievable, worst.
    - Intended signal: content may use strong certainty or emotional amplification.

18. **Novelty intensity language**
    - Examples: urgent, breaking, must watch, can't stop watching, everything is collapsing.
    - Intended signal: content may invite rapid checking, urgency, or escalating novelty.

19. **Speculation / low-evidence terms**
   - Examples: rumor, allegedly, theory, what if, could be, maybe, anonymous source.
   - Intended signal: content may need lower Research confidence unless grounded by evidence terms.

20. **Short-form / novelty-risk terms**
   - Examples: Shorts, TikTok, viral, compilation, top 10, random.
   - Intended signal: content may be rapid novelty or low-context browsing, especially in Study or Project modes.

## Scoring hierarchy

The deterministic architecture separates observable dimensions before assigning a final alignment classification:

1. Smiles / Playfulness Signals
   - smiles, laughter, playful expressions, warm visual/text cues
   - positive affect for Chill Mode
   - never overrides disturbing subject matter or domination framing

2. Calm / Ambient Signals
   - nature/sleep/music ambience
   - gentle animal/aquarium content
   - low-friction recovery signals

3. Violence / Disturbing Subject Matter
   - violent or disturbing event terms
   - crisis/heavy themes
   - psychologically intense subjects
   - restrained-language descriptions of violence

4. Tribal Domination Framing
   - enemies vs allies framing
   - winners vs losers framing
   - humiliation vs dominance framing
   - revenge/punishment framing
   - collapse/catastrophe framing

5. Cognitive Load
   - debate/argument framing
   - live coverage and rapid updates
   - multi-topic formats
   - short-form or highly fragmented formats

6. Evidence Signals
   - source/reputation indicators
   - analytical terminology
   - citations/references
   - specificity
   - opposing viewpoints
   - low speculation framing
   - long-form analysis

7. Novelty Pressure
   - breaking/urgent framing
   - must-watch-now language
   - shocking/rapid novelty cues

8. Intentional Alignment
   - fit relative to the current persona or mode

9. Drift Risk
   - aggregate friction from tribal domination, disturbing subject matter, emotional volatility, novelty pressure, and cognitive load
   - used for local trajectory prompts, never blocking

10. Exploratory Value
   - opposing viewpoints
   - analytical debate
   - critical discussion
   - broader perspective exploration

These dimensions prevent speaking style, playful affect, subject matter, domination framing, and low evidence from being collapsed into one score. A major geopolitical event can show high Evidence Signals, low rage framing, high disturbing subject matter, and high Research value. A conflict-framed commentary item can show low disturbing subject matter but high Tribal Domination Framing and high Drift Risk. A smiling or playful thumbnail can support Chill only when it is not attached to violent/disturbing content.

PersonaLabs separates objective measurable signals from user-defined subjective intent alignment. Objective dimensions describe observed properties of a card. `intentAlignment` estimates fit against the user's currently declared persona and its local dimension weights. This means the system estimates "how aligned this content is with my current intent," not whether the content is true, moral, healthy, politically correct, misinformation, or allowed. PersonaLabs models attentional friction and intentional alignment, not political correctness or objective truth.

`SIGNAL_RICHNESS_SCORE` estimates observability quality before explanations are interpreted. It is not an alignment score. It describes whether the local card has enough reliable observable metadata to support a confident explanation.

Inputs may include:

- transcript availability and completeness
- thumbnail OCR/accessibility text confidence
- descriptive title quality
- structured metadata completeness
- category clarity
- duration stability
- semantic consistency across signals
- thumbnail readability
- title specificity
- signal convergence across title, thumbnail, metadata, and transcript sources

Weak signal richness lowers confidence so classifications do not appear overly authoritative. Strong signal convergence can raise confidence even when the final alignment is mixed or misaligned.

High volatility, playful affect, disturbing subject matter, tribal domination framing, low evidence, and educational/opinion framing are separate dimensions. A high-volatility item may still have strong evidence quality. A low-volatility item may still discuss violent or disturbing subject matter. A calm speaker may still frame reality as enemies vs allies, winners vs losers, humiliation vs dominance, revenge vs punishment, or collapse vs catastrophe. Smiles or playful text do not sanitize disturbing subject matter. Educational formatting is not the same as truth verification.

The deterministic hierarchy should generally prioritize:

1. tribal domination / conflict framing
2. disturbing subject matter
3. emotional volatility
4. cognitive load / fragmentation
5. topic continuity
6. content type and Shorts/novelty risk
7. smiles/playfulness and calm ambience bonuses
8. duration bonuses

Long-form does not necessarily mean low-conflict. A long video with dense domination framing, outrage, humiliation, panic, novelty-intensity language, disturbing subject matter, or rapid-update complexity should score lower in Chill Mode than a shorter low-conflict video. Tribal domination framing, disturbing subject matter, emotional volatility, and cognitive load can outweigh smiles/playfulness, calm ambience, and duration when signals are severe, but high Evidence Signals can still support Research alignment.

Drift detection is based on trajectory and signal density, not political alignment. PersonaLabs should not classify conflict, politics, military topics, ideology, parties, or current-events categories as inherently good or bad. It should evaluate observed tribal/domination framing, subject matter, cognitive-load, and behavioral signals relative to the user's selected mode.

## Thumbnail signal layer

Thumbnail text is a major attention-signal surface on video platforms. For the current local MVP, PersonaLabs may analyze only accessible text tied to the card or thumbnail:

- image alt text
- ARIA labels
- title attributes
- nearby thumbnail container text
- accessible card metadata

This is not OCR and not image understanding. OCR, multimodal image analysis, or model-based thumbnail interpretation are future roadmap items that require separate governance review. The current implementation must not call external APIs or send thumbnail data off-device.

Thumbnail lexical signals are still heuristic indicators. Outrage, humiliation, domination, revenge, panic, or novelty-intensity terms appearing in thumbnail-accessible text may carry higher weight because thumbnails are designed as rapid attention surfaces. This weighting must target attention-capture framing signals, not viewpoint, ideology, or political topic.

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
- Signal Richness: High / Medium / Low
- Transcript availability
- Thumbnail OCR confidence
- Metadata completeness
- Signal convergence estimate
- Smiles / Playfulness signals
- Calm / Ambient signals
- Violence / Disturbing Subject Matter signals
- Tribal Domination Framing signals
- Cognitive Load signals
- Persona Alignment notes
- alignment signals
- evidence signals
- media environment signals
- Evidence Signals dimension
- `SIGNAL_RICHNESS_SCORE`
- emotional tone / rage-framing estimate
- disturbing subject matter estimate
- tribal domination framing estimate
- drift risk estimate
- novelty pressure estimate
- cognitive load / fragmentation estimate
- smiles/playfulness support estimate
- calm ambient support estimate
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

Topic classification is not the same as framing analysis, subject-matter heaviness, cognitive environment analysis, evidence assessment, or intentional alignment. A video may discuss serious geopolitical, conflict, or military topics while still being analytically framed, lower rage, long-form, educational, and appropriate for Research mode. The same restrained subject matter may be less aligned with Chill Mode because low emotional tone does not imply low emotional impact.

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

These signals should influence Smiles / Playfulness, Tribal Domination Framing, Emotional Volatility, Novelty Pressure, Drift Risk, and Cognitive Load / Fragmentation. They should not directly determine Evidence Quality or topic value.

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
