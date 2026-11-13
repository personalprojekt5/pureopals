// The bag lives in localStorage so the count follows the visitor from the ring to the shop and product pages.
// If storage is blocked (private mode, blocked site data) the bag simply lasts for the page.
export type Line = { slug: string; size: string }
const KEY = "offline-bag"
let memory: Line[] = []

export function readBag(): Line[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); if (Array.isArray(v)) return v } catch { /* storage blocked */ }
  return memory
}
function write(lines: Line[]) {
  memory = lines
  try { localStorage.setItem(KEY, JSON.stringify(lines)) } catch { /* storage blocked */ }
}
export function addToBag(lines: Line[]) {
  const all = readBag().concat(lines)
  write(all)
  paintCount(true)
  return all.length
}
export function paintCount(bump = false) {
  const n = String(readBag().length)
  document.querySelectorAll<HTMLElement>("[data-count]").forEach((c) => {
    c.textContent = n
    if (bump) { c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump") }
  })
}
// another tab added something: keep this tab's count in step
addEventListener("storage", (e) => { if (e.key === KEY) paintCount() })
