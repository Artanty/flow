import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';

import { App, createNodeMiddleware } from "octokit";
dotenv.config();
const app = express();
app.use(bodyParser.json());

// GitHub App credentials
const APP_ID = process.env.APP_ID;
const PRIVATE_KEY = process.env.APP_PRIVATE_KEY;
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.APP_WEBHOOK_SECRET
const APP_GIT_PAT = process.env.APP_GIT_PAT



const octokitApp = new App({
  appId: APP_ID,
  privateKey: PRIVATE_KEY,
  webhooks: {
    secret: WEBHOOK_SECRET
  },
});

async function handlePullRequestOpened({octokit, payload}) {
  console.log(payload);

  await octokit.actions.createWorkflowDispatch({
    owner: 'Artanty', // Replace with the target repository owner
    repo: 'serf',   // Replace with the target repository name
    workflow_id: 'log.yaml', // Replace with the workflow file name
    ref: 'master', // Replace with the branch name in the target repository
    inputs: {
      source_repo: repo, // Pass the source repository as an input
    },
  });

  // res.status(200).send('Workflow triggered');
};

app.webhooks.on("push", handlePullRequestOpened);

// This logs any errors that occur.
app.webhooks.onError((error) => {
  if (error.name === "AggregateError") {
    console.error(`Error processing request: ${error.event}`);
  } else {
    console.error(error);
  }
});


app.use(createNodeMiddleware(octokitApp));

app.listen(PORT, () => console.log('Server running on port ' + PORT));