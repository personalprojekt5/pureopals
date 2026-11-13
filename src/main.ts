// OFFLINE — Go touch some grass, dude. (v1.3, 06.11.2026)
// One hero: nine looks stand in a circle seen from above. Drag, wheel or arrows turn the ring; the model in front
// opens into View look (pins on the clothes + a receipt that feeds down from the top edge of the screen); Ring/Grid
// turns the circle inside out into a 3 × 3 grid; INDEX lists every look.
// Blocks: 1 data · 2 elements · 3 ring maths · 4 spring loop · 5 index & autoplay · 6 input · 7 cursor ·
// 8 view (lightbox + pins) · 9 receipt & bag · 10 index menu · 11 mini menu · 12 grid · 13 clock · 14 boot.

// ---------- 1. data ----------
import { LOOKS, money, pad, productUrl, shopUrl, type Look } from "./data"
import { addToBag, paintCount } from "./bag"
const N = LOOKS.length
// ring seen from above: radius and perspective as shares of the stage width (phone values second)
const RING = { R: .44, Rm: .84, P: .8, Pm: 1.1, horizon: .06, fit: 1.12, front: 1.165, frontM: 1.12, step: .03, lift: 40 }
const SIZES = "(max-width: 809px) 240px, 360px"
const pic = (L: Look, cls: string, alt: string, extra = "") =>
  `<img class="rw__cast" src="${L.shadow}" alt="" aria-hidden="true" draggable="false" decoding="async">` +
  `<img class="${cls}" src="${L.img}" srcset="${L.small} 571w, ${L.img} 914w" sizes="${SIZES}" alt="${alt}" draggable="false" decoding="async"${extra}>`

// ---------- 2. elements ----------
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const rw = document.querySelector<HTMLElement>(".rw")!, stage = $("stage"), cursor = $("cursor")
const panel = $("receipt"), itemsEl = $("items")
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches
const fine = matchMedia("(hover: hover) and (pointer: fine)").matches

const bodies = LOOKS.map((L, a) => {
  const el = document.createElement("div")
  el.className = "rw__body"
  el.style.setProperty("--foot", String(L.foot))
  el.innerHTML = `<div class="rw__fig">${pic(L, "rw__pic", L.name, a === 0 ? ' fetchpriority="high"' : "")}<button class="rw__hit" type="button" tabindex="-1" data-a="${a}" aria-label="Look ${pad(a + 1)}: ${L.name}"></button></div>`
  $("bodies").append(el)
  return { el, w: 0, f: "", o: "" }
})

// ---------- 3. ring maths ----------
let W = 0, H = 0, mobile = false, modelH = 0, unit = 120, gap = 120, band = 216, FS = RING.front
const STEP = (Math.PI * 2) / N
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x))
const wrapPi = (x: number) => { x = x % (Math.PI * 2); if (x > Math.PI) x -= Math.PI * 2; if (x <= -Math.PI) x += Math.PI * 2; return x }
const mod = (x: number, m: number) => ((x % m) + m) % m
function measure() {
  W = stage.clientWidth; H = stage.clientHeight; mobile = innerWidth < 810
  gap = mobile ? 168 : 120    // floor line above the bottom bar
  band = 136                  // no title: only the status bar and the QR sit above the ring
  modelH = Math.max(200, Math.round((H - gap - 18 - band) / RING.fit))
  FS = mobile ? RING.frontM : RING.front
  stage.style.setProperty("--model-h", modelH + "px")
  unit = Math.max(mobile ? 90 : 120, W * .3)
  bodies.forEach((b) => (b.w = modelH * 4 / 7))
  if (grid) gridPlace()
  dirty = true; kick()
}
function put(b: typeof bodies[number], x: number, bottom: number, s: number, o: number, blur: number, z: number) {
  if (x + (b.w * s) / 2 < -4 || x - (b.w * s) / 2 > W + 4) o = 0
  b.el.style.transform = `translate3d(${x.toFixed(1)}px,${(-bottom).toFixed(1)}px,0) translateX(-50%) scale(${s.toFixed(4)})`
  const os = o.toFixed(3)
  if (os !== b.o) { b.o = os; b.el.style.opacity = os; b.el.style.visibility = o < .01 ? "hidden" : ""; b.el.style.pointerEvents = o < .5 ? "none" : "" }
  const fs = blur <= .05 ? "" : `blur(${blur.toFixed(1)}px)`
  if (fs !== b.f) { b.f = fs; b.el.style.filter = fs }
  b.el.style.zIndex = String(z)
}
function render() {
  if (grid) return
  const cx = W * .5, R = W * (mobile ? RING.Rm : RING.R), P = W * (mobile ? RING.Pm : RING.P)
  // lift: the whole ring sits 40 px higher than its fitted place (room above the bottom bar)
  const floor = H - gap - RING.lift, horizon = band + (H - band) * RING.horizon - RING.lift
  bodies.forEach((b, a) => {
    const phi = wrapPi((a - cur) * STEP), z = R * (1 - Math.cos(phi)), persp = P / (P + z), sl = Math.abs(phi) / STEP
    const near = clamp(1 - sl, 0, 1)
    const s = persp * (1 + (FS - 1) * near)
    // the model in front also steps a little towards the viewer (desktop)
    const x = cx + R * Math.sin(phi) * persp, feet = horizon + (floor - horizon) * persp + (mobile ? 0 : H * RING.step) * near
    const blur = sl <= 1 ? 1.8 * sl : Math.min(1.8 + (sl - 1) * 2, 6.5)
    put(b, x, H - feet, s, 1, blur, Math.round(s * 1000))
  })
}

