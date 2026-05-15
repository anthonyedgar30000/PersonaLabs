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

## Source-Inspired Heuristic Engine

PersonaLabs includes a dependency-free JavaScript classifier for explainable
GREEN/YELLOW/RED labeling. It stays deterministic-first: no embeddings, vector
databases, LLM APIs, or opaque sentiment models.

```js
import { labelContent } from "personalabs";

const result = labelContent({
  title: "Public Radio Political Interview with Policy Context",
  channel: "NPR Politics",
  lens: "calmer",
});

// result.finalColor === "GREEN"
// result.detectedDomain.domain === "POLITICS_NEWS"
// result.toneSignals, sourceFormatSignals, escalationSignals, and reasons
// explain how the deterministic decision was made.
```

The engine evaluates how content is framed, not just which isolated words appear:

1. **Domain detection first**
   - animal/pet/nature
   - educational/tutorial
   - politics/news
   - drama/reaction
   - entertainment
   - music/ambient

2. **VADER-style tone heuristics**
   - ALL CAPS intensity
   - exclamation density
   - urgency phrases
   - intensifiers
   - emotionally loaded words
   - calm/regulating words

3. **Emotion categories**
   - calm/regulation
   - anger/outrage
   - fear/panic
   - joy/playfulness
   - trust/informational
   - disgust/shock
   - sadness/distress

4. **Source/format heuristics**
   - Lower-friction formats: public radio, PBS/NPR-style, university, lecture,
     documentary, interview, long-form discussion, tutorial
   - Higher-friction formats: reaction clips, rant, exposed, meltdown, breaking
     outrage, debate fight, drama compilation

5. **Lens-aware rules**
   - CALMER keeps animal/pet/nature content GREEN unless explicit distress or
     emergency terms are present.
   - EDUCATIONAL preserves the subject anchor and prefers explained, analysis,
     context, lecture, documentary, interview, and tutorial formats. Intense but
     explanatory content can remain strong YELLOW instead of being suppressed.

Every classification includes the detected domain, tone signals,
source/format signals, escalation signals, final color, and reason.

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
