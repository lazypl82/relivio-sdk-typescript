import test from "node:test";
import assert from "node:assert/strict";

import { Relivio } from "../src/index.js";

test("captureException maps error to ingest and swallows success", async () => {
  const requests: unknown[] = [];
  const client = new Relivio({
    apiKey: "rk_test",
    fetchImpl: async (_url, init) => {
      requests.push(JSON.parse(String(init?.body)));
      return new Response(
        JSON.stringify({
          status: "accepted",
          log_event_id: "log_1",
        }),
        { status: 202 },
      );
    },
  });

  await client.captureException(new TypeError("boom"), {
    service: "checkout-api",
    apiPath: "/api/orders/123",
    traceId: "trace_1",
  });

  assert.equal(requests.length, 1);
  const request = requests[0] as { stacktrace: unknown };
  assert.equal(typeof request.stacktrace, "string");
  assert.deepEqual({ ...request, stacktrace: "<stack>" }, {
    level: "ERROR",
    message: "boom",
    stacktrace: "<stack>",
    service: "checkout-api",
    api_path: "/api/orders/123",
    trace_id: "trace_1",
    error_type: "TypeError",
  });
  assert.equal(client.status().capturedEvents, 1);
  assert.equal(client.status().captureSendFailures, 0);
});

test("captureException normalizes non-error reasons", async () => {
  let captured: unknown = null;
  const client = new Relivio({
    apiKey: "rk_test",
    fetchImpl: async (_url, init) => {
      captured = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          status: "accepted",
          log_event_id: "log_1",
        }),
        { status: 202 },
      );
    },
  });

  await client.captureException("rejected");

  const request = captured as { stacktrace: unknown };
  assert.equal(typeof request.stacktrace, "string");
  assert.deepEqual({ ...request, stacktrace: "<stack>" }, {
    level: "ERROR",
    message: "rejected",
    stacktrace: "<stack>",
    service: null,
    api_path: null,
    trace_id: null,
    error_type: "Error",
  });
  assert.equal(client.status().capturedEvents, 1);
});

test("capture failures stay inside sdk status", async () => {
  const client = new Relivio({
    apiKey: "rk_test",
    fetchImpl: async () => {
      throw new Error("network down");
    },
  });

  await client.captureException(new Error("captured"));

  const status = client.status();
  assert.equal(status.capturedEvents, 1);
  assert.equal(status.captureSendFailures, 1);
  assert.match(status.lastCaptureError ?? "", /Network request failed/);
});
