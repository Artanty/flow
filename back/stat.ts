import axios from 'axios';
import type { StatPayload, RuntimeEventPayload } from './types.js';

let lastExecutedMinute: number | null = null;

export function shouldRunStat(currentMinute: number): boolean {
  return [1, 15, 30, 45].includes(currentMinute);
}

export function getLastExecutedMinute(): number | null {
  return lastExecutedMinute;
}

export function setLastExecutedMinute(minute: number): void {
  lastExecutedMinute = minute;
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
  } catch (error) {
    console.error('error in sendRuntimeEventToStat...');
    if (axios.isAxiosError(error)) {
      console.error('Axios Error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
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
  } catch (error) {
    console.error('error in sendRuntimeErrorToStat...');
    if (axios.isAxiosError(error)) {
      console.error('Axios Error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    } else {
      console.error('Unexpected Error:', error);
    }
    return false;
  }
}
