export interface UpdateResponse {
  domain?: string;
  version?: string;
  commit_id?: string;
  commit_message?: string;
  project_id?: string;
  slave_acc?: string;
  slave_repo?: string;
  namespace?: string;
  is_sent_to_stat?: boolean;
  envs?: Record<string, boolean>;
}

export interface StatPayload {
  projectId: string;
  namespace: string;
  stage: string;
  eventData: string;
  workflowRunId?: string;
  // Deploy telemetry columns (stat AddEventBody): kebab-case milestone tags
  // accumulated through the run, and the FLOW_ERROR error flag.
  steps?: string[];
  isError?: boolean;
  commitMessage?: string;
}

export interface RuntimeEventPayload {
  repo_name: string;
  namespace: string;
  stage: string;
  commit: string;
  tag?: string;
  slave_repo?: string;
  data?: any;
  error?: unknown;
}

export interface SignatureResult {
  valid: boolean;
  error?: string;
  signature?: string;
  calculatedSignature?: string;
  rawBodyLength?: number;
  secretLength?: number;
}

export interface WebhookBody {
  ref: string;
  before: string;
  after: string;
  repository: {
    name: string;
    full_name: string;
    owner: {
      name: string;
      email: string;
      login: string;
      id: number;
    };
  };
  pusher: {
    name: string;
    email: string;
  };
  forced: boolean;
  created: boolean;
  deleted: boolean;
  base_ref: string | null;
  compare: string;
  commits: {
    id: string;
    message: string;
    timestamp: string;
    url: string;
    author: { name: string; email: string; username?: string };
    committer: { name: string; email: string; username?: string };
    added: string[];
    removed: string[];
    modified: string[];
  }[];
  head_commit: {
    id: string;
    message: string;
    timestamp: string;
    url: string;
    author: { name: string; email: string; username?: string };
    committer: { name: string; email: string; username?: string };
    added: string[];
    removed: string[];
    modified: string[];
  } | null;
}

export interface TriggerWorkflowProps {
  namespace: string,
  repo_name: string,
  commit_message: string,
  pat: string | undefined,
  safe_url: string | undefined,
  git_tag: string,
  key_back_url: string | undefined,
  run?: FlowRun,
  // callback path sets this: a cold safe there must NOT re-defer to noy (loop)
  skipDefer?: boolean
}

// noy wake-and-callback replay body (POST /dispatch-callback); token = APP_TRIGGER_RUN_TOKEN
export interface DispatchCallbackBody {
  token: string;
  repo_name: string;
  namespace: string;
  git_tag: string;
  commit_message: string;
}

// Run-scoped telemetry context (see src/runContext.ts): step tags accumulated
// through the webhook handling + fork data, flushed to stat as FLOW_* events.
export interface FlowRun {
  steps: string[];
  data: Record<string, unknown>;
  step: (name: string) => void;
  note: (key: string, value: unknown) => void;
  sendStart: () => void;
  sendEnd: () => void;
  sendError: (error: unknown) => void;
}

export interface RetriggerBody {
  project: string;
}

export interface RetriggerRun {
  id: number;
  name: string;
  status: string | null;
  html_url: string;
  event: string;
  created_at: string;
}

export interface RetriggerResponse {
  project: string;
  run: RetriggerRun;
  rerun: 'full';
}