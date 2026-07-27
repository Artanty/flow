const crypto = require('crypto');
const { sendRuntimeErrorToStat } = require('./stat');
const { getNamespacesToTrigger, isValidVersionTag } = require('githooklib/lib/tag-diff');
import type { Request, Response } from 'express';
import type { SignatureResult, WebhookBody } from './types';

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
  'serf', '_dump',
  'safe'
];

export const ignoredNamespaces: Record<string, string[]> = {
  faq: ['web']
};

export function verifySignature(rawBody: string, signature: string | undefined): SignatureResult {
  if (!WEBHOOK_SECRET) {
    return { valid: false, error: 'WEBHOOK_SECRET is not set' };
  }
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
  const calculatedSignature = `sha256=${hmac}`;
  return {
    valid: signature === calculatedSignature,
    signature,
    calculatedSignature,
    rawBodyLength: rawBody ? rawBody.length : 0,
    secretLength: WEBHOOK_SECRET.length,
  };
}

export function handleWebhook(req: Request, res: Response): void {
  console.log('webhook req.body');
  console.log(req.body);

  if (!WEBHOOK_SECRET) {
    console.error('WEBHOOK_SECRET is not set. Please set APP_WEBHOOK_SECRET environment variable.');
    res.status(500).send('Server misconfiguration: WEBHOOK_SECRET is not set');
    return;
  }

  const body = req.body as WebhookBody;
  const repo_name = body.repository.name;
  const payload = (req as Request & { rawBody?: string }).rawBody ?? '';
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const eventType = req.headers['x-github-event'] as string;
  const commitMessage = body.head_commit.message.trim();

  const sigResult = verifySignature(payload, signature);

  if (!sigResult.valid) {
    console.error('Webhook signature mismatch:');
    console.error('  x-hub-signature-256:', sigResult.signature);
    console.error('  calculated:', sigResult.calculatedSignature);
    console.error('  rawBody length:', sigResult.rawBodyLength);
    console.error('  rawBody first 200 chars:', payload ? payload.substring(0, 200) : 'UNDEFINED');
    console.error('  WEBHOOK_SECRET defined:', true, 'length:', sigResult.secretLength);
    res.status(401).json({
      error: 'Invalid signature',
      rawBodyDefined: !!payload,
      rawBodyLength: sigResult.rawBodyLength,
      secretLength: sigResult.secretLength,
      receivedSignature: sigResult.signature,
      calculatedSignature: sigResult.calculatedSignature,
    });
    return;
  }

  if (eventType === 'push' && body.ref.startsWith('refs/tags/v')) {
    handleTag(req, res, repo_name);
  } else if (eventType === 'push' && body.ref === 'refs/heads/master' && !pushMasterIgnoredRepos.includes(repo_name)) {
    handlePushMaster(req, res, repo_name, commitMessage);
  } else {
    res.status(200).send('Event ignored');
  }
}

export async function triggerWorkflow(
  namespace: string,
  repo_name: string,
  commit_message: string,
  pat: string | undefined,
  safe_url: string | undefined,
  git_tag: string
): Promise<void> {
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
    const runtimeErrorPayload = {
      repo_name: repo_name,
      namespace,
      stage: 'DEPLOY',
      commit: commit_message,
      error: error
    };
    await sendRuntimeErrorToStat(runtimeErrorPayload);
    console.error(`Error triggering workflow for: ${repo_name}@${namespace}`, error);
  }
}

async function handlePushMaster(req: Request, res: Response, repo_name: string, commitMessage: string): Promise<void> {
  console.log('func handlePushMaster');
  const body = req.body as WebhookBody;
  const changedFiles = body.head_commit.modified.concat(body.head_commit.added);

  const affectedFolders = new Set<string>();
  changedFiles.forEach((file: string) => {
    const folder = file.split('/')[0];
    if (folder) {
      affectedFolders.add(folder);
    }
  });

  const namespaces: string[] = [];
  if (affectedFolders.has('web')) namespaces.push('web');
  if (affectedFolders.has('back')) namespaces.push('back');

  for (const namespace of namespaces) {
    if (ignoredNamespaces[repo_name]?.includes(namespace)) {
      console.log(`${repo_name}@${namespace} IGNORED.`);
    } else {
      await triggerWorkflow(
        namespace,
        repo_name,
        commitMessage,
        APP_GIT_PAT,
        SAFE_URL,
        '0.0.0.0'
      );
    }
  }
  res.status(200).send('Workflow triggered');
}

async function handleTag(req: Request, res: Response, repo_name: string): Promise<void> {
  console.log('func handleTag');
  const body = req.body as WebhookBody;
  const newTag = body.ref.replace('refs/tags/', '');

  if (!isValidVersionTag(newTag)) {
    res.status(400).send('Invalid version tag format. Expected: vN.N.N.N');
    return;
  }

  const { data: tags } = await (await getOctokit()).repos.listTags({
    owner: body.repository.owner.login,
    repo: repo_name,
    per_page: 10
  });
  const prevTag = tags.find((t: { name: string }) => t.name !== newTag && isValidVersionTag(t.name))?.name;

  const namespaces = getNamespacesToTrigger(newTag, prevTag);
  if (namespaces.length === 0) {
    res.status(200).send(`No version increase in ${prevTag || 'any component'}`);
    return;
  }

  for (const namespace of namespaces) {
    if (!ignoredNamespaces[repo_name]?.includes(namespace)) {
      await triggerWorkflow(
        namespace,
        repo_name,
        `TAG: ${newTag}`,
        APP_GIT_PAT,
        SAFE_URL,
        newTag.replace('v', '')
      );
    }
  }

  res.status(200).send(`Workflows triggered for: ${namespaces.join(', ')}`);
}
