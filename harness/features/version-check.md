# version-check (safe api-version gate)

`triggerWorkflow` in `back/src/webhook.ts`, before every dispatch.

Asks `POST {SAFE_URL}/api/get-project-safe-api-version` with
`{sourcedName, projectId (dual-send during the wire rename), namespace}`:
`version === 'v2'` → serf `deploy_v2.yml`, else `deploy.yml`.

Decisions (owner-driven):
- **Fail CLOSED** (2026-11-24): any failure THROWS → no dispatch. Fail-open to v1
  was rejected — deploying a maybe-v2 project through the v1 workflow is the
  dangerous case. Cost: unreachable safe blocks the deploy, visibly (FLOW_ERROR).
- Retry loop duplicates serf's http-request-action params (retry 5 / wait 100ms /
  attempt timeout 30s), but with a **total budget** so it always surrenders on
  its own before the 10s Vercel kill: `SAFE_VERSION_TOTAL_BUDGET_MS = 6_000`,
  per-attempt timeout `min(30s, remaining)`. A cold safe@render (20–60s wake)
  therefore fails closed visibly instead of being silently killed — the
  recovery is pushing a new tag once safe is awake (NOT /retrigger: no run
  exists). See the 26-11-27 incident.
- Dual-send `{sourcedName, projectId}`: drop `projectId` when safe's transition
  shim is gone.
