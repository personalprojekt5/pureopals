// Password page: hashes what was typed and compares it with the build-time hash. On a match it sets a cookie
// for 30 days and goes back to the page the visitor came from. (Client-side only: a curtain, not a lock.)
import { LOOKS, BASE } from "./data"
import { startClock } from "./chrome"

startClock()
const COOKIE = "offline_pass"
const form = document.getElementById("pwform") as HTMLFormElement
const input = document.getElementById("pw") as HTMLInputElement
const msg = document.getElementById("pwmsg")!

// the nine looks stand in a line along the floor
document.getElementById("pwline")!.innerHTML = LOOKS.map((L, a) =>
  `<div class="pw__fig" style="--foot:${L.foot};--i:${a}"><img class="pw__cast" src="${L.shadow}" alt="" decoding="async"><img class="pw__pic" src="${L.small}" alt="" decoding="async"></div>`).join("")

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("")
}
// only send the visitor back inside this site
function nextUrl() {
  const n = new URLSearchParams(location.search).get("next") || ""
  return n.startsWith(BASE) && !n.startsWith("//") && !n.includes("password.html") ? n : BASE
}

form.addEventListener("submit", async (e) => {
  e.preventDefault()
  const v = input.value.trim().toLowerCase()
  if (!v) { msg.textContent = "Type the password first."; input.focus(); return }
  if (!crypto.subtle) { msg.textContent = "Open the site over https to log on."; return }
  if ((await sha256("offline:" + v)) === __PASS_HASH__) {
    document.cookie = `${COOKIE}=${__PASS_HASH__}; path=${BASE}; max-age=${60 * 60 * 24 * 30}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`
    form.classList.add("is-ok"); msg.textContent = "You're back on."
    setTimeout(() => location.replace(nextUrl()), matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450)
  } else {
    msg.textContent = "Wrong password. Go touch some grass."
    form.classList.remove("is-shake"); void form.offsetWidth; form.classList.add("is-shake")
    input.select()
  }
})
input.focus({ preventScroll: true })
