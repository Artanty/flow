import axios from 'axios';
import { fireNoyWakeAndCall } from './defer';
import type { StatPayload, FlowRun } from './types';

// Serf-style run telemetry (deploy_v2.yml MASTER_START/END/ERROR mechanics), ported
// to flow: a run-scoped context accumulates step tags + fork data through the
// webhook handling; FLOW_START goes out as soon as the namespace is known (the run
// becomes visible in stat BEFORE the GitHub Action starts), FLOW_END/FLOW_ERROR
// carry the full picture. Sends are fire-and-forget with a short timeout —
// telemetry must never eat into the 10s Vercel budget nor fail the deploy.
const STAT_SEND_TIMEOUT_MS = 3_000;

export function createFlowRun(props: {
  repo_name: string;
  namespace: string;
  tag: string;
  commit: string;
}): FlowRun {
  const { repo_name, namespace, tag, commit } = props;

  const run: FlowRun = {
    steps: [],
    data: {},

    step(name: string): void {
      run.steps.push(name);
    },

    note(key: string, value: unknown): void {
      run.data[key] = value;
    },

    sendStart(): void {
      send('FLOW_START', false);
    },
    sendEnd(): void {
      send('FLOW_END', false);
    },
    sendError(error: unknown): void {
      send('FLOW_ERROR', true, error);
    },
  };

  // Mirrors serf: telemetry failures only warn (curl ::warning / console here).
  function send(stage: string, isError: boolean, error?: unknown): void {
    const payload: StatPayload = {
      projectId: `${repo_name}@github`,
      namespace,
      stage,
      commitMessage: commit,
      eventData: JSON.stringify({
        tag,
        commit,
        ...run.data,
        ...(error !== undefined ? { error: error instanceof Error ? error.message : error } : {}),
      }),
      steps: run.steps,
      isError,
    };
    axios
      .post(`${process.env.STAT_URL}/add-event`, payload, { timeout: STAT_SEND_TIMEOUT_MS })
      .then(() => console.log(`FLOW ${stage} -> @stat: ${repo_name}@${namespace} | v${tag} | steps: ${run.steps.join(',') || '-'}`))
      .catch((e: unknown) => {
        // stat@render can be cold together with safe (same free tier) — the direct
        // 3s send times out and the run would leave NO trace. Fallback: noy wakes
        // stat and replays the event itself (callback = stat's /add-event, no auth
        // there, body = the plain payload). Fire-and-forget, same as the direct send.
        console.error(`FLOW ${stage} stat send failed:`, (e as Error).message);
        const statUrl = process.env.STAT_URL!;
        const sentViaNoy = fireNoyWakeAndCall(`FLOW ${stage} viaNoy`, statUrl, `${statUrl}/add-event`, JSON.stringify(payload));
        if (!sentViaNoy) {
          console.error(`FLOW ${stage} noy fallback skipped (NOY_URL not configured) — event lost`);
        }
      });
  }

  return run;
}
