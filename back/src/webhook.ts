const { sendRuntimeErrorToStat } = require('./stat');
const { WebhookError, validateWebhookConfig, validateSignature, validateTagFormat, validateAndGetNamespaces } = require('./validation');
const { getOctokit } = require('./github');
import type { Request, Response } from 'express';
import type { RuntimeEventPayload, TriggerWorkflowProps, WebhookBody } from './types';

// envs should be added via slave pero in code!
const APP_GIT_PAT = process.env.APP_GIT_PAT;
const WEBHOOK_SECRET = process.env.APP_WEBHOOK_SECRET;
const STAT_URL = process.env.STAT_URL;
const SAFE_URL = process.env.SAFE_URL;
const KEY_BACK_URL = process.env.KEY_BACK_URL;

export const pushMasterIgnoredRepos: string[] = [
  'githooklib',
  'githooklib-test',
  'bash',
  'snt',
  'host',
  'typlib',
  'http-request-action',
  'shell',
  'netlify',
  'free-chat',
  'room',
  'aparta',
  'frames',
  'laravel-angular-auth',
  'test_front_ang_utube',
  'alibi-react-ui-lib',
  'test_back_lara',
  'cell',
  'tval',
  'forgot',
  'papakarla',
  'folders',
  'doctrinizer',
  'lara_horizon',
  'tamashi',
  'gear',
  'php_oop',
  'grapesJS',
  'serf',
  '_dump',
];

export const ignoredNamespaces: Record<string, string[]> = {
  faq: ['web'],
};

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const body = req.body as WebhookBody;
  // Must not throw before signature validation: an unauthenticated
  // `POST /webhook` with `{}` would otherwise crash the whole process.
  const repo_name = body?.repository?.name ?? 'unknown';
  const eventType = req.headers['x-github-event'] as string;
  const commitMessage = body.head_commit?.message?.trim() || '';

  try {
    console.log('webhook req.body');
    console.log(req.body);

    validateWebhookConfig(WEBHOOK_SECRET);

    const payload = (req as Request & { rawBody?: string }).rawBody ?? '';
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    validateSignature(payload, signature, WEBHOOK_SECRET);

    if (eventType === 'push' && body.ref.startsWith('refs/tags/v')) {
      await handleTag(req, res, repo_name);
    } else {
      res.status(200).send('Event ignored');
    }
  } catch (error) {
    const webhookError = error instanceof WebhookError
      ? error
      : new WebhookError('Unexpected webhook error', 500, { originalError: (error as Error).message });

    console.error(`Webhook error: ${webhookError.message}`);

    const runtimeErrorPayload: RuntimeEventPayload = {
      repo_name,
      namespace: 'webhook',
      stage: 'WEBHOOK_VALIDATION',
      commit: commitMessage,
      tag: body?.ref?.startsWith('refs/tags/') ? body.ref.replace('refs/tags/', '') : undefined,
      data: {
        ...webhookError.details,
        eventType,
        repo_name,
      },
      error: webhookError.message,
    };
    sendRuntimeErrorToStat(runtimeErrorPayload);

    res.status(webhookError.statusCode).json({
      error: webhookError.message,
      ...webhookError.details,
    });
  }
}

