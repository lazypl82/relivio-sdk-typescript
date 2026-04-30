import type { HttpTransport } from "../http.js";
import type {
  IngestBatchInput,
  IngestBatchResponse,
  IngestLogInput,
  IngestLogResponse,
  WireIngestBatchResponse,
  WireIngestLogInput,
  WireIngestLogResponse,
} from "../types/ingest.js";

export class IngestResource {
  private readonly http: HttpTransport;

  constructor(http: HttpTransport) {
    this.http = http;
  }

  async send(input: IngestLogInput): Promise<IngestLogResponse> {
    const raw = await this.http.request<WireIngestLogResponse>({
      method: "POST",
      path: "/api/v1/ingest/log",
      body: toWireLog(input),
      idempotencyKey: input.idempotencyKey,
    });

    return {
      status: raw.status,
      logEventId: raw.log_event_id,
    };
  }

  async sendBatch(input: IngestBatchInput): Promise<IngestBatchResponse> {
    const raw = await this.http.request<WireIngestBatchResponse>({
      method: "POST",
      path: "/api/v1/ingest/logs",
      body: {
        logs: input.logs.map(toWireLog),
      },
      idempotencyKey: input.idempotencyKey,
    });

    return {
      status: raw.status,
      acceptedCount: raw.accepted_count,
      logEventIds: raw.log_event_ids,
    };
  }
}

function toWireLog(input: IngestLogInput): WireIngestLogInput {
  return {
    level: input.level,
    message: input.message,
    stacktrace: input.stacktrace ?? null,
    service: input.service ?? null,
    api_path: input.apiPath ?? null,
    trace_id: input.traceId ?? null,
    error_type: input.errorType ?? null,
  };
}

