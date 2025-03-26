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
const SAFE_URL = process.env.SAFE_URL

const ignoredRepos = [
  'githooklib', 
  'githooklib-test',
  'bash',
  'snt',
  'host',
  'typlib',
  'http-request-action',
  'shell',
  'netlify',
  'free-chat',
  'room',
  'aparta',
  'frames',
  'laravel-angular-auth',
  'test_front_ang_utube',
  'alibi-react-ui-lib',
  'test_back_lara',
  'cell',
  'tval',
  'forgot',
  'papakarla',
  'folders',
  'doctrinizer',
  'lara_horizon',
  'tamashi',
  'gear',
  'php_oop',
  'grapesJS',
  'serf', '_dump'];
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

  // if (/ -d(;|$)/.test(commitMessage)) {
  //   return res.status(200).send('Event ignored (-d)');
  // }

  if (signature !== calculatedSignature) {
    return res.status(401).send('Invalid signature');
  }

  // Handle version tag pushes (e.g., v12.23.55.32)
  if (eventType === 'push' && req.body.ref.startsWith('refs/tags/v') && !ignoredRepos.includes(repo_name)) {
    handleTag(req, res, repo_name)
  }

  else if (eventType === 'push' && req.body.ref === 'refs/heads/master' && !ignoredRepos.includes(repo_name)) {
    handlePushMaster(req, res, repo_name, commitMessage)
  } 
  
  else {
    res.status(200).send('Event ignored');
  }
});

async function handlePushMaster (req, res, repo_name, commitMessage) {
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
        SAFE_URL
      );
    }
  }
  return res.status(200).send('Workflow triggered');
}

async function handleTag (req, res, repo_name) {
  const newTag = req.body.ref.replace('refs/tags/', '');

  // Validate tag format
  if (!isValidVersionTag(newTag)) {
    return res.status(400).send('Invalid version tag format. Expected: vN.N.N.N');
  }

  // Fetch previous valid tag (skip non-version tags)
  const { data: tags } = await octokit.repos.listTags({
    owner: req.body.repository.owner.login,
    repo: repo_name,
    per_page: 10
  });
  const prevTag = tags.find(t => t.name !== newTag && isValidVersionTag(t.name))?.name;

  // Determine namespaces to trigger
  const namespaces = getNamespacesToTrigger(newTag, prevTag);
  if (namespaces.length === 0) {
    return res.status(200).send(`No version increase in ${prevTag || 'any component'}`);
  }

  // Trigger workflows for selected namespaces
  for (const namespace of namespaces) {
    if (!ignoredNamespaces[repo_name]?.includes(namespace)) {
      await triggerWorkflow(
        namespace,
        repo_name,
        `TAG: ${newTag}`,
        APP_GIT_PAT,
        SAFE_URL
      );
    }
  }

  return res.status(200).send(`Workflows triggered for: ${namespaces.join(', ')}`);
}

// Check if tag matches 'v' followed by 4 numbers (e.g., v12.23.55.32)
function isValidVersionTag(tag) {
  return /^v\d+\.\d+\.\d+\.\d+$/.test(tag);
}

// Compare two valid tags to determine which namespaces to trigger
// 12.23.55.32
// 12 - backend package.json minor version
// 23 - backend commit count
// 55 - frontend package.json minor version
// 23 - frontend commit count
function getNamespacesToTrigger(newTag, prevTag) {
  const [new1, new2, new3, new4] = newTag.replace('v', '').split('.').map(Number);
  const [prev1, prev2, prev3, prev4] = prevTag?.replace('v', '').split('.').map(Number) || [0, 0, 0, 0];

  const namespaces = [];
  if (new1 > prev1 || new2 > prev2) namespaces.push('back');
  if (new3 > prev3 || new4 > prev4) namespaces.push('web');
  return namespaces;
}

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