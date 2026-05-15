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

## Lens-Aware Lexical Labeling

PersonaLabs includes a dependency-free JavaScript classifier for explainable
GREEN/YELLOW/RED labeling:

```js
import { labelContent } from "personalabs";

const result = labelContent({
  title: "Funny Rabbit Compilation",
  channel: "Cozy Bunny Shorts",
  lens: "calmer",
});

// result.label === "GREEN"
// result.domain === "ANIMAL_PET_NATURE"
// result.reasons explains the domain, lens, and matched terms.
```

For the CALMER/lower-friction lens, animal, pet, and nature content defaults to
GREEN when no distress or escalation terms are present. Engagement words such as
`funny`, `cute`, `compilation`, `eating`, `playing`, `baby`, `shorts`, and
`viral` are treated as harmless in that domain. Animal/pet/nature content only
becomes YELLOW for explicit chaotic-but-harmless terms such as `hyper`, `loud`,
`chaotic`, `prank`, `fail`, `screaming`, or `zoomies`, and RED for explicit
distress/danger terms such as `attack`, `injured`, `death`, `abuse`,
`emergency`, or `rescue crisis`.

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
