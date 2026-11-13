// Zips the theme folders into offline-theme.zip for Online Store → Themes → Add theme → Upload zip file.
import { execFileSync } from "node:child_process"
const dirs = ["assets", "config", "layout", "locales", "sections", "snippets", "templates"]
execFileSync("python3", ["-c", `
import zipfile, os, sys
with zipfile.ZipFile("offline-theme.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for d in sys.argv[1:]:
        for base, _, files in os.walk(d):
            for f in sorted(files):
                z.write(os.path.join(base, f))
print("offline-theme.zip")`, ...dirs], { stdio: "inherit" })
