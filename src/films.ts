// Journal films (sections/films.liquid): each tile shows a poster; pressing play swaps in the player that
// Liquid prepared in a <template>, so YouTube / Vimeo load nothing until someone actually plays a film.
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches
document.querySelectorAll<HTMLElement>(".jr__film").forEach((f) => {
  const play = f.querySelector<HTMLButtonElement>(".jr__play"), tpl = f.querySelector<HTMLTemplateElement>("template")
  if (!play || !tpl) return
  play.addEventListener("click", () => {
    const screen = f.querySelector<HTMLElement>(".jr__screen")!
    const node = tpl.content.cloneNode(true) as DocumentFragment
    if (calm) node.querySelectorAll("iframe").forEach((i) => (i.src = i.src.replace("autoplay=1", "autoplay=0")))
    if (calm) node.querySelectorAll("video").forEach((v) => v.removeAttribute("autoplay"))
    screen.replaceChildren(node)
    f.classList.add("is-playing")
    screen.querySelector<HTMLElement>("iframe, video")?.focus()
  })
})
