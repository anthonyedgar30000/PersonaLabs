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

## Contextual Interpretation Engine

PersonaLabs uses a deterministic contextual interpretation engine for
GREEN/YELLOW/RED labeling. It does not use embeddings, vector databases, LLM
APIs, external services, or opaque sentiment models.

The engine interprets signals through context:

```text
signal + domain + context + format + intent lens = final interpretation
```

```js
import { labelContent } from "personalabs";

const result = labelContent({
  title: "Rabbit Zoomies in the Living Room",
  channel: "Cute Bunny Pets",
  lens: "calmer",
});

// result.finalColor === "GREEN"
// result.explanation ===
//   "Marked GREEN because harmless animal domain suppressed chaos signals."
```

### Layers

1. **Domain detection**
   - `ANIMAL_PET_NATURE`
   - `EDUCATIONAL`
   - `POLITICS_NEWS`
   - `DRAMA_REACTION`
   - `MUSIC_AMBIENT`
   - `COMEDY`
   - `DOCUMENTARY`
   - `GAMING`
   - `TUTORIAL`

   Detection uses title, channel name, metadata, playlist, tag, and category
   clues.

2. **Global signal detection**
   - outrage
   - urgency
   - fear
   - anger
   - intensity
   - chaos
   - calm
   - trust
   - educational framing
   - playful/funny tone

3. **Contextual escalation suppression**

   Animal/pet/nature content suppresses harmless chaos signals such as
   `chaos`, `loud`, `screaming`, `zoomies`, `funny`, `dramatic`, `wild`, and
   `crazy` unless severe distress terms are present, including `abuse`,
   `injury`, `blood`, `death`, `rescue crisis`, `starving`, or `emergency`.

4. **Format interpretation**

   Lower-friction formats reduce escalation:
   - documentary
   - interview
   - lecture
   - tutorial
   - public radio style
   - long-form discussion
   - educational analysis

   Higher-friction formats increase escalation:
   - reaction clips
   - ragebait formatting
   - drama thumbnails
   - meltdown
   - destroyed
   - humiliated
   - outrage optimization patterns

5. **Intent lens weighting**

   - `CALMER` prioritizes emotional regulation, suppresses harmless chaos,
     boosts ambient/calm/playful content, and heavily penalizes outrage
     optimization.
   - `EDUCATIONAL` allows difficult topics when they are explanatory or
     contextual, prioritizing depth, context, and explanation.
   - `BARE_METAL` minimizes interpretation and mostly reports metadata-derived
     context.

Every result exposes the detected domain, tone signals, escalation signals,
suppression modifiers, lens modifiers, final score, final color, and
human-readable explanation.

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
