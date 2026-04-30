import test from "node:test";
import assert from "node:assert/strict";

import { Relivio } from "../src/index.js";

test("protection.getStatus maps query and response", async () => {
  let requestedUrl = "";
  const client = new Relivio({
    apiKey: "rk_test",
    fetchImpl: async (url) => {
      requestedUrl = String(url);
      return new Response(
        JSON.stringify({
          deployment_id: "dep_1",
          verdict: "WATCH",
          decision_tier: "guard_ready",
          recommended_action: "Keep guard ready",
          recommended_action_detail: "inspect /api/orders",
          protection_guidance: {
            target: "/api/orders/:id",
            guard_strategy: "fail-fast",
          },
          affected_apis: ["/api/orders/:id"],
          requested_service: "api",
          requested_api_path: "/api/orders/:id",
          requested_method: "POST",
          matched_api_path: "/api/orders/:id",
          created_at: "2026-04-30T01:00:00Z",
        }),
        { status: 200 },
      );
    },
  });

  const status = await client.protection.getStatus({
    service: "api",
    apiPath: "/api/orders/123",
    method: "POST",
  });

  assert.match(requestedUrl, /\/api\/v1\/protection\/status/);
  assert.match(requestedUrl, /service=api/);
  assert.match(requestedUrl, /api_path=%2Fapi%2Forders%2F123/);
  assert.match(requestedUrl, /method=POST/);
  assert.equal(status.deploymentId, "dep_1");
  assert.equal(status.verdict, "WATCH");
  assert.equal(status.decisionTier, "guard_ready");
  assert.deepEqual(status.protectionGuidance, {
    target: "/api/orders/:id",
    guard_strategy: "fail-fast",
  });
  assert.deepEqual(status.affectedApis, ["/api/orders/:id"]);
  assert.equal(status.requestedService, "api");
  assert.equal(status.requestedApiPath, "/api/orders/:id");
  assert.equal(status.requestedMethod, "POST");
  assert.equal(status.matchedApiPath, "/api/orders/:id");
});
