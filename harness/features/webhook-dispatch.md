# webhook-dispatch

`POST /webhook` — `back/src/webhook.ts` (`handleWebhook` → `handleTag` →
`triggerWorkflow`).

Flow: log body → validate config + `x-hub-signature-256` HMAC (rawBody kept by
the bodyParser `verify` hook in `app.ts`) → only `push` events on
`refs/tags/v…` proceed → tag format `vN.N.N.N.N.N` validated → previous tag
resolved via `repos.listTags` (per_page 10) → namespaces whose version
components changed are extracted (`validateAndGetNamespaces`) → for each
non-ignored namespace: version-check gate (`version-check.md`) → dispatch
`Artanty/serf` workflow `deploy.yml`/`deploy_v2.yml` (workflow_dispatch, ref
master) with inputs `{repo_name, commit_message, pat, safe_url, stat_url,
git_tag, key_back_url}` → stat telemetry per namespace (`flow-telemetry.md`).

Lists: `pushMasterIgnoredRepos` (repos that must never auto-deploy — serf
would self-deploy on its own tags; gates the tag path since 2026-11-27, was
accidentally un-gated 2025-03…2026-11) and `ignoredNamespaces`
(e.g. `faq: [web]`).

Decisions:
- Errors before the namespace is known (signature, tag format) → old-style
  `WEBHOOK_VALIDATION`/`TAG_VALIDATION` stat events; no run object exists yet.
- Dispatch errors are logged + FLOW_ERROR, but do not fail the HTTP request
  path for other namespaces.

Auth: cached PAT Octokit (`src/github.ts`), not a GitHub App installation.
