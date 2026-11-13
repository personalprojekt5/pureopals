// Journal: fills each chapter with its model, lines up all nine looks at the end of the story, and turns every
// film tile into a player. Videos only load when the visitor presses play (no third-party embed before that).
import { LOOKS, esc } from "./data"
import { chrome } from "./chrome"

chrome()
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches

const model = (a: number, sizes: string) => {
  const L = LOOKS[a]
  return `<div class="jr__model" style="--foot:${L.foot}"><img class="jr__cast" src="${L.shadow}" alt="" decoding="async" loading="lazy"><img class="jr__pic" src="${L.img}" srcset="${L.small} 571w, ${L.img} 914w" sizes="${sizes}" alt="${esc(L.name)}" decoding="async" loading="lazy"></div>`
}
const lookOf = (el: HTMLElement) => Math.min(LOOKS.length, Math.max(1, Number(el.dataset.look) || 1)) - 1

// chapters
document.querySelectorAll<HTMLElement>(".jr__spread").forEach((s) => {
  s.querySelector(".jr__fig")!.innerHTML = model(lookOf(s), "(max-width: 809px) 60vw, 30vw")
})
// the whole drop, standing in a line
document.getElementById("lineup")!.innerHTML = LOOKS.map((_, a) => model(a, "(max-width: 809px) 20vw, 12vw")).join("")

// films
const PLAY = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`
document.querySelectorAll<HTMLElement>(".jr__film").forEach((f) => {
  const screen = f.querySelector<HTMLElement>(".jr__screen")!
  const { youtube = "", vimeo = "", video = "" } = f.dataset
  const title = f.querySelector(".card__name")?.textContent || "Film"
  const ready = !!(youtube.trim() || vimeo.trim() || video.trim())
  screen.innerHTML = `<div class="jr__poster">${model(lookOf(f), "(max-width: 809px) 50vw, 25vw")}</div>` + (ready
    ? `<button class="jr__play" type="button" aria-label="Play: ${esc(title)}"><span class="jr__play-dot">${PLAY}</span><span class="cap">Play</span></button>`
    : `<span class="jr__soon cap">Coming soon</span>`)
  if (!ready) { f.classList.add("is-soon"); return }
  screen.querySelector(".jr__play")!.addEventListener("click", () => {
    const auto = calm ? 0 : 1
    let player: string
    if (youtube.trim()) player = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtube.trim())}?autoplay=${auto}&rel=0&modestbranding=1" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`
    else if (vimeo.trim()) player = `<iframe src="https://player.vimeo.com/video/${encodeURIComponent(vimeo.trim())}?autoplay=${auto}&dnt=1" title="${esc(title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`
    else player = `<video src="${esc(video.trim())}" controls playsinline ${auto ? "autoplay" : ""} title="${esc(title)}"></video>`
    screen.innerHTML = player
    f.classList.add("is-playing")
    screen.querySelector<HTMLElement>("iframe, video")?.focus()
  })
})
