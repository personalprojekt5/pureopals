// Single product page: the model wearing the piece with its dot, size picker + add to bag, the rest of the
// look, more pieces of the same type, and previous / next. The HTML is generated per product at build time
// (vite.config.ts); this script reads the slug from <body data-slug> and fills in the interactive parts.
import { LOOKS, PRODUCTS, esc, lookUrl, money, pad, plural, productUrl, shopUrl, type Piece } from "./data"
import { addToBag } from "./bag"
import { chrome, toast } from "./chrome"

chrome()
const $ = (id: string) => document.getElementById(id)!
const p = PRODUCTS.find((x) => x.slug === document.body.dataset.slug)
if (p) render(p)

function render(p: Piece) {
  const L = LOOKS[p.look], [px, py] = L.pins[p.j]

  // links that depend on the base path
  $("pdkind").setAttribute("href", shopUrl(p.kind)); $("pdkind").textContent = plural(p.kind)
  $("pdmorekind").textContent = plural(p.kind) + "."

  // the model wearing it, with the dot on the piece
  const model = $("pdmodel")
  model.style.setProperty("--foot", String(L.foot))
  model.innerHTML = `<div class="rw__fig">
    <img class="rw__cast" src="${L.shadow}" alt="" aria-hidden="true" draggable="false" decoding="async">
    <img class="rw__pic" src="${L.img}" srcset="${L.small} 571w, ${L.img} 914w" sizes="(max-width: 809px) 100vw, 50vw" alt="${esc(L.name)}: the full look" draggable="false" decoding="async" fetchpriority="high">
    <div class="rw__pins"><span class="rw__pin is-hot" style="left:${px}%;top:${py}%;--pi:1"><span class="sticker">${pad(p.j + 1)}</span><span class="rw__tip"><b>${esc(p.name)}</b><span>${money(p.price)}</span></span></span></div>
  </div>`

  // the label sits right of the dot, else left, else under it: never past the screen edge
  const place = () => {
    const pin = model.querySelector<HTMLElement>(".rw__pin")!, tip = pin.querySelector<HTMLElement>(".rw__tip")!
    pin.classList.remove("is-flip", "is-below"); tip.style.removeProperty("--dx")
    const r = pin.getBoundingClientRect(), w = tip.offsetWidth, m = 12, vw = document.documentElement.clientWidth
    if (r.right + w <= vw - m) return
    if (r.left - w >= m) { pin.classList.add("is-flip"); return }
    pin.classList.add("is-below")
    const c = r.left + r.width / 2, half = Math.min(w, vw - m * 2) / 2
    tip.style.setProperty("--dx", `${Math.round(Math.max(m + half, Math.min(vw - m - half, c)) - c)}px`)
  }
  place(); addEventListener("resize", place); document.fonts?.ready.then(place)

  // size picker + add to bag
  let size = p.sizes.length === 1 ? p.sizes[0] : ""
  const sizes = $("pdsizes"), msg = $("pdmsg")
  $("pdbuy").hidden = false
  $("pdsizehint").textContent = p.sizes.length === 1 ? "" : p.kind === "Shoes" ? "EU sizes" : "Boxy fit, take your usual size"
  sizes.innerHTML = p.sizes.map((s) => `<button class="rw__size" type="button" data-s="${s}" aria-pressed="${s === size}">${s}</button>`).join("")
  sizes.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>(".rw__size"); if (!b) return
    size = b.dataset.s!; msg.textContent = ""
    sizes.querySelectorAll(".rw__size").forEach((x) => x.setAttribute("aria-pressed", String(x === b)))
  })
  $("pdadd").addEventListener("click", () => {
    if (!size) {
      msg.textContent = "Pick a size first."
      sizes.classList.remove("is-shake"); void sizes.offsetWidth; sizes.classList.add("is-shake")
      sizes.querySelector<HTMLElement>(".rw__size")?.focus()
      return
    }
    addToBag([{ slug: p.slug, size }])
    msg.textContent = ""
    toast(`${p.name}${p.sizes.length > 1 ? ", " + size : ""} saved to your bag`)
  })

  // the rest of the look
  const rest = L.pieces.filter((x) => x !== p)
  const full = L.pieces.reduce((t, x) => t + x.price, 0)
  $("pdlook").innerHTML = `
    <div class="pd__look-head"><span class="cap">Complete the look</span><a class="cap pd__link" href="${lookUrl(p.look)}">See Look ${pad(p.look + 1)} on the ring</a></div>
    <ul class="pd__rest" role="list">${rest.map((x) => `
      <li><a class="rw__mini-item pd__rest-item" href="${productUrl(x)}">
        <span class="rw__mini-img"><img src="${x.img}" alt="" width="48" height="48" loading="lazy" decoding="async"></span>
        <span class="rw__mini-txt"><span class="rw__mini-name">${esc(x.name)}</span><span class="rw__mini-price">${money(x.price)}</span></span>
      </a></li>`).join("")}
    </ul>
    <p class="cap pd__muted">Full look ${money(full)} · −10% when you add all three from the ring: ${money(full * .9)}</p>`

  // more of the same type from the other looks
  const more = PRODUCTS.filter((x) => x.kind === p.kind && x !== p).slice(0, 4)
  const grid = $("pdgrid")
  if (more.length) grid.innerHTML = more.map((x, i) => `
    <li class="card" style="--i:${i}">
      <a class="card__link" href="${productUrl(x)}">
        <span class="card__tile"><img src="${x.img}" alt="" width="192" height="192" loading="lazy" decoding="async"></span>
        <span class="card__row"><span class="card__name">${esc(x.name)}</span><span class="card__price">${money(x.price)}</span></span>
        <span class="card__row card__meta cap"><span>${esc(x.kind)}</span><span>Look ${pad(x.look + 1)}</span></span>
      </a>
    </li>`).join("")
  else $("pdmore").remove()

  // previous / next through the whole drop
  const i = PRODUCTS.indexOf(p), prev = PRODUCTS[(i - 1 + PRODUCTS.length) % PRODUCTS.length], next = PRODUCTS[(i + 1) % PRODUCTS.length]
  $("pdpager").innerHTML = `
    <a class="pd__page" href="${productUrl(prev)}" rel="prev"><span class="cap pd__muted">Previous</span><span class="pd__page-name">${esc(prev.name)}</span></a>
    <a class="pill" href="${shopUrl()}">Shop all</a>
    <a class="pd__page pd__page--next" href="${productUrl(next)}" rel="next"><span class="cap pd__muted">Next</span><span class="pd__page-name">${esc(next.name)}</span></a>`
}