// ---------- 4. spring loop (critically damped, 3 sub-steps) ----------
const K = 95, C = 2 * Math.sqrt(K)
let cur = calm ? 0 : -1.15, target = 0, vel = 0, raf = 0, last = 0, dirty = true, visible = true
function kick() { if (!raf && visible) { last = 0; raf = requestAnimationFrame(frame) } }
function frame(now: number) {
  raf = 0
  const dt = last ? Math.min(.034, (now - last) / 1000) : 1 / 60; last = now
  let moving = false
  if (calm) { if (cur !== target) dirty = true; cur = target }   // reduced motion: jump, but still redraw
  else for (let k = 0, h = dt / 3; k < 3; k++) { const acc = -K * (cur - target) - C * vel; vel += acc * h; cur += vel * h }
  if (Math.abs(cur - target) <= .0005 && Math.abs(vel) <= .0005) { cur = target; vel = 0 } else moving = true
  if (moving || dirty || dragging) { dirty = false; render() }
  rw.classList.toggle("is-moving", moving || dragging)
  if (moving || dragging) raf = requestAnimationFrame(frame)
}

// ---------- 5. index & autoplay ----------
let index = -1, playing = !calm, engaged = false, timer = 0, panelHover = false, zoomed = false
const live = $("live"), nowEl = $("now"), autoBtn = $("auto")
function setIndex(i: number, silent = false) {
  i = mod(i, N)
  if (i === index) return
  index = i
  bodies.forEach((b, a) => b.el.querySelector(".rw__hit")!.setAttribute("tabindex", a === i ? "0" : "-1"))
  idxItems.forEach((b, j) => b.setAttribute("aria-current", String(j === i)))
  capEls.forEach((c, j) => c.classList.toggle("is-on", j === i))
  $("nowi").textContent = pad(i + 1); $("nown").textContent = LOOKS[i].name
  if (!silent) {
    live.textContent = `Look ${i + 1}: ${LOOKS[i].name}`
    if (!calm) {
      stage.classList.remove("is-sweep"); void stage.offsetWidth; stage.classList.add("is-sweep")
      nowEl.classList.remove("is-swap"); void nowEl.offsetWidth; nowEl.classList.add("is-swap")
    }
    if (zoomed) closeView()
  }
  renderReceipt()
  renderMini(!silent)
  restartTimer()
}
function moveTo(T: number) { target = T; setIndex(mod(T, N)); kick() }
const next = () => moveTo(Math.round(target) + 1), prev = () => moveTo(Math.round(target) - 1)
function go(i: number) { let d = mod(i - index, N); if (d > N / 2) d -= N; moveTo(Math.round(target) + d) }
function restartTimer() {
  clearTimeout(timer)
  if (playing) timer = window.setTimeout(() => {
    if (visible && !dragging && !document.hidden && !panelHover && !zoomed && !grid && !rw.classList.contains("is-index")) next(); else restartTimer()
  }, 5000)
}
function play(on: boolean) { playing = on; rw.classList.toggle("is-playing", on); autoBtn.setAttribute("aria-pressed", String(on)); restartTimer() }
function engage() { engaged = true; if (playing) play(false) }
autoBtn.addEventListener("click", () => { if (!playing) engaged = false; play(!playing) })
panel.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") panelHover = true })
panel.addEventListener("pointerleave", () => { panelHover = false })

