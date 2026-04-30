export interface RelivioOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  fetchImpl?: typeof fetch;
}

export interface ResolvedOptions {
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  fetchImpl: typeof fetch;
}

export function resolveOptions(options: RelivioOptions): ResolvedOptions {
  const apiKey = options.apiKey.trim();
  if (!apiKey) {
    throw new Error("apiKey is required");
  }

  const baseUrl = (options.baseUrl ?? "https://api.relivio.dev").trim().replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("baseUrl must be non-empty");
  }

  const timeoutMs = options.timeoutMs ?? 10_000;
  if (timeoutMs <= 0) {
    throw new Error("timeoutMs must be positive");
  }

  const maxRetries = options.maxRetries ?? 3;
  if (maxRetries < 0) {
    throw new Error("maxRetries must be >= 0");
  }

  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error("fetchImpl is required");
  }

  return {
    apiKey,
    baseUrl,
    timeoutMs,
    maxRetries,
    fetchImpl,
  };
}

