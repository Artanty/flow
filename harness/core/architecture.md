# architecture

GitHub deploy automation service ("buster" on Vercel): receives GitHub push
webhooks, and on version-tag pushes dispatches deploy workflows in
`Artanty/serf`.

## Layout

- `back/` — the whole service: Express + TypeScript, CommonJS-style requires +
  TS types. Source `back/src/`, entry `back/app.ts`, compiled `back/dist/`
  (gitignored — Vercel builds via `npm run build` → tsc).
- `build/` — local build helper (tag history logs), not part of the service.
- `harness/` — this knowledge base.

## Run / build

```bash
cd back
npm run build          # tsc → dist/
node dist/app.js       # serves PORT (default 3000), loads .env from cwd
node test/rerun.test.js  # logic tests, GitHub client stubbed
```

## Route map

| Route | What | Code |
|---|---|---|
| `POST /webhook` | GitHub push webhook; tag pushes `vN.N.N.N.N.N` → serf dispatch | `src/webhook.ts` |
| `POST /retrigger` | re-run latest `Deploy <project> \| v…` serf run; `Authorization: Bearer APP_TRIGGER_RUN_TOKEN` | `src/rerun.ts` |
| `GET /get-updates` | runtime/env introspection (`?stat=true` also pings stat) | `app.ts` |

## Deployment model (Vercel)

- Express `app.listen(PORT)` → deployed as ONE Vercel Function on Fluid compute
  in legacy-server mode (the "Legacy server listening…" log line is Vercel's
  wrapper, not ours). Repo: `Artanty/flow`, Vercel project `buster`
  (`buster-tau.vercel.app`).
- **Default maxDuration = 10s (free tier, kept deliberately)** — every code path
  in `/webhook` must fit inside it. See `core/gotchas.md`.
- Deploy trigger: push to master with `-d` suffix convention handled outside
  this repo's tooling (user-driven).
