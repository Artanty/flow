# deferred-dispatch (noy wake-and-callback)

Cold-safe recovery added 2026-11-27. `back/src/defer.ts` + `back/src/callback.ts`
(+ the `/dispatch-callback` route in `app.ts`), noy side: `noy/back/app.py`
`GET /wake-and-call`.

When the version-check fails because safe@render is cold (see
`version-check.md`), flow fires-and-forgets
`GET {NOY_URL}/wake-and-call?target={SAFE_URL}&callback={FLOW_URL}/dispatch-callback&body=…`
— noy (always-on Timeweb VH) wakes safe with the render strategy (up to ~3 min
budget) and then POSTs the callback. Flow's `POST /dispatch-callback` (token =
`APP_TRIGGER_RUN_TOKEN`, travels INSIDE the callback body — noy's query string
must stay secret-free, Apache logs URLs) re-runs `triggerWorkflow` with
`skipDefer: true` (no deferral loop) under a fresh telemetry run
(`deferred-resume` step). Result: cold deploys succeed ~30–60s late and are
visible in stat the whole time; stat clears a FLOW_ERROR once a later FLOW_END
lands in the same attempt (recovery pass in stat `core/deployRuns.ts`).

Env: `NOY_URL` (required for deferral), `FLOW_URL` (full public https URL;
falls back to `https://$VERCEL_URL`), plus existing SAFE_URL /
APP_TRIGGER_RUN_TOKEN. Unconfigured → plain fail-closed throw, no behavior
change. The un-awaited noy fetch (1.5s client-side abort) shares the accepted
fire-and-forget risk of the stat telemetry sends.

Import-cycle note: `defer.ts` is deliberately import-free — webhook.ts requires
it, `callback.ts` requires webhook.ts.
