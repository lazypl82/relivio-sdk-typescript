import { collectDeploymentMetadata } from "../environment.js";
import type { HttpTransport } from "../http.js";
import type {
  RegisterDeploymentInput,
  RegisterDeploymentResponse,
  WireDeploymentResponse,
} from "../types/deployments.js";

export class DeploymentsResource {
  private readonly http: HttpTransport;

  constructor(http: HttpTransport) {
    this.http = http;
  }

  async register(
    input?: RegisterDeploymentInput,
  ): Promise<RegisterDeploymentResponse> {
    const raw = await this.http.request<WireDeploymentResponse>({
      method: "POST",
      path: "/api/v1/deployments",
      body: {
        version: input?.version ?? null,
        note: input?.note ?? null,
        metadata: input?.metadata ?? null,
      },
      idempotencyKey: input?.idempotencyKey,
    });

    return {
      id: raw.id,
      deploymentId: raw.deployment_id ?? raw.id,
      version: raw.version,
      summaryScheduled: raw.summary_scheduled,
    };
  }

  async registerFromEnvironment(
    input?: RegisterDeploymentInput,
  ): Promise<RegisterDeploymentResponse> {
    const metadata = {
      ...collectDeploymentMetadata(),
      ...(input?.metadata ?? {}),
    };
    return this.register({
      ...input,
      version:
        input?.version ??
        metadata.commit_sha ??
        metadata.package_version ??
        null,
      metadata,
    });
  }
}
