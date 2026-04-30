import type { HttpTransport } from "../http.js";
import type {
  ProtectionStatusInput,
  ProtectionStatusResponse,
  WireProtectionStatusResponse,
} from "../types/protection.js";

export class ProtectionResource {
  private readonly http: HttpTransport;

  constructor(http: HttpTransport) {
    this.http = http;
  }

  async getStatus(
    input: ProtectionStatusInput = {},
  ): Promise<ProtectionStatusResponse> {
    const raw = await this.http.request<WireProtectionStatusResponse>({
      method: "GET",
      path: "/api/v1/protection/status",
      params: toQuery(input),
    });

    return {
      deploymentId: raw.deployment_id,
      verdict: stringOrNull(raw.verdict),
      decisionTier: stringOrNull(raw.decision_tier),
      recommendedAction: stringOrNull(raw.recommended_action),
      recommendedActionDetail: stringOrNull(raw.recommended_action_detail),
      protectionGuidance: isObject(raw.protection_guidance)
        ? raw.protection_guidance
        : null,
      affectedApis: raw.affected_apis.filter(
        (item): item is string => typeof item === "string",
      ),
      requestedService: stringOrNull(raw.requested_service),
      requestedApiPath: stringOrNull(raw.requested_api_path),
      requestedMethod: stringOrNull(raw.requested_method),
      matchedApiPath: stringOrNull(raw.matched_api_path),
      createdAt: raw.created_at,
    };
  }
}

function toQuery(input: ProtectionStatusInput): Record<string, string> | undefined {
  const params: Record<string, string> = {};
  if (input.service) {
    params.service = input.service;
  }
  if (input.apiPath) {
    params.api_path = input.apiPath;
  }
  if (input.method) {
    params.method = input.method;
  }
  if (input.deploymentId) {
    params.deployment_id = input.deploymentId;
  }
  return Object.keys(params).length > 0 ? params : undefined;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
