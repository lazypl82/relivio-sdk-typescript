export type DecisionTier =
  | "inform"
  | "observe"
  | "guard_ready"
  | "rollback_ready"
  | "block_recommended";

export interface LatestVerdictInput {
  deploymentId?: string;
}

export interface VerdictResponse {
  id: string;
  verdict: string | null;
  decisionTier: DecisionTier | null;
  recommendedAction: string | null;
  actionDetail: string | null;
  affectedApis: string[];
  topSignals: string[];
  deploymentId: string;
  createdAt: string;
}

export interface WireVerdictResponse {
  id: string;
  verdict?: string | null;
  decision_tier?: DecisionTier | null;
  recommended_action?: string | null;
  recommended_action_detail?: string | null;
  affected_apis: unknown[];
  top_signals: unknown[];
  deployment_id: string;
  created_at: string;
}

