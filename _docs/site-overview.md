# Site overview

## Hosting and publishing

- **Where it runs:** GitHub Pages, deployed straight from the `main` branch (there is no GitHub Actions workflow
  and no build step). Push to `main` → live after roughly 1–2 minutes.
- **Domain:** the file `CNAME` contains `3vomunl.cz`. The site is served from the domain root
  (`https://3vomunl.cz/pages/aktivity.html`), *not* from a `/3VOM-site/` sub-path. DNS is configured at the domain
  registrar (not documented here).
- **What gets published:** everything in the repository *except* files/folders starting with `_` or `.`
  (Jekyll rule). That includes things that are not part of the website: `README.md`, `CLAUDE.md`, `TODO.txt`,
  `package.json`, `compress-images.js`, the worker copies in `admin/cloudeflare-worker/`, and all of `src/data/`.
  `robots.txt` only asks search engines to skip `/admin/`; it does not protect anything.
- **The repo is public**, so treat everything in it as readable by anyone.
- **Local development:** VS Code + the Live Server extension on `http://127.0.0.1:5500`
  (this origin is whitelisted in the workers' CORS list).

## Folder map

```
index.html                 Homepage
pages/                     Public pages (Czech file names)
  aktivity.html            Events + embedded Google Calendar + program PDF link
  galerie.html             Photo gallery with lightbox (loads gallery.json)
  o-nas.html               About the club
  kontakty.html            Staff contacts + Leaflet map
  pridej-se.html           Join form (EmailJS)
  bezpecnost.html          Water safety
  co-s-sebou.html          What to bring
  vybaveni.html            Equipment overview
  prihlaseni.html          Member login
  pujceni.html             Borrowed items of the logged-in member
admin/                     Admin panel (see authentication.md)
  login.html               Admin login (decrypts the admin key in the browser)
  index.html               Admin dashboard
  Admin-Photo-Upload.html  Upload a gallery photo      -> img-replace worker
  Admin-PDF-Upload.html    Replace the program PDF     -> pdf-replace worker
  admin-item-tracker.html  Add/remove borrowed items   -> add/remove workers
  change-password.html     Change a MEMBER's password  -> change-password worker
  JS/                      Scripts used by the admin pages
  cloudeflare-worker/      Reference copies of the 5 worker sources (folder name is spelled that way)
  Admin05v0yy54da1xxc29t1.html, test.html   Old/scratch pages, not linked from anywhere
src/
  components/header.js     Navigation, injected into every page
  components/footer.js     Footer, injected into every page
  data/items.json          Borrowed equipment per member
  data/user.json           Member login accounts
  data/gallery.json        Gallery metadata
assets/
  image/                   Images (logo/, gallery-12-pics/, gallery-nahled/, index-nahled/, activities-nahled/)
  JS/                      Public scripts (see below)
css/
  styles.css               The only stylesheet linked from HTML; it @imports everything else
  base/ components/ features/ pages/
  fff.css                  Old stylesheet, only still used by admin/change-password.html
pdf/program_jaro_26.pdf    The current program (replaced by the PDF worker)
_docs/                     This documentation (not published)
compress-images.js/.ps1    Helper to convert images to WebP (needs `npm install`, uses `sharp`)
CNAME, robots.txt, sitemap.xml
```

## How pages are assembled

Every page has empty `<div id="header">` and `<div id="footer">` and calls:

```html
<script src="../assets/JS/i18n.js"></script>
<script src="../src/components/header.js"></script>
<script>renderHeader("gallery");</script>
...
<script src="../src/components/footer.js"></script>
<script>renderFooter();</script>
```

- The string passed to `renderHeader` is a **page key** defined in `assets/JS/i18n.js`
  (`home, activities, gallery, about, contacts, join, safety, bring, vybaveni, login, pujceni`).
- `i18n.js` holds, per key, the nav label (`title`), the browser-tab title (`fullTitle`) and the meta description.
  Change a nav label there (e.g. the first nav item is `home.title` = "Domů").
- `header.js` also sets the SEO tags on every page (description, canonical URL, Open Graph, Twitter) using the
  i18n entry and the base URL `https://3vomunl.cz/`.
- Nav/footer HTML lives only in `header.js` / `footer.js`. Never copy it into a page.
- To add a page: create it in `pages/`, add its key to `i18n.js`, add links in `header.js`/`footer.js`
  (the footer keeps its own key → file-name map, `pageFiles`), add it to `sitemap.xml`.

## Data files (the "database")

`src/data/items.json`
```json
{ "people": [ { "id": 1, "name": "Vojtěch", "surname": "Balda",
    "borrowed_items": [ { "id": "borrow-1771240384439-94ohneh9e", "category": "Helma",
                          "description": "…", "itemNumber": "…", "date": "2026-02-15" } ] } ] }
```

`src/data/user.json` – member accounts. `personId` must equal the person's `id` in `items.json`.
```json
{ "users": [ { "personId": 1, "username": "vojbal", "password": "…" } ] }
```

`src/data/gallery.json` – `[ { "file": "GOPR0624.webp", "caption": "…", "date": "2026-02-10T20:25:11.331Z" } ]`.
The gallery page sorts by `date` (newest first) and shows the 12 newest, loading images from
`assets/image/gallery-12-pics/`.

These files are edited by the workers (commits to `main`) and can also be edited by hand.
Files must be saved as UTF-8 (Czech letters).

## Public scripts (`assets/JS/`)

| File | Purpose |
|---|---|
| `i18n.js` | Czech labels/titles/descriptions per page key |
| `login.js`, `borrowed-items-display.js` | Member login and the borrowed-items table |
| `gallery-img-load.js`, `lightbox.js` | Gallery rendering and lightbox |
| `gallery-precache.js` | Prefetches gallery images when the browser is idle |
| `location-map.js` | Leaflet map on the contacts page |
| `contact-form-handler.js` | Join form → EmailJS |
| `recruit-popup.js` | The "Nabíráme nové členy!" popup (homepage) |
| `service-worker.js` | Registered only by `galerie.html` from `assets/JS/`, so its default scope is `/assets/JS/` and it most likely has no effect on the pages themselves |

## The recruit popup

`recruit-popup.js` builds the popup in JavaScript and `css/components/popup.css` styles it (classes start with
`recruit-`). It is included only in `index.html`, appears ~0.8 s after load, and is shown **once per browser
session** (flag `recruitPopupShown` in `sessionStorage`). To see it again while testing: open a new tab/window or run
`sessionStorage.clear()`. To make it once *ever* per device, change `sessionStorage` to `localStorage` in the script.
The text is the template string inside `open()`.

## Join form (EmailJS)

`pridej-se.html` + `contact-form-handler.js` send two emails through EmailJS: a notification to the club and a copy
to the applicant. The service/template IDs and the EmailJS public key are in `contact-form-handler.js` (public keys
are meant to be visible in front-end code). Manage templates in the EmailJS dashboard.

## Images

- The site uses WebP. `compress-images.js` (`npm install`, then `node compress-images.js`) converts every JPG/PNG
  under `assets/image/` to WebP (max 1500 px), deletes the originals and updates references in HTML/JS/JSON.
- Photos uploaded through the admin panel are stored **as uploaded** (max 6 MB; JPG/PNG/WebP). Resize/convert big
  photos to WebP first so the gallery stays fast.

## Known issues (as of this writing)

1. **Member login is broken on `3vomunl.cz`.** `assets/JS/login.js` fetches `/3VOM-site/src/data/user.json`,
   a path that only existed under `martinecececek.github.io/3VOM-site/`. On the custom domain that URL is a 404.
   Fix: load the file relative to the page (`../src/data/user.json`) instead of the hard-coded `/3VOM-site/` prefix.
2. `robots.txt` lists the member pages as `/3VOM-site/pages/...`, which no longer matches URLs on the custom domain.
3. `CLAUDE.md` still lists English page file names (`about.html`, `login.html`…); the real names are the Czech ones above.
4. The image worker trims `gallery.json` by array order (oldest first) while the site sorts by `date`. Normally the
   same thing; it only differs if entries are hand-edited out of order.
5. Open to-dos are in `TODO.txt` (Czech text, calendar filtering, borrowed-items show/hide instead of delete, etc.).
