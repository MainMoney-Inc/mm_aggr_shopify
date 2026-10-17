import { createSession } from "@mainmoneyapp/js-core";
import { createCheckout, mountCheckout } from "@mainmoneyapp/js-checkout";

type CheckoutBootConfig = {
  merchantBackendUrl: string;
  clientToken: string;
  pollUrl: string;
  pollHeaders: Record<string, string>;
  locale?: "en" | "fr";
  amount?: string | null;
  lockAmount?: boolean;
  reference?: string;
  /** Currency of `amount` (the order's); never changed by the widget. */
  currency?: string | null;
  customerEmail?: string | null;
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
    currency: cfg.currency ?? undefined,
    customerEmail: cfg.customerEmail ?? undefined,
  });
  // Mount first so the form shows while countries load.
  mountCheckout(root, checkout, cfg.logoUrl !== undefined ? { logoUrl: cfg.logoUrl } : {});
  await checkout.loadCountries();
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
