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

test("captureException uses defaultService when caller omits service", async () => {
  let captured: { service: unknown } | null = null;
  const client = new Relivio({
    apiKey: "rk_test",
    defaultService: "checkout-api",
    fetchImpl: async (_url, init) => {
      captured = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({ status: "accepted", log_event_id: "log_default" }),
        { status: 202 },
      );
    },
  });

  await client.captureException(new Error("boom"), { apiPath: "/api/orders" });

  assert.equal(captured?.service, "checkout-api");
});

test("explicit service overrides defaultService", async () => {
  let captured: { service: unknown } | null = null;
  const client = new Relivio({
    apiKey: "rk_test",
    defaultService: "checkout-api",
    fetchImpl: async (_url, init) => {
      captured = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({ status: "accepted", log_event_id: "log_override" }),
        { status: 202 },
      );
    },
  });

  await client.captureException(new Error("boom"), { service: "orders-worker" });

  assert.equal(captured?.service, "orders-worker");
});

test("captureException uses traceIdProvider when caller omits traceId", async () => {
  let captured: { trace_id: unknown } | null = null;
  const client = new Relivio({
    apiKey: "rk_test",
    traceIdProvider: () => "trace_from_provider",
    fetchImpl: async (_url, init) => {
      captured = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({ status: "accepted", log_event_id: "log_trace" }),
        { status: 202 },
      );
    },
  });

  await client.captureException(new Error("boom"));

  assert.equal(captured?.trace_id, "trace_from_provider");
});

test("explicit traceId overrides traceIdProvider", async () => {
  let captured: { trace_id: unknown } | null = null;
  const client = new Relivio({
    apiKey: "rk_test",
    traceIdProvider: () => "from_provider",
    fetchImpl: async (_url, init) => {
      captured = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({ status: "accepted", log_event_id: "log_trace_override" }),
        { status: 202 },
      );
    },
  });

  await client.captureException(new Error("boom"), { traceId: "explicit_trace" });

  assert.equal(captured?.trace_id, "explicit_trace");
});

test("traceIdProvider exception is swallowed and falls back to null", async () => {
  let captured: { trace_id: unknown } | null = null;
  const client = new Relivio({
    apiKey: "rk_test",
    traceIdProvider: () => {
      throw new Error("provider broken");
    },
    fetchImpl: async (_url, init) => {
      captured = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({ status: "accepted", log_event_id: "log_trace_fallback" }),
        { status: 202 },
      );
    },
  });

  await client.captureException(new Error("boom"));

  assert.equal(captured?.trace_id, null);
  assert.equal(client.status().capturedEvents, 1);
});

test("ingest.send payload is not mutated by defaultService", async () => {
  let captured: { service: unknown } | null = null;
  const client = new Relivio({
    apiKey: "rk_test",
    defaultService: "checkout-api",
    fetchImpl: async (_url, init) => {
      captured = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({ status: "accepted", log_event_id: "log_passthrough" }),
        { status: 202 },
      );
    },
  });

  await client.ingest.send({
    level: "ERROR",
    message: "explicit ingest message",
  });

  assert.equal(captured?.service, null);
});
