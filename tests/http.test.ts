import test from "node:test";
import assert from "node:assert/strict";

import { Relivio } from "../src/index.js";
import { RelivioApiError } from "../src/errors.js";

test("http retries 429 until success", async () => {
  let calls = 0;

  const client = new Relivio({
    apiKey: "rk_test",
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) {
        return new Response(
          JSON.stringify({
            error: {
              code: "RATE_LIMITED",
              message: "slow down",
              request_id: "req_1",
            },
          }),
          {
            status: 429,
            headers: { "Retry-After": "0" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          id: "dep_1",
          version: "1.0.0",
          summary_scheduled: true,
        }),
        { status: 201 },
      );
    },
  });

  const result = await client.deployments.register({ version: "1.0.0" });
  assert.equal(result.id, "dep_1");
  assert.equal(calls, 2);
});

test("http raises after retry budget exhausted", async () => {
  let calls = 0;

  const client = new Relivio({
    apiKey: "rk_test",
    maxRetries: 3,
    fetchImpl: async () => {
      calls += 1;
      return new Response(
        JSON.stringify({
          error: {
            code: "RATE_LIMITED",
            message: "retry later",
            request_id: "req_2",
          },
        }),
        {
          status: 429,
          headers: { "Retry-After": "0" },
        },
      );
    },
  });

  await assert.rejects(
    async () => client.deployments.register(),
    (error: unknown) => {
      assert.ok(error instanceof RelivioApiError);
      assert.equal(error.status, 429);
      assert.equal(error.code, "RATE_LIMITED");
      return true;
    },
  );

  assert.equal(calls, 4);
});

