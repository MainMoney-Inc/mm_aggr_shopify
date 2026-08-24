import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), "../.env") });

const store = process.env.SHOPIFY_STORE ?? "";
const token = process.env.SHOPIFY_ADMIN_TOKEN ?? "";
if (store === "" || token === "") {
  console.error("Set SHOPIFY_STORE and SHOPIFY_ADMIN_TOKEN in .env");
  process.exit(1);
}

const products = [
  { title: "Demo T-shirt", sku: "DEMO-SHIRT", price: "25.00" },
  { title: "Demo coffee", sku: "DEMO-COFFEE", price: "5.00" },
  { title: "Demo bundle", sku: "DEMO-BUNDLE", price: "10.00" },
];

const query = `
mutation CreateProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
  productCreate(product: $product, media: $media) {
    product { id title }
    userErrors { field message }
  }
}
`;

async function createProduct(item) {
  const response = await fetch(`https://${store}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({
      query,
      variables: {
        product: {
          title: item.title,
          status: "ACTIVE",
          productOptions: [{ name: "Title", values: [{ name: "Default" }] }],
        },
      },
    }),
  });
  const payload = await response.json();
  const errors = payload?.data?.productCreate?.userErrors ?? payload?.errors;
  if (errors && errors.length > 0) {
    console.error(item.sku, errors);
    return;
  }
  console.log("Created", item.title, payload?.data?.productCreate?.product?.id ?? "");
}

for (const item of products) {
  await createProduct(item);
}
