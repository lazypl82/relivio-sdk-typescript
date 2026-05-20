# relivio

Primitive TypeScript client for Relivio deploy registration, ingest, and exception capture.

## Status

- current package scope: `0.2.0`
- supported runtime: `Node.js 20+`
- current public surface:
  - `deployments.register()`
  - `deployments.registerFromEnvironment()`
  - `ingest.send()`
  - `ingest.sendBatch()`
  - `captureException()`
  - `protection.getStatus()`
  - `verdicts.latest()`
  - `status()`
- automatic retry only for `429 RATE_LIMITED`

## Non-goals

- full verdict consumer surface
- feedback/history/list/search APIs
- framework integration
- guard or middleware implementation
- broad auto instrumentation or metric collection
- request object parsing

## Installation

```bash
npm install relivio
```

For local development:

```bash
npm install
```

## Quick Start

```ts
import { IngestLogInput, Relivio } from "relivio";

const relivio = new Relivio({ apiKey: "rk_..." });

const deployment = await relivio.deployments.register({ version: "1.2.3" });
console.log(deployment.deploymentId);

const result = await relivio.ingest.send({
  level: "ERROR",
  message: "checkout failed",
  apiPath: "/api/orders/finalize",
} satisfies IngestLogInput);
console.log(result.logEventId);

const verdict = await relivio.verdicts.latest();
if (verdict !== null) {
  console.log(verdict.verdict, verdict.decisionTier);
}
```

Capture exceptions explicitly from the boundary that already knows the safe path/context:

```ts
try {
  await runUsecase();
} catch (error) {
  await relivio.captureException(error, {
    service: "checkout-api",
    apiPath: "/api/orders/:id",
    traceId: "req_123",
  });
  throw error;
}
```

If `service` and `traceId` are repetitive across calls, set them once at client init. They apply only to `captureException` — explicit `ingest.send()` payloads are passed through unchanged.

```ts
import { AsyncLocalStorage } from "node:async_hooks";

const requestContext = new AsyncLocalStorage<{ requestId: string }>();

const relivio = new Relivio({
  apiKey: "rk_...",
  defaultService: "checkout-api",
  traceIdProvider: () => requestContext.getStore()?.requestId,
});

// Per-call only apiPath needs to be passed.
await relivio.captureException(error, { apiPath: req.path });
```

Read protection status explicitly from guard code:

```ts
const status = await relivio.protection.getStatus({
  service: "checkout-api",
  apiPath: "/api/orders/:id",
  method: "POST",
});

console.log(status.decisionTier, status.matchedApiPath);
```

## Development

```bash
npm install
npm run build
npm test
npm run pack:check
```

## Behavior Notes

- API key is sent through `X-API-Key`
- `Idempotency-Key` is supported for v0 writer endpoints
- 429 responses are retried with `Retry-After`
- 5xx responses are not retried
- server can accept gzip payloads, but SDK v0 sends plain JSON only
- SDK code never receives framework request objects
- `captureException()` is an ingest helper, not a framework adapter
- `captureException()` swallows Relivio delivery failures and records them in local `status()`
- `protection.getStatus()` is a thin read over `/api/v1/protection/status`; it does not make block/allow decisions
- `verdicts.latest()` is intentionally narrow and only exists to support service-side guard logic
- `verdicts.latest()` returns `null` on 404 when a verdict is not available yet
- `status()` reports SDK self-diagnostics locally; it does not send host metrics to Relivio

## Security

Do not commit project API keys. Keep `X-API-Key` values in environment variables or local secret storage outside source control.

## Contributing

Small, behavior-preserving changes are preferred. Keep transport, resource, type, and error responsibilities separate, and run the smallest effective test/build checks before sending a change.
