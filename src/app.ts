import { createHmac, timingSafeEqual } from "node:crypto";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import express, { type Request, type Response } from "express";

import { createCheckoutSession, MemoryCheckoutSessionStore } from "./checkout-session.js";
import { payPageHtml } from "./pay-html.js";
import { handleProxy } from "./proxy.js";
import { SettingsStore } from "./settings-store.js";
import type { MerchantSdk, MerchantSettings } from "./types.js";
import { isFailed, isPaid, verifyAggregatorWebhook } from "./webhooks.js";

export type AppDeps = {
  settings: SettingsStore;
  sessions: MemoryCheckoutSessionStore;
  encryptionSecret: string;
  host: string;
  createClient: (settings: MerchantSettings) => MerchantSdk;
  markOrder?: (shop: string, reference: string, status: string, transactionId?: string) => Promise<void>;
};

const here = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(here, "../assets");

function bearerToken(req: Request): string | null {
  const header = req.header("authorization") ?? "";
  const match = /Bearer\s+(\S+)/i.exec(header);
  return match?.[1] ?? null;
}

export function createApp(deps: AppDeps): express.Express {
  const app = express();
  const createClient = deps.createClient;
  app.use(express.json({ verify: (req, _res, buf) => {
    (req as Request & { rawBody?: string }).rawBody = buf.toString("utf8");
  } }));
  app.use(express.urlencoded({ extended: false }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/", (_req, res) => {
    res.type("html").send(`<!DOCTYPE html>
<html><body>
  <h1>MainMoney</h1>
  <p>Configure merchant credentials for this shop. Secrets are stored encrypted and never sent to checkout UI.</p>
  <form method="post" action="/settings">
    <label>Shop domain <input name="shop" required /></label><br />
    <label>Client ID <input name="clientId" required /></label><br />
    <label>API secret <input name="secret" type="password" required /></label><br />
    <label><input name="test" type="checkbox" value="1" /> Test mode</label><br />
    <label>Base URI override <input name="baseUri" /></label><br />
    <label>Webhook secret <input name="webhookSecret" type="password" required /></label><br />
    <button type="submit">Save</button>
  </form>
  <p>Aggregator webhook URL: ${deps.host}/webhooks/aggregator</p>
  <p>Native Shopify payment-method listing requires Payments App approval. This app is for Partner development stores.</p>
</body></html>`);
  });

  app.post("/settings", (req, res) => {
    const shop = String(req.body.shop ?? "").trim();
    if (shop === "") {
      res.status(400).send("shop is required");
      return;
    }
    deps.settings.save({
      shop,
      clientId: String(req.body.clientId ?? ""),
      secret: String(req.body.secret ?? ""),
      test: req.body.test === "1" || req.body.test === true,
      baseUri: String(req.body.baseUri ?? "").trim() || null,
      webhookSecret: String(req.body.webhookSecret ?? ""),
    });
    res.redirect("/");
  });

  app.post("/payments/session", (req, res) => {
    const shop = String(req.body.shop ?? req.header("x-shop-domain") ?? "").trim();
    if (shop === "") {
      res.status(400).json({ message: "shop is required" });
      return;
    }
    const session = createCheckoutSession({
      shop,
      amount: typeof req.body.amount === "string" ? req.body.amount : null,
      currency: typeof req.body.currency === "string" ? req.body.currency : null,
      reference: typeof req.body.reference === "string" ? req.body.reference : null,
      lockAmount: req.body.lockAmount !== false,
    });
    deps.sessions.save(session);
    res.json({
      merchantBackendUrl: `${deps.host}/payments`,
      clientToken: session.token,
      pollUrl: `${deps.host}/payments/status`,
      pollHeaders: { Authorization: `Bearer ${session.token}` },
      amount: session.amount,
      lockAmount: session.lockAmount,
      reference: session.reference,
      targetId: "mm-aggr-checkout",
    });
  });

  const proxyHandler = async (req: Request, res: Response): Promise<void> => {
    const token = bearerToken(req);
    if (token === null) {
      res.status(401).json({ message: "Missing checkout session token" });
      return;
    }
    const session = deps.sessions.find(token);
    if (session === null) {
      res.status(401).json({ message: "Invalid checkout session" });
      return;
    }
    const settings = deps.settings.find(session.shop);
    if (settings === null) {
      res.status(503).json({ message: "MainMoney is not configured for this shop" });
      return;
    }
    const route = req.path.replace(/^\/payments\/?/, "");
    const query: Record<string, string> = {};
    for (const [name, value] of Object.entries(req.query)) {
      if (typeof value === "string") {
        query[name] = value;
      }
    }
    const body = req.body !== null && typeof req.body === "object" && !Array.isArray(req.body)
      ? (req.body as Record<string, unknown>)
      : {};
    const result = await handleProxy(createClient(settings), req.method, route, query, body, session);
    res.status(result.status).json(result.body);
  };

  app.get(/^\/payments\/.+/, (req, res, next) => {
    if (req.path === "/payments/session") {
      next();
      return;
    }
    void proxyHandler(req, res);
  });
  app.post(/^\/payments\/.+/, (req, res, next) => {
    if (req.path === "/payments/session") {
      next();
      return;
    }
    void proxyHandler(req, res);
  });

  app.post("/webhooks/aggregator", async (req, res) => {
    const shop = String(req.query.shop ?? req.header("x-shop-domain") ?? "").trim();
    if (shop === "") {
      res.status(400).json({ message: "shop is required" });
      return;
    }
    const settings = deps.settings.find(shop);
    if (settings === null || settings.webhookSecret === "") {
      res.status(503).json({ message: "Webhook secret is not configured" });
      return;
    }
    const rawBody = (req as Request & { rawBody?: string }).rawBody ?? JSON.stringify(req.body ?? {});
    try {
      const payload = verifyAggregatorWebhook(
        createClient(settings),
        rawBody,
        String(req.header("x-webhook-signature") ?? ""),
        settings.webhookSecret,
      );
      if (deps.markOrder !== undefined && payload.merchant_reference !== undefined) {
        await deps.markOrder(shop, payload.merchant_reference, payload.status ?? "", payload.transaction_id);
      }
      res.json({ received: true, paid: isPaid(payload.status), failed: isFailed(payload.status) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid webhook";
      res.status(401).json({ message });
    }
  });

  app.post("/webhooks/shopify/uninstalled", (req, res) => {
    const shop = String(req.body.shop_domain ?? req.header("x-shopify-shop-domain") ?? "").trim();
    if (shop !== "") {
      deps.settings.delete(shop);
    }
    res.status(200).send("ok");
  });

  app.get("/pay", (req, res) => {
    const shop = String(req.query.shop ?? "").trim();
    const signature = String(req.query.sig ?? "");
    const amount = String(req.query.amount ?? "");
    const currency = String(req.query.currency ?? "");
    const reference = String(req.query.reference ?? "");
    const expected = createHmac("sha256", deps.encryptionSecret)
      .update(`${shop}:${amount}:${currency}:${reference}`)
      .digest("hex");
    if (shop === "" || signature === "" || expected.length !== signature.length
      || !timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signature, "utf8"))) {
      res.status(401).send("Invalid pay link");
      return;
    }
    const session = createCheckoutSession({
      shop,
      amount: amount || null,
      currency: currency || null,
      reference: reference || null,
      lockAmount: true,
    });
    deps.sessions.save(session);
    const config = {
      merchantBackendUrl: `${deps.host}/payments`,
      clientToken: session.token,
      pollUrl: `${deps.host}/payments/status`,
      pollHeaders: { Authorization: `Bearer ${session.token}` },
      amount: session.amount,
      lockAmount: true,
      reference: session.reference,
      targetId: "mm-aggr-checkout",
    };
    res.type("html").send(payPageHtml(JSON.stringify(config)));
  });

  app.get("/checkout.js", (_req, res) => {
    res.type("application/javascript");
    createReadStream(path.join(assetsDir, "checkout.js")).pipe(res);
  });
  app.get("/checkout.css", (_req, res) => {
    res.type("text/css");
    createReadStream(path.join(assetsDir, "checkout.css")).pipe(res);
  });

  return app;
}

export function signPayLink(secret: string, shop: string, amount: string, currency: string, reference: string): string {
  return createHmac("sha256", secret).update(`${shop}:${amount}:${currency}:${reference}`).digest("hex");
}
