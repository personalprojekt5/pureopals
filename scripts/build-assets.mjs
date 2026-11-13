// Compiles src/*.ts into assets/offline-*.js (one self-contained, minified file per page type).
// Shopify serves everything in assets/ from its CDN; run `npm run build` after editing src/.
import { build } from "vite"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const entries = ["common", "ring", "product", "collection", "password", "films"]
for (const name of entries) {
  await build({
    configFile: false, root, logLevel: "warn",
    build: {
      outDir: "assets", emptyOutDir: false, minify: true, sourcemap: false, copyPublicDir: false,
      lib: { entry: resolve(root, `src/${name}.ts`), formats: ["iife"], name: `offline_${name}`, fileName: () => `offline-${name}.js` },
    },
  })
  console.log(`assets/offline-${name}.js`)
}
