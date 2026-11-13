// Shop all / any collection (sections/main-collection.liquid): filter the grid by product type with the pills.
// ?type=shoes keeps the filter in the link. Works on the products of the current page (up to 48 at a time).
document.querySelectorAll<HTMLElement>("[data-collection]").forEach((root) => {
  const grid = root.querySelector<HTMLElement>("[data-grid]")!, filters = root.querySelector<HTMLElement>("[data-filters]")
  const count = root.querySelector<HTMLElement>("[data-count-label]")
  if (!filters) return
  const cards = [...grid.querySelectorAll<HTMLElement>(".card")]
  function show(type: string, push = false) {
    const known = [...filters!.querySelectorAll<HTMLElement>("[data-type]")].some((b) => b.dataset.type === type)
    if (!known) type = "all"
    let n = 0
    cards.forEach((c) => {
      const on = type === "all" || c.dataset.type === type
      c.hidden = !on
      if (on) c.style.setProperty("--i", String(n++))
    })
    grid.classList.remove("is-in"); void grid.offsetWidth; grid.classList.add("is-in")
    filters!.querySelectorAll<HTMLElement>("[data-type]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.type === type)))
    if (count) count.textContent = `${n} piece${n === 1 ? "" : "s"}`
    if (push) {
      const u = new URL(location.href)
      if (type === "all") u.searchParams.delete("type"); else u.searchParams.set("type", type)
      history.replaceState(null, "", u)
    }
  }
  filters.addEventListener("click", (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>("[data-type]"); if (b) show(b.dataset.type!, true) })
  show((new URLSearchParams(location.search).get("type") || "all").toLowerCase())
})
