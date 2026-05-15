# PersonaLabs

PersonaLabs is a cognitive observability and intentionality support platform.

The system helps users notice when digital media consumption patterns drift away from their stated goals, modes, schedules, or values using explainable AI, behavioral telemetry, and human-centered observability principles.

## Core Principles

- Flag, do not block
- User agency first
- Explainable AI outputs
- Human-in-the-loop control
- Calm, non-judgmental interaction design
- Privacy-aware architecture
- Behavioral observability over coercive filtering
- Bare Metal mode always available

## MVP Goals

- Chrome extension overlay for YouTube
- Persona modes:
  - Study
  - Chill
  - Research
  - Bare Metal
- Color-coded alignment borders
- Lightweight telemetry signals
- Explainable scoring summaries
- Adaptive schedule renegotiation prompts

## Lens-Aware Deterministic Tone Labeling

PersonaLabs includes a dependency-free JavaScript classifier for explainable
GREEN/YELLOW/RED labeling. It evaluates how content is framed, not only which
keywords appear:

```js
import { labelContent } from "personalabs";

const result = labelContent({
  title: "Funny Rabbit Compilation",
  channel: "Cozy Bunny Shorts",
  lens: "calmer",
});

// result.label === "GREEN"
// result.domain === "ANIMAL_PET_NATURE"
// result.tone.calmToneScore, escalationToneScore, harmlessEnergyScore
// result.reasons explains the domain, baseline, tone, heuristics, and decision.
```

The deterministic tone layer combines:

- domain baseline weighting, such as strongly GREEN for animal/pet/nature and
  nature ambience, moderately GREEN for educational long-form, neutral for
  politics/news, and elevated scrutiny for outrage/drama
- calm tone signals, including `relaxing`, `peaceful`, `soothing`, `cozy`,
  `gentle`, `quiet`, `nature sounds`, `bonding`, `routine`, `study`,
  `explained`, and `walkthrough`
- escalation tone signals, including `you won't believe`, `insane`,
  `shocking`, `exposed`, `meltdown`, `disaster`, `panic`, `outrage`,
  `terrifying`, `urgent`, `massive problem`, and `emergency`
- harmless high-energy signals, including `funny`, `zoomies`, `playful`,
  `chaotic`, `silly`, `compilation`, `memes`, `excited`, `goofy`,
  `energetic`, and `hyper`
- transparent punctuation and pacing heuristics for all caps, exclamation
  count, punctuation density, urgency phrase density, title pacing, and
  repetition patterns

For the CALMER/lower-friction lens, animal, pet, and nature content keeps a
strong GREEN baseline unless explicit distress, danger, or escalation framing is
present. Harmless high-energy animal content can become YELLOW for pacing, not
because generic engagement is suppressed. RED remains reserved for explicit
distress/danger framing such as `attack`, `injured`, `death`, `abuse`,
`terrifying`, `emergency`, or `rescue crisis`.

## Example Prompt

"Looks like your activity drifted away from Study Mode.
Would you like to:
- Continue Study Mode
- Switch to Chill Mode
- Enter Bare Metal Mode
- Snooze prompts for 30 mins"

## Development Model

PersonaLabs is being developed using governed AI-assisted iterative development.

Agent roles include:
- Product Architect
- Frontend Builder
- AI Scoring Engineer
- Security/Governance Reviewer
- QA/Test Agent
- Documentation Agent

All AI-generated outputs require:
- feature validation
- governance review
- hallucination mitigation review
- human approval

## Vision

AI helping people notice when they are no longer acting intentionally.
# PersonaLabs

PersonaLabs is a cognitive observability and intentionality support platform.

The system helps users notice when digital media consumption patterns drift away from their stated goals, modes, schedules, or values using explainable AI, behavioral telemetry, and human-centered observability principles.

## Core Principles

- Flag, do not block
- User agency first
- Explainable AI outputs
- Human-in-the-loop control
- Calm, non-judgmental interaction design
- Privacy-aware architecture
- Behavioral observability over coercive filtering
- Bare Metal mode always available

## MVP Goals

- Chrome extension overlay for YouTube
- Persona modes:
  - Study
  - Chill
  - Research
  - Bare Metal
- Color-coded alignment borders
- Lightweight telemetry signals
- Explainable scoring summaries
- Adaptive schedule renegotiation prompts

## Example Prompt

"Looks like your activity drifted away from Study Mode.
Would you like to:
- Continue Study Mode
- Switch to Chill Mode
- Enter Bare Metal Mode
- Snooze prompts for 30 mins"

## Development Model

PersonaLabs is being developed using governed AI-assisted iterative development.

Agent roles include:
- Product Architect
- Frontend Builder
- AI Scoring Engineer
- Security/Governance Reviewer
- QA/Test Agent
- Documentation Agent

All AI-generated outputs require:
- feature validation
- governance review
- hallucination mitigation review
- human approval

## Vision

AI helping people notice when they are no longer acting intentionally.
