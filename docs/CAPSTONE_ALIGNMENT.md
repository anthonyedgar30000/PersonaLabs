# PersonaLabs Capstone Alignment

## Problem statement

Modern digital platforms optimize heavily for engagement. In media browsing
environments, visible title and headline wording can shape attention, emotional
salience, click behavior, and perception before a user opens the underlying
content. Users often lack transparent, real-time tools that help them observe
these persuasive framing patterns while preserving their own judgment.

PersonaLabs addresses this gap as a privacy-conscious, deterministic-first
browser-extension prototype for media framing awareness. The current proof of
concept operates on YouTube because it provides a controlled demonstration
environment with visible titles, channel metadata, and repeatable browsing
surfaces.

## Capstone scope

Current prototype scope:

- Chrome-compatible browser extension.
- YouTube title/card analysis as a controlled proof-of-concept.
- Deterministic wording-cue scoring.
- Explainable overlays and a side panel.
- Guided demo searches for framing-style examples.
- Local-first runtime behavior with no default cloud AI service.
- Debug-gated tracing, replay, and regression validation.

Future work only:

- News aggregator headline analysis.
- Article headline and preview-card analysis.
- Social feed support.
- Cybersecurity awareness training scenarios for phishing and social
  engineering recognition.

## Cybersecurity and information assurance relevance

PersonaLabs is not a malware detector or network defense tool. Its cybersecurity
relevance is awareness-oriented: social engineering frequently relies on urgency,
fear, curiosity, authority cues, and emotionally salient wording. PersonaLabs
applies those security-awareness concepts to everyday media browsing by making
observable wording patterns visible and explainable.

Information assurance concepts represented in the project include:

- least-scope browser permissions;
- deterministic and reproducible scoring;
- traceable classification outputs;
- human-readable explanations;
- debug-gated evidence export;
- regression testing for semantic drift;
- clear non-goals and user-agency boundaries.

## Non-goals

PersonaLabs does not:

- determine whether content is true or false;
- classify ideological correctness or viewpoint;
- censor, block, approve, or rank content quality;
- infer creator intent or morality;
- profile users;
- replace human interpretation;
- act as a misinformation detector.

The system flags and explains observable framing patterns only.

## Privacy model

The extension analyzes visible page text such as title and channel metadata.
Runtime state for the selected context anchor can be stored locally in browser
storage so the side panel remains coherent during a demo. The panel includes a
Clear saved context control.

By default, PersonaLabs does not use cloud AI APIs, embeddings, vector databases,
remote inference, or external scoring services. Debug traces are disabled unless
`window.PERSONALABS_DEBUG = true` is set. When debug mode is enabled, traces are
kept locally in memory and can be copied or exported by the user.

## Threat and risk model

Primary risks:

- Over-trust: users may treat framing labels as truth or quality judgments.
- False positives/negatives: deterministic wording rules can miss context.
- Privacy leakage during demos: debug traces can include visible title/channel
  metadata if debug mode is enabled.
- Browser-extension scope risk: extensions must minimize permissions and avoid
  unnecessary background collection.
- UI friction: overlays must remain explainable without becoming coercive.

Mitigations:

- repeated non-goal language in UI and docs;
- local-first deterministic scoring;
- limited host permissions for the YouTube proof-of-concept;
- debug-gated tracing;
- Clear saved context control;
- regression tests and golden scenario validation;
- score-first/filter-second architecture with no UI-only label logic.

## Explainability and traceability

Every active runtime label is produced by `semantic.scoreContent(...)` or a
compatibility adapter that delegates to it. The canonical result includes label,
rule-match score, matched terms, suppressed terms, reasoning, confidence
components, contradictions, trace events, pipeline version, and scoring path.

The tracing framework supports capstone concepts of reproducibility and
auditability:

- `traceEvents[]` documents deterministic scoring stages.
- Runtime `stages[]` document panel/overlay rendering and optional persistence
  attempts.
- `window.PersonaLabsDebugTraces` holds the most recent debug traces when debug
  mode is enabled.
- Replay utilities compare historical traces with current scoring behavior.
- Scenario and golden regression packs detect semantic drift.

Some internal test fields still use the term `governance` for historical
compatibility. In this capstone context, those fields mean deterministic
rule-check agreement and regression validation. They do not mean content
moderation, platform governance, or policy enforcement.

## Testing strategy

The repository uses Node-based checks and tests:

```bash
npm run check
npm test
```

The tests validate:

- deterministic title-framing classifications;
- score-first/filter-second behavior;
- runtime architecture boundaries;
- no legacy analyzer usage in the extension runtime;
- debug-only test API exposure;
- trace replay and drift detection;
- scenario and golden regression validation;
- evidence export without unsafe mutation APIs.

## Limitations

PersonaLabs analyzes wording patterns in visible titles and metadata. It does not
read full video content, validate claims, measure actual user emotions, or infer
intent. Deterministic rules are intentionally transparent, but they are not a
complete model of language, persuasion, culture, or context.

The YouTube implementation should be presented as a controlled capstone demo, not
as a finished cross-platform media analysis product.
