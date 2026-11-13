// Talking to the Shopify store: routes, money in the shop's own format, the Ajax cart, the bag count and the toast.
// theme.liquid puts window.offline = { routes, moneyFormat } on every page.

type Routes = { root: string; cart: string; cartAdd: string; cartChange: string; recommendations: string }
declare global { interface Window { offline: { routes: Routes; moneyFormat: string } } }

export const routes = (): Routes => window.offline.routes

// Shopify money format, e.g. "${{amount}}" or "{{amount_with_comma_separator}} Kč"
export function money(cents: number, format = window.offline?.moneyFormat || "${{amount}}") {
  const group = (n: number, decimals: number, thousands: string, dec: string) => {
    const [i, d] = (n / 100).toFixed(decimals).split(".")
    return i.replace(/\B(?=(\d{3})+(?!\d))/g, thousands) + (d ? dec + d : "")
  }
  return format.replace(/\{\{\s*(\w+)\s*\}\}/, (_, k: string) => {
    switch (k) {
      case "amount_no_decimals": return group(cents, 0, ",", ".")
      case "amount_with_comma_separator": return group(cents, 2, ".", ",")
      case "amount_no_decimals_with_comma_separator": return group(cents, 0, ".", ",")
      case "amount_with_apostrophe_separator": return group(cents, 2, "'", ".")
      case "amount_with_space_separator": return group(cents, 2, " ", ",")
      default: return group(cents, 2, ",", ".")
    }
  }).replace(/<[^>]*>/g, "")
}

export const pad = (i: number) => String(i).padStart(2, "0")
export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)

// ---------- cart ----------
export type CartLine = { id: number; quantity: number }
export class CartError extends Error {}

export async function cartAdd(items: CartLine[]) {
  const r = await fetch(routes().cartAdd + ".js", {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ items }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new CartError(data.description || data.message || "That piece couldn't be added.")
  await refreshCount(true)
  return data
}

export async function refreshCount(bump = false) {
  try {
    const cart = await (await fetch(routes().cart + ".js", { headers: { Accept: "application/json" } })).json()
    paintCount(cart.item_count, bump)
  } catch { /* offline: leave the count as rendered */ }
}
export function paintCount(n: number, bump = false) {
  document.querySelectorAll<HTMLElement>("[data-count]").forEach((c) => {
    c.textContent = String(n)
    if (bump) { c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump") }
  })
  document.querySelectorAll<HTMLElement>("[data-bag]").forEach((b) => b.setAttribute("aria-label", `Bag, ${n} item${n === 1 ? "" : "s"}`))
}

let toastT = 0
export function toast(s: string) {
  const t = document.getElementById("toast")
  if (!t) return
  t.textContent = s; t.classList.add("is-on")
  clearTimeout(toastT); toastT = window.setTimeout(() => t.classList.remove("is-on"), 2800)
}

// sizes: the option called "Size" (or the first option). A product with one variant is "One size".
export type ShopVariant = { id: number; title: string; options: string[]; available: boolean; price: number }
export type ShopProduct = { title: string; type: string; url: string; img: string; price: number; available: boolean; options: string[]; variants: ShopVariant[] }
export function sizesOf(p: ShopProduct) {
  if (p.variants.length <= 1) return [{ label: "One size", variant: p.variants[0] }]
  const k = Math.max(0, p.options.findIndex((o) => /size|größe|taille|velikost|talla|maat/i.test(o)))
  const seen = new Map<string, ShopVariant>()
  p.variants.forEach((v) => {
    const label = v.options[k]
    const had = seen.get(label)
    if (!had || (!had.available && v.available)) seen.set(label, v)   // first in-stock variant per size
  })
  return [...seen].map(([label, variant]) => ({ label, variant }))
}
