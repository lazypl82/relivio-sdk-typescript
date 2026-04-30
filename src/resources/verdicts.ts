import { RelivioApiError } from "../errors.js";
import type { HttpTransport } from "../http.js";
import type {
  LatestVerdictInput,
  VerdictResponse,
  WireVerdictResponse,
} from "../types/verdicts.js";

export class VerdictsResource {
  private readonly http: HttpTransport;

  constructor(http: HttpTransport) {
    this.http = http;
  }

  async latest(input?: LatestVerdictInput): Promise<VerdictResponse | null> {
    try {
      const raw = await this.http.request<WireVerdictResponse>({
        method: "GET",
        path: "/api/v1/summaries/latest",
        params: input?.deploymentId
          ? { deployment_id: input.deploymentId }
          : undefined,
      });
      return mapVerdict(raw);
    } catch (error) {
      if (error instanceof RelivioApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }
}

function mapVerdict(raw: WireVerdictResponse): VerdictResponse {
  return {
    id: raw.id,
    verdict: raw.verdict ?? null,
    decisionTier: raw.decision_tier ?? null,
    recommendedAction: raw.recommended_action ?? null,
    actionDetail: raw.recommended_action_detail ?? null,
    affectedApis: raw.affected_apis.filter((value) => typeof value === "string"),
    topSignals: raw.top_signals.filter((value) => typeof value === "string"),
    deploymentId: raw.deployment_id,
    createdAt: raw.created_at,
  };
}

