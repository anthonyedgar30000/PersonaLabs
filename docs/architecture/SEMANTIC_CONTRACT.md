# Semantic Contract

The canonical semantic contract is the shape returned by `semantic.scoreContent(...)`.

## Canonical trace/result object

```js
{
  traceId: string,
  videoId: string,
  title: string,
  channel: string,
  lens: string,
  domain: string,
  label: "GREEN" | "YELLOW" | "RED",
  confidence: number,
  scores: object,
  matchedTerms: {
    positive: string[],
    friction: string[]
  },
  suppressedTerms: string[],
  semanticSignals: object,
  observabilitySignals: object,
  reasoning: object,
  pipelineVersion: string,
  scoringPath: string,
  contradictions: string[],
  domainContext: object,
  explanation: string,
  timestamp: string
}
```

## Required fields

- `traceId`
- `title`
- `channel`
- `lens`
- `domain`
- `label`
- `confidence`
- `scores`
- `matchedTerms`
- `suppressedTerms`
- `semanticSignals`
- `observabilitySignals`
- `reasoning`
- `pipelineVersion`
- `scoringPath`
- `contradictions`
- `domainContext`
- `explanation`
- `timestamp`

## Optional fields

- `videoId`: empty string when unavailable.
- Compatibility fields:
  - `classification`
  - `score`
  - `breakdown`
  - `matchedSignals`
  - `suppressedSignals`
  - `debug`
  - `reasons`
  - `finalReason`

Compatibility fields must mirror canonical values and must not become alternate decision sources.

## Field meanings

- `label`: final semantic label consumed by overlay, panel, retrieval filtering, and traces.
- `confidence`: final 0-100 confidence.
- `scores`: deterministic score components and confidence component values.
- `matchedTerms`: matched positive/friction terms used for explanations.
- `suppressedTerms`: terms removed or suppressed by contextual logic.
- `semanticSignals`: derived semantic evidence, including domain boosts, confidence deltas, semantic overrides, and final decision source.
- `observabilitySignals`: raw observability signal groups detected from title/channel metadata.
- `reasoning`: human-readable reasons, final reason, and downgrade reasons.
- `contradictions`: detected internal inconsistency warnings.
- `domainContext`: detected domain, boosts, and confidence source.
- `scoringPath`: consumer path, such as `overlay`, `retrieval-panel`, `retrieval-ranking`, or `legacy-scoreCandidate`.

## Invariants

- `label` must equal `classification.color` while compatibility fields exist.
- `confidence` must be an integer from `0` to `100`.
- `matchedTerms.positive` and `matchedTerms.friction` must always be arrays.
- `suppressedTerms` must always be an array.
- `contradictions` must always be an array.
- If `matchedTerms` is empty, explanations must not claim matched title terms.
- If `label` is `GREEN`, explanation text must not claim a red/yellow final state.
- UI must render from `label`, not from compatibility fields.
- Retrieval filtering must use the canonical result.
- Debug traces must include the canonical result fields.

## Consistency guarantees

PersonaLabs guarantees that active runtime semantic decisions are produced through `semantic.scoreContent(...)`.

Known exception:

- `lib/headlineAnalyzer.js` remains as legacy isolated code and tests, but it is not loaded by the extension runtime and must not be used as a UI decision source.

