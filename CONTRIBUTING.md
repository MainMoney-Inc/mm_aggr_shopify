# Contributing

This document is for people who change **this repository**. To install the
package into an application, see [README.md](README.md).

## Legal

Pull requests require agreement to [CLA.md](CLA.md). Contributions are owned
by MainMoney SARL.

## Clone

```bash
git clone git@github.com:MainMoney-Inc/mm_aggr_shopify.git
```

From the contrib hub, this tree is `contrib/plugins/shopify` with the Node SDK
at `contrib/sdks/nodejs` and the JS SDK at `contrib/sdks/javascript`.

## Setup

```bash
npm install
npm run build
```

## Test

```bash
npm test
npm run typecheck
```

## Branches and commits

- `feature/<name>`, `bugfix/<name>`, `hotfix/<issue>`, `refactor/<description>`
- Conventional commits: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Pull requests

- Include tests for behavior changes.
- Do not invent merchant API endpoints; use `/api/v1/schema/merchants/`.
- Do not commit secrets (including `shopify.app.toml` client secrets).
- Local demos live under `examples/`.
