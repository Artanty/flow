const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(process.cwd(), '.env') });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { handleWebhook } = require('./src/webhook');
const {
  sendRuntimeEventToStat,
  startStatInterval,
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

const PORT = process.env.PORT || 3000;

app.post('/webhook', handleWebhook);

app.get('/get-updates', async (req: Request, res: Response) => {
  const { stat } = req.query;

  let sendToStatResult = false;

  if (stat === 'true') {
      sendToStatResult = await sendRuntimeEventToStat();
  }

  const response: UpdateResponse = {
      domain: process.env.VERCEL_URL,
      version: process.env.TAG_VERSION,
      commit_id: process.env.COMMIT_ID,
      commit_message: process.env.COMMIT,
      project_id: process.env.PROJECT_ID,
      slave_acc: process.env.SLAVE_ACC,
      slave_repo: process.env.SLAVE_REPO,
      namespace: process.env.NAMESPACE,
  };

  if (sendToStatResult) {
      response.is_sent_to_stat = sendToStatResult;
  }

  res.json(response);
});

app.listen(PORT, async () => {
  console.log('Server running on port ' + PORT);
  startStatInterval();
});
