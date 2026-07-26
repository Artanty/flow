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
  slave_repo?: string;
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
  repository: {
    name: string;
    owner: {
      login: string;
    };
  };
  head_commit: {
    message: string;
    modified: string[];
    added: string[];
  };
}
