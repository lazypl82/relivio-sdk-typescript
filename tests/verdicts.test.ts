import test from "node:test";
import assert from "node:assert/strict";

import { Relivio } from "../src/index.js";

test("verdicts.latest returns minimal guard surface", async () => {
  const client = new Relivio({
    apiKey: "rk_test",
    fetchImpl: async (url) => {
      assert.equal(new URL(url).pathname, "/api/v1/summaries/latest");
      return new Response(
        JSON.stringify({
          id: "sum_1",
          deployment_id: "dep_1",
          verdict: "WATCH",
          decision_tier: "guard_ready",
          recommended_action: "Keep guard ready",
          recommended_action_detail: "inspect /api/orders/finalize",
          affected_apis: ["/api/orders/finalize"],
          top_signals: ["service concentration HHI=0.50"],
          created_at: "2026-04-21T12:00:00Z",
        }),
        { status: 200 },
      );
    },
  });

  const result = await client.verdicts.latest();
  assert.ok(result !== null);
  assert.equal(result?.deploymentId, "dep_1");
  assert.equal(result?.decisionTier, "guard_ready");
  assert.deepEqual(result?.topSignals, ["service concentration HHI=0.50"]);
});

test("verdicts.latest passes deployment id query", async () => {
  const client = new Relivio({
    apiKey: "rk_test",
    fetchImpl: async (url) => {
      const parsed = new URL(url);
      assert.equal(parsed.pathname, "/api/v1/summaries/latest");
      assert.equal(parsed.searchParams.get("deployment_id"), "dep_2");

      return new Response(
        JSON.stringify({
          id: "sum_2",
          deployment_id: "dep_2",
          verdict: "RISK",
          decision_tier: "block_recommended",
          recommended_action: "Pause rollout",
          recommended_action_detail: "inspect /api/orders/finalize first",
          affected_apis: ["/api/orders/finalize"],
          top_signals: ["dominant route concentration"],
          created_at: "2026-04-21T12:05:00Z",
        }),
        { status: 200 },
      );
    },
  });

  const result = await client.verdicts.latest({ deploymentId: "dep_2" });
  assert.ok(result !== null);
  assert.equal(result?.deploymentId, "dep_2");
  assert.equal(result?.verdict, "RISK");
});

test("verdicts.latest returns null on 404", async () => {
  const client = new Relivio({
    apiKey: "rk_test",
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          error: {
            code: "SUMMARY_NOT_FOUND",
            message: "Summary not available yet",
            request_id: "req_404",
          },
        }),
        { status: 404 },
      ),
  });

  const result = await client.verdicts.latest();
  assert.equal(result, null);
});

