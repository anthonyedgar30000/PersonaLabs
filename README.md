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

## Baseline-Safe Contextual Interpretation

PersonaLabs uses a deterministic contextual interpretation engine for
GREEN/YELLOW/RED labeling. It does not use embeddings, vector databases, LLM
APIs, external services, or opaque sentiment models.

The scoring principle is:

```text
default behavioral baseline + contextual escalation evidence = final color
```

Some content domains inherit calmness or low friction by default. They do not
need explicit calming words to earn GREEN; harmlessness itself is sufficient.

### Safe Baseline Domains

Strong matches for these domains default GREEN unless friction overrides them:

- `ANIMAL_PET_NATURE`
- `RELAXING_AMBIENT`
- `EDUCATIONAL_TUTORIAL`
- `DOCUMENTARY_LONGFORM`
- `HOBBY_CRAFTING`

### Escalation Overrides

Safe-baseline domains become YELLOW for mild friction such as mild controversy,
chaotic formatting, excessive stimulation, drama framing, loud/frenetic wording,
excessive clickbait, `crazy`, `wild`, `fails`, `meltdown`, `fight`, `panic`, or
`shocking`.

They become RED when severe distress or optimization terms appear, such as
`abuse`, `injury`, `blood`, `death`, `crisis`, `starvation`, `emergency`,
`danger`, fear escalation, ragebait, outrage optimization, or severe distress.

### Contextual Suppression

In `ANIMAL_PET_NATURE`, harmless energy is suppressed before final scoring:

- funny
- zoomies
- silly
- playful
- energetic behavior
- loud but harmless animal behavior
- clearly playful chaos such as "crazy puppy playing" or "funny cat fails"

This prevents harmless animal and pet content from being treated like political
outrage or crisis coverage.

### Weighting Hierarchy

The engine applies interpretation in this priority order:

1. Severe distress override
2. Domain interpretation
3. Contextual suppression
4. Emotional escalation
5. Tone analysis
6. Metadata modifiers

Domain meaning outweighs isolated keywords.

### Explainability

Every result exposes:

- detected domain
- baseline status
- escalation overrides
- suppression modifiers
- friction terms
- final score
- final color
- human-readable explanation

Example:

```js
import { labelContent } from "personalabs";

const result = labelContent({
  title: "Funny Puppy Zoomies",
  channel: "Dog Clips",
  lens: "calmer",
});

// result.finalColor === "GREEN"
// result.explanation ===
//   "Marked GREEN because harmless animal domain detected and contextual suppression removed harmless energy signals."
```

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
