# MainMoney for Shopify

Shopify app for MainMoney aggregator payments. The app server uses the
[Node.js SDK](https://github.com/MainMoney-Inc/mm_aggr_nodejs_sdk). Checkout
and the hosted `/pay` page use the
[JS/TS frontend SDK](https://github.com/MainMoney-Inc/mm_aggr_js_sdk).

Listing MainMoney as a native Shopify payment method requires Shopify Payments
App approval. This repository is a Partner **development-store** app, not an
App Store submission.

## Requirements

- Node.js 22 or later (24 recommended)
- A Shopify Partner account and development store
- A merchant application on MM Aggregator

## Install

1. Copy `.env.example` to `.env`. Set `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`,
   and `HOST`. Never put those values in `shopify.app.toml`.
2. `npm install` then `npm run build` (bundles the JS checkout into `assets/`).
3. `npm run dev` (or `shopify app dev` once the Partner app is linked).
4. Open the embedded app and save Client ID, API secret, Test mode, and webhook
   secret. They are stored encrypted in SQLite.
5. In the aggregator admin, set the merchant webhook URL to
   `https://your-app.example/webhooks/aggregator?shop=your-shop.myshopify.com`.

The checkout UI extension imports `createCheckout` from `@mainmoney/js-checkout`
and calls this app’s `/payments` proxy (`DEFAULT_PATHS`). Stores without
checkout extensibility can use the HMAC-signed `/pay` page.

Do not put merchant API keys in the extension or theme JavaScript.

## License

Copyright (c) 2026 MainMoney SARL. Licensed under the PolyForm Noncommercial
License 1.0.0. Commercial use requires permission from MainMoney SARL.
See [LICENSE](LICENSE).

Want to contribute? See [CONTRIBUTING.md](CONTRIBUTING.md).
