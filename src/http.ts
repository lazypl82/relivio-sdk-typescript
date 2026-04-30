import {
  RelivioApiError,
  RelivioNetworkError,
  RelivioTimeoutError,
} from "./errors.js";
import type { ErrorPayload } from "./types/errors.js";
import type { ResolvedOptions } from "./types/options.js";

type JsonObject = Record<string, unknown>;

interface HttpRequestOptions {
  method: "GET" | "POST";
  path: string;
  body?: unknown;
  idempotencyKey?: string;
  params?: Record<string, string>;
}

export class HttpTransport {
  private readonly config: ResolvedOptions;

  constructor(config: ResolvedOptions) {
    this.config = config;
  }

  async request<T>(options: HttpRequestOptions): Promise<T> {
    const maxAttempts = this.config.maxRetries + 1;
    const url = this.buildUrl(options.path, options.params);

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      let response: Response;

      try {
        response = await this.config.fetchImpl(url, {
          method: options.method,
          headers: this.buildHeaders(options.idempotencyKey),
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: AbortSignal.timeout(this.config.timeoutMs),
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "TimeoutError") {
          throw new RelivioTimeoutError(this.config.timeoutMs);
        }
        throw new RelivioNetworkError(error);
      }

      if (response.status === 429 && attempt < this.config.maxRetries) {
        await sleep(this.retryDelayMs(response));
        continue;
      }

      return this.parseResponse<T>(response);
    }

    throw new Error("unreachable");
  }

  private buildHeaders(idempotencyKey?: string): Headers {
    const headers = new Headers({
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-Key": this.config.apiKey,
    });

    if (idempotencyKey) {
      headers.set("Idempotency-Key", idempotencyKey);
    }

    return headers;
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(`${this.config.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }

  private retryDelayMs(response: Response): number {
    const raw = response.headers.get("Retry-After");
    const seconds = raw === null ? 1 : Number.parseFloat(raw);
    const normalized = Number.isFinite(seconds) ? seconds : 1;
    return Math.max(0, Math.min(normalized, 30)) * 1000;
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const payload = await parseJsonBody(response);

    if (response.ok) {
      if (isJsonObject(payload)) {
        return payload as T;
      }
      throw new RelivioApiError(
        "Relivio API returned an invalid JSON payload.",
        response.status,
        "INVALID_RESPONSE",
        null,
      );
    }

    const error = isJsonObject(payload) ? payload.error : undefined;
    if (isErrorPayload(error)) {
      throw new RelivioApiError(
        error.message,
        response.status,
        error.code,
        error.request_id ?? null,
      );
    }

    throw new RelivioApiError(
      `Relivio API request failed with status ${response.status}.`,
      response.status,
      "UNKNOWN_ERROR",
      null,
    );
  }
}

async function parseJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new RelivioApiError(
      "Relivio API returned invalid JSON.",
      502,
      "INVALID_RESPONSE",
      null,
    );
  }
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isErrorPayload(value: unknown): value is ErrorPayload {
  if (!isJsonObject(value)) {
    return false;
  }

  return (
    typeof value.code === "string" &&
    typeof value.message === "string" &&
    (typeof value.request_id === "string" || value.request_id === undefined)
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
