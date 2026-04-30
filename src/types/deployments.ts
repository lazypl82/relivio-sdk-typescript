export interface RegisterDeploymentInput {
  version?: string | null;
  note?: string | null;
  metadata?: Record<string, string> | null;
  idempotencyKey?: string;
}

export interface RegisterDeploymentResponse {
  id: string;
  version: string | null;
  summaryScheduled: boolean;
}

export interface WireDeploymentResponse {
  id: string;
  version: string | null;
  summary_scheduled: boolean;
}

