# flow

GitHub deploy automation service.

- `back/` — Express + TypeScript API (`npm run build` → `node dist/app.js`, loads `.env` from the working directory)
- `build/` — build helper

Main use: re-run the last deploy of a project in [`Artanty/serf`](https://github.com/Artanty/serf/actions) on demand.

---

## How to use `POST /retrigger`

Finds the newest `deploy.yml` run in `Artanty/serf` whose name looks like
`Deploy chat@web | v1.0.5.0.0.20` and **re-runs it** — same commit, same inputs
as the original run (`POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun`).

### Step 1 — set the env

| Variable | Required | What it is |
|---|---|---|
| `APP_TRIGGER_RUN_TOKEN` | yes (new) | your own secret for this API — generate one: `openssl rand -hex 32` |
| `APP_GIT_PAT` | already used by the service | must have **Actions: Read and write** on `Artanty/serf` (fine-grained) or `repo` scope (classic), otherwise rerun → `502` |
| `PORT`, `STAT_URL`, `APP_WEBHOOK_SECRET`, … | already used | unchanged |

Where to put `APP_TRIGGER_RUN_TOKEN`:

- **production** — the same place the other env vars of this service are configured;
- **locally** — `back/.env` (the file is gitignored, so the secret cannot be committed):

```dotenv
APP_TRIGGER_RUN_TOKEN=5f3a...paste-generated-value
APP_GIT_PAT=ghp_...existing-pat-with-actions-write
```

### Step 2 — send the request

```bash
curl -X POST https://<your-host>/retrigger \
  -H "Authorization: Bearer $APP_TRIGGER_RUN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"project":"chat@web"}'
```

| Part | Value |
|---|---|
| Method + path | `POST /retrigger` |
| Header | `Authorization: Bearer <APP_TRIGGER_RUN_TOKEN>` — **required**, no HMAC/signature needed |
| Header | `Content-Type: application/json` |
| Body | `{"project":"<repo>@<namespace>"}` → `chat@web`, `noy@back`, `feat@back` |

`project` must match `/^[A-Za-z0-9._-]+@[A-Za-z0-9._-]+$/`.

### Step 3 — read the response

`200 OK`:

```json
{
  "project": "chat@web",
  "run": {
    "id": 123456,
    "name": "Deploy chat@web | v1.0.5.0.0.20",
    "status": "queued",
    "html_url": "https://github.com/Artanty/serf/actions/runs/123456",
    "event": "workflow_dispatch",
    "created_at": "2026-11-19T10:00:00Z"
  },
  "rerun": "full"
}
```

The new attempt appears right away on <https://github.com/Artanty/serf/actions>.

| Status | Meaning |
|---|---|
| `200` | rerun queued — `run.id` is the run that will restart |
| `400` | invalid `project` format |
| `401` | missing or wrong `Authorization: Bearer` token |
| `404` | no run named `Deploy <project> \| …` found (`scanned_runs`, `name_prefix` in body) |
| `409` | latest matching run is still in progress — retry when it finishes |
| `500` | `APP_TRIGGER_RUN_TOKEN` is not configured on the server |
| `502` | GitHub API failure — see `detail` (usually `APP_GIT_PAT` lacks Actions write) |

### Try it locally

```bash
cd back
npm run build
APP_TRIGGER_RUN_TOKEN=test123 APP_GIT_PAT=<your-pat> PORT=3999 node dist/app.js
```

```bash
# another shell
curl -X POST localhost:3999/retrigger \
  -H 'Authorization: Bearer test123' \
  -H 'Content-Type: application/json' \
  -d '{"project":"chat@web"}'
```

Logic tests (GitHub client stubbed, no real calls): `cd back && npm run build && node test/rerun.test.js`

---

## Other endpoints

- `POST /webhook` — GitHub push webhook. Verifies `x-hub-signature-256` against
  `APP_WEBHOOK_SECRET`, and on a tag push (`refs/tags/vN.N.N.N.N.N`) dispatches
  `deploy.yml` in `Artanty/serf` for the namespaces whose version components changed.
- `GET /get-updates?stat=true` — runtime/version info of this service.
