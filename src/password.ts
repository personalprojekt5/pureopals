// Landing page = the front door while the store is locked. Set in src/site.json:
//   "launched":       false → every store page sends visitors here. true → this page sends everyone to the store.
//   "dropDate":       optional, e.g. "2026-12-12T18:00:00+01:00" → shows a countdown and the date
//   "signupEndpoint": where emails go, e.g. a Formspree form "https://formspree.io/f/abcdwxyz"
// The password (SITE_PASSWORD secret) still lets the team in. Client-side only: a curtain, not a lock.
import site from "./site.json"
import { LOOKS, BASE } from "./data"
import { startClock } from "./chrome"

// after launch nobody needs this page: go to the store
if (site.launched) location.replace(BASE)

startClock()
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const shake = (el: HTMLElement) => { el.classList.remove("is-shake"); void el.offsetWidth; el.classList.add("is-shake") }

// the nine looks stand in a line along the floor
$("pwline").innerHTML = LOOKS.map((L, a) =>
  `<div class="pw__fig" style="--foot:${L.foot};--i:${a}"><img class="pw__cast" src="${L.shadow}" alt="" decoding="async"><img class="pw__pic" src="${L.small}" alt="" decoding="async"></div>`).join("")

// ---------- countdown to the drop ----------
const drop = site.dropDate ? new Date(site.dropDate) : null
if (drop && !isNaN(+drop) && +drop > Date.now()) {
  const count = $("count"), cells = count.querySelectorAll<HTMLElement>("b")
  count.hidden = false
  $("pwkick").textContent = `Drop 01 · ${new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long" }).format(drop)}`
  const tick = () => {
    const left = Math.max(0, +drop - Date.now()) / 1000
    const v = [Math.floor(left / 86400), Math.floor(left / 3600) % 24, Math.floor(left / 60) % 60, Math.floor(left) % 60]
    cells.forEach((c, i) => { const s = String(v[i]).padStart(2, "0"); if (c.textContent !== s) c.textContent = s })
    if (left > 0) setTimeout(tick, 1000 - (Date.now() % 1000) + 10)
  }
  tick()
}

// ---------- email sign-up ----------
const signup = $<HTMLFormElement>("signup"), email = $<HTMLInputElement>("email"), smsg = $("signupmsg")
signup.addEventListener("submit", async (e) => {
  e.preventDefault()
  const v = email.value.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { smsg.textContent = "That email doesn't look right."; shake(signup); email.focus(); return }
  const f = new FormData(signup)
  if (f.get("_gotcha")) { done(); return }   // a bot filled the hidden field
  if (!site.signupEndpoint) {
    console.warn("[signup] Set signupEndpoint in src/site.json so emails are saved.")
    smsg.textContent = "Sign-ups aren't switched on yet. Try again soon."
    return
  }
  const btn = signup.querySelector<HTMLButtonElement>("button")!
  btn.disabled = true; smsg.textContent = "Joining…"
  f.set("_subject", "OFFLINE: new sign-up")
  try {
    const r = await fetch(site.signupEndpoint, { method: "POST", body: f, headers: { Accept: "application/json" } })
    if (!r.ok) throw new Error(String(r.status))
    done()
  } catch {
    smsg.textContent = "That didn't go through. Check your connection and try again."
  } finally { btn.disabled = false }
})
function done() {
  signup.reset(); signup.classList.add("is-ok")
  email.placeholder = "You're on the list"
  smsg.textContent = "You're on the list. Now go outside."
}

// ---------- password: the team and early access ----------
const pwform = $<HTMLFormElement>("pwform"), input = $<HTMLInputElement>("pw"), pmsg = $("pwmsg"), toPass = $("toPass")
function showPass(on: boolean) {
  pwform.hidden = !on; signup.hidden = on; toPass.setAttribute("aria-expanded", String(on))
  toPass.toggleAttribute("aria-current", on)
  ;(on ? input : email).focus({ preventScroll: true })
}
toPass.addEventListener("click", () => showPass(pwform.hidden))
$("toList").addEventListener("click", () => showPass(false))

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("")
}
// only send the visitor back inside this site
function nextUrl() {
  const n = new URLSearchParams(location.search).get("next") || ""
  return n.startsWith(BASE) && !n.startsWith("//") && !n.includes("password.html") ? n : BASE
}
pwform.addEventListener("submit", async (e) => {
  e.preventDefault()
  const v = input.value.trim().toLowerCase()
  if (!v) { pmsg.textContent = "Type the password first."; input.focus(); return }
  if (!crypto.subtle) { pmsg.textContent = "Open the site over https to log on."; return }
  if ((await sha256("offline:" + v)) === __PASS_HASH__) {
    document.cookie = `offline_pass=${__PASS_HASH__}; path=${BASE}; max-age=${60 * 60 * 24 * 30}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`
    pwform.classList.add("is-ok"); pmsg.textContent = "You're back on."
    setTimeout(() => location.replace(nextUrl()), calm ? 0 : 450)
  } else {
    pmsg.textContent = "Wrong password. Go touch some grass."
    shake(pwform); input.select()
  }
})

// a shared link to …/password.html#password opens straight on the password
if (location.hash === "#password") showPass(true)
else email.focus({ preventScroll: true })
