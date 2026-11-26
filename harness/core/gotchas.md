# gotchas

- **10s hard ceiling.** Vercel free tier, default maxDuration; the owner keeps it
  (dashboard raise rejected 2026-11-27). Anything in `/webhook` longer = "Vercel
  Runtime Timeout Error: Task timed out after 10 seconds", the deploy is lost
  (GitHub does NOT redeliver webhooks) and nothing is dispatched. Budgets:
  ~1.5s prelude (octokit listTags) + 6s safe version check + ~1s dispatch +
  ≤3s fire-and-forget telemetry. The incident that taught this:
  `incidents/26-11-27_vercel-10s-kill-safe-cold-start.md`.
- **Legacy server mode.** `app.listen` → single Fluid function via Vercel's
  wrapper ("Legacy server listening…" in logs is theirs). No per-route function
  config; there is no `vercel.json`.
- **`Response` type collision** in `src/webhook.ts`: express's `Response` vs
  fetch's — the fetch one is `globalThis.Response`.
- **`@octokit/rest` dispatch endpoint deprecation warning** in logs
  (`workflow dispatch … is deprecated`, removal 2028-03) — cosmetic for now.
- **GitHub webhook delivery timeout ≈ 10s**: GitHub may mark a delivery
  "timed out" while the function is still working — cosmetic when telemetry
  (`features/flow-telemetry.md`) shows the run completing.
- `/retrigger` cannot recover a dispatch that never happened — it re-runs an
  EXISTING serf run; there is no run id to rerun when flow died before dispatch.
