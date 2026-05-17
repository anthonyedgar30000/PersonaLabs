# PersonaLabs Engineering Quality and Traceability

PersonaLabs should be developed as a stable, explainable engineering system for a
bounded capstone prototype. Changes must improve observability, correctness,
privacy-conscious behavior, traceability, or maintainability without expanding
the YouTube proof-of-concept scope unless explicitly approved.

## Change discipline

- No broad refactors without explicit approval.
- Change one subsystem per pull request or commit whenever possible.
- Keep behavioral changes small enough to explain from input signal to final label.
- Do not introduce AI APIs, embeddings, vector databases, or remote inference without an approved architecture decision.
- Do not redesign UI as part of scoring, instrumentation, or test work.

## Scoring discipline

- Tests before tuning: add or update focused regression tests before changing thresholds, weights, dictionaries, or label selection.
- Instrumentation before guessing: if a classification is unclear, add trace evidence before changing scoring behavior.
- No duplicate scoring paths: overlays, panel recommendations, persistence, and debug output must converge on the canonical semantic result object.
- If duplicate scoring exists, document the current split before replacing it.
- Every final label must be explainable from metadata, matched signals, suppression/override rules, score components, confidence, and final reason.

## Canonical result requirement

Every classification pipeline must produce or derive the canonical semantic result object defined in `docs/SCORING_CONTRACT.md`.

The canonical result is the single decision record for:

- overlay display
- panel recommendation display
- debug traces
- persistence attempts
- regression tests

Adapter-specific data may exist, but it must not become a competing label source.

## Observability requirements

Instrumentation must be available before classification tuning. Debug traces should capture:

- metadata extraction
- domain detection
- signal matching
- scoring
- suppression/override rules
- final label selection
- overlay rendering
- panel rendering
- database save attempt/success/failure

Debug logging must be gated behind `PERSONALABS_DEBUG`.

