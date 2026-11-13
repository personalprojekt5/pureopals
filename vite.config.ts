// Multi-page build: the ring (index.html), the password page, the shop and one generated page per product.
//
// Password: set SITE_PASSWORD when building (a GitHub Actions secret in deploy.yml). Only its SHA-256 hash
// reaches the site. GitHub Pages is static hosting, so this is a curtain, not a lock: it keeps casual
// visitors out, but anyone who reads the page source can get past it. Never put anything secret behind it.
import { defineConfig, type Plugin } from "vite"
import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = dirname(fileURLToPath(import.meta.url))
const DEFAULT_PASSWORD = "touchgrass"
const fromEnv = (process.env.SITE_PASSWORD || "").trim()
// case and outer spaces do not matter when typing the password
const PASS_HASH = createHash("sha256").update("offline:" + (fromEnv || DEFAULT_PASSWORD).toLowerCase()).digest("hex")
const COOKIE = "offline_pass"
// launch switch: "launched": true in src/site.json removes the gate and retires the landing page
const LAUNCHED = !!JSON.parse(readFileSync(resolve(root, "src/site.json"), "utf8")).launched

// ---------- product pages: product/<slug>/index.html from one template ----------
type RawLook = { name: string; pieces: [string, string, number, string][] }
const looks: RawLook[] = JSON.parse(readFileSync(resolve(root, "src/looks.json"), "utf8"))
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)
const pad = (i: number) => String(i).padStart(2, "0")
const template = readFileSync(resolve(root, "src/templates/product.html"), "utf8")
const productDir = resolve(root, "product")   // generated, git-ignored
rmSync(productDir, { recursive: true, force: true })
const productInputs: Record<string, string> = {}
looks.forEach((L, a) => L.pieces.forEach(([name, kind, price], j) => {
  const slug = slugify(name), file = resolve(productDir, slug, "index.html")
  const vars: Record<string, string> = {
    slug, name: esc(name), kind: esc(kind), price: "$" + price, look: pad(a + 1), lookName: esc(L.name), piece: pad(j + 1),
    img: `https://demo.filatov.design/kit/dfadfe5e0f2b1a44/v3/images/piece-${a + 1}-${j + 1}.webp`,
  }
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, template.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? ""))
  productInputs[`product-${slug}`] = file
}))

// ---------- password gate: runs in <head> before anything paints ----------
function gate(): Plugin {
  let base = "/"
  return {
    name: "offline-gate",
    configResolved(c) {
      base = c.base
      if (LAUNCHED) { c.logger.info("\n[offline-gate] launched: the store is open, no password.\n"); return }
      if (!fromEnv) c.logger.warn(`\n[offline-gate] SITE_PASSWORD is not set: using the default password "${DEFAULT_PASSWORD}".\n`)
    },
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        if (LAUNCHED || ctx.filename.endsWith("password.html")) return html
        const js = `(function(){if(document.cookie.split("; ").indexOf(${JSON.stringify(COOKIE + "=" + PASS_HASH)})>-1)return;` +
          `location.replace(${JSON.stringify(base + "password.html")}+"?next="+encodeURIComponent(location.pathname+location.search+location.hash))})()`
        return html.replace("<head>", `<head>\n<script>${js}</script>`)
      },
    },
  }
}

export default defineConfig({
  plugins: [gate()],
  define: { __PASS_HASH__: JSON.stringify(PASS_HASH) },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        password: resolve(root, "password.html"),
        shop: resolve(root, "shop.html"),
        faq: resolve(root, "faq.html"),
        journal: resolve(root, "journal.html"),
        ...productInputs,
      },
    },
  },
})
