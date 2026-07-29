const { sendRuntimeErrorToStat } = require('./stat');
const { WebhookError, validateWebhookConfig, validateSignature, validateTagFormat, validateAndGetNamespaces } = require('./validation');
import type { Request, Response } from 'express';
import type { RuntimeEventPayload, TriggerWorkflowProps, WebhookBody } from './types';

const APP_GIT_PAT = process.env.APP_GIT_PAT;
const WEBHOOK_SECRET = process.env.APP_WEBHOOK_SECRET;
const STAT_URL = process.env.STAT_URL;
const SAFE_URL = process.env.SAFE_URL;

let octokit: any = null;

async function getOctokit() {
  if (!octokit) {
    const { Octokit } = await import('@octokit/rest');
    octokit = new Octokit({ auth: APP_GIT_PAT });
  }
  return octokit;
}

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
  'safe'
];

export const ignoredNamespaces: Record<string, string[]> = {
  faq: ['web']
};

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const body = req.body as WebhookBody;
  const repo_name = body.repository.name;
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
    // } else if (eventType === 'push' && body.ref === 'refs/heads/master' && !pushMasterIgnoredRepos.includes(repo_name)) {
    //   await handlePushMaster(req, res, repo_name, commitMessage);
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
    git_tag
  } = data;
  console.log('func triggerWorkflow');
  try {
    await (await getOctokit()).actions.createWorkflowDispatch({
      owner: 'Artanty',
      repo: 'serf',
      workflow_id: 'deploy.yml',
      ref: 'master',
      inputs: {
        repo_name: repo_name,
        commit_message: commit_message,
        pat: pat!,
        safe_url: safe_url!,
        namespace: namespace,
        stat_url: STAT_URL!,
        git_tag: git_tag
      },
    });
    console.log(`Flow triggered for: ${repo_name}@${namespace}, commit: ${commit_message}`);
  } catch (error) {
    const err = error as Error;
    console.log(err.message);
    const runtimeErrorPayload: RuntimeEventPayload = {
      repo_name: repo_name,
      namespace,
      stage: 'DEPLOY',
      commit: commit_message,
      tag: git_tag !== '0.0.0.0' ? `v${git_tag}` : undefined,
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
  console.log(req.body)
  const newTag = body.ref.replace('refs/tags/', '');

  try {
    validateTagFormat(newTag);
  } catch (error) {
    const webhookError = error instanceof WebhookError
      ? error
      : new WebhookError('Invalid tag format', 400, { tag: newTag });

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
    return;
  }

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

  try {
    const namespaces = validateAndGetNamespaces(newTag, prevTag);

    for (const namespace of namespaces) {
      if (!ignoredNamespaces[repo_name]?.includes(namespace)) {
        await triggerWorkflow({
          namespace,
          repo_name,
          commit_message:`TAG: ${newTag}`,
          pat: APP_GIT_PAT,
          safe_url: SAFE_URL,
          git_tag: newTag.replace('v', '')
        });
      }
    }
    res.status(200).send(`Workflows triggered for: ${namespaces.join(', ')}`);
  } catch (error) {
    const webhookError = error instanceof WebhookError
      ? error
      : new WebhookError('Tag processing error', 500, { tag: newTag, prevTag });

    const runtimeErrorPayload: RuntimeEventPayload = {
      repo_name,
      namespace: 'tag',
      stage: 'TAG_VALIDATION',
      commit: '',
      tag: newTag,
      data: { ...webhookError.details, prevTag },
      error: webhookError.message,
    };
    sendRuntimeErrorToStat(runtimeErrorPayload);
    res.status(webhookError.statusCode).json({ error: webhookError.message, ...webhookError.details });
  }
}
