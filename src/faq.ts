// FAQ: the questions are plain <details> in faq.html (they work without JavaScript). This script opens a
// question when its topic is linked (#shipping), and sends the contact form.
//
// Where the form sends is set in src/site.json:
//   "contactEndpoint": a form service URL that accepts a POST, e.g. "https://formspree.io/f/abcdwxyz"
//   "contactEmail":    used only when there is no endpoint; opens the visitor's email app with the message filled in
import site from "./site.json"
import { chrome } from "./chrome"

chrome()

// a topic link opens that group's first question
function openFromHash() {
  const g = document.getElementById(decodeURIComponent(location.hash.slice(1)))
  const q = g?.classList.contains("faq__group") ? g.querySelector<HTMLDetailsElement>(".faq__q") : null
  if (q) q.open = true
}
addEventListener("hashchange", openFromHash)
openFromHash()

// ---------- contact form ----------
const form = document.getElementById("contactform") as HTMLFormElement
const status = document.getElementById("c-status")!
const btn = form.querySelector<HTMLButtonElement>("button[type=submit]")!
const say = (s: string, ok = false) => { status.textContent = s; status.classList.toggle("is-ok", ok) }

function check(): string {
  const f = new FormData(form)
  if (!String(f.get("name") || "").trim()) return "Add your name."
  const email = String(f.get("email") || "").trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Add an email we can answer to."
  if (String(f.get("message") || "").trim().length < 5) return "Write us a message first."
  return ""
}

form.addEventListener("submit", async (e) => {
  e.preventDefault()
  const problem = check()
  if (problem) {
    say(problem)
    form.classList.remove("is-shake"); void form.offsetWidth; form.classList.add("is-shake")
    form.querySelector<HTMLElement>(":invalid")?.focus()
    return
  }
  const f = new FormData(form)
  if (f.get("_gotcha")) { form.reset(); say("Message sent. Now go outside.", true); return }   // bot filled the trap
  f.set("_subject", `OFFLINE contact: ${f.get("topic")}`)

  if (site.contactEndpoint) {
    btn.disabled = true; say("Sending…")
    try {
      const r = await fetch(site.contactEndpoint, { method: "POST", body: f, headers: { Accept: "application/json" } })
      if (!r.ok) throw new Error(String(r.status))
      form.reset(); form.classList.add("is-sent")
      say("Message sent. We'll answer within two working days. Now go outside.", true)
    } catch {
      say("That didn't go through. Check your connection and try again.")
    } finally { btn.disabled = false }
    return
  }

  if (site.contactEmail) {
    const body = `${f.get("message")}\n\n— ${f.get("name")} (${f.get("email")})${f.get("order") ? `\nOrder: ${f.get("order")}` : ""}`
    location.href = `mailto:${site.contactEmail}?subject=${encodeURIComponent(String(f.get("_subject")))}&body=${encodeURIComponent(body)}`
    say("Your email app should open with the message ready to send.", true)
    return
  }

  console.warn("[contact] Set contactEndpoint or contactEmail in src/site.json so the form can send.")
  say("Sorry, the form isn't switched on yet. Try again soon.")
})
