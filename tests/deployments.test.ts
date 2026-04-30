import test from "node:test";
import assert from "node:assert/strict";

import { Relivio } from "../src/index.js";
import { RelivioApiError } from "../src/errors.js";

test("deployments.register maps payload and response", async () => {
  const client = new Relivio({
    apiKey: "rk_test",
    fetchImpl: async (url, init) => {
      assert.equal(new URL(url).pathname, "/api/v1/deployments");
      assert.equal(init?.method, "POST");
      assert.equal(init?.headers instanceof Headers, true);
      const headers = init?.headers as Headers;
      assert.equal(headers.get("X-API-Key"), "rk_test");
      assert.equal(headers.get("Idempotency-Key"), "idem-1");
      assert.deepEqual(JSON.parse(String(init?.body)), {
        version: "1.2.3",
        note: "deploy note",
        metadata: { env: "prod" },
      });

      return new Response(
        JSON.stringify({
          id: "dep_1",
          version: "1.2.3",
          summary_scheduled: true,
        }),
        { status: 201 },
      );
    },
  });

  const result = await client.deployments.register({
    version: "1.2.3",
    note: "deploy note",
    metadata: { env: "prod" },
    idempotencyKey: "idem-1",
  });

  assert.deepEqual(result, {
    id: "dep_1",
    version: "1.2.3",
    summaryScheduled: true,
  });
});

test("deployments.register surfaces api errors", async () => {
  const client = new Relivio({
    apiKey: "rk_test",
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          error: {
            code: "INVALID_API_KEY",
            message: "bad key",
            request_id: "req_3",
          },
        }),
        { status: 401 },
      ),
  });

  await assert.rejects(
    async () => client.deployments.register(),
    (error: unknown) => {
      assert.ok(error instanceof RelivioApiError);
      assert.equal(error.status, 401);
      assert.equal(error.code, "INVALID_API_KEY");
      assert.equal(error.requestId, "req_3");
      return true;
    },
  );
});

test("deployments.registerFromEnvironment merges runtime metadata", async () => {
  const previousCommitSha = process.env.RELIVIO_COMMIT_SHA;
  process.env.RELIVIO_COMMIT_SHA = "abc123";

  const client = new Relivio({
    apiKey: "rk_test",
    fetchImpl: async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as {
        version: string | null;
        metadata: Record<string, string>;
      };
      assert.equal(body.version, "abc123");
      assert.equal(body.metadata.commit_sha, "abc123");
      assert.equal(body.metadata.runtime, "node");
      assert.equal(body.metadata.runtime_version, process.version);
      assert.equal(body.metadata.package_name, "relivio");
      assert.equal(body.metadata.explicit, "kept");

      return new Response(
        JSON.stringify({
          id: "dep_env",
          version: "abc123",
          summary_scheduled: true,
        }),
        { status: 201 },
      );
    },
  });

  try {
    const result = await client.deployments.registerFromEnvironment({
      metadata: { explicit: "kept" },
    });

    assert.equal(result.id, "dep_env");
  } finally {
    if (previousCommitSha === undefined) {
      delete process.env.RELIVIO_COMMIT_SHA;
    } else {
      process.env.RELIVIO_COMMIT_SHA = previousCommitSha;
    }
  }
});
