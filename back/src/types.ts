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
}

export interface StatPayload {
  projectId: string;
  namespace: string;
  stage: string;
  eventData: string;
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
  git_tag: string
}