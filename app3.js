import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import { createNodeMiddleware, Webhooks } from '@octokit/webhooks';
import { Octokit } from '@octokit/rest';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// GitHub App credentials
const APP_ID = process.env.APP_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY; // The private key from the .pem file
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET; // The webhook secret you set in the GitHub App
const PORT = process.env.PORT || 3000;

// Create a webhooks API instance
const webhooks = new Webhooks({
  secret: WEBHOOK_SECRET, // Use the webhook secret from your GitHub App
});

// Use the webhook middleware in your Express app
app.use(createNodeMiddleware(webhooks));

// Handle push events
webhooks.on('push', async ({ id, name, payload }) => {
  console.log(`Received a push event for branch ${payload.ref}`);

  const installationId = payload.installation.id;
  const repo = payload.repository.full_name;

  // Authenticate as the GitHub App
  const octokit = new Octokit({
    auth: `Bearer ${await getInstallationAccessToken(installationId)}`,
  });

  // Handle the push event
  try {
    await handlePushEvent({ octokit, payload });
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

// Function to handle push events
async function handlePushEvent({ octokit, payload }) {
  console.log(`Received a push event for branch ${payload.ref}`);

  // Example: Trigger a workflow in the repository
  // try {
  //   await octokit.actions.createWorkflowDispatch({
  //     owner: payload.repository.owner.login,
  //     repo: payload.repository.name,
  //     workflow_id: 'log.yaml', // Replace with your workflow file name
  //     ref: payload.ref.replace('refs/heads/', ''), // Branch name
  //     inputs: {
  //       source_repo: payload.repository.full_name, // Pass the source repository as an input
  //     },
  //   });

  //   console.log('Workflow triggered successfully');
  // } catch (error) {
  //   if (error.response) {
  //     console.error(`Error! Status: ${error.response.status}. Message: ${error.response.data.message}`);
  //   }
  //   console.error(error);
  // }
}

// Get installation access token
async function getInstallationAccessToken(installationId) {
  // Create a JSON Web Token (JWT) for the GitHub App
  const jwt = crypto.createHmac('sha256', PRIVATE_KEY).update(`${APP_ID}`).digest('hex');

  // Authenticate as the GitHub App
  const octokit = new Octokit({ auth: `Bearer ${jwt}` });

  // Create an installation access token
  const { token } = await octokit.apps.createInstallationAccessToken({
    installation_id: installationId,
  });

  return token;
}

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));