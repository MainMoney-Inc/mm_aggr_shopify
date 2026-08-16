import type { MerchantSdk } from "./types.js";

export type AggregatorWebhook = {
  merchant_reference?: string;
  status?: string;
  transaction_id?: string;
};

export function verifyAggregatorWebhook(
  client: MerchantSdk,
  rawBody: string,
  signature: string,
  secret: string,
): AggregatorWebhook {
  client.webhooks.verifyOrFail(rawBody, signature, secret);
  const decoded = JSON.parse(rawBody) as unknown;
  if (decoded === null || typeof decoded !== "object" || Array.isArray(decoded)) {
    throw new Error("Webhook body must be a JSON object");
  }
  return decoded as AggregatorWebhook;
}

export function isPaid(status: string | undefined): boolean {
  return (status ?? "").toUpperCase() === "SUCCESS";
}

export function isFailed(status: string | undefined): boolean {
  const normalized = (status ?? "").toUpperCase();
  return normalized === "FAILED" || normalized === "CANCELLED" || normalized === "CANCELED" || normalized === "EXPIRED";
}
