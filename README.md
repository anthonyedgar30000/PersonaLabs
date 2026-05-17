# PersonaLabs

PersonaLabs is a privacy-conscious, deterministic-first semantic observability
and media framing awareness browser-extension prototype.

The current prototype uses YouTube as a controlled proof-of-concept environment. It
helps users observe how visible title and headline wording can influence
attention, emotional salience, click behavior, and perception. Analysis focuses
on visible title/channel text and deterministic rule matches.

PersonaLabs does not determine truth, classify ideology, censor content, or
replace YouTube. It does not assess creator intent, morality, misinformation,
user mental state, or content quality. It gives users transparent, local-first
cues for noticing escalation, amplification, calm/neutral, and explanatory
wording.

## Core Principles

- Flag, do not block
- User agency first
- Deterministic-first scoring and transformations
- Local-first runtime with no cloud AI APIs
- Explainable outputs and transparent scoring summaries
- Calm, non-judgmental interaction design
- Privacy-aware architecture
- Bounded wording analysis over coercive filtering
- Score first; filter second
- Traceable and auditable scoring behavior

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
   - calm/neutral signals
5. PersonaLabs offers guided demo buttons that load YouTube searches selected for
   visible framing-style contrast:
   - neutral explainer
   - urgency + risk
   - conflict / investigation
   - curiosity gap
   - future-risk framing

The demo buttons are intentionally presentation-friendly. They help evaluators
see several wording styles quickly without requiring a presenter to invent
searches live.

## Persistent Side Panel

The content script renders a persistent PersonaLabs control panel on YouTube. It
shows:

- selected contextual anchor
- original title
- extracted subject anchor
- removed escalation terms
- guided demo framing-style buttons
- selected scoring/filter lens
- visible title-filtering results after a demo style is opened

The demo buttons open YouTube searches in a new tab when the browser allows it:

- neutral explainer
- urgency + risk
- conflict / investigation
- curiosity gap
- future-risk framing

The panel includes a Clear saved context control so a presenter or user can
remove the locally stored anchor/search state without changing browser-level
extension settings.

## Visible Metadata and Result Filtering

After a guided demo style is opened, PersonaLabs reads visible or
provider-supplied video metadata, scores title/channel wording with deterministic
logic, and applies the selected wording lens.

The current browser extension still includes a temporary visible-page metadata
provider so the UI works before a YouTube Data API key/configuration exists. The
scoring architecture no longer depends on content-script scoring of scraped DOM
nodes; the DOM adapter is isolated behind the Retrieval Layer and can be replaced
by YouTube Data API retrieval.

Pipeline:

1. Contextual anchor
2. Guided demo style selection
3. Structured metadata retrieval
4. Deterministic wording-cue scoring
5. Lens-aware filtering
6. Title framing presentation

It surfaces:

- topic relevance
- educational framing
- lower-intensity wording
- explanatory terminology
- longer-form structure

It surfaces attention-cue patterns:

- conflict or outrage-style wording
- excessive capitalization
- high-attention curiosity-gap wording
- domination/conflict language
- panic/escalation wording

### Lens Filtering Rules

The color system summarizes title framing only:

- GREEN: calm or straightforward title wording
- YELLOW: mixed or unclear title wording
- RED: intense or attention-grabbing title wording

Lens behavior:

- CALMER: only GREEN videos allowed
- LOWER FRICTION: only GREEN videos allowed
- EDUCATIONAL: GREEN prioritized; strong explanatory YELLOW allowed
- DEEPER DIVE: GREEN plus deeper-context YELLOW
- BEGINNER FRIENDLY: GREEN plus simple explanatory YELLOW
- LONGER-FORM: GREEN plus relevant long-form YELLOW

Suggested results include the title, channel, framing label, rule-match score, and
plain-language wording-cue explanations such as:

- lower-friction language
- explanatory framing
- long-form discussion
- topic continuity preserved
- educational terminology detected

## Overlay Badges

PersonaLabs badges are contextual title-framing cues. They do not block, approve,
censor, fact-check, or assess video quality. They help users notice when a visible
card title contains escalation language, which GREEN/YELLOW/RED wording label a
result falls into, and which deterministic rule matches contributed. On-card
badges use readable framing labels, such as "Framing: calm/straightforward
framing (GREEN)", instead of requiring reviewers to decode a color alone.

## Architecture

```text
manifest.json
src/
  semantic-core.js        Anchor extraction, wording cues, deterministic scoring
  retrieval-pipeline.js  Retrieval/query/scoring/filtering interfaces
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
- Wording Analysis Layer: deterministic scoring, title framing analysis,
  escalation/clickbait detection, educational phrasing, calm/neutral wording, and
  long-form signals.
- Demo Search Layer: guided searches for framing-style examples in the controlled
  YouTube proof-of-concept.
- Filtering Layer: GREEN/YELLOW/RED label filtering by the selected wording lens.
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

## Capstone alignment

For WGU Cybersecurity and Information Assurance review, see
`docs/CAPSTONE_ALIGNMENT.md`. It summarizes the problem statement, scope,
cybersecurity relevance, privacy model, threat/risk model, testing strategy,
limitations, and future work.

## Development practices

PersonaLabs is developed as a deterministic, explainable engineering prototype.
Changes should be small, reviewed against architecture contracts, and verified
with syntax checks and regression tests. AI-assisted drafts or code changes must
be validated by human review, repository tests, and documented scoring contracts.

## Vision

A deterministic tool for noticing how title wording can shape attention and
emotional feel.
