import * as esbuild from "esbuild";
import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sdkRoot = path.resolve(pluginRoot, "../../sdks/javascript");
const outDir = path.join(pluginRoot, "assets");
mkdirSync(outDir, { recursive: true });

await esbuild.build({
  absWorkingDir: pluginRoot,
  entryPoints: [path.join(pluginRoot, "assets/bootstrap.ts")],
  bundle: true,
  format: "iife",
  outfile: path.join(outDir, "checkout.js"),
  platform: "browser",
  target: ["es2022"],
  loader: { ".png": "file" },
  alias: {
    "@mainmoney/js-core": path.join(sdkRoot, "packages/core/src/index.ts"),
    "@mainmoney/js-http": path.join(sdkRoot, "packages/http/src/index.ts"),
    "@mainmoney/js-checkout": path.join(sdkRoot, "packages/checkout/src/index.ts"),
  },
});

cpSync(path.join(sdkRoot, "packages/checkout/src/styles.css"), path.join(outDir, "checkout.css"));
cpSync(
  path.join(sdkRoot, "packages/checkout/src/assets/main_money_square.png"),
  path.join(outDir, "main_money_square.png"),
);
