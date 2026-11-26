# env

UPPER_SNAKE_CASE only (shared rule 0). Production values live in the Vercel
dashboard; local in `back/.env` (gitignored).

## Secrets
- `APP_WEBHOOK_SECRET` — HMAC secret verifying `x-hub-signature-256` on `/webhook`.
- `APP_GIT_PAT` — GitHub PAT, needs **actions: write** on `Artanty/serf`
  (dispatch + rerun). Used by `src/github.ts` (cached Octokit).
- `APP_TRIGGER_RUN_TOKEN` — bearer secret for `POST /retrigger`.

## Service URLs
- `SAFE_URL` — safe@back (render, sleeps) — api-version gate, see
  `features/version-check.md`.
- `STAT_URL` — stat@back `/add-event` telemetry sink.
- `KEY_BACK_URL` — key@back, passed through to serf dispatch inputs.
- `NOY_URL` — noy@back (always-on Timeweb) — wake-and-callback deferral, see
  `features/deferred-dispatch.md`.
- `FLOW_URL` — this service's public https URL (fallback `https://$VERCEL_URL`)
  — builds the noy callback target.

## Runtime/heartbeat (`/get-updates`, RUNTIME stat ping)
- `PROJECT_ID`, `NAMESPACE`, `SLAVE_ACC`, `SLAVE_REPO`, `COMMIT`,
  `COMMIT_ID`, `TAG_VERSION`, `SURGE_DOMAIN`, `SURGE_TOKEN`, `PORT`, `VERCEL_URL`.
