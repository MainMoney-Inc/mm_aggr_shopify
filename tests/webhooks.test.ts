import { createHmac } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { decryptSecret, encryptSecret } from "../src/settings-store.js";
import { isFailed, isPaid, verifyAggregatorWebhook } from "../src/webhooks.js";
import type { MerchantSdk } from "../src/types.js";

describe("aggregator webhooks", () => {
  it("verifies HMAC and decodes the body", () => {
    const raw = '{"merchant_reference":"SH-1","status":"SUCCESS"}';
    const secret = "whsec";
    const signature = createHmac("sha256", secret).update(raw, "utf8").digest("hex");
    const client = {
      webhooks: { verifyOrFail: vi.fn() },
    } as unknown as MerchantSdk;
    const payload = verifyAggregatorWebhook(client, raw, signature, secret);
    expect(client.webhooks.verifyOrFail).toHaveBeenCalledWith(raw, signature, secret);
    expect(payload.merchant_reference).toBe("SH-1");
    expect(isPaid(payload.status)).toBe(true);
    expect(isFailed("EXPIRED")).toBe(true);
  });
});

describe("settings encryption", () => {
  it("round-trips secrets", () => {
    const secret = "shopify-api-secret";
    const encoded = encryptSecret("mm-secret", secret);
    expect(encoded).not.toContain("mm-secret");
    expect(decryptSecret(encoded, secret)).toBe("mm-secret");
  });
});
