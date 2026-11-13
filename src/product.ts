// Product page (sections/main-product.liquid): size / option buttons, price and stock per variant, add to the
// Shopify cart without leaving the page, and the two recommendation strips. Without JavaScript the form still
// posts to /cart/add with the first available variant.
import { cartAdd, CartError, money, toast } from "./shopify"

type Variant = { id: number; options: string[]; available: boolean; price: number; compare_at_price: number | null }

document.querySelectorAll<HTMLElement>("[data-product]").forEach((root) => {
  const variants = JSON.parse(root.querySelector("[data-product-json]")?.textContent || "[]") as Variant[]
  const form = root.querySelector<HTMLFormElement>("form[data-product-form]")
  if (!form || !variants.length) return
  const idInput = form.querySelector<HTMLInputElement>("input[name='id']")!
  const btn = form.querySelector<HTMLButtonElement>("[data-add]")!, btnLabel = btn.querySelector<HTMLElement>("[data-add-label]")!
  const msg = root.querySelector<HTMLElement>("[data-msg]")!
  const priceEl = root.querySelector<HTMLElement>("[data-price]"), compareEl = root.querySelector<HTMLElement>("[data-compare]")
  const groups = [...root.querySelectorAll<HTMLElement>("[data-option]")]
  // a shopper must choose a size themselves (unless the link already named a variant)
  const chosen: (string | null)[] = groups.map((g) => g.querySelector<HTMLElement>("[aria-pressed='true']")?.dataset.value ?? null)
  if (root.dataset.requireSize === "true") groups.forEach((g, i) => { if (g.dataset.size === "true") { chosen[i] = null; g.querySelectorAll("[data-value]").forEach((b) => b.setAttribute("aria-pressed", "false")) } })

  const match = () => variants.find((v) => chosen.every((c, i) => c !== null && v.options[i] === c))
  function paint() {
    // grey out values that have no in-stock variant with the other choices made
    groups.forEach((g, i) => g.querySelectorAll<HTMLButtonElement>("[data-value]").forEach((b) => {
      const ok = variants.some((v) => v.available && v.options[i] === b.dataset.value && chosen.every((c, k) => k === i || c === null || v.options[k] === c))
      b.classList.toggle("is-out", !ok)
    }))
    const v = match()
    if (!v) { btn.disabled = false; btnLabel.textContent = chosen.includes(null) ? "Pick a size" : "Unavailable"; return }
    idInput.value = String(v.id)
    if (priceEl) priceEl.textContent = money(v.price)
    if (compareEl) { compareEl.hidden = !(v.compare_at_price && v.compare_at_price > v.price); if (v.compare_at_price) compareEl.textContent = money(v.compare_at_price) }
    btn.disabled = !v.available
    btnLabel.textContent = v.available ? "Add to bag" : "Sold out"
    const u = new URL(location.href); u.searchParams.set("variant", String(v.id)); history.replaceState(null, "", u)
  }
  groups.forEach((g, i) => g.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-value]"); if (!b) return
    chosen[i] = b.dataset.value!
    g.querySelectorAll("[data-value]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)))
    msg.textContent = ""
    paint()
  }))
  paint()

  form.addEventListener("submit", async (e) => {
    e.preventDefault()
    const v = match()
    if (!v) {
      msg.textContent = chosen.includes(null) ? "Pick a size first." : "That combination isn't available."
      const g = groups[chosen.indexOf(null)] || groups[0]
      g?.classList.remove("is-shake"); void g?.offsetWidth; g?.classList.add("is-shake")
      g?.querySelector<HTMLElement>("[data-value]:not(.is-out)")?.focus()
      return
    }
    btn.disabled = true; btnLabel.textContent = "Adding…"
    try {
      const qty = Math.max(1, Number(form.querySelector<HTMLInputElement>("input[name='quantity']")?.value) || 1)
      await cartAdd([{ id: v.id, quantity: qty }])
      toast(`${root.dataset.title}${chosen.length && chosen[0] && v.options[0] !== "Default Title" ? ", " + v.options.join(" / ") : ""} saved to your bag`)
    } catch (err) {
      msg.textContent = err instanceof CartError ? err.message : "No signal. Try again."
    } finally { paint() }
  })
})

// ---------- recommendations: Shopify's own (related and complementary), loaded after the page ----------
document.querySelectorAll<HTMLElement>("[data-recs]").forEach(async (box) => {
  try {
    const html = await (await fetch(box.dataset.url!)).text()
    const doc = new DOMParser().parseFromString(html, "text/html")
    const inner = doc.querySelector<HTMLElement>("[data-recs]")
    if (inner && inner.querySelector(".card, .pd__rest-item")) { box.innerHTML = inner.innerHTML; box.classList.add("is-in") }
    else box.remove()
  } catch { box.remove() }
})
