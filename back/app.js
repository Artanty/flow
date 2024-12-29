import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import { Octokit } from '@octokit/rest';

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.APP_WEBHOOK_SECRET;
const APP_GIT_PAT = process.env.APP_GIT_PAT;
const STAT_URL = process.env.STAT_URL;

const ignoredRepos = ['serf', '_dump'];
const ignoredNamespaces = {
  faq: ['web']
}

const octokit = new Octokit({
  auth: APP_GIT_PAT,
});

async function triggerWorkflow(namespace, repo_name, commit_message, pat, safe_url) {

  try {
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
        stat_url: STAT_URL,
      },
    });
    console.log(`Flow triggered for: ${repo_name}@${namespace}, commit: ${commit_message}`);
  } catch (error) {
    console.error(`Error triggering workflow for: ${repo_name}@${namespace}`, error);
  }
}

app.post('/webhook', async (req, res) => {
  const repo_name = req.body.repository.name;
  const payload = JSON.stringify(req.body);
  const signature = req.headers['x-hub-signature-256'];
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
  const calculatedSignature = `sha256=${hmac}`;
  const eventType = req.headers['x-github-event'];
  const commitMessage = req.body.head_commit.message.trim();

  if (/ -d(;|$)/.test(commitMessage)) {
    return res.status(200).send('Event ignored (-d)');
  }

  if (signature !== calculatedSignature) {
    return res.status(401).send('Invalid signature');
  }

  if (eventType === 'push' && req.body.ref === 'refs/heads/master' && !ignoredRepos.includes(repo_name)) {

    // Get the list of files changed in the last commit
    const changedFiles = req.body.head_commit.modified.concat(req.body.head_commit.added);

    // Determine which folders were affected by the changes
    const affectedFolders = new Set();
    changedFiles.forEach(file => {
      const folder = file.split('/')[0]; // Extract the first part of the file path as the folder
      if (folder) {
        affectedFolders.add(folder);
      }
    });

    // Create an array of namespaces based on folder existence and changes
    const namespaces = [];
    if (affectedFolders.has('web')) namespaces.push('web');
    if (affectedFolders.has('back')) namespaces.push('back');

    // Iterate over the namespaces and trigger the workflow
    for (const namespace of namespaces) {
      if (ignoredNamespaces[repo_name]?.includes(namespace)) {
        console.log(`${repo_name}@${namespace} IGNORED.`)
      } else {
        await triggerWorkflow(
          namespace,
          repo_name,
          commitMessage,
          APP_GIT_PAT,
          process.env.SAFE_URL
        );
      }
    }
    res.status(200).send('Workflow triggered');
  } else {
    res.status(200).send('Event ignored');
  }
});


async function sendRuntimeEventToStat(triggerIP) {
  try {
    const payload = {
      projectId: `${process.env.PROJECT_ID}@github`,
      namespace: process.env.NAMESPACE,
      stage: 'RUNTIME',
      eventData: JSON.stringify(
        {
          triggerIP: triggerIP,
          projectId: process.env.PROJECT_ID,
          slaveRepo: process.env.SLAVE_REPO,
          commit: process.env.COMMIT
        }
      )
    }
    await axios.post(`${process.env.STAT_URL}/add-event`, payload);
    console.log(`SENT TO @stat: ${process.env.PROJECT_ID}@github -> ${process.env.SLAVE_REPO} | ${process.env.COMMIT}`)
    return true
  } catch (error) {
    console.error('error in sendRuntimeEventToStat...');
    if (axios.isAxiosError(error)) {
      // Handle Axios-specific errors
      const axiosError = error; // as AxiosError
      console.error('Axios Error:', {
          message: axiosError.message,
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
      });
    } else {
        // Handle generic errors
        console.error('Unexpected Error:', error);
    }
    return false;
  }
}

// Function to check if the current minute is one of [0, 15, 30, 45]
function shouldRunStat(currentMinute) { // : boolean
  return [1, 15, 30, 45].includes(currentMinute);
}

// Global variable to track the last minute when sendRuntimeEventToStat was called
let lastExecutedMinute = null; // : number | null

//(req: Request, res: Response) => {
app.get('/get-updates', async (req, res) => {
  const clientIP = req.ip;

  // Parse URL parameters
  const { stat } = req.query;

  let sendToStatResult = false;

  // Get the current minute
  const now = new Date();
  const currentMinute = now.getMinutes();

  // Check if stat=true is in the URL params
  if (stat === 'true') {
      sendToStatResult = await sendRuntimeEventToStat(clientIP);
  } else {
      // If stat is not true, check the current time and whether the function was already called this minute
      if (shouldRunStat(currentMinute) && lastExecutedMinute !== currentMinute) {
          lastExecutedMinute = currentMinute; // Update the last executed minute
          sendToStatResult = await sendRuntimeEventToStat(clientIP);
      }
  }

  res.json({
      trigger: clientIP,
      PORT: process.env.PORT,
      isSendToStat: sendToStatResult,
  });
});

app.listen(PORT, async() => {
  console.log('Server running on port ' + PORT)
});