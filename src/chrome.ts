// Shared bits for the shop, product and password pages: status-bar clock, bag count, toast.
import { paintCount } from "./bag"

export function startClock() {
  const clock = document.getElementById("clock")
  if (!clock) return
  const fmt = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" })
  const tick = () => { clock.textContent = fmt.format(new Date()); window.setTimeout(tick, 60000 - (Date.now() % 60000) + 50) }
  tick()
}

let toastT = 0
export function toast(s: string) {
  const t = document.getElementById("toast")
  if (!t) return
  t.textContent = s; t.classList.add("is-on")
  clearTimeout(toastT); toastT = window.setTimeout(() => t.classList.remove("is-on"), 2500)
}

export function chrome() {
  startClock()
  paintCount()
}
