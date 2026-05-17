# Known Issues and Architectural Debt

This file tracks known semantic architecture risks so future changes do not rediscover or reintroduce prior drift.

## Duplicate scoring paths

Current active runtime state:

- Overlay scoring uses `semantic.scoreContent(...)`.
- Retrieval filtering uses `semantic.scoreCandidates(...)`, which delegates to `scoreContent(...)`.
- Panel rendering consumes canonical scores returned by retrieval.

Remaining legacy code:

- `lib/headlineAnalyzer.js` remains in the repository with tests.
- It is no longer loaded by the extension manifest.
- It must not be used as a UI decision source without an explicit migration plan.

Risk:

- Future agents may reintroduce `headlineAnalyzer.analyzeHeadline(...)` into UI code because the file still exists.

Mitigation:

- Keep this debt documented.
- Prefer removing or archiving the legacy analyzer after verifying no required tests depend on it.

## Contradictory explanation states

Historical failure modes:

- explanation says "title contains controversy terms" while matched terms are empty;
- overlay label and explanation disagree;
- overlay label and panel label disagree;
- source/channel risk terms affect color but are not shown in matched terms.

Current mitigation:

- canonical `contradictions[]` detects several internal consistency failures;
- traces expose matched terms, explanation, label, scoring path, and final decision source.

Remaining risk:

- contradiction detection is heuristic and should expand as new failure modes appear.

## Confidence inconsistencies

Historical failure modes:

- overlay showed coarse confidence labels while panel used score/classification;
- confidence components were not visible in all render targets.

Current mitigation:

- canonical scores include final confidence plus domain/friction/positive-signal confidence components;
- overlays, tooltips, panel suggestions, and traces expose confidence.

Remaining risk:

- confidence math is deterministic but heuristic; future tuning requires tests first.

## Overlay/panel divergence

Historical failure mode:

- overlay and panel could compute labels through separate paths.

Current mitigation:

- both consume canonical semantic scores.
- regression tests cover overlay/panel canonical agreement.

Remaining risk:

- UI code still contains compatibility helpers and rendering-specific formatting that could drift if new label logic is added there.

## Unresolved heuristics

Known heuristic areas:

- animal/pet/nature safe-domain handling;
- harmless energetic pet pacing;
- civic/news escalation terms;
- public radio/interview lower-friction source handling;
- neutral reporting verbs;
- long-form and educational framing weights.

These are intentionally deterministic but not complete. Any tuning must include:

- before/after examples;
- regression tests;
- trace inspection;
- no UI-only logic.

## Database persistence

Current state:

- debug traces attempt persistence only if `window.PersonaLabsTraceDatabase.saveTrace` exists.
- without an adapter, trace save is recorded as failed/skipped via debug trace stage.

Risk:

- there is no durable trace persistence in this runtime branch.

Mitigation:

- treat in-memory traces as debugging support only.
- add persistence only through an explicit storage architecture task.

## Current architectural debt

- Legacy headline analyzer remains in the repo.
- Some compatibility fields remain on canonical results (`classification`, `score`, `breakdown`, `debug`) for older tests and call sites.
- Trace schema and scoring contract exist in both root docs and architecture docs; keep them synchronized or consolidate later.
- UI renders trace/export controls inside the existing panel rather than a dedicated debug view.

