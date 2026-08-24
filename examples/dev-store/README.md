# Shopify development-store example

Helpers around the MainMoney Shopify app: seed demo products, print a signed
`/pay` link, and a static storefront page. You still need a Partner account
and a development store — Shopify cannot be created offline.

App server default port: **3000**.

## Setup

From this folder:

```bash
cp .env.example .env
# set SHOPIFY_API_KEY, SHOPIFY_API_SECRET, HOST, SHOPIFY_STORE, SHOPIFY_ADMIN_TOKEN
yarn
```

From the plugin root (parent of `examples/`):

```bash
cp .env.example .env
yarn
yarn build
yarn dev
```

Or `shopify app dev` once the Partner app is linked. Open `/` and save merchant
credentials for your shop.

## Seed products

```bash
yarn seed
```

Requires `SHOPIFY_STORE` and `SHOPIFY_ADMIN_TOKEN`.

## Hosted pay page (no checkout UI extension)

```bash
yarn pay-url 25.00 USD ORDER-1
```

Open the printed URL. Aggregator webhook:

`{HOST}/webhooks/aggregator?shop=your-shop.myshopify.com`

Open `storefront.html` for the demo catalog copy.
