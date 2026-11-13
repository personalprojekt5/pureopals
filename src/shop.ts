// Shop all: every piece of Drop 01 in one grid, filtered by type (?kind=top keeps the filter in the URL).
import { KINDS, PRODUCTS, esc, money, pad, plural, productUrl, type Piece } from "./data"
import { chrome } from "./chrome"

chrome()
const grid = document.getElementById("grid")!, filters = document.getElementById("filters")!, count = document.getElementById("shopcount")!

const card = (p: Piece, i: number) => `
  <li class="card" style="--i:${i}">
    <a class="card__link" href="${productUrl(p)}">
      <span class="card__tile"><img src="${p.img}" alt="" width="192" height="192" loading="${i < 8 ? "eager" : "lazy"}" decoding="async"></span>
      <span class="card__row"><span class="card__name">${esc(p.name)}</span><span class="card__price">${money(p.price)}</span></span>
      <span class="card__row card__meta cap"><span>${esc(p.kind)}</span><span>Look ${pad(p.look + 1)}</span></span>
    </a>
  </li>`

const kinds = ["All", ...KINDS]
filters.innerHTML = kinds.map((k) => {
  const n = k === "All" ? PRODUCTS.length : PRODUCTS.filter((p) => p.kind === k).length
  return `<button class="pill shop__filter" type="button" data-k="${k.toLowerCase()}" aria-pressed="false">${k === "All" ? "All" : plural(k)} <span class="shop__n">${n}</span></button>`
}).join("")

function show(kind: string, push = false) {
  if (!kinds.some((k) => k.toLowerCase() === kind)) kind = "all"
  const list = kind === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.kind.toLowerCase() === kind)
  grid.innerHTML = list.map(card).join("")
  grid.classList.remove("is-in"); void grid.offsetWidth; grid.classList.add("is-in")
  filters.querySelectorAll<HTMLElement>(".shop__filter").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k === kind)))
  count.textContent = `${list.length} pieces · ${new Set(list.map((p) => p.look)).size} looks`
  if (push) {
    const u = new URL(location.href)
    if (kind === "all") u.searchParams.delete("kind"); else u.searchParams.set("kind", kind)
    history.replaceState(null, "", u)
  }
}
filters.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>(".shop__filter")
  if (b) show(b.dataset.k!, true)
})
show((new URLSearchParams(location.search).get("kind") || "all").toLowerCase())

