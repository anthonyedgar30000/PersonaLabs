# PersonaLabs

PersonaLabs is an observability-driven semantic navigation layer for YouTube
exploration.

The system helps users preserve topic and event continuity while changing the style
of exploration. It is designed to feel like: "I am exploring this topic
intentionally" instead of "I am trapped inside a recommendation funnel."

PersonaLabs does not determine truth, rank ideology, censor content, or replace
YouTube. It gives users transparent, local-first tools for generating calmer and
more explanatory paths from a selected contextual anchor.

## Core Principles

- Flag, do not block
- User agency first
- Deterministic-first scoring and transformations
- Local-first runtime with no cloud AI APIs
- Explainable outputs and transparent scoring summaries
- Calm, non-judgmental interaction design
- Privacy-aware architecture
- Behavioral observability over coercive filtering
- Score first; filter second
- Bare Metal mode always available

## Current Chrome Extension UX

1. The user clicks a YouTube video or card.
2. The clicked item becomes the contextual anchor.
3. PersonaLabs extracts:
   - core entities
   - event/topic anchors
   - subject nouns
   - named people, organizations, and events
4. PersonaLabs detects style signals:
   - escalation language
   - outrage framing
   - domination framing
   - clickbait signals
   - educational signals
   - calm/low-friction signals
5. PersonaLabs creates subject-preserving transformed searches:
   - Like this, but calmer
   - Like this, but educational
   - Like this, but deeper
   - Like this, but beginner-friendly
   - Like this, but longer-form

The transformed query preserves the original topic, event, people, and entities.
Only the exploration style changes.

Example:

```text
Original: BREAKING: Thomas Massie DESTROYS Iran vote
Good:     Thomas Massie Iran vote explained educational analysis
Bad:      educational politics video
```

## Persistent Side Panel

The content script renders a persistent PersonaLabs control panel on YouTube. It
shows:

- selected contextual anchor
- original title
- extracted subject anchor
- removed escalation terms
- transformed exploration query
- selected exploration lens
- Suggested Exploration Paths after a transformed search is opened

The exploration buttons generate and open transformed YouTube searches while
preserving event continuity:

- calmer
- educational
- deeper dive
- beginner friendly
- longer-form

## Exploration Result Filtering

After a transformed search is opened, PersonaLabs scans visible YouTube results and
scores the returned videos/channels with deterministic logic. The selected
exploration lens controls filtering/routing behavior.

Pipeline:

1. Generate transformed search
2. Scan visible results
3. Score results
4. Apply exploration lens filtering
5. Display the intentional exploration set

It prioritizes:

- topic relevance
- educational framing
- lower sensational wording
- explanatory terminology
- longer-form structure

It deprioritizes:

- outrage framing
- excessive capitalization
- ragebait
- domination language
- panic/escalation wording

### Lens Filtering Rules

The color system has operational meaning:

- GREEN: safe candidate for calmer/lower-friction exploration
- YELLOW: mixed but potentially useful for educational/deeper exploration
- RED: high-friction/escalatory

Lens behavior:

- CALMER: only GREEN videos allowed
- LOWER FRICTION: only GREEN videos allowed
- EDUCATIONAL: GREEN prioritized; strong explanatory YELLOW allowed
- DEEPER DIVE: GREEN plus high-quality relevant YELLOW
- BEGINNER FRIENDLY: GREEN plus simple explanatory YELLOW
- LONGER-FORM: GREEN plus relevant long-form YELLOW

Suggested results include the title, channel, classification color, score, and
plain-language explanations such as:

- lower-friction language
- explanatory framing
- long-form discussion
- topic continuity preserved
- educational terminology detected

## Overlay Badges

PersonaLabs badges are contextual observability signals. They do not block,
approve, censor, or fact-check videos. They help users notice when a visible card
contains escalation language, which GREEN/YELLOW/RED class a result falls into,
and how strongly a result fits the active contextual anchor.

## Architecture

```text
manifest.json
src/
  semantic-core.js   Deterministic extraction, transformation, and scoring
  content.js         YouTube anchor capture, side panel, result scanning
  content.css        Panel and badge styling
test/
  semantic-core.test.js
```

The semantic core is dependency-free and can run in both the browser content
script and Node tests. It does not use cloud APIs, LLM calls, embeddings, vector
databases, autonomous AI ranking systems, opaque recommendation systems, or
network calls.

## Development

Run syntax checks:

```bash
npm run check
```

Run tests:

```bash
npm test
```

Load the extension locally:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Select "Load unpacked".
4. Choose this repository directory.
5. Visit YouTube and click a video/card to create a contextual anchor.

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