// ---------- 6. input: drag, click, trackpad, keys ----------
let dragging = false, down = false, sx = 0, sy = 0, st = 0, pid = -1, samples: { x: number; t: number }[] = [], suppress = 0
stage.addEventListener("pointerdown", (e) => {
  if (zoomed || grid || (e.pointerType === "mouse" && e.button !== 0)) return
  down = true; dragging = false; sx = e.clientX; sy = e.clientY; st = target; pid = e.pointerId; samples = [{ x: e.clientX, t: e.timeStamp }]
})
stage.addEventListener("pointermove", (e) => {
  moveCursor(e)
  if (!down || e.pointerId !== pid) return
  if (e.pointerType === "mouse" && !(e.buttons & 1)) return release(e)
  const dx = e.clientX - sx, dy = e.clientY - sy
  if (!dragging) {
    if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { down = false; return }
    if (Math.abs(dx) > 8 && Math.abs(dx) > 1.2 * Math.abs(dy)) { dragging = true; rw.classList.add("is-dragging"); stage.setPointerCapture(pid); engage() }
    else return
  }
  samples.push({ x: e.clientX, t: e.timeStamp }); if (samples.length > 6) samples.shift()
  target = st - dx / unit; setIndex(mod(Math.round(target), N)); kick()
})
function release(e: PointerEvent) {
  if (!down) return
  down = false
  if (!dragging) return
  dragging = false; rw.classList.remove("is-dragging"); suppress = e.timeStamp
  const f = samples[0], l = samples[samples.length - 1], vx = l.t > f.t ? (l.x - f.x) / (l.t - f.t) : 0
  const dx = e.clientX - sx, from = Math.round(st)
  let i: number
  if (mobile) i = Math.abs(dx) > 30 || Math.abs(vx) > .3 ? from + (dx < 0 ? 1 : -1) : from   // one look per swipe
  else {
    i = Math.round(target - (vx * 160) / unit)
    if (i === from && Math.abs(vx) > .3) i = from + (vx < 0 ? 1 : -1)
    i = clamp(i, from - 2, from + 2)
  }
  moveTo(i)
}
stage.addEventListener("pointerup", release)
stage.addEventListener("pointercancel", release)
stage.addEventListener("click", (e) => {
  if (e.timeStamp - suppress < 60) return
  const hit = (e.target as Element).closest<HTMLElement>(".rw__hit")
  if (!hit) return
  const a = +hit.dataset.a!
  if (grid) { target = cur = a; vel = 0; setIndex(a); openView(); return }
  const k = mod(a - Math.round(target) + N / 2, N) - N / 2
  if (k === 0) openView(); else { engage(); moveTo(Math.round(target) + k) }
})
let acc = 0, lock = 0
stage.addEventListener("wheel", (e) => {
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || zoomed || grid) return
  e.preventDefault()
  if (e.timeStamp < lock) return
  acc += e.deltaX
  if (Math.abs(acc) > 45) { engage(); acc > 0 ? next() : prev(); acc = 0; lock = e.timeStamp + 520 }
}, { passive: false })
stage.addEventListener("keydown", (e) => {
  const cols = grid ? 3 : 0
  if (e.key === "ArrowRight") { e.preventDefault(); engage(); next() }
  else if (e.key === "ArrowLeft") { e.preventDefault(); engage(); prev() }
  else if (cols && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); engage(); go(index + (e.key === "ArrowDown" ? cols : -cols)) }
  else if (e.key === "Enter" && !zoomed) { e.preventDefault(); if (grid) { target = cur = index; vel = 0 } openView() }
})
addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return
  if (zoomed) closeView(); else if (rw.classList.contains("is-index")) menu(false)
})

