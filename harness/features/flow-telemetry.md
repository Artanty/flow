# flow-telemetry (FLOW_START / FLOW_END / FLOW_ERROR runs in stat)

`back/src/runContext.ts` (`createFlowRun`), wired in `webhook.ts`; stat side in
`../stat` (`core/deployRuns.ts`, `web/src/deployTimeline.tsx`,
`back/core/miniEnvelope.ts`). Added 2026-11-27.

Serf's MASTER_START/END/ERROR mechanics ported to flow: a per-namespace run
context accumulates `steps[]` tags + fork `data` (safe version/attempts/
latency, workflow file); sends go to `POST {STAT_URL}/add-event`:

- `FLOW_START` — as soon as the namespace is known (steps prelude
  `webhook-received…namespaces-resolved`). Carries NO workflowRunId → stat
  renders a **pre-action run** (no run id, no retrigger button) before the
  GitHub Action exists.
- `FLOW_END` — after successful dispatch, full steps incl. `safe-version`,
  `dispatch`.
- `FLOW_ERROR` (isError: true) — version-check throw (outer handleTag catch) or
  dispatch failure (triggerWorkflow catch, replaces the old invisible `DEPLOY`
  error event).

Payload: `{projectId: '<repo>@github', namespace, stage, eventData: JSON
{tag, commit, …data}, steps, isError, commitMessage}`. Sends are
fire-and-forget, 3s axios timeout — telemetry never blocks the deploy nor eats
the 10s budget.

stat merges FLOW groups into the earliest subsequent run of the same
project+namespace at read time (event-id monotonic); orphans stay provisional
(`workflowRunId: flow:<eventId>`, `flowOnly: true`). Deploy order matters:
stat first, then flow. Logic tests: `../stat/back/test/deployRuns-flow.test.mjs`.
