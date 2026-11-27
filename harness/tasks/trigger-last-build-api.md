# Task: API for triggering the last build (queried)

Queued 2026-11-27. Not started.

## Goal

An API to trigger the last build matching a query — e.g. re-run the newest serf
run for a given project/namespace (or a freer query: repo, namespace, tag
range). Today `POST /retrigger` covers exactly `Deploy <project> | v…` name
matching; this task is the generalized/queried form.

## Requirements sketch

- Endpoint next to `/retrigger` (`back/src/rerun.ts` is the existing pattern:
  scan serf runs newest-first, `POST /runs/{id}/rerun`).
- Query params/body: at minimum `project` (`repo@namespace`); consider optional
  tag/commit filters.
- **Auth via key@back** instead of the static bearer token: same pattern serf
  uses (`Artanty/http-request-action` calls to key@back `register`/`get-token`)
  — caller registers/obtains a short-lived token from key@back, flow validates
  it against key@back before rerunning. `KEY_BACK_URL` env already exists
  (passed to serf dispatch inputs today); flow would consume it itself now.
- Keep the stat `RETRIGGER` marker event on success (run-level metadata).
- Update `harness/features/retrigger.md` + root README when done; delete this
  task file.

## Related

- `features/retrigger.md` — the existing latest-run rerun + APP_TRIGGER_RUN_TOKEN auth.
- `core/env.md` — KEY_BACK_URL.
