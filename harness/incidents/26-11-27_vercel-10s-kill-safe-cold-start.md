# 26-11-27 — Vercel 10s kill during safe cold start (lost deploy)

**Symptom:** tag `v1.0.42.0.0.1` (Artanty/tik, 2026-11-26 21:39 UTC) — deploy
"sometimes" didn't happen. Logs: `func triggerWorkflow` at t+0.5s, then
`Vercel Runtime Timeout Error: Task timed out after 10 seconds` at t+10.05s;
no `serf workflow:` line → `createWorkflowDispatch` never ran. GitHub marked
the delivery failed and does not redeliver; no stat trace (error events carry
no workflowRunId → invisible in runs). Next tag 8 min later worked (safe was
awake, safe fetch ~1.3s, whole request ~2.7s).

**Root cause:** the "safe api v2" change gave the api-version fetch a 30s
per-attempt timeout × 5 retries, while the Vercel function (single Fluid
function, legacy-server mode) runs at the default 10s maxDuration. Cold
safe@render (sleeps on the free tier, 20–60s wake) outlived the budget.

**Fix (2026-11-27):**
1. Total budget on the retry loop (deadline-aware, per-attempt
   `min(30s, remaining)`), capped at 6s to fit the kept-10s ceiling → failures
   are now visible FLOW_ERROR runs instead of silent kills.
2. flow telemetry (`features/flow-telemetry.md`) + stat pre-action runs, so a
   lost dispatch is visible and diagnosable.
3. Dashboard duration raise explicitly rejected by owner (free tier) — the 6s
   cap is the accepted tradeoff; recovery = push a new tag once safe is awake.
