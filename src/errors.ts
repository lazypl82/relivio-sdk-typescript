export class RelivioError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RelivioError";
  }
}

export class RelivioApiError extends RelivioError {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | null;

  constructor(
    message: string,
    status: number,
    code: string,
    requestId: string | null,
  ) {
    super(message);
    this.name = "RelivioApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export class RelivioTimeoutError extends RelivioError {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = "RelivioTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export class RelivioNetworkError extends RelivioError {
  readonly cause: unknown;

  constructor(cause: unknown) {
    super("Network request failed");
    this.name = "RelivioNetworkError";
    this.cause = cause;
  }
}

