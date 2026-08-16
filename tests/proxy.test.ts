import { describe, expect, it, vi } from "vitest";

import { createCheckoutSession } from "../src/checkout-session.js";
import { handleProxy } from "../src/proxy.js";
import type { MerchantSdk } from "../src/types.js";

function mockClient(overrides: Partial<MerchantSdk> = {}): MerchantSdk {
  return {
    countries: { list: vi.fn(async () => [{ code: "CD", name: "DR Congo" }]) },
    providers: { list: vi.fn(async () => []) },
    customers: { matchProvider: vi.fn(async () => ({ entity: "VODACOM_MPESA_COD" })) },
    amountLimits: { list: vi.fn(async () => []) },
    fees: { simulate: vi.fn(async () => ({ total_merchant_fee: "0" })) },
    checkoutPreferences: { get: vi.fn(async () => ({ primary_color: "#ff3366" })) },
    deposits: { create: vi.fn(async (payload) => ({ status: "PENDING", ...payload })) },
    status: { check: vi.fn(async () => ({ status: "PENDING" })) },
    refunds: { create: vi.fn(async () => ({ status: "PENDING" })) },
    webhooks: { verifyOrFail: vi.fn() },
    ...overrides,
  };
}

describe("handleProxy", () => {
  it("lists countries through the Node SDK", async () => {
    const client = mockClient();
    const session = createCheckoutSession({ shop: "demo.myshopify.com" });
    const result = await handleProxy(client, "GET", "countries", {}, {}, session);
    expect(result.status).toBe(200);
    expect(client.countries.list).toHaveBeenCalled();
  });

  it("locks deposit amount and reference", async () => {
    const client = mockClient();
    const session = createCheckoutSession({
      shop: "demo.myshopify.com",
      amount: "12.00",
      reference: "SH-1",
      lockAmount: true,
    });
    const result = await handleProxy(
      client,
      "POST",
      "deposits",
      {},
      { amount: "1.00", reference: "FORGED", currency: "USD", provider_code: "VODACOM_MPESA_COD" },
      session,
    );
    expect(result.status).toBe(200);
    expect(client.deposits.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: "12.00", reference: "SH-1" }),
      "SH-1",
    );
  });

  it("rejects unknown paths", async () => {
    const result = await handleProxy(mockClient(), "GET", "invented", {}, {}, createCheckoutSession({ shop: "x" }));
    expect(result.status).toBe(400);
  });
});
