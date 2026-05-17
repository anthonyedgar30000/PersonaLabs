# Trace Schema

Debug traces make every visible title-framing label inspectable from metadata extraction to final rendering.

Tracing is gated by:

```js
window.PERSONALABS_DEBUG = true
```

When enabled:

- traces log to console as structured objects;
- the last 50 traces are kept in `window.PersonaLabsDebugTraces`;
- the side panel renders a "Debug Traces" section;
- copy/export JSON controls are available.

## Trace object

Each trace mirrors the deterministic title-framing result and adds rendering/pipeline event metadata.

```js
{
  traceId,
  videoId,
  title,
  channel,
  lens,
  domain,
  label,
  confidence,
  scores,
  matchedTerms,
  matchedSignals,
  suppressedTerms,
  suppressedSignals,
  semanticSignals,
  observabilitySignals,
  reasoning,
  pipelineVersion,
  scoringPath,
  contradictions,
  confidenceValidation,
  domainContext,
  traceEvents,
  downgradeReasons,
  explanation,
  renderingTarget,
  stages,
  timestamp
}
```

## Pipeline stages

Deterministic scoring stages:

1. metadata normalization
2. domain detection
3. signal matching
4. rule scoring
5. confidence consistency validation
6. suppression/override evaluation
7. contradiction detection
8. final label selection

Runtime rendering stages:

1. video/card detected
2. metadata extracted
3. rule scoring started
4. topic/tone/attention cues matched
5. suppression/override rules applied
6. final classification selected
7. overlay rendered
8. panel recommendation rendered
9. database save attempted
10. database save succeeded or database save failed

## Developer Trace Inspector

When debug mode is enabled, the side panel includes a developer-facing rule-match
trace inspector. The inspector observes deterministic scoring output only. It does
not call scoring functions and does not derive labels.

Inspector sections:

- Input: raw title, metadata, source URL, timestamp.
- Contextual Anchors: extracted anchor, normalized terms, matched wording group, wording boosts.
- Term Analysis: matched calm/explanatory terms, matched attention cues, suppressed terms, ignored/override terms.
- Scoring Flow: pipeline stages, rule-score components, scoring modifiers, final label.
- Rule checks: contradictions, override reasons, score-field consistency, scoring path.
- Lens/Search Details: selected lens, generated search paths, lens rules, exclusions.
- Trace Events: canonical `traceEvents`.
- Runtime Events: overlay/panel/database `stages`.

Inspector utilities:

- copy JSON;
- export JSON;
- clear trace history;
- toggle verbose trace rendering;
- filter traces by all, overlay, panel, or contradictions.
- replay visible traces;
- load exported replay JSON.

## Replay Analysis

Replay uses exported trace JSON as input and delegates to
`semantic.replayTraces(...)`. Replay must call canonical `scoreContent(...)`
only; it must not introduce another scoring system.

Replay telemetry includes:

- `replayId`
- `sourceTraceId`
- `replayPipelineVersion`
- `driftClassification`
- `replayAgreementState`
- `originalLabel`
- `currentLabel`
- `confidenceDelta`
- `governanceDecisionChanges` (legacy field name for rule-check decision changes)
- `replayTimestamp`
- `pipelineVersionComparison`

The inspector shows original/current labels, confidence delta, drift severity,
changed rule-check decisions, replay timestamp, and pipeline version comparison.

## Scenario Validation

Scenario validation runs compact deterministic scenario packs through
`semantic.runScenarioPack(...)`. The runner calls canonical `scoreContent(...)`
only and emits scenario telemetry:

- `scenarioId`
- `expectedLabel`
- `actualLabel`
- `confidenceDelta`
- `governanceAgreement` (legacy field name for rule-check agreement)
- `contradictionAgreement`
- `driftDetected`
- `severity`
- `pipelineVersion`

The inspector summarizes pass/fail, label agreement, confidence agreement,
contradiction agreement, rule-check agreement, drift severity, pipeline version,
and summary stats.

## Golden Regression Pack

The Golden Regression Pack is a frozen set of canonical scenarios for platform
stability. It includes calm animal content, harmless pet friction, animal
distress, educational tutorial, documentary, public radio interview, civic/news
escalation wording, high-attention curiosity-gap wording, ambiguous low-context
title, stress-test title, contradictory explanation guard, and semantic drift
sentinel.

Golden validation reports total scenarios, pass/fail, drift count, failed
scenario ids, confidence deltas, rule-check mismatches, contradiction mismatches,
matched/suppressed signal mismatches, and pipeline version.

## Trace events

Canonical `scoreContent(...)` results expose `traceEvents[]`. Runtime debug
traces also expose UI/persistence `stages[]`.

Each `traceEvents[]` entry has:

```js
{
  traceId: string,
  order: number,
  stage: string,
  timestamp: string,
  input: object,
  derivedState: object,
  confidence: object,
  canonicalLabel: string,
  contradictions: string[],
  metadata: object
}
```

Each runtime `stages[]` entry has:

```js
{
  traceId: string,
  stage: string,
  timestamp: string,
  input: object,
  derivedState: object,
  confidence: object,
  canonicalLabel: string,
  contradictions: string[],
  metadata: object
}
```

## Confidence deltas

Confidence deltas are exposed in:

```js
semanticSignals: {
  confidenceDeltas: {
    domain,
    friction,
    positiveSignal
  }
}
```

These values explain how final confidence was assembled.

## Suppression events

Suppression appears in:

- `suppressedTerms`
- `suppressedSignals`
- `reasoning.downgradeReasons`
- `stages[].details.suppressedSignals`

Suppression must be explicit and inspectable.

## Override events

Overrides appear in:

- `semanticSignals.semanticOverrides`
- `semanticSignals.finalDecisionSource`
- `reasoning.finalReason`
- `stages[].details.semanticOverrides`

Hidden overrides are not allowed.

## Contradiction events

Contradictions appear in:

- `contradictions`
- `stages[].details.contradictions`

Examples:

- label says `GREEN`, but explanation claims final RED/YELLOW state;
- `matchedTerms` is empty, but explanation claims matched terms;
- expected label supplied for diagnostics disagrees with canonical label.

## Example trace: calm bunny

```js
{
  traceId: "pl-example",
  videoId: "",
  title: "Cute Baby Bunny Compilation",
  channel: "Wholesome Pets",
  lens: "calmer",
  domain: "animal-pet-nature",
  label: "GREEN",
  confidence: 100,
  matchedTerms: {
    positive: ["cute", "bunny"],
    friction: []
  },
  suppressedTerms: [],
  semanticSignals: {
    domainBoosts: ["calm animal/nature signals"],
    confidenceDeltas: {
      domain: 100,
      friction: 0,
      positiveSignal: 100
    },
    finalDecisionSource: "canonical.semantic.classifyScoredCandidate"
  },
  contradictions: [],
  explanation: "Calm/pet content detected; no distress or escalation signals found.",
  renderingTarget: "overlay",
  stages: [
    { stage: "metadata extracted", details: { title: "Cute Baby Bunny Compilation" } },
    { stage: "final classification selected", details: { label: "GREEN", confidence: 100 } },
    { stage: "overlay rendered", details: { category: "green" } }
  ]
}
```

## Example trace: contradiction detection

```js
{
  label: "GREEN",
  matchedTerms: {
    positive: [],
    friction: []
  },
  explanation: "Marked GREEN after contextual analysis.",
  contradictions: []
}
```

If explanation text claimed matched controversy terms while `matchedTerms` was empty, `contradictions` would contain:

```js
["explanation claims matched terms while matchedTerms is empty"]
```

