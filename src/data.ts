// Shared catalogue: nine looks, three pieces each. The hero, the shop and every product page read from here.
// looks.json is also read at build time by vite.config.ts to generate one HTML page per product.
import raw from "./looks.json"

export type Piece = {
  name: string; kind: string; price: number; img: string; sizes: string[]
  slug: string; look: number; j: number   // look: 0-based look index · j: 0-based piece index inside the look
}
export type Look = { name: string; img: string; small: string; shadow: string; foot: number; pins: [number, number][]; pieces: Piece[] }

export const IMG = "https://demo.filatov.design/kit/dfadfe5e0f2b1a44/v3/images/"
const SIZE_SETS: Record<string, string[]> = { top: ["S", "M", "L", "XL"], shoe: ["40", "41", "42", "43", "44", "45"], one: ["One size"] }
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

// i: file number · foot: empty share under the feet (prep-media.py prints it) · pins: % of the cut-out
export const LOOKS: Look[] = raw.map((L, a) => {
  const i = a + 1
  return {
    name: L.name, foot: L.foot, pins: L.pins as [number, number][],
    img: `${IMG}look-${i}.webp`, small: `${IMG}look-${i}-s.webp`, shadow: `${IMG}shadow-${i}.webp`,
    pieces: L.pieces.map(([n, k, p, s], j) => ({
      name: String(n), kind: String(k), price: Number(p), sizes: SIZE_SETS[String(s)],
      img: `${IMG}piece-${i}-${j + 1}.webp`, slug: slugify(String(n)), look: a, j,
    })),
  }
})
export const PRODUCTS: Piece[] = LOOKS.flatMap((L) => L.pieces)
export const KINDS = ["Top", "Outerwear", "Bottom", "Shoes", "Accessory"]
export const plural = (k: string) => (k === "Shoes" || k === "Outerwear" ? k : k === "Accessory" ? "Accessories" : k + "s")

export const money = (v: number) => "$" + (Math.round(v * 100) / 100).toFixed(v % 1 ? 2 : 0)
export const pad = (i: number) => String(i).padStart(2, "0")
export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)

// links work under any base (GitHub Pages serves the site from /<repo>/)
export const BASE = import.meta.env.BASE_URL
export const productUrl = (p: Piece) => `${BASE}product/${p.slug}/`
export const shopUrl = (kind?: string) => `${BASE}shop.html${kind ? `?kind=${encodeURIComponent(kind.toLowerCase())}` : ""}`
export const lookUrl = (a: number) => `${BASE}#look-${a + 1}`
