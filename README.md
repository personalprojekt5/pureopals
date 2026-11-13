# OFFLINE — Shopify theme

The OFFLINE site (the ring of nine looks, View look + receipt, Grid, INDEX, shop, product pages, FAQ, Journal and
the pre-launch landing page) as an Online Store 2.0 theme. Everything a shop owner changes is in Shopify admin or
the theme editor — no code:

| What | Where in Shopify |
|---|---|
| Logo, favicon, colours | Online Store → Themes → Customize → **Theme settings** |
| The nine looks on the ring (model photo, three products, dot positions) | Customize → Home page → **Ring** → each **Look** block |
| Products, prices, sizes, photos | **Products** (sizes are variants with an option called "Size") |
| Landing page + password | **Online Store → Preferences → Password protection**, design in Customize → Password page |
| Email sign-ups from the landing page | **Customers** (tagged `newsletter`, email marketing consent) |
| FAQ questions, size chart | Customize → FAQ page template → **FAQ** blocks |
| Contact form messages | Sent to the store's sender email (**Settings → Notifications**) |
| Journal stories | **Online Store → Blog posts** (blog called *Journal*) |
| Films | Customize → Blog template → **Films** (YouTube / Vimeo link or uploaded video) |
| Complete the look on product pages | **Search & Discovery** app → Product recommendations → complementary products |
| Menus (INDEX sheet, footer, help links) | **Online Store → Navigation** |

## Install

1. **Add the theme** — either
   - **Online Store → Themes → Add theme → Connect from GitHub**, repository `personalprojekt5/pureopals`,
     branch `shopify-theme` (recommended: changes made in the theme editor are committed back), or
   - **Add theme → Upload zip file** with `offline-theme.zip` (`npm run package` makes it).
2. **Import the 27 pieces**: **Products → Import →** `setup/products.csv`. Handles match the looks on the ring, so
   the ring is wired up as soon as the import finishes. Prices import as numbers in your store currency. The
   photos are the demo cut-outs; replace them with your own product photos.
3. **Menus** (**Online Store → Navigation**):
   - `main-menu` (INDEX sheet): Shop all → `/collections/all`, Journal → the blog, FAQ → the FAQ page
   - `footer`: The ring → `/`, Shop all, Journal, FAQ
   - add a menu called **Help** (handle `help`): Shipping → `/pages/faq#shipping`, Returns → `#returns`,
     Size chart → `#sizing`, Care → `#care` (shown on every product page)
4. **FAQ page**: **Online Store → Pages → Add page**, title *FAQ*, template **page.faq**. The questions are in the
   theme editor. The shipping times, prices and return window in it are placeholders: replace them with your terms.
5. **Journal**: **Online Store → Blog posts → Manage blogs → Add blog**, title *Journal*. Each post becomes a
   spread; add the films in Customize → Blogs.
6. **Logo**: Customize → Theme settings → Logo (SVG or transparent PNG).
7. **Landing page**: **Preferences → Password protection** on, with a password for the team. The message there is
   the text under the title. Countdown: Customize → Password page → Drop date.
8. **Launch**: turn password protection off. The landing page disappears and the ring is the home page.

### Optional

- **Full look discount** — the receipt can show "Full look −X%" (Ring section → Full look discount shown). It is only a
  label: create the matching automatic discount in **Discounts** or leave it at 0 (default, line hidden).
- The **filatov.design QR** under the clock can be switched off in the Ring section.

## Develop

```bash
npm install
npm run build      # src/*.ts → assets/offline-*.js
npm run check      # TypeScript + Shopify Theme Check
npx @shopify/cli@latest theme dev --store your-store.myshopify.com
```

- `src/` — TypeScript sources (`ring.ts` is the ring: spring K = 95, the 3 × 3 grid morph, View look FLIP,
  receipt), compiled into `assets/` (commit the built files: Shopify serves `assets/` as is).
- `assets/base.css`, `assets/pages.css` — all styles.
- `sections/`, `snippets/`, `templates/`, `layout/`, `config/`, `locales/` — the theme.
- `setup/products.csv` — product import.

Theme Check reports only `RemoteAsset` warnings: the Switzer font is loaded from Fontshare on purpose.
