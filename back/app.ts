import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import { handleWebhook } from './webhook.js';
import {
  sendRuntimeEventToStat,
  shouldRunStat,
  getLastExecutedMinute,
  setLastExecutedMinute,
} from './stat.js';
import type { UpdateResponse } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
const app = express();
app.use(cors());
app.use(bodyParser.json({
  verify: (req, _res, buf) => {
    (req as express.Request & { rawBody?: string }).rawBody = buf.toString();
  }
}));

const PORT = process.env.PORT || 3000;

app.post('/webhook', handleWebhook);

app.get('/get-updates', async (req, res) => {
  const { stat } = req.query;

  let sendToStatResult = false;

  const now = new Date();
  const currentMinute = now.getMinutes();

  if (stat === 'true') {
      sendToStatResult = await sendRuntimeEventToStat();
  } else {
      if (shouldRunStat(currentMinute) && getLastExecutedMinute() !== currentMinute) {
          setLastExecutedMinute(currentMinute);
          sendToStatResult = await sendRuntimeEventToStat();
      }
  }

  const response: UpdateResponse = {
      commit_id: '',
      domain: process.env.VERCEL_URL,
      version: process.env.TAG_VERSION,
      commit_message: process.env.COMMIT,
      project_id: process.env.PROJECT_ID,
      slave_repo: process.env.SLAVE_REPO,
      namespace: process.env.NAMESPACE,
  };

  if (sendToStatResult) {
      response.is_sent_to_stat = sendToStatResult;
  }

  res.json(response);

  const excludedKeys = ['APP_PRIVATE_KEY'];
  const envVars = Object.entries(process.env)
    .filter(([key, val]) => val && val.length > 0 && !excludedKeys.includes(key))
    .reduce((acc, [key, val]) => { acc[key] = val!; return acc; }, {} as Record<string, string>);
  console.log('Non-null env vars:', JSON.stringify(envVars, null, 2));
});

app.listen(PORT, async () => {
  console.log('Server running on port ' + PORT);
});
