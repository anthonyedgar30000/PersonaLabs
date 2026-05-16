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

## Structured Retrieval and Result Filtering

After a transformed search is opened, PersonaLabs runs a retrieval pipeline that
returns structured video metadata, scores the returned videos/channels with
deterministic logic, and applies the selected exploration lens.

The current browser extension still includes a temporary visible-page metadata
provider so the UI works before a YouTube Data API key/configuration exists. The
ranking architecture no longer depends on content-script scoring of scraped DOM
nodes; the DOM adapter is isolated behind the Retrieval Layer and can be replaced
by YouTube Data API retrieval.

Pipeline:

1. Contextual anchor
2. Transformation query generation
3. Structured metadata retrieval
4. Deterministic observability scoring
5. Lens-aware reranking/filtering
6. Intentional exploration presentation

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

The color system summarizes title framing only:

- GREEN: calm or straightforward title framing
- YELLOW: mixed or unclear title framing
- RED: intense or attention-grabbing title framing

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
  semantic-core.js        Anchor extraction, observability signals, deterministic scoring
  retrieval-pipeline.js  Retrieval/query/scoring/ranking interfaces
  content.js             YouTube anchor selector and presentation layer
  content.css            Panel, badge, and overlay styling
lib/
  headlineAnalyzer.js    Deterministic Chill-mode headline label engine
  headlineAnalyzer.ts    TypeScript-facing export surface for analyzeHeadline
test/
  headline-analyzer.test.js
  semantic-core.test.js
  retrieval-pipeline.test.js
```

Layer boundaries:

- Retrieval Layer: structured metadata retrieval via mock providers, temporary
  visible-page metadata provider, and a YouTube Data API provider interface.
- Observability Layer: deterministic scoring, emotional compression/framing
  analysis, escalation/clickbait detection, educational density, calmness, and
  long-form signals.
- Transformation Layer: subject-preserving "this but calmer/educational/deeper"
  query generation.
- Ranking Layer: GREEN/YELLOW/RED reranking and lens-aware filtering.
- Presentation Layer: browser extension control panel, contextual anchor
  selection, and visible classification UI.
- Headline Labeling Layer: deterministic `analyzeHeadline(title, source, mode)`
  labels card titles Green/Yellow/Red for ContextOS/PersonaLabs modes using
  weighted dictionaries, phrase matching, source-format adjustment, and
  explainable matched terms.

The semantic and retrieval modules are dependency-free and can run in both the
browser content script and Node tests. They do not use cloud APIs by default, LLM
calls, embeddings, vector databases, autonomous AI ranking systems, opaque
recommendation systems, or network calls. YouTube Data API support is represented
as a clean provider interface and remains optional future configuration.

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
