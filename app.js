import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import { Octokit } from '@octokit/rest';
import fs from 'fs'; // Import fs to check for folder existence

dotenv.config();
const app = express();
app.use(bodyParser.json());

// GitHub App credentials
const APP_ID = process.env.APP_ID;
const PRIVATE_KEY = process.env.APP_PRIVATE_KEY;
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.APP_WEBHOOK_SECRET;
const APP_GIT_PAT = process.env.APP_GIT_PAT;

const ignoredRepos = ['serf'];

const octokit = new Octokit({
  auth: APP_GIT_PAT,
});

async function triggerWorkflow(namespace, repo_name, commit_message, pat, safe_url) {

  await octokit.actions.createWorkflowDispatch({
    owner: 'Artanty', // Replace with the target repository owner
    repo: 'serf',     // Replace with the target repository name
    workflow_id: 'deploy.yml', // Replace with the workflow file name
    ref: 'master',    // Replace with the branch name in the target repository
    inputs: {
      repo_name: repo_name,
      commit_message: commit_message,
      pat: pat,
      safe_url: safe_url,
      namespace: namespace,
    },
  });
}

app.post('/webhook', async (req, res) => {
  console.log(process.env.SAFE_URL)
  const repo_name = req.body.repository.name;
  const payload = JSON.stringify(req.body);
  const signature = req.headers['x-hub-signature-256'];
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
  const calculatedSignature = `sha256=${hmac}`;
  const eventType = req.headers['x-github-event'];

  if (signature !== calculatedSignature) {
    return res.status(401).send('Invalid signature');
  }

  if (eventType === 'push' && req.body.ref === 'refs/heads/master' && !ignoredRepos.includes(repo_name)) {
    // Check if 'web' or 'back' folders exist in the repository
    const hasWebFolder = fs.existsSync('web');
    const hasBackFolder = fs.existsSync('back');

    // Get the list of files changed in the last commit
    const changedFiles = req.body.head_commit.modified.concat(req.body.head_commit.added);

    // Check if changes are inside 'web' or 'back' folders
    const webChanges = changedFiles.some(file => file.startsWith('web/'));
    const backChanges = changedFiles.some(file => file.startsWith('back/'));

    // Create an array of namespaces based on folder existence and changes
    const namespaces = [];
    if (hasWebFolder && webChanges) namespaces.push('web');
    if (hasBackFolder && backChanges) namespaces.push('back');
    if (!hasWebFolder && !hasBackFolder) namespaces.push('root');

    // Iterate over the namespaces and trigger the workflow
    for (const namespace of namespaces) {
      await triggerWorkflow(
        namespace === 'root' ? '' : namespace,
        repo_name,
        req.body.head_commit.message,
        APP_GIT_PAT,
        process.env.SAFE_URL
      );
    }

    res.status(200).send('Workflow triggered');
  } else {
    res.status(200).send('Event ignored');
  }
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));