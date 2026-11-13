// Landing page = Shopify's password page (sections/main-password.liquid), shown while the store is password
// protected. The email box is Shopify's newsletter form (sign-ups land in Customers, tagged "newsletter");
// the password form is Shopify's own. This script runs the countdown and the Password switch.
function init() {
  const root = document.querySelector<HTMLElement>("[data-landing]")
  if (!root) return
  // ---------- countdown ----------
  const count = root.querySelector<HTMLElement>("[data-countdown]")
  const drop = count?.dataset.drop ? new Date(count.dataset.drop) : null
  if (count && drop && !isNaN(+drop) && +drop > Date.now()) {
    const cells = count.querySelectorAll<HTMLElement>("b")
    count.hidden = false
    const tick = () => {
      const left = Math.max(0, +drop - Date.now()) / 1000
      const v = [Math.floor(left / 86400), Math.floor(left / 3600) % 24, Math.floor(left / 60) % 60, Math.floor(left) % 60]
      cells.forEach((c, i) => { const s = String(v[i]).padStart(2, "0"); if (c.textContent !== s) c.textContent = s })
      if (left > 0) setTimeout(tick, 1000 - (Date.now() % 1000) + 10)
    }
    tick()
  }

  // ---------- email ↔ password ----------
  const signup = root.querySelector<HTMLElement>("[data-signup]")!, pass = root.querySelector<HTMLElement>("[data-pass]")!
  const toggles = document.querySelectorAll<HTMLElement>("[data-to-pass]"), back = root.querySelector<HTMLElement>("[data-to-list]")
  function showPass(on: boolean, focus = true) {
    pass.hidden = !on; signup.hidden = on
    toggles.forEach((t) => { t.setAttribute("aria-expanded", String(on)); t.toggleAttribute("aria-current", on) })
    if (focus) (on ? pass : signup).querySelector<HTMLInputElement>("input:not([type=hidden])")?.focus({ preventScroll: true })
  }
  toggles.forEach((t) => (t.onclick = () => showPass(pass.hidden)))   // onclick: a re-run replaces, never doubles
  if (back) back.onclick = () => showPass(false)
  // ---------- background video: muted loop, Pause / Play, still frame for reduced motion ----------
  const vid = root.parentElement?.querySelector<HTMLVideoElement>(".pw__bg video")
  const vbtn = root.querySelector<HTMLButtonElement>("[data-video-toggle]")
  if (vid) {
    vid.muted = true; vid.playsInline = true; vid.loop = true
    const paint = () => {
      if (!vbtn) return
      vbtn.textContent = vid.paused ? "Play" : "Pause"
      vbtn.setAttribute("aria-pressed", String(vid.paused))
      vbtn.setAttribute("aria-label", `${vid.paused ? "Play" : "Pause"} background video`)
    }
    vid.onplay = paint; vid.onpause = paint
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { vid.removeAttribute("autoplay"); vid.pause() }
    else vid.play().catch(() => paint())   // a browser that blocks autoplay shows Play
    if (vbtn) vbtn.onclick = () => { if (vid.paused) vid.play().catch(() => paint()); else vid.pause() }
    paint()
  }

  // a wrong password comes back from Shopify with an error: keep the password form open
  if (root.dataset.open === "password" || location.hash === "#password") showPass(true, false)
  // the form shakes when Shopify sent an error back
  root.querySelectorAll<HTMLElement>(".pw__form.has-error").forEach((f) => f.classList.add("is-shake"))
}
init()
// theme editor: the section is redrawn after every change, so run again on the new markup
document.addEventListener("shopify:section:load", init)