// ---------- 7. cursor ----------
let tx = 0, ty = 0, cx2 = 0, cy2 = 0, craf = 0
if (fine) rw.classList.add("has-cursor"); else cursor.remove()
function moveCursor(e: PointerEvent) {
  if (!fine || e.pointerType !== "mouse") return
  const r = stage.getBoundingClientRect()
  tx = e.clientX - r.left; ty = e.clientY - r.top
  if (!cursor.classList.contains("is-on")) { cx2 = tx; cy2 = ty; cursor.classList.add("is-on") }
  const t = e.target as HTMLElement, hit = t.closest<HTMLElement>(".rw__hit")
  const front = hit && (grid || mod(+hit.dataset.a! - Math.round(target) + N / 2, N) - N / 2 === 0)
  cursor.classList.toggle("is-view", !!front && !dragging && !zoomed)
  cursor.classList.toggle("is-link", !!hit && !front && !dragging)
  cursor.classList.toggle("is-pin", zoomed && !!t.closest(".rw__pin, .rw__lb-close"))
  if (!craf) craf = requestAnimationFrame(stepCursor)
}
function stepCursor() {
  craf = 0
  const k = calm ? 1 : .18
  cx2 += (tx - cx2) * k; cy2 += (ty - cy2) * k
  cursor.style.transform = `translate3d(${cx2.toFixed(1)}px,${cy2.toFixed(1)}px,0)`
  if (Math.abs(tx - cx2) + Math.abs(ty - cy2) > .4) craf = requestAnimationFrame(stepCursor)
}
stage.addEventListener("pointerleave", () => cursor.classList.remove("is-on", "is-view", "is-link"))

// ---------- 8. view: the front model grows into a lightbox with pins (FLIP) ----------
const lb = $("lb"), lbstage = $("lbstage")
let model: HTMLElement | null = null
function frontFig() { return bodies[mod(Math.round(target), N)].el.querySelector<HTMLElement>(".rw__fig")! }
function openView() {
  if (zoomed) return
  engage(); hot(0)
  if (rw.classList.contains("is-index")) menu(false)
  const L = LOOKS[index], from = frontFig()
  $("lbkick").textContent = `${pad(index + 1)}.`; $("lbname").textContent = L.name
  const r = lbstage.getBoundingClientRect(), h = Math.max(160, Math.min(r.height, r.width / (4 / 7)))
  model = document.createElement("div")
  model.className = "rw__lb-model"
  model.style.setProperty("--model-h", h + "px")
  model.style.setProperty("--foot", String(L.foot))
  model.innerHTML = `<div class="rw__fig">${pic(L, "rw__pic", L.name)}<div class="rw__pins">${L.pins.map(([x, y], j) =>
    `<button class="rw__pin" type="button" data-p="${j + 1}" style="left:${x}%;top:${y}%;--pi:${j + 1}" aria-label="${pad(j + 1)}: ${L.pieces[j].name}, ${money(L.pieces[j].price)}"><span class="sticker">${pad(j + 1)}</span><span class="rw__tip"><b>${L.pieces[j].name}</b><span>${money(L.pieces[j].price)}</span></span></button>`).join("")}</div></div>`
  lbstage.append(model)
  zoomed = true; rw.classList.add("is-zoom"); lb.setAttribute("aria-hidden", "false"); panel.setAttribute("aria-hidden", "false")
  if (!calm) {
    const a = from.getBoundingClientRect(), b = model.querySelector(".rw__fig")!.getBoundingClientRect()
    model.style.transition = "none"
    model.style.transform = `translate3d(${a.left - b.left}px,${a.bottom - b.bottom}px,0) scale(${a.height / b.height})`
    void model.offsetWidth
    model.style.transition = ""; model.style.transform = ""
  }
  $("lbclose").focus({ preventScroll: true })
}
function closeView() {
  if (!zoomed || !model) return
  const m = model, to = frontFig()
  if (!calm) {
    const a = to.getBoundingClientRect(), b = m.querySelector(".rw__fig")!.getBoundingClientRect()
    m.style.transform = `translate3d(${a.left - b.left}px,${a.bottom - b.bottom}px,0) scale(${a.height / b.height})`
  }
  zoomed = false; rw.classList.remove("is-zoom"); lb.setAttribute("aria-hidden", "true"); panel.setAttribute("aria-hidden", "true"); hot(0)
  setTimeout(() => m.remove(), calm ? 0 : 950); model = null
  if (lb.contains(document.activeElement) || panel.contains(document.activeElement)) stage.focus({ preventScroll: true })
}
$("lbclose").addEventListener("click", closeView)
lbstage.addEventListener("click", (e) => {
  const pin = (e.target as HTMLElement).closest<HTMLElement>(".rw__pin")
  if (pin) { hot(+pin.dataset.p!, true); return }
  if (!(e.target as HTMLElement).closest(".rw__fig")) closeView()
})
lbstage.addEventListener("pointermove", (e) => moveCursor(e as PointerEvent))
lbstage.addEventListener("pointerover", (e) => { if (e.pointerType !== "mouse") return; const pin = (e.target as HTMLElement).closest<HTMLElement>(".rw__pin"); if (pin) hot(+pin.dataset.p!) })
lbstage.addEventListener("focusin", (e) => { const pin = (e.target as HTMLElement).closest<HTMLElement>(".rw__pin"); if (pin) hot(+pin.dataset.p!) })
// tooltip side: right of the dot, else left, else under it (shifted to stay inside the stage)
function placeTip(pin: HTMLElement) {
  const tip = pin.querySelector<HTMLElement>(".rw__tip")!
  pin.classList.remove("is-flip", "is-below"); tip.style.removeProperty("--dx")
  const box = lbstage.getBoundingClientRect(), r = pin.getBoundingClientRect(), w = tip.offsetWidth, m = 8
  if (r.right + w <= box.right - m) return
  if (r.left - w >= box.left + m) { pin.classList.add("is-flip"); return }
  pin.classList.add("is-below")
  const c = r.left + r.width / 2, half = Math.min(w, box.width - m * 2) / 2
  tip.style.setProperty("--dx", `${Math.round(Math.max(box.left + m + half, Math.min(box.right - m - half, c)) - c)}px`)
}
function hot(p: number, reveal = false) {
  document.querySelectorAll(".is-hot").forEach((el) => el.classList.remove("is-hot"))
  if (!p) return
  const pin = lbstage.querySelector<HTMLElement>(`.rw__pin[data-p="${p}"]`)
  if (pin) { placeTip(pin); pin.classList.add("is-hot") }
  const row = itemsEl.querySelector<HTMLElement>(`.rw__item[data-p="${p}"]`)
  row?.classList.add("is-hot")
  if (reveal && row) row.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" })
}

