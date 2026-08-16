import { createSession } from "@mainmoney/js-core";
import { createCheckout, mountCheckout } from "@mainmoney/js-checkout";

type CheckoutBootConfig = {
  merchantBackendUrl: string;
  clientToken: string;
  pollUrl: string;
  pollHeaders: Record<string, string>;
  locale?: "en" | "fr";
  amount?: string | null;
  lockAmount?: boolean;
  reference?: string;
  targetId?: string;
  logoUrl?: string;
};

declare global {
  interface Window {
    mmAggrCheckouts?: CheckoutBootConfig[];
  }
}

async function mountOne(cfg: CheckoutBootConfig): Promise<void> {
  const root = document.getElementById(cfg.targetId ?? "mm-aggr-checkout");
  if (root === null) {
    return;
  }
  const session = createSession({
    merchantBackendUrl: cfg.merchantBackendUrl,
    clientToken: cfg.clientToken,
    locale: cfg.locale ?? "en",
  });
  const checkout = createCheckout(session, {
    operation: "deposit",
    pollUrl: cfg.pollUrl,
    pollHeaders: cfg.pollHeaders,
    amount: cfg.amount ?? undefined,
    lockAmount: cfg.lockAmount === true,
    reference: cfg.reference,
  });
  await checkout.loadCountries();
  mountCheckout(root, checkout, cfg.logoUrl !== undefined ? { logoUrl: cfg.logoUrl } : {});
}

function boot(): void {
  const configs = window.mmAggrCheckouts ?? [];
  for (const cfg of configs) {
    void mountOne(cfg);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
