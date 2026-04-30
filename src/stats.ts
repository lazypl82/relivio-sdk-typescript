export interface RelivioStatsSnapshot {
  capturedEvents: number;
  captureSendFailures: number;
  lastCaptureError: string | null;
}

export class RelivioStatsStore {
  private capturedEvents = 0;
  private captureSendFailures = 0;
  private lastCaptureError: string | null = null;

  recordCapturedEvent(): void {
    this.capturedEvents += 1;
  }

  recordCaptureSendFailure(error: unknown): void {
    this.captureSendFailures += 1;
    this.lastCaptureError = describeUnknownError(error);
  }

  snapshot(): RelivioStatsSnapshot {
    return {
      capturedEvents: this.capturedEvents,
      captureSendFailures: this.captureSendFailures,
      lastCaptureError: this.lastCaptureError,
    };
  }
}

function describeUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
