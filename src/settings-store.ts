import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { MerchantSettings } from "./types.js";

function keyFromSecret(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plain: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFromSecret(secret), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSecret(payload: string, secret: string): string {
  const buffer = Buffer.from(payload, "base64");
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", keyFromSecret(secret), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export class SettingsStore {
  private readonly db: DatabaseSync;

  constructor(
    private readonly sqlitePath: string,
    private readonly encryptionSecret: string,
  ) {
    mkdirSync(dirname(sqlitePath), { recursive: true });
    this.db = new DatabaseSync(sqlitePath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS merchant_settings (
        shop TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        secret_enc TEXT NOT NULL,
        test INTEGER NOT NULL DEFAULT 0,
        base_uri TEXT,
        webhook_secret_enc TEXT NOT NULL
      );
    `);
  }

  save(settings: MerchantSettings): void {
    this.db.prepare(`
      INSERT INTO merchant_settings (shop, client_id, secret_enc, test, base_uri, webhook_secret_enc)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(shop) DO UPDATE SET
        client_id = excluded.client_id,
        secret_enc = excluded.secret_enc,
        test = excluded.test,
        base_uri = excluded.base_uri,
        webhook_secret_enc = excluded.webhook_secret_enc
    `).run(
      settings.shop,
      settings.clientId,
      encryptSecret(settings.secret, this.encryptionSecret),
      settings.test ? 1 : 0,
      settings.baseUri,
      encryptSecret(settings.webhookSecret, this.encryptionSecret),
    );
  }

  find(shop: string): MerchantSettings | null {
    const row = this.db.prepare("SELECT * FROM merchant_settings WHERE shop = ?").get(shop) as
      | {
          shop: string;
          client_id: string;
          secret_enc: string;
          test: number;
          base_uri: string | null;
          webhook_secret_enc: string;
        }
      | undefined;
    if (row === undefined) {
      return null;
    }
    return {
      shop: row.shop,
      clientId: row.client_id,
      secret: decryptSecret(row.secret_enc, this.encryptionSecret),
      test: row.test === 1,
      baseUri: row.base_uri,
      webhookSecret: decryptSecret(row.webhook_secret_enc, this.encryptionSecret),
    };
  }

  delete(shop: string): void {
    this.db.prepare("DELETE FROM merchant_settings WHERE shop = ?").run(shop);
  }
}