// ---------- 9. receipt & bag ----------
type State = { added: boolean; size: string; touched: boolean }
const state = LOOKS.map((L) => L.pieces.map((p): State => ({ added: false, size: p.sizes[p.sizes.length > 1 ? 1 : 0], touched: p.sizes.length === 1 })))
function renderReceipt() {
  const L = LOOKS[index], S = state[index]
  $("rlook").textContent = `Look ${pad(index + 1)} — ${L.name}`
  itemsEl.innerHTML = L.pieces.map((p, j) => `
    <li class="rw__item${S[j].added ? " is-added" : ""}" data-p="${j + 1}">
      <a class="rw__name" href="${productUrl(p)}">${p.name}</a><span class="rw__price">${money(p.price)}</span>
      <span class="rw__kind cap">${p.kind}</span>
      <button class="rw__add" type="button" aria-expanded="false" aria-label="Add to bag: ${p.name}"></button>
      <div class="rw__picker" hidden>
        <div class="rw__sizes" role="group" aria-label="Size">${p.sizes.map((s) => `<button class="rw__size" type="button" aria-pressed="${s === S[j].size}" data-s="${s}">${s}</button>`).join("")}</div>
        <button class="rw__confirm" type="button">Add to bag</button>
      </div>
    </li>`).join("")
  const full = L.pieces.reduce((t, p) => t + p.price, 0)
  $("rsub").textContent = money(full); $("rdisc").textContent = "−" + money(full * .1); $("rtot").textContent = money(full * .9)
  $("msg").textContent = ""
  panel.classList.toggle("is-complete", S.every((s) => s.added))
}
function addPieces(js: number[]) {
  const S = state[index]
  js.forEach((j) => {
    S[j].added = true
    const row = itemsEl.querySelector(`.rw__item[data-p="${j + 1}"]`)
    row?.classList.add("is-added"); row?.classList.remove("is-picking"); row?.querySelector(".rw__picker")?.setAttribute("hidden", "")
    row?.querySelector(".rw__add")?.setAttribute("aria-label", `In bag: ${LOOKS[index].pieces[j].name}`)
  })
  addToBag(js.map((j) => ({ slug: LOOKS[index].pieces[j].slug, size: state[index][j].size })))
  toast(js.length > 1 ? "Look saved to your bag" : "Piece saved to your bag")
  panel.classList.toggle("is-complete", S.every((s) => s.added))
}
itemsEl.addEventListener("click", (e) => {
  const t = e.target as HTMLElement, row = t.closest<HTMLElement>(".rw__item"); if (!row) return
  const j = +row.dataset.p! - 1, p = LOOKS[index].pieces[j], S = state[index][j]
  engage()
  const add = t.closest<HTMLElement>(".rw__add")
  if (add) {
    if (S.added) return
    if (p.sizes.length === 1) return addPieces([j])
    const pk = row.querySelector<HTMLElement>(".rw__picker")!, open = !!pk.hidden
    pk.hidden = !open; row.classList.toggle("is-picking", open); add.setAttribute("aria-expanded", String(open))
    return
  }
  const size = t.closest<HTMLElement>(".rw__size")
  if (size) { S.size = size.dataset.s!; S.touched = true; row.querySelectorAll(".rw__size").forEach((b) => b.setAttribute("aria-pressed", String(b === size))); return }
  if (t.closest(".rw__confirm")) { S.touched = true; addPieces([j]) }
})
itemsEl.addEventListener("pointerover", (e) => { if (e.pointerType !== "mouse") return; const row = (e.target as HTMLElement).closest<HTMLElement>(".rw__item"); if (row) hot(+row.dataset.p!) })
itemsEl.addEventListener("pointerleave", () => hot(0))
$("cta").addEventListener("click", () => {
  const S = state[index], L = LOOKS[index]
  if (S.every((s) => s.added)) return
  engage()
  const open = S.map((s, j) => (!s.added ? j : -1)).filter((j) => j >= 0)
  const ready = open.filter((j) => S[j].touched), pending = open.filter((j) => !S[j].touched)
  if (ready.length) addPieces(ready)
  if (pending.length) {
    pending.forEach((j, k) => { if (mobile && k) return; const row = itemsEl.querySelector<HTMLElement>(`.rw__item[data-p="${j + 1}"]`)!; row.classList.add("is-picking"); row.querySelector<HTMLElement>(".rw__picker")!.hidden = false })
    $("msg").textContent = "Pick a size for: " + pending.map((j) => L.pieces[j].name).join(", ")
  }
})
let toastT = 0
function toast(s: string) { const t = $("toast"); t.textContent = s; t.classList.add("is-on"); clearTimeout(toastT); toastT = window.setTimeout(() => t.classList.remove("is-on"), 2500) }

