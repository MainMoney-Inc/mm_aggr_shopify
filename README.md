# MainMoney for Shopify

Shopify app for MainMoney aggregator payments. The app server uses the
[Node.js SDK](https://github.com/MainMoney-Inc/mm_aggr_nodejs_sdk). Checkout
and storefront UI use the
[JS/TS frontend SDK](https://github.com/MainMoney-Inc/mm_aggr_js_sdk).

## Requirements

- Node.js 22 or later (24 recommended)
- A Shopify Partner account and store
- A merchant application on MM Aggregator

## Install

1. Create a Shopify app from this repository with Shopify CLI when you are ready
   to connect a Partner account.
2. Set aggregator URL and API credentials in the app's private environment
   (never in `shopify.app.toml` in git).
3. Install the app on your store.

## License

Copyright (c) 2026 MainMoney SARL. Licensed under the PolyForm Noncommercial
License 1.0.0. Commercial use requires permission from MainMoney SARL.
See [LICENSE](LICENSE).

Want to contribute? See [CONTRIBUTING.md](CONTRIBUTING.md).