export async function triggerWorkflow(data: TriggerWorkflowProps): Promise<void> {
  const {
    namespace,
    repo_name,
    commit_message,
    pat,
    safe_url,
    git_tag,
    key_back_url
  } = data;
  console.log('func triggerWorkflow');

  // v2 projects (PRJ_/HST_ env naming, safe@web-enforced) route to serf's deploy_v2.yml.
  // Retry/timeout duplicated from serf's safe request (http-request-action: retry 5,
  // retryWait 100, timeout 30000): render can sleep safe@back — the 30s per-attempt
  // budget rides out the cold start. Fail CLOSED (owner, 2026-11-24): with an unknown
  // api version we must NOT guess v1 — that could deploy an already-v2 project through
  // the v1 workflow. Any failure here throws onward to the outer catch → DEPLOY runtime
  // error to stat, no dispatch.
  const SAFE_VERSION_RETRIES = 5;
  const SAFE_VERSION_RETRY_WAIT_MS = 100;
  const SAFE_VERSION_TIMEOUT_MS = 30_000;
  let safeVersionResponse: globalThis.Response | null = null;
  let lastVersionError = 'no attempt made';
  for (let attempt = 1; attempt <= SAFE_VERSION_RETRIES; attempt++) {
    try {
      const r = await fetch(`${safe_url}/api/get-project-safe-api-version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // DUAL-SEND during the wire transition (projectId -> sourcedName): the currently
        // deployed safe may still read the legacy field only; both sides ignore the extra.
        body: JSON.stringify({ sourcedName: `${repo_name}@github`, projectId: `${repo_name}@github`, namespace }),
        signal: AbortSignal.timeout(SAFE_VERSION_TIMEOUT_MS),
      });
      if (r.ok) {
        safeVersionResponse = r;
        break;
      }
      lastVersionError = `HTTP ${r.status}`;
    } catch (error) {
      lastVersionError = (error as Error).message;
    }
    if (attempt < SAFE_VERSION_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, SAFE_VERSION_RETRY_WAIT_MS));
    }
  }
  if (!safeVersionResponse) {
    throw new Error(
      `safe api-version failed after ${SAFE_VERSION_RETRIES} attempts (${lastVersionError}) for ${repo_name}@${namespace}`,
    );
  }
  const versionAnswer = (await safeVersionResponse.json()) as { version?: string };
  const workflowId = versionAnswer.version === 'v2' ? 'deploy_v2.yml' : 'deploy.yml';
  console.log(`serf workflow: ${workflowId} (api ${versionAnswer.version ?? 'v1'})`);

  try {
    await (await getOctokit()).actions.createWorkflowDispatch({
      owner: 'Artanty',
      repo: 'serf',
      workflow_id: workflowId,
      ref: 'master',
      inputs: {
        repo_name: repo_name,
        commit_message: commit_message,
        pat: pat!,
        safe_url: safe_url!,
        namespace: namespace,
        stat_url: STAT_URL!,
        git_tag: git_tag,
        key_back_url: key_back_url!
      },
    });
    console.log(`by: ${repo_name}@${namespace} | v${git_tag} | ${commit_message}`);
  } catch (error) {
    const err = error as Error;
    console.log(err.message);
    const runtimeErrorPayload: RuntimeEventPayload = {
      repo_name: repo_name,
      namespace,
      stage: 'DEPLOY',
      commit: commit_message,
      tag: git_tag,
      data: { git_tag },
      error: error
    };
    await sendRuntimeErrorToStat(runtimeErrorPayload);
    console.error(`Error triggering workflow for: ${repo_name}@${namespace}`, error);
  }
}

async function handleTag(req: Request, res: Response, repo_name: string): Promise<void> {
  console.log('func handleTag');
  const body = req.body as WebhookBody;
  const headCommitMessage = req.body.head_commit.message;
  console.log(req.body)
  const newTag = body.ref.replace('refs/tags/', '');

  try {
    validateTagFormat(newTag);

    const { data: tags } = await (await getOctokit()).repos.listTags({
      owner: body.repository.owner.login,
      repo: repo_name,
      per_page: 10
    });

    const isValidTag = (t: { name: string }) => {
      try { validateTagFormat(t.name); return true; }
      catch { return false; }
    };
    const prevTag = tags.find((t: { name: string }) => t.name !== newTag && isValidTag(t))?.name;

    const namespaces = validateAndGetNamespaces(newTag, prevTag);

    for (const namespace of namespaces) {
      if (!ignoredNamespaces[repo_name]?.includes(namespace)) {
        await triggerWorkflow({
          namespace,
          repo_name,
          commit_message: headCommitMessage,
          pat: APP_GIT_PAT,
          safe_url: SAFE_URL,
          git_tag: newTag.replace('v', ''),
          key_back_url: KEY_BACK_URL
        });
      }
    }
    res.status(200).send(`Workflows triggered for: ${namespaces.join(', ')}`);
  } catch (error) {
    const webhookError = error instanceof WebhookError
      ? error
      : new WebhookError('Tag processing error', 500, { tag: newTag });

    const runtimeErrorPayload: RuntimeEventPayload = {
      repo_name,
      namespace: 'tag',
      stage: 'TAG_VALIDATION',
      commit: '',
      tag: newTag,
      data: webhookError.details,
      error: webhookError.message,
    };
    sendRuntimeErrorToStat(runtimeErrorPayload);
    res.status(webhookError.statusCode).json({ error: webhookError.message, ...webhookError.details });
  }
}
