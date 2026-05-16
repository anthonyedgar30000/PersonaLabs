# Engineering Governance

PersonaLabs is now a semantic governance and observability project. Engineering changes must preserve determinism, explainability, and traceability.

## Required rules

### All UI consumes canonical trace/result objects

- Overlay UI must render from canonical score fields.
- Panel UI must render from canonical score fields.
- Tooltip/debug UI must render from canonical score or trace fields.
- UI must not compute semantic labels.

### No duplicate scoring pipelines

- Active runtime semantic decisions must originate from `semantic.scoreContent(...)`.
- Compatibility functions may delegate to canonical scoring.
- New scoring functions require explicit architecture approval.

### No hidden overrides

- Any override must appear in:
  - `semanticSignals.semanticOverrides`;
  - `reasoning.finalReason`;
  - debug trace stages.
- Hidden label changes are prohibited.

### No UI-only scoring logic

- UI may format, filter, or display canonical values.
- UI may not alter labels, confidence, matched terms, or explanations.
- UI may not infer semantic meaning from CSS classes or display strings.

### Every label must be explainable

Every final label must trace to:

- input metadata;
- matched terms;
- suppressed terms;
- score components;
- confidence components;
- reasoning;
- final decision source.

### Confidence must be traceable

Confidence must expose:

- final confidence;
- domain confidence;
- friction confidence;
- positive-signal confidence;
- confidence deltas in traces.

### Contradictions must be surfaced

Contradictions must not be silently ignored. They should appear in:

- canonical `contradictions`;
- debug trace JSON;
- tests when a known contradiction class is fixed.

### Instrumentation is required for semantic changes

Before changing scoring weights, thresholds, dictionaries, or override rules:

1. reproduce the behavior with traces;
2. add or update regression tests;
3. make the smallest scoring change;
4. verify traces explain the new behavior.

### Trace inspector observes only

- The Developer Trace Inspector must never call scoring functions directly.
- The inspector must render only existing canonical results, `traceEvents`, and runtime stages.
- Inspector utilities may copy, export, clear, filter, or expand traces.
- Inspector utilities must not mutate scoring state or semantic labels.
- Replay utilities may call canonical replay helpers only; replay helpers must call `scoreContent(...)` and must not implement separate scoring.
- Scenario validation utilities may call canonical scenario helpers only; scenario helpers must call `scoreContent(...)` and must not implement separate scoring.

### Regression tests are required for scoring changes

Tests must cover:

- expected final label;
- matched terms where relevant;
- suppression behavior where relevant;
- contradiction absence/presence;
- confidence preservation where relevant;
- overlay/panel agreement for shared cases.

## Change-control guidance

- No broad refactors without approval.
- One subsystem per change.
- Tests before tuning.
- Instrumentation before guessing.
- Do not add AI APIs, embeddings, vector databases, or external scoring services.
- Do not redesign UI as part of scoring stabilization.

## Review checklist

Before merging a semantic change, confirm:

- [ ] active scoring starts at `scoreContent(...)`;
- [ ] UI consumes canonical labels;
- [ ] no duplicate label branch was introduced;
- [ ] traces include all new signal/override information;
- [ ] contradictions are updated if needed;
- [ ] tests cover the changed behavior;
- [ ] docs are updated if contract or architecture changes.

