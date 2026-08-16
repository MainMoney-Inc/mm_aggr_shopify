import type { CheckoutSession, MerchantSdk, ProxyResult } from "./types.js";

export async function handleProxy(
  client: MerchantSdk,
  method: string,
  route: string,
  query: Record<string, string>,
  body: Record<string, unknown>,
  session: CheckoutSession,
): Promise<ProxyResult> {
  try {
    const payload = await dispatch(client, method.toUpperCase(), route.replace(/^\/+|\/+$/g, ""), query, body, session);
    return { status: 200, body: payload };
  } catch (error) {
    const status = typeof (error as { statusCode?: unknown }).statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : 400;
    const message = error instanceof Error ? error.message : "Merchant backend request failed";
    return { status: status >= 400 ? status : 400, body: { message } };
  }
}

async function dispatch(
  client: MerchantSdk,
  method: string,
  route: string,
  query: Record<string, string>,
  body: Record<string, unknown>,
  session: CheckoutSession,
): Promise<unknown> {
  if (method === "GET" && route === "countries") {
    return client.countries.list();
  }
  if (method === "GET" && route === "providers") {
    return client.providers.list(query);
  }
  if (method === "GET" && route === "match-provider") {
    return client.customers.matchProvider(query.account_number ?? "", query.get_lookup === "true" || query.get_lookup === "1");
  }
  if (method === "GET" && route === "amount-limits") {
    return client.amountLimits.list(query);
  }
  if (method === "POST" && route === "fees/simulate") {
    return client.fees.simulate(body);
  }
  if (method === "GET" && route === "checkout-preferences") {
    return client.checkoutPreferences.get();
  }
  if (method === "POST" && route === "deposits") {
    const payload: Record<string, unknown> = { ...body, reference: session.reference };
    if (session.lockAmount && session.amount !== null) {
      payload.amount = session.amount;
    }
    return client.deposits.create(payload, session.reference);
  }
  if (method === "GET" && route === "status") {
    return client.status.check(query.operation || "deposit", query.reference || session.reference);
  }
  throw new Error("Unknown merchant backend path");
}
