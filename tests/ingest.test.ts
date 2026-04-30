import test from "node:test";
import assert from "node:assert/strict";

import { Relivio } from "../src/index.js";

test("ingest.send maps wire body and response", async () => {
  const client = new Relivio({
    apiKey: "rk_test",
    fetchImpl: async (url, init) => {
      assert.equal(new URL(url).pathname, "/api/v1/ingest/log");
      assert.equal(init?.method, "POST");
      assert.deepEqual(JSON.parse(String(init?.body)), {
        level: "ERROR",
        message: "checkout failed",
        stacktrace: null,
        service: "api",
        api_path: "/api/orders/finalize",
        trace_id: "trace_1",
        error_type: "RuntimeError",
      });

      return new Response(
        JSON.stringify({
          status: "accepted",
          log_event_id: "log_1",
        }),
        { status: 202 },
      );
    },
  });

  const result = await client.ingest.send({
    level: "ERROR",
    message: "checkout failed",
    service: "api",
    apiPath: "/api/orders/finalize",
    traceId: "trace_1",
    errorType: "RuntimeError",
  });

  assert.deepEqual(result, {
    status: "accepted",
    logEventId: "log_1",
  });
});

test("ingest.sendBatch maps response", async () => {
  const client = new Relivio({
    apiKey: "rk_test",
    fetchImpl: async (url, init) => {
      assert.equal(new URL(url).pathname, "/api/v1/ingest/logs");
      assert.equal(init?.method, "POST");

      return new Response(
        JSON.stringify({
          status: "accepted",
          accepted_count: 2,
          log_event_ids: ["log_1", "log_2"],
        }),
        { status: 202 },
      );
    },
  });

  const result = await client.ingest.sendBatch({
    logs: [
      {
        level: "ERROR",
        message: "first",
      },
      {
        level: "WARN",
        message: "second",
      },
    ],
  });

  assert.deepEqual(result, {
    status: "accepted",
    acceptedCount: 2,
    logEventIds: ["log_1", "log_2"],
  });
});

