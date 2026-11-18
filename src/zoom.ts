// Product photo zoom (sections/main-product.liquid → "Photo zoom" setting).
//   hover: on a mouse, the photo magnifies 2x under the cursor; click opens the full-screen viewer
//   click: click / tap opens the full-screen viewer
// Viewer: tap or click to zoom in at that point (2.5x), pinch or trackpad-scroll to zoom 1–4x, drag to pan
// (a mouse pans by just moving), arrows / swipe for the next photo, Esc or Close to leave.

const calm = matchMedia("(prefers-reduced-motion: reduce)").matches
const fine = matchMedia("(hover: hover) and (pointer: fine)").matches
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x))
const MAX = 4, TAP = 2.5

export function initZoom(root: HTMLElement, mode: string) {
  if (mode === "off") return
  const triggers = [...root.querySelectorAll<HTMLElement>("[data-zoom]")]
  if (!triggers.length) return
  const items = triggers.map((t) => ({ src: t.dataset.zoom!, alt: t.querySelector("img")?.alt || "" }))

  // ---------- inline magnifier (mouse only) ----------
  if (fine && mode === "hover") triggers.forEach((t) => {
    const img = t.querySelector<HTMLImageElement>("img"); if (!img) return
    t.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return
      t.classList.add("is-hover")
      if (!img.dataset.hi) {   // swap in the large file once, so the magnified view stays sharp
        img.dataset.hi = "1"
        const hi = new Image(); hi.src = t.dataset.zoom!
        hi.onload = () => { img.removeAttribute("srcset"); img.removeAttribute("sizes"); img.src = hi.src }
      }
    })
    t.addEventListener("pointermove", (e) => {
      // measure the photo at its normal size (getBoundingClientRect would include the 2x magnification);
      // it sits centred in the button
      const tr = t.getBoundingClientRect(), w = img.offsetWidth, h = img.offsetHeight
      const left = tr.left + (tr.width - w) / 2, top = tr.top + (tr.height - h) / 2
      img.style.transformOrigin = `${clamp((e.clientX - left) / w, 0, 1) * 100}% ${clamp((e.clientY - top) / h, 0, 1) * 100}%`
    })
    t.addEventListener("pointerleave", () => t.classList.remove("is-hover"))
  })

  // ---------- full-screen viewer ----------
  let dlg: HTMLDialogElement, stage: HTMLElement, pic: HTMLImageElement, count: HTMLElement
  let i = 0, scale = 1, tx = 0, ty = 0
  const pts = new Map<number, { x: number; y: number }>()
  let start = { x: 0, y: 0, tx: 0, ty: 0, moved: 0 }, pinch = { d: 0, s: 1 }

  function build() {
    dlg = document.createElement("dialog")
    dlg.className = "zm"
    dlg.setAttribute("aria-label", "Photo viewer")
    const arrow = (d: string) => `<svg width="22" height="12" viewBox="0 0 26 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`
    dlg.innerHTML = `
      <div class="zm__bar"><span class="cap zm__count" aria-live="polite"></span><button class="pill zm__close" type="button">Close</button></div>
      <div class="zm__stage"><img class="zm__img" alt="" draggable="false"></div>
      ${items.length > 1 ? `<button class="zm__nav zm__prev" type="button" aria-label="Previous photo">${arrow("M25 7H1M7 1L1 7l6 6")}</button><button class="zm__nav zm__next" type="button" aria-label="Next photo">${arrow("M1 7h24M19 1l6 6-6 6")}</button>` : ""}
      <p class="cap zm__hint">${fine ? "Click to zoom · move to look around" : "Tap or pinch to zoom · drag to look around"}</p>`
    document.body.append(dlg)
    stage = dlg.querySelector(".zm__stage")!; pic = dlg.querySelector(".zm__img")!; count = dlg.querySelector(".zm__count")!
    // Buttons answer a finger on release: after a swipe, mobile browsers sometimes never turn the next tap into a
    // "click". A click that does follow is skipped, so nothing runs twice; mouse and keyboard use the click.
    const press = (el: Element | null, fn: () => void) => {
      if (!el) return
      let skip = 0
      el.addEventListener("pointerup", (e) => { const pe = e as PointerEvent; if (pe.pointerType !== "mouse") { skip = performance.now(); fn() } })
      el.addEventListener("click", () => { if (performance.now() - skip > 600) fn() })
    }
    press(dlg.querySelector(".zm__close"), () => dlg.close())
    press(dlg.querySelector(".zm__prev"), () => show(i - 1))
    press(dlg.querySelector(".zm__next"), () => show(i + 1))
    dlg.addEventListener("close", () => { document.documentElement.classList.remove("zm-lock"); triggers[i]?.focus({ preventScroll: true }) })
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); show(i + 1) }
      else if (e.key === "ArrowLeft") { e.preventDefault(); show(i - 1) }
    })
    stage.addEventListener("pointerdown", down)
    stage.addEventListener("pointermove", move)
    stage.addEventListener("pointerup", up)
    stage.addEventListener("pointercancel", up)
    stage.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") pts.delete(e.pointerId) })
    stage.addEventListener("wheel", (e) => {   // trackpad pinch / scroll wheel zooms around the cursor
      e.preventDefault()
      zoomAt(e.clientX, e.clientY, clamp(scale * Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .002)), 1, MAX))
    }, { passive: false })
    addEventListener("resize", () => { if (dlg.open) { clampPan(); paint() } })
  }

  function open(n: number) {
    if (!dlg) build()
    show(n)
    dlg.showModal()
    document.documentElement.classList.add("zm-lock")
    dlg.querySelector<HTMLElement>(".zm__close")!.focus({ preventScroll: true })
  }
  function show(n: number) {
    i = ((n % items.length) + items.length) % items.length
    pic.src = items[i].src; pic.alt = items[i].alt
    count.textContent = `${String(i + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`
    scale = 1; tx = 0; ty = 0; paint(true)
  }
  function paint(instant = false) {
    pic.style.transition = instant || calm ? "none" : ""
    pic.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${scale.toFixed(3)})`
    dlg.classList.toggle("is-zoomed", scale > 1.01)
    if (instant) { void pic.offsetWidth; pic.style.transition = "" }
  }
  function clampPan() {
    const s = stage.getBoundingClientRect()
    const mx = Math.max(0, (pic.offsetWidth * scale - s.width) / 2), my = Math.max(0, (pic.offsetHeight * scale - s.height) / 2)
    tx = clamp(tx, -mx, mx); ty = clamp(ty, -my, my)
  }
  // keep the point under the finger / cursor where it is while the scale changes
  function zoomAt(x: number, y: number, s1: number) {
    const r = stage.getBoundingClientRect(), px = x - (r.left + r.width / 2), py = y - (r.top + r.height / 2)
    tx = px - ((px - tx) * s1) / scale; ty = py - ((py - ty) * s1) / scale; scale = s1
    if (scale <= 1.01) { scale = 1; tx = 0; ty = 0 }
    clampPan(); paint()
  }
  // a mouse pans by moving: the cursor's place on the screen picks the part of the photo
  function follow(x: number, y: number) {
    const r = stage.getBoundingClientRect()
    const mx = Math.max(0, (pic.offsetWidth * scale - r.width) / 2), my = Math.max(0, (pic.offsetHeight * scale - r.height) / 2)
    tx = -clamp((x - r.left) / r.width * 2 - 1, -1, 1) * mx; ty = -clamp((y - r.top) / r.height * 2 - 1, -1, 1) * my
    pic.style.transition = "transform .25s ease-out"; paint(); pic.style.transition = ""
  }

  function down(e: PointerEvent) {
    stage.setPointerCapture(e.pointerId)
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    start = { x: e.clientX, y: e.clientY, tx, ty, moved: 0 }
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: scale } }
  }
  function move(e: PointerEvent) {
    if (e.pointerType === "mouse" && !pts.size) { if (scale > 1) follow(e.clientX, e.clientY); return }
    if (!pts.has(e.pointerId)) return
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    start.moved = Math.max(start.moved, Math.hypot(e.clientX - start.x, e.clientY - start.y))
    if (pts.size === 2) {
      const [a, b] = [...pts.values()]
      dlg.classList.add("is-dragging")
      zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, clamp(pinch.s * Math.hypot(a.x - b.x, a.y - b.y) / (pinch.d || 1), 1, MAX))
    } else if (scale > 1 && e.pointerType !== "mouse") {
      dlg.classList.add("is-dragging")
      tx = start.tx + e.clientX - start.x; ty = start.ty + e.clientY - start.y
      clampPan(); paint()
    }
  }
  function up(e: PointerEvent) {
    if (!pts.has(e.pointerId)) return
    const wasPinch = pts.size > 1
    pts.delete(e.pointerId)
    dlg.classList.remove("is-dragging")
    if (wasPinch) { start.moved = 99; return }
    const dx = e.clientX - start.x
    if (start.moved < 8) {
      // a tap / click: zoom in at that point, or back out; a tap beside the photo closes the viewer
      // (judge by position: while a finger is down the stage captures it, so e.target is always the stage)
      const r = pic.getBoundingClientRect()
      const onPic = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      if (!onPic && scale === 1) { dlg.close(); return }
      if (scale > 1) zoomAt(e.clientX, e.clientY, 1)
      else { zoomAt(e.clientX, e.clientY, TAP); if (e.pointerType === "mouse") follow(e.clientX, e.clientY) }
    } else if (scale === 1 && Math.abs(dx) > 60 && items.length > 1) show(dx < 0 ? i + 1 : i - 1)   // swipe
  }

  triggers.forEach((t, n) => t.addEventListener("click", (e) => { e.preventDefault(); t.classList.remove("is-hover"); open(n) }))
}
