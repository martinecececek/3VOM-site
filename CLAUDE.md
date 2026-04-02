# CLAUDE.md — 3VOM Site

## Project Overview

Website for **3. Vodácký oddíl mládeže** (3rd Youth Paddling Club), based in Ústí nad Labem, Czech Republic.  
Live at: https://martinecececek.github.io/3VOM-site/  
Repository ID: TOM 7104

**Purpose:** Public-facing club site + lightweight internal tools (member login, equipment borrowing tracker, admin panel).

**Tech stack:** Vanilla HTML/CSS/JS, no build step. Hosted on GitHub Pages. Backend via Cloudflare Workers + GitHub API (JSON files as database).

---

## File Structure

```
/
├── index.html                  # Homepage
├── robots.txt                  # Blocks /admin/
├── pages/                      # All public pages
│   ├── about.html              # Club history & values
│   ├── activities.html         # Events + embedded Google Calendar
│   ├── gallery.html            # Dynamic photo gallery with lightbox
│   ├── join.html               # Membership sign-up form (EmailJS)
│   ├── contacts.html           # Staff contacts + Leaflet map
│   ├── bring.html              # Packing lists by activity type
│   ├── vybaveni.html           # Equipment overview
│   ├── safety.html             # Water safety guidelines
│   ├── login.html              # Member login
│   └── pujceni.html            # Borrowed items table (members only)
├── admin/                      # Password-protected admin panel
│   ├── login.html              # AES-256-GCM encrypted key login
│   ├── index.html              # Admin dashboard (noindex)
│   ├── Admin-Photo-Upload.html
│   ├── Admin-PDF-Upload.html
│   ├── admin-item-tracker.html
│   ├── change-password.html
│   ├── cloudeflare-worker/     # Reference copies of deployed workers
│   └── JS/                     # Admin-only scripts
├── src/
│   ├── components/
│   │   ├── header.js           # Dynamic nav (injected into every page)
│   │   └── footer.js           # Dynamic footer with logos
│   └── data/
│       ├── items.json          # Borrowed equipment per member
│       ├── user.json           # Member accounts (username/password/personId)
│       └── gallery.json        # Gallery metadata (file, caption, date)
├── assets/
│   ├── image/                  # Images organized by context
│   │   ├── logo/               # Club & partner logos
│   │   ├── gallery-12-pics/    # Latest gallery images shown on site
│   │   ├── gallery-nahled/     # Thumbnails
│   │   ├── activities-nahled/  # Activity previews
│   │   └── index-nahled/       # Homepage previews
│   └── JS/                     # Public scripts
│       ├── i18n.js             # Czech translations + page title map
│       ├── login.js            # Auth logic (IIFE)
│       ├── borrowed-items-display.js
│       ├── gallery-img-load.js # ES module, dynamic gallery load
│       ├── lightbox.js
│       ├── location-map.js     # Leaflet integration
│       ├── contact-form-handler.js  # EmailJS
│       └── service-worker.js   # PWA caching
└── css/
    ├── styles.css              # Master import file
    ├── base/                   # reset, variables, typography, layout
    ├── components/             # header, footer, buttons, forms, etc.
    ├── features/               # lightbox, borrow table, map
    └── pages/                  # per-page styles
```

---

## Key Conventions

### Language
- Site language: **Czech** (`lang="cs"` on all pages)
- All user-facing content must be in Czech
- `assets/JS/i18n.js` maps page keys to Czech strings and page titles

### CSS
- CSS custom properties defined in `css/base/variables.css`
- Dark mode by default (dark blue radial gradient background)
- Primary color: `--primary: #38bdf8` (sky blue)
- **Never add styles inline**; always use the appropriate page CSS file under `css/pages/`
- `css/styles.css` is the single entry point — add new imports there

### JavaScript
- No frameworks, no bundler — plain ES6+ in `<script>` tags or `type="module"`
- `header.js` and `footer.js` are injected dynamically; do not duplicate nav/footer HTML in pages
- For new public scripts, place in `assets/JS/`
- For admin scripts, place in `admin/JS/`

### Admin Panel
- All admin pages check `sessionStorage.ADMIN_KEY` on load and redirect to `admin/login.html` if missing
- The admin key is decrypted client-side with AES-256-GCM (Web Crypto API, PBKDF2 100k iterations)
- Never expose `ADMIN_KEY` logic in public pages
- All admin routes are blocked by `robots.txt` and tagged `noindex, nofollow`

### Backend (Cloudflare Workers)
Five deployed workers on `*.martin-jakubuv.workers.dev`:
| Worker | Purpose |
|--------|---------|
| `add-borrow` | Add a borrowed item to items.json |
| `remove-borrow` | Remove a borrowed item |
| `img-replace-worker` | Upload a new gallery photo |
| `pdf-replace-worker` | Upload a new PDF |
| `change-password` | Update a user password |

All workers require an `x-admin-key` header. CORS is whitelisted to:
- `https://martinecececek.github.io`
- `http://127.0.0.1:5500`
- `http://localhost:5500`

Worker source reference copies live in `admin/cloudeflare-worker/` — these are for reference only; the live versions are deployed on Cloudflare.

### Data Files (act as DB)
- `src/data/items.json` — people and their borrowed items (categories: Padlo, Vesta, Helma, Bezky, Lodak/Batoh, Hulky, etc.)
- `src/data/user.json` — member accounts; `personId` links user to items
- `src/data/gallery.json` — array of `{ file, caption, date }`; gallery shows 12 newest sorted by date

### EmailJS
- Service ID: `service_h2xz6tf`
- Admin template: `template_6lvrhzx`
- User copy template: `template_1e6z71z`
- Public key: `zzphlggCEr4fMFcPx`

---

## Development

- **Local dev:** VS Code + Live Server on `http://127.0.0.1:5500`
- **Deploy:** Push to `main` → auto-deployed via GitHub Pages
- **No build step** — changes to HTML/CSS/JS are live after push

---

## Known Issues / TODOs (from TODO.txt)

1. Email feedback not yet wired to `3vom.usti@seznam.cz`
2. Equipment page missing "what club provides" section
3. Google Calendar needs filtering + migration to 3VOM account
4. Join form auto-reply to applicant not implemented
5. Not all text translated to Czech (noted 2026-02-27)
6. Gallery pre-caching not implemented
7. Borrowed items should support update (show/hide) instead of delete-only
8. **Future:** Rewrite to Astro

---

## Contacts (club)

- Email: 3vom.usti@seznam.cz
- Staff: Petr Balda, Jiří Magasanik, Renata Brodská
- Club location: Ústí nad Labem, Czech Republic
