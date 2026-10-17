import { createHash } from "node:crypto";

import type { ProxyCache } from "./proxy-cache.js";
import type { CheckoutSession, MerchantSdk, ProxyResult } from "./types.js";

export async function handleProxy(
  client: MerchantSdk,
  method: string,
  route: string,
  query: Record<string, string>,
  body: Record<string, unknown>,
  session: CheckoutSession,
  cache?: { store: ProxyCache; scope: string },
): Promise<ProxyResult> {
  try {
    const payload = await dispatch(client, method.toUpperCase(), route.replace(/^\/+|\/+$/g, ""), query, body, session, cache);
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
  cache?: { store: ProxyCache; scope: string },
): Promise<unknown> {
  const remember = <T>(load: () => Promise<T>): Promise<T> =>
    cache === undefined ? load() : cache.store.remember(cache.scope, route, query, load);
  if (method === "GET" && route === "countries") {
    return remember(() => client.countries.list());
  }
  if (method === "GET" && route === "providers") {
    return remember(() => client.providers.list(query));
  }
  if (method === "GET" && route === "match-provider") {
    return remember(() =>
      client.customers.matchProvider(query.account_number ?? "", query.get_lookup === "true" || query.get_lookup === "1"),
    );
  }
  if (method === "GET" && route === "amount-limits") {
    return remember(() => client.amountLimits.list(query));
  }
  if (method === "POST" && route === "fees/simulate") {
    return client.fees.simulate(pinnedCurrency(withoutBrowserFeeFields(body), session));
  }
  if (method === "GET" && route === "checkout-preferences") {
    return remember(() => client.checkoutPreferences.get());
  }
  if (method === "POST" && route === "deposits") {
    const retry = retryNumber(body.reference, session);
    const payload: Record<string, unknown> = {
      ...pinnedCurrency(withoutBrowserFeeFields(body), session),
      reference: retry > 0 ? `${session.reference}-r${retry}` : session.reference,
    };
    if (session.lockAmount && session.amount !== null) {
      payload.amount = session.amount;
    }
    return client.deposits.create(payload, idempotencyKey(session, retry));
  }
  if (method === "GET" && route === "status") {
    return client.status.check(query.operation || "deposit", query.reference || session.reference);
  }
  throw new Error("Unknown merchant backend path");
}

/**
 * One key per checkout session and per retry attempt: the same body replays the first answer, while a retry
 * (new phone number, new reference) gets a new key instead of a 409.
 */
export function idempotencyKey(session: CheckoutSession, retry = 0): string {
  const base = `mm-${createHash("sha256").update(session.token).digest("hex").slice(0, 32)}`;
  return retry > 0 ? `${base}-r${retry}` : base;
}

/** The widget retries a failed deposit as `<reference>-r<N>`; any other browser reference is ignored. */
function retryNumber(browserReference: unknown, session: CheckoutSession): number {
  if (typeof browserReference !== "string" || !browserReference.startsWith(`${session.reference}-r`)) {
    return 0;
  }
  const suffix = browserReference.slice(session.reference.length + 2);
  return /^[1-9]\d{0,2}$/.test(suffix) ? Number(suffix) : 0;
}

/** The session's currency is the amount's: the browser may only choose how the customer pays (payment_currency). */
function pinnedCurrency(body: Record<string, unknown>, session: CheckoutSession): Record<string, unknown> {
  return session.currency !== null ? { ...body, currency: session.currency } : body;
}

/** Fees are merchant-controlled: the browser may not choose the merchant fee or who bears the fees. */
function withoutBrowserFeeFields(body: Record<string, unknown>): Record<string, unknown> {
  const { fees: _fees, fee_bearer: _feeBearer, ...rest } = body;
  return rest;
}
