import { Client } from "@mainmoney/sdk";

import type { MerchantSdk, MerchantSettings } from "./types.js";

export function createMerchantClient(settings: MerchantSettings): MerchantSdk {
  return new Client({
    clientId: settings.clientId,
    secret: settings.secret,
    baseUri: settings.baseUri ?? undefined,
    test: settings.test,
  });
}
