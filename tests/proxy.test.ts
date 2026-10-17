import { describe, expect, it, vi } from "vitest";

import { createCheckoutSession } from "../src/checkout-session.js";
import { ProxyCache } from "../src/proxy-cache.js";
import { handleProxy, idempotencyKey } from "../src/proxy.js";
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

  it("does not let the browser set merchant fees or the fee bearer", async () => {
    const client = mockClient();
    const session = createCheckoutSession({ shop: "demo.myshopify.com", amount: "12.00", reference: "SH-2" });
    await handleProxy(
      client,
      "POST",
      "deposits",
      {},
      { amount: "12.00", currency: "USD", provider_code: "X", fees: "9.00", fee_bearer: "CUSTOMER" },
      session,
    );
    const created = vi.mocked(client.deposits.create).mock.calls[0][0];
    expect(created).not.toHaveProperty("fees");
    expect(created).not.toHaveProperty("fee_bearer");
    await handleProxy(client, "POST", "fees/simulate", {}, { amount: "12.00", fees: "9.00", fee_bearer: "CUSTOMER" }, session);
    const simulated = vi.mocked(client.fees.simulate).mock.calls[0][0];
    expect(simulated).not.toHaveProperty("fees");
    expect(simulated).not.toHaveProperty("fee_bearer");
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
      idempotencyKey(session),
    );
  });

  it("rejects unknown paths", async () => {
    const result = await handleProxy(mockClient(), "GET", "invented", {}, {}, createCheckoutSession({ shop: "x" }));
    expect(result.status).toBe(400);
  });

  it("derives the idempotency key from the session, not the reference", async () => {
    const client = mockClient();
    const session = createCheckoutSession({ shop: "demo.myshopify.com", amount: "12.00", reference: "SH-1", lockAmount: true });
    const other = createCheckoutSession({ shop: "demo.myshopify.com", amount: "12.00", reference: "SH-1", lockAmount: true });
    await handleProxy(client, "POST", "deposits", {}, { customer_phone: "1" }, session);
    await handleProxy(client, "POST", "deposits", {}, { customer_phone: "2", reference: "SH-1-r1" }, session);
    const calls = vi.mocked(client.deposits.create).mock.calls;
    expect(calls[0][1]).toBe(idempotencyKey(session));
    expect(calls[0][1]).not.toBe(session.reference);
    expect(calls[0][1]).not.toBe(idempotencyKey(other));
    expect(calls[1][1]).toBe(idempotencyKey(session, 1));
    expect(calls[1][0]).toMatchObject({ reference: "SH-1-r1" });
  });

  it("pins the session currency but lets payment_currency through", async () => {
    const client = mockClient();
    const session = createCheckoutSession({ shop: "demo.myshopify.com", amount: "12.00", currency: "EUR", lockAmount: true });
    await handleProxy(client, "POST", "deposits", {}, { currency: "CDF", payment_currency: "CDF" }, session);
    expect(vi.mocked(client.deposits.create).mock.calls[0][0]).toMatchObject({ currency: "EUR", payment_currency: "CDF" });
  });

  it("caches static lookups until the cache is flushed, never fee simulations", async () => {
    const client = mockClient();
    const session = createCheckoutSession({ shop: "demo.myshopify.com" });
    const cache = { store: new ProxyCache(), scope: "shop" };
    await handleProxy(client, "GET", "countries", {}, {}, session, cache);
    await handleProxy(client, "GET", "countries", {}, {}, session, cache);
    expect(client.countries.list).toHaveBeenCalledTimes(1);
    cache.store.flush();
    await handleProxy(client, "GET", "countries", {}, {}, session, cache);
    expect(client.countries.list).toHaveBeenCalledTimes(2);
    await handleProxy(client, "POST", "fees/simulate", {}, { amount: "1" }, session, cache);
    await handleProxy(client, "POST", "fees/simulate", {}, { amount: "1" }, session, cache);
    expect(client.fees.simulate).toHaveBeenCalledTimes(2);
    await handleProxy(client, "GET", "match-provider", { account_number: "1", get_lookup: "true" }, {}, session, cache);
    await handleProxy(client, "GET", "match-provider", { account_number: "1", get_lookup: "true" }, {}, session, cache);
    expect(client.customers.matchProvider).toHaveBeenCalledTimes(2);
  });

  it("expires cached entries after their TTL", async () => {
    let now = 0;
    const store = new ProxyCache(() => now);
    const load = vi.fn(async () => ["x"]);
    await store.remember("s", "match-provider", { account_number: "1" }, load);
    await store.remember("s", "match-provider", { account_number: "1" }, load);
    expect(load).toHaveBeenCalledTimes(1);
    now = 600_001;
    await store.remember("s", "match-provider", { account_number: "1" }, load);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
