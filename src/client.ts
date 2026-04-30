import { CaptureResource } from "./capture.js";
import { HttpTransport } from "./http.js";
import { DeploymentsResource } from "./resources/deployments.js";
import { IngestResource } from "./resources/ingest.js";
import { ProtectionResource } from "./resources/protection.js";
import { VerdictsResource } from "./resources/verdicts.js";
import { RelivioStatsStore, type RelivioStatsSnapshot } from "./stats.js";
import { resolveOptions, type RelivioOptions } from "./types/options.js";

export class Relivio {
  readonly capture: CaptureResource;
  readonly deployments: DeploymentsResource;
  readonly ingest: IngestResource;
  readonly protection: ProtectionResource;
  readonly verdicts: VerdictsResource;
  private readonly statsStore: RelivioStatsStore;

  constructor(options: RelivioOptions) {
    const resolved = resolveOptions(options);
    const http = new HttpTransport(resolved);
    this.statsStore = new RelivioStatsStore();
    this.deployments = new DeploymentsResource(http);
    this.ingest = new IngestResource(http);
    this.protection = new ProtectionResource(http);
    this.verdicts = new VerdictsResource(http);
    this.capture = new CaptureResource(this.ingest, this.statsStore);
  }

  stats(): RelivioStatsSnapshot {
    return this.status();
  }

  status(): RelivioStatsSnapshot {
    return this.statsStore.snapshot();
  }

  async captureException(
    ...args: Parameters<CaptureResource["captureException"]>
  ): Promise<void> {
    await this.capture.captureException(...args);
  }
}
