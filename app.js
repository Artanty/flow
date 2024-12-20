import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import { Octokit } from '@octokit/rest';

dotenv.config();
const app = express();
app.use(bodyParser.json());

// GitHub App credentials
const APP_ID = process.env.APP_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = 'mysecret'

/**
 * req.headers['x-hub-signature-256'] - контрольная сумма payload'а.
 * состоит из:
 * const hmac = crypto.createHmac('sha256', 'your-webhook-secret').update(payload).digest('hex');
 */
app.post('/test', async (req, res) => {
  // console.log('PRIVATE_KEY')
  // console.log(PRIVATE_KEY)
  // console.log("crypto.createHmac('sha256', PRIVATE_KEY)")
  // console.log(crypto.createHmac('sha256', PRIVATE_KEY))
  console.log("crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex')")
  console.log(crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex'))
})
// Verify webhook signature
app.post('/webhook', async (req, res) => {
  const payload = JSON.stringify(req.body);
  const signature = req.headers['x-hub-signature-256'];
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
  
  console.log('local PRIVATE_KEY')
  console.log(PRIVATE_KEY)
  
  const calculatedSignature = `sha256=${hmac}`;

  console.log('calculatedSignature - контрольная сумма, посчитанная локально')
  console.log(calculatedSignature)

  console.log("signature - контрольная сумма, которая приходит в хэдере")
  console.log(signature)

  if (signature !== calculatedSignature) {
    return res.status(401).send('Invalid signature');
  }

  // Handle push event
  if (req.body.action === 'push' && req.body.ref === 'refs/heads/master') {
    const installationId = req.body.installation.id;
    const repo = req.body.repository.full_name;

    // Authenticate as the GitHub App
    const octokit = new Octokit({
      auth: `Bearer ${await getInstallationAccessToken(installationId)}`,
    });

    // Trigger workflow in the target repository
    await octokit.actions.createWorkflowDispatch({
      owner: 'Artanty', // Replace with the target repository owner
      repo: 'serf',   // Replace with the target repository name
      workflow_id: 'log.yaml', // Replace with the workflow file name
      ref: 'master', // Replace with the branch name in the target repository
      inputs: {
        source_repo: repo, // Pass the source repository as an input
      },
    });

    res.status(200).send('Workflow triggered');
  } else {
    res.status(200).send('Event ignored');
  }
});

// Get installation access token
async function getInstallationAccessToken(installationId) {
  const jwt = crypto.createHmac('sha256', PRIVATE_KEY).update(`${APP_ID}`).digest('hex');
  const octokit = new Octokit({ auth: `Bearer ${jwt}` });
  const { token } = await octokit.apps.createInstallationAccessToken({
    installation_id: installationId,
  });
  return token;
}

app.listen(PORT, () => console.log('Server running on port ' + PORT));