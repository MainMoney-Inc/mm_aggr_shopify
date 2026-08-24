import { createHmac } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), "../.env") });

const secret = process.env.SHOPIFY_API_SECRET ?? "";
const shop = process.env.SHOPIFY_STORE ?? "";
const host = (process.env.HOST ?? "http://127.0.0.1:3000").replace(/\/+$/, "");
const amount = process.argv[2] ?? "25.00";
const currency = process.argv[3] ?? "USD";
const reference = process.argv[4] ?? `SH-${Date.now()}`;

if (secret === "" || shop === "") {
  console.error("Set SHOPIFY_API_SECRET and SHOPIFY_STORE in .env");
  process.exit(1);
}

const sig = createHmac("sha256", secret).update(`${shop}:${amount}:${currency}:${reference}`).digest("hex");
const url = `${host}/pay?shop=${encodeURIComponent(shop)}&amount=${encodeURIComponent(amount)}&currency=${encodeURIComponent(currency)}&reference=${encodeURIComponent(reference)}&sig=${sig}`;
console.log(url);