// ---------- 10. index menu ----------
const idx = $("index"), idxBtn = $("indexbtn")
const idxItems = LOOKS.map((L, i) => {
  const li = document.createElement("li"), b = document.createElement("button")
  li.style.setProperty("--i", String(i))
  b.type = "button"; b.className = "idx__item"; b.dataset.i = String(i)
  b.innerHTML = `<span class="idx__n cap">${pad(i + 1)}</span><span class="idx__name">${L.name}</span><span class="idx__meta cap">${L.pieces.length} pieces · ${money(L.pieces.reduce((t, p) => t + p.price, 0))}</span>`
  li.append(b); $("idxlist").append(li)
  return b
})
function menu(open: boolean) {
  rw.classList.toggle("is-index", open); idx.setAttribute("aria-hidden", String(!open)); idxBtn.setAttribute("aria-expanded", String(open))
  if (open) { engage(); if (zoomed) closeView(); idxItems[index]?.focus({ preventScroll: true }) }
  else if (idx.contains(document.activeElement)) idxBtn.focus({ preventScroll: true })
}
idxBtn.addEventListener("click", () => menu(!rw.classList.contains("is-index")))
$("idxclose").addEventListener("click", () => menu(false))
$("idxlist").addEventListener("click", (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>(".idx__item"); if (b) { go(+b.dataset.i!); menu(false) } })
$("plus").addEventListener("click", () => openView())

