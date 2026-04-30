export interface ProtectionStatusInput {
  service?: string | null;
  apiPath?: string | null;
  method?: string | null;
  deploymentId?: string | null;
}

export interface ProtectionStatusResponse {
  deploymentId: string;
  verdict: string | null;
  decisionTier: string | null;
  recommendedAction: string | null;
  recommendedActionDetail: string | null;
  protectionGuidance: Record<string, unknown> | null;
  affectedApis: string[];
  requestedService: string | null;
  requestedApiPath: string | null;
  requestedMethod: string | null;
  matchedApiPath: string | null;
  createdAt: string;
}

export interface WireProtectionStatusResponse {
  deployment_id: string;
  verdict?: string | null;
  decision_tier?: string | null;
  recommended_action?: string | null;
  recommended_action_detail?: string | null;
  protection_guidance?: Record<string, unknown> | null;
  affected_apis: unknown[];
  requested_service?: string | null;
  requested_api_path?: string | null;
  requested_method?: string | null;
  matched_api_path?: string | null;
  created_at: string;
}
