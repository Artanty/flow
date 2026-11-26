# retrigger

`POST /retrigger` — `back/src/rerun.ts`. Full API/usage docs: root `README.md`.

Re-runs the newest serf run named `Deploy <project> | v…` (scans up to 2000
runs newest-first, `POST /runs/{id}/rerun`) — same commit, same inputs.
Auth: `Authorization: Bearer APP_TRIGGER_RUN_TOKEN`. Needs `APP_GIT_PAT` with
actions: write. Posts a `RETRIGGER` marker event to stat (run-level metadata
with workflowRunId).

Limits: cannot recover a dispatch that never happened (no run id exists —
the v1.0.42 case); rejects a rerun while the latest matching run is still
in progress (409). Consumers: stat's redeploy button via the feat `req`
feature (`FEAT_REQ_REDEPLOY_TARGET = <flow>/retrigger`).

Tests: `back/test/rerun.test.js` (GitHub client stubbed).
