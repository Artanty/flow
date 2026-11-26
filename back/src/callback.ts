const { triggerWorkflow } = require('./webhook');
const { createFlowRun } = require('./runContext');
const { WebhookError } = require('./validation');
import type { Request, Response } from 'express';
import type { DispatchCallbackBody } from './types';

// POST /dispatch-callback — the noy wake-and-call landing endpoint. noy woke
// safe@render and replays the deferred dispatch here (body carries the
// APP_TRIGGER_RUN_TOKEN — it traveled inside the noy callback body, never in
// noy's query string). Runs the normal triggerWorkflow path with safe awake;
// skipDefer prevents a deferral loop if safe is somehow still cold.
export async function handleDispatchCallback(req: Request, res: Response): Promise<void> {
  const body = (req.body ?? {}) as DispatchCallbackBody;
  const repo_name = body?.repo_name ?? 'unknown';
  const namespace = body?.namespace ?? 'unknown';

  try {
    if (!process.env.APP_TRIGGER_RUN_TOKEN || body?.token !== process.env.APP_TRIGGER_RUN_TOKEN) {
      throw new WebhookError('Unauthorized', 401);
    }
    for (const field of ['repo_name', 'namespace', 'git_tag', 'commit_message'] as const) {
      if (typeof body?.[field] !== 'string' || !body[field]) {
        throw new WebhookError(`Missing or invalid "${field}"`, 400);
      }
    }

    const run = createFlowRun({
      repo_name: body.repo_name,
      namespace: body.namespace,
      tag: body.git_tag,
      commit: body.commit_message,
    });
    run.step('deferred-resume');
    run.note('deferred', true);
    run.sendStart();

    await triggerWorkflow({
      namespace: body.namespace,
      repo_name: body.repo_name,
      commit_message: body.commit_message,
      pat: process.env.APP_GIT_PAT,
      safe_url: process.env.SAFE_URL,
      git_tag: body.git_tag,
      key_back_url: process.env.KEY_BACK_URL,
      run,
      skipDefer: true,
    });

    res.status(200).json({ ok: true, deferred: true });
  } catch (error) {
    // noy only logs the response status/body — report, don't crash
    const webhookError = error instanceof WebhookError
      ? error
      : new WebhookError('Callback processing error', 500, { originalError: (error as Error).message });
    console.error(`dispatch-callback error for ${repo_name}@${namespace}: ${webhookError.message}`);
    res.status(webhookError.statusCode).json({ error: webhookError.message, ...webhookError.details });
  }
}
