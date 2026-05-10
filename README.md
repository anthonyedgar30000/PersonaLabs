# PersonaLabs

PersonaLabs is an explainable media observability and intentionality alignment platform.

The system helps users inspect whether digital media environment signals align with their stated goals, modes, schedules, or values using explainable local telemetry and human-centered observability principles.

## Core Principles

- Flag, do not block
- User agency first
- Explainable AI outputs
- Human-in-the-loop control
- Calm, non-judgmental interaction design
- Privacy-aware architecture
- Media observability over coercive filtering
- Bare Metal mode always available

## MVP Goals

- Chrome extension overlay for YouTube
- Persona modes:
  - Study - Cybersecurity
  - Study - AI/ML
  - Study - Cloud/DevOps
  - Study - General
  - Chill
  - Research
  - Project
  - Bare Metal
- Color-coded alignment borders
- Lightweight telemetry signals
- Explainable scoring summaries
- Adaptive schedule renegotiation prompts

## Chrome Extension MVP

The current demo lives in [`extension/`](extension/). It is a local-only Chrome extension that detects YouTube video cards and applies green, yellow, or red borders from deterministic scoring heuristics. It now includes lightweight session observability, drift prompts, a schedule-ready local config, and Study - Cybersecurity, Study - AI/ML, Study - Cloud/DevOps, Study - General, Chill, Research, Project, and Bare Metal modes.

To try it:

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked** and choose the `extension` directory.
4. Visit YouTube and switch modes from the Persona Labs popup.

The extension stores mode, aggregate session telemetry, and schedule-ready configuration locally with `chrome.storage.local`. It has no backend, account system, cloud sync, or AI API integration.

The deterministic scoring architecture is documented in [`docs/source-framework.md`](docs/source-framework.md), including source concepts, heuristic media-signal categories, explanation requirements, and clinical/truth-judgment boundaries.

Study scoring is persona-specific: PersonaLabs evaluates alignment relative to a declared intent, not generic "good content."

Recent scoring refinements prioritize Emotional Volatility and framing signals over long-form duration, so extended commentary is not treated as low-conflict simply because it is long. Session Drift prompts are based on signal density and trajectory relative to the selected mode, not political alignment.

The latest scoring model is multi-axis: evidenceQuality, emotionalVolatility, educationalDepth, exploratoryValue, continuityAlignment, cognitiveLoad, and intentAlignment are inspected separately before a final border classification is shown.

PersonaLabs separates objective measurable media signals from user-defined subjective intent alignment. It estimates "how aligned this content is with my current declared persona," not whether content is true, moral, healthy, or allowed.

The extension also checks accessible thumbnail-related text where available. This is heuristic and local-only; OCR or multimodal thumbnail analysis is future roadmap work and is not part of the current MVP.

## Example Prompt

"Your recent browsing trajectory appears less aligned with Study Mode.
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
