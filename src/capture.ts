import type { IngestResource } from "./resources/ingest.js";
import type { RelivioStatsStore } from "./stats.js";
import type { LogLevel } from "./types/ingest.js";
import type { TraceIdProvider } from "./types/options.js";

export interface CaptureExceptionOptions {
  service?: string;
  level?: LogLevel;
  apiPath?: string;
  traceId?: string;
}

export interface CaptureResourceDefaults {
  defaultService?: string;
  traceIdProvider?: TraceIdProvider;
}

export class CaptureResource {
  private readonly ingest: IngestResource;
  private readonly stats: RelivioStatsStore;
  private readonly defaultService: string | undefined;
  private readonly traceIdProvider: TraceIdProvider | undefined;

  constructor(
    ingest: IngestResource,
    stats: RelivioStatsStore,
    defaults: CaptureResourceDefaults = {},
  ) {
    this.ingest = ingest;
    this.stats = stats;
    this.defaultService = defaults.defaultService;
    this.traceIdProvider = defaults.traceIdProvider;
  }

  async captureException(
    reason: unknown,
    options: CaptureExceptionOptions = {},
  ): Promise<void> {
    const error = normalizeError(reason);
    this.stats.recordCapturedEvent();

    const service = options.service ?? this.defaultService;
    const traceId = options.traceId ?? this.resolveTraceId();

    try {
      await this.ingest.send({
        level: options.level ?? "ERROR",
        message: error.message,
        stacktrace: error.stack,
        service,
        apiPath: options.apiPath,
        traceId,
        errorType: error.name,
      });
    } catch (sendError) {
      this.stats.recordCaptureSendFailure(sendError);
    }
  }

  private resolveTraceId(): string | undefined {
    const provider = this.traceIdProvider;
    if (!provider) {
      return undefined;
    }
    try {
      const value = provider();
      if (typeof value !== "string") {
        return undefined;
      }
      return value || undefined;
    } catch {
      return undefined;
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
