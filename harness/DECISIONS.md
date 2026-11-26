# DECISIONS — flow (live session log)

Plan → result, newest first. Distill old sessions into `harness/features/`
and `harness/core/` when this grows.

## 2026-11-27 (3) — noy wake-and-callback (cold-safe recovery)

- Owner picked the noy wake-and-callback option (thru rejected: synchronous —
  the caller's 10s ceiling still applies; http-gate: browser-side, wrong
  runtime). Implemented: noy `GET /wake-and-call` (wake → POST callback, body
  JSON, secrets in body not query), flow `src/defer.ts` fire-and-forget on
  version-check failure + `POST /dispatch-callback` (token in body,
  skipDefer) + fresh `deferred-resume` telemetry run; stat recovery pass
  clears FLOW_ERROR when a later FLOW_END lands (test case 6, 18/18 checks).
  Deferred requests respond 200 to GitHub (deploy resumes out-of-band).
  Env: NOY_URL, FLOW_URL. Deploy order: noy -d → stat -d → flow -d.
  NOT committed.

## 2026-11-27 (2) — harness v2 conversion

- Converted the project to the layered knowledge base (know harness-v2
  checklist, reference ../tabs): `core/` (architecture, env, gotchas),
  `features/` (webhook-dispatch, version-check, flow-telemetry, retrigger,
  stat-reporting), `incidents/` (the 26-11-27 Vercel 10s kill), INDEX, this
  log. Root `DECISIONS.md` deleted (content distilled). `AGENTS.md` added
  delegating to know rules. NOT committed (reorg commit pending owner).

## 2026-11-27 — Vercel 10s kill: budgets + FLOW telemetry

- Safe version-check loop made deadline-aware, total budget 6s (owner keeps
  the 10s default; dashboard raise rejected — free tier). Cold safe now fails
  closed visibly. Incident: `incidents/26-11-27_vercel-10s-kill-safe-cold-start.md`.
- flow telemetry added (`src/runContext.ts`): FLOW_START/END/ERROR per
  namespace → stat pre-action runs, flow-first timeline step, retrigger hidden
  for flow-only runs. stat side done in ../stat (deploy order: stat → flow).
  Verified: flow tsc + rerun tests; stat typechecks + 14 stubbed-pool checks.
  NOT committed.

## 2026-11-23/24 — version-aware dispatch (distilled)

- safe api-version gate before dispatch; fail-open rejected → fail-CLOSED;
  render-wake retry params duplicated from serf; dual-send sourcedName/
  projectId during the wire rename. See `features/version-check.md`.
