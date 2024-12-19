import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import { Octokit } from '@octokit/rest';
import {App} from "octokit";
import {createNodeMiddleware} from "@octokit/webhooks";
import fs from "fs";
import http from "http";
dotenv.config();
// const app = express();
app.use(bodyParser.json());

// GitHub App credentials
const APP_ID = process.env.APP_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PORT = process.env.PORT || 3000;

const app2 = new App({
  appId: APP_ID,
  privateKey: PRIVATE_KEY
});

async function handlePullRequestOpened({octokit, payload}) {
  console.log(`Received a pull request event for #${payload.ref}`);
  try {
    console.log('tried')
  } catch (error) {
    if (error.response) {
      console.error(`Error! Status: ${error.response.status}. Message: ${error.response.data.message}`)
    }
    console.error(error)
  }
};

app2.webhooks.on("pull_request.opened", handlePullRequestOpened);

const middleware = createNodeMiddleware(app2.webhooks, {path});

http.createServer(middleware).listen(PORT, () => {
  
  console.log('Press Ctrl + C to quit.')
});
