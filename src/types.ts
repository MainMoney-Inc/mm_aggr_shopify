/** Shared SDK surface used by the Shopify app. */

export type JsonObject = Record<string, unknown>;

export type MerchantSdk = {
  countries: { list: (query?: Record<string, string | number | boolean | null>) => Promise<unknown> };
  providers: { list: (query?: Record<string, string | number | boolean | null>) => Promise<unknown> };
  customers: { matchProvider: (accountNumber: string, getLookup?: boolean) => Promise<unknown> };
  amountLimits: { list: (query?: Record<string, string | number | boolean | null>) => Promise<unknown> };
  fees: { simulate: (payload: JsonObject) => Promise<unknown> };
  checkoutPreferences: { get: () => Promise<unknown> };
  deposits: { create: (payload: JsonObject, idempotencyKey?: string | null) => Promise<unknown> };
  status: { check: (operationType: string, reference: string) => Promise<unknown> };
  refunds: { create: (payload: JsonObject, idempotencyKey?: string | null) => Promise<unknown> };
  webhooks: { verifyOrFail: (rawBody: string, signature: string, secret: string) => void };
};

export type MerchantSettings = {
  shop: string;
  clientId: string;
  secret: string;
  test: boolean;
  baseUri: string | null;
  webhookSecret: string;
};

export type CheckoutSession = {
  token: string;
  shop: string;
  reference: string;
  amount: string | null;
  currency: string | null;
  lockAmount: boolean;
  expiresAt: number;
};

export type ProxyResult = { status: number; body: unknown };
