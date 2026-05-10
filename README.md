# PersonaLabs

PersonaLabs is an explainable cognitive observability layer for low-volatility
intentional media consumption.

The MVP helps users notice when a browsing session appears to be drifting away
from a declared low-conflict, calming consumption intent. It does not decide
whether media is true, moral, politically correct, educational, or harmful. It
only estimates alignment with the user's stated desire for calmer media.

## MVP Focus: Chill Mode First

PersonaLabs is currently scoped to one primary mode:

**Chill Mode**: "I want this session to stay low-conflict, calming, and
emotionally stable."

The system observes titles, thumbnails, OCR text, and lightweight session
patterns, then explains whether the current media appears:

- calming
- low conflict
- mixed
- high volatility
- at risk of drift

Bare Metal mode remains available so users can disable scoring and prompts at
any time.

## Non-Goals

The MVP intentionally avoids broad subjective scoring domains that are difficult
to validate deterministically:

- research quality scoring
- evidence quality analysis
- study optimization
- educational depth scoring
- political interpretation
- misinformation detection
- morality judgments
- opposing-viewpoint recommendations
- AI/ML topic weighting
- complex persona onboarding

PersonaLabs should flag observable volatility signals, not evaluate worldview,
truth, virtue, or ideology.

## Core Principles

- Flag, do not block
- User agency first
- Explainable overlays and tooltip reasoning
- Deterministic heuristics before opaque models
- Local-first thumbnail, title, and OCR processing where possible
- Calm, non-judgmental interaction design
- Behavioral observability over coercive filtering
- Bare Metal mode always available

## Primary Scoring Dimensions

The MVP uses three explainable dimensions. Scores should be deterministic,
auditable, and traceable to concrete signals.

### 1. Emotional Volatility

Estimates whether media appears emotionally escalatory or conflict-oriented.

Signals that increase volatility:

- outrage wording
- escalation language
- panic framing
- humiliation, "exposed", or "destroyed" framing
- rage thumbnails
- conflict-oriented wording
- aggressive punctuation or sensational formatting

Example matched keywords:

- "destroyed"
- "exposed"
- "rage"
- "panic"
- "meltdown"
- "humiliated"
- "shocking"

### 2. Calm Alignment

Estimates whether media appears compatible with a low-conflict calming intent.

Signals that increase calm alignment:

- ambient music
- relaxation or sleep framing
- piano, lo-fi, meditation, or nature audio
- nature, animals, or gentle documentary framing
- long-form stable pacing
- low novelty pressure
- soothing imagery
- repetitive calming structure

Example matched keywords:

- "ambient"
- "relaxing"
- "piano"
- "meditation"
- "nature"
- "animals"
- "sleep"
- "calm"

### 3. Cognitive Fragmentation Risk

Estimates whether the session is likely to pull attention into rapid switching
or emotionally discontinuous browsing.

Signals that increase fragmentation risk:

- short rapid clips
- high switching pressure
- novelty spikes
- sensational formatting
- frequent emotional transitions
- repeated recommendations with urgent or clickbait phrasing

## UI Language

PersonaLabs avoids "good content" and "bad content" labels. The interface should
use descriptive, intent-relative language:

- High volatility
- Low conflict
- Calming
- Mixed
- Drift risk
- Strong chill-mode alignment
- Weak chill-mode alignment

## Explainable Overlay Behavior

The overlay should summarize the current item or session in terms of chill-mode
alignment:

- **Green / calm**: strong calming signals and low volatility
- **Yellow / mixed**: calming and volatility signals both present
- **Orange / drift risk**: fragmentation or novelty pressure is rising
- **Red / high volatility**: strong conflict, panic, rage, or humiliation signals
- **Bare Metal**: scoring and prompts disabled

Prompts should be gentle and reversible:

> This session is drifting toward emotionally volatile content.
> Would you like to stay in Chill Mode, switch to Bare Metal mode, or snooze
> prompts for 30 minutes?

## Tooltip Requirements

Each score must be explainable from observed evidence. Tooltips should show:

- strongest calming signals
- strongest volatility signals
- exact matched title keywords
- exact matched OCR keywords
- thumbnail emotional analysis
- why the score increased or decreased
- whether fragmentation risk came from short-form pacing, novelty pressure, or
  rapid emotional switching

Example tooltip:

```text
Chill-mode alignment: Mixed

Calming signals:
- Title matched "ambient" and "rain sounds"
- Thumbnail appears low motion and nature-oriented

Volatility signals:
- OCR matched "panic"
- Title uses urgent punctuation

Why this changed:
- Calm alignment increased from nature/audio signals.
- Emotional volatility increased from panic framing.
- Fragmentation risk stayed low because this is long-form media.
```

## MVP Test Cases

High alignment examples:

- ambient animal videos
- piano relaxation
- nature documentaries
- meditation channels
- long-form calm music

Low alignment examples:

- rage commentary
- outrage politics
- panic framing
- humiliation, "exposed", or "destroyed" thumbnails
- high-conflict clickbait

Validation goal:

> A user should visually understand: "This browsing session is drifting toward
> emotionally volatile content."

## Development Model

PersonaLabs is developed through governed AI-assisted iterative development.
Changes should preserve deterministic scoring, transparency, local-first
processing, user control, and Bare Metal mode.

Agent roles include:

- Product Architect
- Frontend Builder
- Scoring Heuristics Engineer
- Security/Governance Reviewer
- QA/Test Agent
- Documentation Agent

All AI-generated outputs require:

- feature validation
- governance review
- hallucination mitigation review
- human approval

## Vision

AI helping people notice when they are no longer browsing with the emotional
texture they intended.
