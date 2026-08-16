# Conventions

- Node 22+. Server: official Node SDK. Storefront/checkout: official JS/TS SDK.
- Never commit Shopify API secrets. `shopify.app.toml` uses placeholders only.
- REST paths match the JS/TS `DEFAULT_PATHS` convention. Merchant credentials stay in encrypted SQLite, not the browser.
