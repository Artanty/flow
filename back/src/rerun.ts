import { sendRuntimeErrorToStat } from './stat';
import { getOctokit } from './github';
import { WebhookError, validateProjectName, assertTriggerToken } from './validation';
import axios from 'axios';
import type { Request, Response } from 'express';
import type { RetriggerBody, RetriggerResponse, RetriggerRun, RuntimeEventPayload, StatPayload } from './types';


const OWNER = 'Artanty';
const REPO = 'serf';
const WORKFLOW_ID = 'deploy.yml';
const RUN_NAME_PREFIX = 'Deploy';
const RUNS_PER_PAGE = 100;
const MAX_PAGES = 20;

export function buildRunNamePrefix(project: string): string {
  return `${RUN_NAME_PREFIX} ${project} | `;
}

function toRetriggerRun(run: any): RetriggerRun {
  return {
    id: run.id,
    name: run.name,
    status: run.status ?? 'unknown',
    html_url: run.html_url,
    event: run.event,
    created_at: run.created_at,
  };
}

interface LatestRunResult {
  run: any | null;
  scanned: number;
}

/**
 * Runs are returned newest-first, so the first name match is the latest run
 * for the given project. Scans at most MAX_PAGES * RUNS_PER_PAGE runs.
 */
async function findLatestRun(project: string): Promise<LatestRunResult> {
  const octokit = await getOctokit();
  const prefix = buildRunNamePrefix(project);
  let scanned = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data } = await octokit.actions.listWorkflowRuns({
      owner: OWNER,
      repo: REPO,
      workflow_id: WORKFLOW_ID,
      per_page: RUNS_PER_PAGE,
      page,
    });

    const runs: any[] = data.workflow_runs ?? [];
    scanned += runs.length;

    const match = runs.find((run) => typeof run.name === 'string' && run.name.startsWith(prefix));
    if (match) {
      return { run: match, scanned };
    }

    if (runs.length < RUNS_PER_PAGE) break;
  }

  return { run: null, scanned };
}




function mapGitHubError(error: any, project: string): WebhookError {
  if (error instanceof WebhookError) return error;

  const status: number | undefined = error?.status;
  const detail: string = error?.message ?? String(error);

  if (status === 409) {
    return new WebhookError('GitHub rejected the rerun: the run is still in progress', 409, { project, detail });
  }
  if (status === 404) {
    return new WebhookError('GitHub run not found', 404, { project, detail });
  }
  if (status === 401 || status === 403) {
    return new WebhookError('GitHub rejected APP_GIT_PAT (needs actions: write on Artanty/serf)', 502, { project, detail });
  }

  return new WebhookError('GitHub API error', 502, { project, detail, status });
}

export async function handleRetrigger(req: Request, res: Response): Promise<void> {
  const body = (req.body ?? {}) as RetriggerBody;
  const project = body.project;
  const [repo_name, namespace] = typeof project === 'string' ? project.split('@') : ['unknown', 'unknown'];

  try {
    assertTriggerToken(req.headers.authorization, process.env.APP_TRIGGER_RUN_TOKEN);
    validateProjectName(project);

    const { run, scanned } = await findLatestRun(project);

    if (!run) {
      throw new WebhookError('No run found for project', 404, {
        project,
        scanned_runs: scanned,
        name_prefix: buildRunNamePrefix(project),
      });
    }

    if (run.status !== 'completed') {
      throw new WebhookError('Latest matching run is still in progress', 409, {
        project,
        run: toRetriggerRun(run),
      });
    }

    await (await getOctokit()).actions.reRunWorkflow({
      owner: OWNER,
      repo: REPO,
      run_id: run.id,
    });

    // stat run-level marker (not a workflow stage): makes the rerun visible in stat's
    // run card and moves the run to the top of web/mini lists (last-activity sort)
    axios.post(`${process.env.STAT_URL}/add-event`, {
      projectId: `${repo_name}@github`,
      namespace,
      stage: 'RETRIGGER',
      eventData: JSON.stringify({ project, runId: run.id, runName: run.name }),
      workflowRunId: String(run.id),
    } as StatPayload).catch((e) => console.error('RETRIGGER stat event failed:', e.message));

    const response: RetriggerResponse = {
      project,
      run: toRetriggerRun(run),
      rerun: 'full',
    };

    console.log(`RETRIGGER ok: ${run.name} (run_id=${run.id})`);
    res.status(200).json(response);
  } catch (error) {
    const mapped = mapGitHubError(error, typeof project === 'string' ? project : 'unknown');

    console.error(`RETRIGGER error: ${mapped.message}`, mapped.details);

    const runtimeErrorPayload: RuntimeEventPayload = {
      repo_name,
      namespace,
      stage: 'RETRIGGER',
      commit: '',
      tag: undefined,
      data: { project, ...mapped.details },
      error: mapped.message,
    };
    sendRuntimeErrorToStat(runtimeErrorPayload);

    res.status(mapped.statusCode).json({
      error: mapped.message,
      ...mapped.details,
    });
  }
}
