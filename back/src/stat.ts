import axios from 'axios';
import type { StatPayload, RuntimeEventPayload } from './types';

const STAT_INTERVAL_MS = 15 * 60 * 1000;

export function startStatInterval(): void {
  setInterval(async () => {
    await sendRuntimeEventToStat();
  }, STAT_INTERVAL_MS);
  console.log(`Stat interval started: every ${STAT_INTERVAL_MS / 60000} minutes`);
}

export async function sendRuntimeEventToStat(): Promise<boolean> {
  console.log('func sendRuntimeEventToStat');
  try {
    const payload: StatPayload = {
      projectId: `${process.env.PROJECT_ID}@github`,
      namespace: process.env.NAMESPACE!,
      stage: 'RUNTIME',
      eventData: JSON.stringify({
        slaveRepo: process.env.SLAVE_REPO,
        commit: process.env.COMMIT,
      })
    };
    await axios.post(`${process.env.STAT_URL}/add-event`, payload);
    console.log(`SENT TO @stat: ${process.env.PROJECT_ID}@github -> ${process.env.SLAVE_REPO} | ${process.env.COMMIT}`);
    return true;
  } catch (error: unknown) {
    console.error('error in sendRuntimeEventToStat...');
    if (axios.isAxiosError(error as Error)) {
      const axiosError = error as { message: string; response?: { status?: number; statusText?: string; data?: unknown } };
      console.error('Axios Error:', {
        message: axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
      });
    } else {
      console.error('Unexpected Error:', error);
    }
    return false;
  }
}

export async function sendRuntimeErrorToStat(runtimeEventPayload: RuntimeEventPayload): Promise<boolean> {
  try {
    const payload: StatPayload = {
      projectId: `${runtimeEventPayload.repo_name}@github`,
      namespace: runtimeEventPayload.namespace,
      stage: runtimeEventPayload.stage,
      eventData: JSON.stringify({
        slaveRepo: runtimeEventPayload.slave_repo || null,
        commit: runtimeEventPayload.commit,
        error: runtimeEventPayload.error
      })
    };
    await axios.post(`${process.env.STAT_URL}/add-event`, payload);
    console.log(`ERROR SENT TO @stat: ${runtimeEventPayload.repo_name}@github -> ${runtimeEventPayload.slave_repo} | ${runtimeEventPayload.commit}`);
    return true;
  } catch (error: unknown) {
    console.error('error in sendRuntimeErrorToStat...');
    if (axios.isAxiosError(error as Error)) {
      const axiosError = error as { message: string; response?: { status?: number; statusText?: string; data?: unknown } };
      console.error('Axios Error:', {
        message: axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
      });
    } else {
      console.error('Unexpected Error:', error);
    }
    return false;
  }
}
