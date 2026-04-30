import test from "node:test";
import assert from "node:assert/strict";

import { Relivio } from "../src/index.js";

test("client exposes resources", () => {
  const client = new Relivio({
    apiKey: "rk_test",
    fetchImpl: async () => new Response("{}"),
  });

  assert.ok(client.deployments);
  assert.ok(client.ingest);
  assert.ok(client.protection);
  assert.ok(client.verdicts);
  assert.ok(client.capture);
  assert.deepEqual(client.status(), {
    capturedEvents: 0,
    captureSendFailures: 0,
    lastCaptureError: null,
  });
  assert.deepEqual(client.stats(), client.status());
});

test("client rejects empty api key", () => {
  assert.throws(
    () =>
      new Relivio({
        apiKey: "  ",
        fetchImpl: async () => new Response("{}"),
      }),
    /apiKey is required/,
  );
});
