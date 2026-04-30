export type LogLevel = "ERROR" | "WARN";

export interface IngestLogInput {
  level: LogLevel;
  message: string;
  stacktrace?: string | null;
  service?: string | null;
  apiPath?: string | null;
  traceId?: string | null;
  errorType?: string | null;
  idempotencyKey?: string;
}

export interface IngestLogResponse {
  status: "accepted";
  logEventId: string;
}

export interface IngestBatchInput {
  logs: Array<Omit<IngestLogInput, "idempotencyKey">>;
  idempotencyKey?: string;
}

export interface IngestBatchResponse {
  status: "accepted";
  acceptedCount: number;
  logEventIds: string[];
}

export interface WireIngestLogInput {
  level: LogLevel;
  message: string;
  stacktrace: string | null;
  service: string | null;
  api_path: string | null;
  trace_id: string | null;
  error_type: string | null;
}

export interface WireIngestLogResponse {
  status: "accepted";
  log_event_id: string;
}

export interface WireIngestBatchResponse {
  status: "accepted";
  accepted_count: number;
  log_event_ids: string[];
}

