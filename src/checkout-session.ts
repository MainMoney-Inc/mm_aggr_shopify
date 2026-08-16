import { randomBytes } from "node:crypto";

import type { CheckoutSession } from "./types.js";

export function createCheckoutSession(input: {
  shop: string;
  amount?: string | null;
  currency?: string | null;
  reference?: string | null;
  lockAmount?: boolean;
  ttlSeconds?: number;
}): CheckoutSession {
  const amount = input.amount?.trim() ? input.amount.trim() : null;
  const currency = input.currency?.trim() ? input.currency.trim() : null;
  const reference = input.reference?.trim() ? input.reference.trim() : `SH-${randomBytes(8).toString("hex")}`;
  return {
    token: randomBytes(32).toString("hex"),
    shop: input.shop,
    reference,
    amount,
    currency,
    lockAmount: input.lockAmount === true,
    expiresAt: Date.now() + (input.ttlSeconds ?? 1800) * 1000,
  };
}

export class MemoryCheckoutSessionStore {
  private readonly sessions = new Map<string, CheckoutSession>();

  save(session: CheckoutSession): void {
    this.sessions.set(session.token, session);
  }

  find(token: string): CheckoutSession | null {
    const session = this.sessions.get(token);
    if (session === undefined || session.expiresAt <= Date.now()) {
      this.sessions.delete(token);
      return null;
    }
    return session;
  }
}
