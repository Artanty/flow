const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { handleWebhook } = require('./src/webhook');
const {
  sendRuntimeEventToStat,
  shouldRunStat,
  getLastExecutedMinute,
  setLastExecutedMinute,
} = require('./src/stat');
import type { UpdateResponse } from './src/types';
import type { Request, Response } from 'express';

const app = express();
app.use(cors());
app.use(bodyParser.json({
  verify: (req: Request, _res: Response, buf: Buffer) => {
    (req as Request & { rawBody?: string }).rawBody = buf.toString();
  }
}));

dotenv.config({ path: path.join(process.cwd(), '.env') });

const PORT = process.env.PORT || 3000;

app.post('/webhook', handleWebhook);

app.get('/get-updates', async (req: Request, res: Response) => {
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
