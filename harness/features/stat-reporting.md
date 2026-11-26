# stat-reporting (legacy events + heartbeat)

`back/src/stat.ts` — predates flow-telemetry:

- `startStatInterval` — every 15 min a `RUNTIME` event for flow itself
  (`PROJECT_ID@github`), no workflowRunId → invisible in stat runs (by design,
  it's a heartbeat).
- `sendRuntimeErrorToStat` — old error path for pre-namespace failures
  (`WEBHOOK_VALIDATION`, `TAG_VALIDATION`); the dispatch-failure `DEPLOY` path
  was replaced by FLOW_ERROR (see `flow-telemetry.md`). No workflowRunId →
  these never appear as runs either.

Errors from stat sends are logged and swallowed (returns false), never thrown.
