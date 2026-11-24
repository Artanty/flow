# DECISIONS — flow

## 2026-11-23 — version-aware serf dispatch

triggerWorkflow now asks safe `POST {safe_url}/api/get-safe-api-version`
{projectId: "<repo>@github", namespace} (open endpoint, 5s timeout) before dispatching:
`v2` → serf `deploy_v2.yml`, else `deploy.yml`. Fail-open to v1 (non-200 / unreachable
logs and falls back) — a missing version answer must never block a deploy. tsc clean.
NOT committed.

## 2026-11-24 (later) — version check: render-wake retries + fail-CLOSED

Owner rejected fail-open: deploying a maybe-v2 project as v1 is the dangerous case, so a
failed version check now THROWS → outer catch → DEPLOY runtime error to stat, nothing
dispatched. safe@back sleeps on render (first hit ~20–60 s), so the request duplicates
serf's safe call parameters exactly (http-request-action retry 5 / retryWait 100 /
timeout 30000): 5 attempts, 100 ms apart, 30 s per-attempt AbortSignal budget. Gotcha:
`Response` type collides with express's in this file — fetch's is `globalThis.Response`.
tsc clean. NOT committed.

**Wire rename (2026-11-24):** version-check body {projectId} → {sourcedName}; safe's
transition shim keeps the old field working during the push window.

**Dual-send (2026-11-24):** version-check body carries BOTH sourcedName and projectId
during the wire transition (deployed safe may read the legacy field only). Drop with
safe's shim later.
