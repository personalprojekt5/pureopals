// Every page: the status-bar clock, the FAQ topic links (#shipping opens its first question) and the
// cart page's quantity fields (they update the bag on change).
import { refreshCount } from "./shopify"

// ---------- clock: the visitor's own time ----------
const clocks = document.querySelectorAll<HTMLElement>("[data-clock]")
if (clocks.length) {
  const fmt = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" })
  const tick = () => { const t = fmt.format(new Date()); clocks.forEach((c) => (c.textContent = t)); window.setTimeout(tick, 60000 - (Date.now() % 60000) + 50) }
  tick()
}

// ---------- FAQ ----------
function openFromHash() {
  const g = document.getElementById(decodeURIComponent(location.hash.slice(1)))
  const q = g?.classList.contains("faq__group") ? g.querySelector<HTMLDetailsElement>(".faq__q") : null
  if (q) q.open = true
}
addEventListener("hashchange", openFromHash)
openFromHash()

// ---------- cart page: change a quantity → submit the form (it posts to /cart and comes back updated) ----------
document.querySelectorAll<HTMLFormElement>("form[data-cart-form]").forEach((form) => {
  let t = 0
  form.addEventListener("change", (e) => {
    if (!(e.target as HTMLElement).matches("input[name='updates[]']")) return
    clearTimeout(t); t = window.setTimeout(() => form.requestSubmit(form.querySelector<HTMLButtonElement>("[name='update']") || undefined), 350)
  })
})

// the count is rendered by Liquid; refresh it when the page comes back from the back/forward cache
addEventListener("pageshow", (e) => { if (e.persisted) refreshCount() })
