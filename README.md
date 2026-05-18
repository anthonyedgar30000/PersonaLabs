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

## Framing Classification

The framing classification window starts in a neutral state until a user or
classifier selects a more specific framing. This keeps videos such as
"Infiltrating bank scammers" from receiving an implied frame before there is
evidence to support it. Trigger words can still be surfaced separately; for
example, "Infiltrating" is flagged as a trigger for the infiltrating
classification while the default selection remains neutral.

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