// ---------- 11. mini menu: the pieces of the look in front ----------
const mini = $("mini")
function renderMini(animate: boolean) {
  mini.innerHTML = LOOKS[index].pieces.map((p, j) => `<li style="--i:${j + 1}"><button class="rw__mini-item" type="button" data-p="${j + 1}" aria-label="${p.name}, ${money(p.price)}"><span class="rw__mini-img"><img src="${p.img}" alt="" width="48" height="48" loading="lazy" decoding="async"></span><span class="rw__mini-txt"><span class="rw__mini-name">${p.name}</span><span class="rw__mini-price">${money(p.price)}</span></span></button></li>`).join("")
  if (animate && !calm) { mini.classList.remove("is-in"); void mini.offsetWidth; mini.classList.add("is-in") }
}
mini.addEventListener("click", (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>(".rw__mini-item"); if (!b) return; openView(); hot(+b.dataset.p!, true) })

// ---------- 12. grid: the ring turns inside out into a 3 × 3 grid ----------
let grid = false, gridT = 0
const capEls = LOOKS.map((L, i) => {
  const c = document.createElement("span"); c.className = "rw__gcap cap"; c.style.setProperty("--i", String(i))
  c.innerHTML = `${pad(i + 1)}&nbsp;&nbsp;${L.name}`; $("gcaps").append(c); return c
})
function gridPlace() {
  const cols = 3, rows = Math.ceil(N / cols)
  const t = mobile ? 72 : 80, bottom = H - (mobile ? 104 : 96), cellH = (bottom - t) / rows, cellW = W / cols
  const s = Math.min(cellH - 40, cellW * 7 / 4 * .92) / modelH
  bodies.forEach((b, a) => {
    const col = a % cols, row = Math.floor(a / cols), x = cellW * (col + .5), feet = t + cellH * (row + 1) - 32
    b.el.style.transform = `translate3d(${x.toFixed(1)}px,${(feet - H).toFixed(1)}px,0) translateX(-50%) scale(${s.toFixed(4)})`
    b.el.style.opacity = "1"; b.el.style.visibility = ""; b.el.style.pointerEvents = ""; b.el.style.filter = ""; b.el.style.zIndex = String(10 + row)
    b.o = "1"; b.f = ""
    capEls[a].style.transform = `translate3d(${x.toFixed(1)}px,${(feet + 12).toFixed(1)}px,0) translateX(-50%)`
  })
}
function setView(g: boolean) {
  if (g === grid || zoomed) return
  engage()
  // stagger in waves: the model in front moves first, the ones further round the ring follow
  bodies.forEach((b, a) => { const wave = Math.round((Math.abs(wrapPi((a - cur) * STEP)) / Math.PI) * 4); b.el.style.setProperty("--d", `${(wave * (g ? .32 : .24)).toFixed(2)}s`) })
  rw.classList.add("is-anim"); clearTimeout(gridT)
  grid = g; rw.classList.toggle("is-grid", g)
  document.querySelectorAll<HTMLElement>(".rw__vbtn").forEach((v) => v.setAttribute("aria-pressed", String((v.dataset.v === "grid") === g)))
  stage.setAttribute("aria-roledescription", g ? "grid of looks" : "carousel")
  if (g) gridPlace(); else { bodies.forEach((b) => { b.o = ""; b.f = "" }); dirty = true; render() }
  gridT = window.setTimeout(() => rw.classList.remove("is-anim"), calm ? 0 : 1700)
}
document.querySelectorAll<HTMLElement>(".rw__vbtn").forEach((v) => v.addEventListener("click", () => setView(v.dataset.v === "grid")))

// ---------- 13. status bar clock: the visitor's own time ----------
const clock = $("clock")
const fmt = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" })
function tick() { clock.textContent = fmt.format(new Date()); window.setTimeout(tick, 60000 - (Date.now() % 60000) + 50) }
tick()

// ---------- 14. boot ----------
new ResizeObserver(() => measure()).observe(stage)
new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; if (visible) kick() }).observe(stage)
document.addEventListener("visibilitychange", () => { if (!document.hidden) { kick(); restartTimer() } })
$("nowt").textContent = pad(N)
// deep link: #look-3 opens the ring on look 03 (the shop and product pages link here)
const deep = /^#look-(\d+)$/.exec(location.hash), start = deep ? clamp(+deep[1] - 1, 0, N - 1) : 0
if (start) { target = start; cur = calm ? start : start - 1.15 }
document.querySelectorAll<HTMLAnchorElement>("[data-shop]").forEach((a) => (a.href = shopUrl()))
paintCount()
measure()
setIndex(start, true)
play(playing)
kick()
