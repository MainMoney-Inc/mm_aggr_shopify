import path from "node:path";
import { fileURLToPath } from "node:url";

import { createApp } from "./app.js";
import { MemoryCheckoutSessionStore } from "./checkout-session.js";
import { createMerchantClient } from "./create-client.js";
import { SettingsStore } from "./settings-store.js";

const host = process.env.HOST ?? "http://localhost:3000";
const encryptionSecret = process.env.SHOPIFY_API_SECRET ?? "dev-only-not-for-production";
const sqlitePath = process.env.SQLITE_PATH ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/shopify.sqlite");

const app = createApp({
  settings: new SettingsStore(sqlitePath, encryptionSecret),
  sessions: new MemoryCheckoutSessionStore(),
  encryptionSecret,
  host,
  createClient: createMerchantClient,
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`MainMoney Shopify app listening on ${port}`);
});
