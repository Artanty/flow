# harness/ — the working knowledge of this project

Layers (load only what a task needs):

- `core/` — always-true facts. Read the relevant one when a task touches that area.
- `features/` — one file per feature: what it does, where the code lives, the
  decisions behind it. Read before changing that feature.
- `incidents/` — one file per field bug: symptom → root cause → fix, named
  `YY-MM-DD_keywords.md` (fix date). `ls incidents/` reads chronologically.
- The live session log is `harness/DECISIONS.md` (read it first; per AGENTS.md).

## core/
- `architecture.md` — layout, run/build commands, route map, Vercel deployment model.
- `env.md` — env vars (webhook secrets, safe/stat/key URLs, retrigger token).
- `gotchas.md` — the 10s function ceiling, legacy-server mode, TS type collisions.

## features/
- `webhook-dispatch.md` — tag push → namespaces → serf workflow dispatch (webhook.ts).
- `version-check.md` — safe api-version gate before dispatch: fail-closed, budgets.
- `deferred-dispatch.md` — noy wake-and-callback: cold-safe recovery, POST /dispatch-callback.
- `flow-telemetry.md` — runContext FLOW_START/END/ERROR runs in stat, pre-action runs.
- `retrigger.md` — POST /retrigger: re-run the latest serf run of a project (rerun.ts).
- `stat-reporting.md` — RUNTIME heartbeat, legacy error events (stat.ts).

## incidents/
- `26-11-27_vercel-10s-kill-safe-cold-start.md` — lost deploy v1.0.42 (silent kill).

## Cross-project
Shared rules (DECISIONS workflow, git/commits, naming):
`/Users/artyomantoshkin/server/know/entries/rules.md`.

## DECISIONS.md
- Live session log (plan → result per session); old sessions distill into
  `features/`/`core/` when this grows.
