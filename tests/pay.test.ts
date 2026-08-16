import { describe, expect, it } from "vitest";

import { payPageHtml } from "../src/pay-html.js";
import { signPayLink } from "../src/app.js";

describe("hosted pay page", () => {
  it("embeds checkout config without a merchant API secret", () => {
    const html = payPageHtml(JSON.stringify({ clientToken: "abc", merchantBackendUrl: "https://app.example/payments" }));
    expect(html).toContain("checkout.js");
    expect(html).not.toContain("secret");
    expect(html).toContain("abc");
  });

  it("signs pay links", () => {
    const sig = signPayLink("dev-secret", "demo.myshopify.com", "10.00", "USD", "SH-1");
    expect(sig).toHaveLength(64);
  });
});
