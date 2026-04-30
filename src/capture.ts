import type { IngestResource } from "./resources/ingest.js";
import type { RelivioStatsStore } from "./stats.js";
import type { LogLevel } from "./types/ingest.js";

export interface CaptureExceptionOptions {
  service?: string;
  level?: LogLevel;
  apiPath?: string;
  traceId?: string;
}

export class CaptureResource {
  private readonly ingest: IngestResource;
  private readonly stats: RelivioStatsStore;

  constructor(ingest: IngestResource, stats: RelivioStatsStore) {
    this.ingest = ingest;
    this.stats = stats;
  }

  async captureException(
    reason: unknown,
    options: CaptureExceptionOptions = {},
  ): Promise<void> {
    const error = normalizeError(reason);
    this.stats.recordCapturedEvent();

    try {
      await this.ingest.send({
        level: options.level ?? "ERROR",
        message: error.message,
        stacktrace: error.stack,
        service: options.service,
        apiPath: options.apiPath,
        traceId: options.traceId,
        errorType: error.name,
      });
    } catch (sendError) {
      this.stats.recordCaptureSendFailure(sendError);
    }
  }
}

function normalizeError(reason: unknown): Error {
  if (reason instanceof Error) {
    return reason;
  }

  const message =
    typeof reason === "string" ? reason : safeDescribe(reason);
  return new Error(message);
}

function safeDescribe(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}
