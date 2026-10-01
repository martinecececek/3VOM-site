# 3VOM Site - 3. Vodacky oddil mladeze

Website for the 3rd Youth Paddling Club (3. Vodacky oddil mladeze) based in Usti nad Labem. Static site hosted on GitHub Pages with Cloudflare Workers as serverless backend.

**Live site:** https://3vomunl.cz/ (custom domain; GitHub Pages repo formerly at https://martinecececek.github.io/3VOM-site/)

**Maintainer docs:** see [`_docs/`](_docs/README.md) for a deeper dive into the Workers, authentication and troubleshooting (not published to the live site — Jekyll skips `_`-prefixed paths).

---

## Project Structure

```
3VOM-site/
├── index.html                  # Homepage
├── robots.txt                  # Search engine rules (blocks /admin/)
│
├── pages/                      # Public pages (Czech file names)
│   ├── o-nas.html              # About the club
│   ├── aktivity.html           # Activities & events (+ Google Calendar embed)
│   ├── galerie.html            # Photo gallery
│   ├── pridej-se.html          # Join the club form
│   ├── kontakty.html           # Contact info
│   ├── bezpecnost.html         # Safety information
│   ├── vybaveni.html           # Equipment overview
│   ├── co-s-sebou.html         # What to bring
│   ├── prihlaseni.html         # User login (members)
│   └── pujceni.html            # Borrowed items (members, requires login)
│
├── admin/                      # Admin panel (password-protected)
│   ├── login.html              # Admin login (AES-256-GCM encrypted key)
│   ├── index.html              # Admin dashboard
│   ├── Admin-Photo-Upload.html # Upload photos to gallery (drag & drop)
│   ├── Admin-PDF-Upload.html   # Upload/replace program PDF (drag & drop)
│   ├── admin-item-tracker.html # Manage borrowed items
│   ├── change-password.html    # Change user passwords
│   ├── JS/                     # Admin client-side scripts
│   │   ├── admin-nav.js        # Shared admin nav bar (renderAdminNav)
│   │   ├── dropzone.js         # Drag-and-drop upgrade for file inputs
│   │   ├── add-item.js         # Add borrowed item via worker
│   │   ├── remove-item.js      # Remove borrowed item via worker
│   │   ├── load-borrow-admin.js # Load & render borrow table
│   │   ├── send-img.js         # Upload image via worker
│   │   └── send-file.js        # Upload PDF via worker
│   └── cloudeflare-worker/     # Cloudflare Worker source code (reference)
│       ├── add-item-worker.js
│       ├── remove-item-worker.js
│       ├── img-replace-worker.js
│       ├── pdf-replace-worker.js
│       └── change-password-worker.js
│
├── assets/
│   ├── image/                  # Images (logo, gallery thumbnails, etc.)
│   └── JS/                     # Public client-side scripts
│       ├── i18n.js             # Internationalization
│       ├── login.js            # User login logic
│       ├── borrowed-items-display.js # Display borrowed items for logged user
│       ├── gallery-img-load.js # Gallery image loading
│       ├── gallery-precache.js # Prefetch gallery images at idle
│       ├── lightbox.js         # Image lightbox viewer
│       ├── location-map.js     # Contact page map
│       ├── contact-form-handler.js # Contact form handling
│       ├── recruit-popup.js    # "Nabíráme nové členy" homepage popup
│       └── service-worker.js   # PWA service worker
│
├── src/
│   ├── components/             # Reusable HTML components
│   │   ├── header.js           # Site header/navigation
│   │   └── footer.js           # Site footer
│   └── data/                   # JSON data files
│       ├── items.json          # People & their borrowed items
│       ├── user.json           # User accounts (username, password, personId)
│       └── gallery.json        # Gallery image metadata
│
├── pdf/
│   └── program_jaro_26.pdf     # Current season program (path is hard-coded in the PDF worker + aktivity.html)
│
├── css/
│   ├── styles.css              # Main stylesheet (imports all below)
│   ├── fff.css                 # Legacy monolithic stylesheet — no longer linked from any page, kept for reference only
│   ├── base/                   # Reset, variables, typography, layout
│   ├── components/             # Buttons, forms, header, footer, popup
│   ├── features/               # Borrow, lightbox, map
│   └── pages/                  # Page-specific styles
│
├── _docs/                      # Maintainer documentation (workers, auth, troubleshooting) — not published (Jekyll skips `_`-prefixed paths)
└── TODO.txt                    # Known issues & improvements
```

---

## How It Works

### Architecture

- **Frontend:** Static HTML/CSS/JS hosted on GitHub Pages
- **Backend:** Cloudflare Workers (serverless functions) that read/write data to this repo via GitHub API
- **Data storage:** JSON files in `src/data/` committed directly to the repo
- **Authentication:** Two separate systems:
  - **User login** (`pages/prihlaseni.html`) - members log in with username/password from `user.json`, personId stored in `localStorage`/`sessionStorage`
  - **Admin login** (`admin/login.html`) - admin key encrypted with AES-256-GCM, decrypted client-side with password

### Data Flow

```
Browser → Cloudflare Worker → GitHub API → src/data/*.json (commit)
                ↑
          x-admin-key header (from sessionStorage)
```

All admin operations (add/remove items, upload photos/PDFs, change passwords) go through Cloudflare Workers which authenticate via `x-admin-key` header and then use a GitHub PAT to read/write files in this repo. Every admin action is a real commit to `main` — GitHub Pages then redeploys automatically (~1–2 min), and a local clone of this repo can fall behind the live site as a result (`git pull` before editing locally).

---

## Cloudflare Workers

Each worker is deployed separately on Cloudflare. Source code is stored in `admin/cloudeflare-worker/` for reference only — the deployed version in the Cloudflare dashboard is what actually runs.

| Worker | URL | Purpose |
|--------|-----|---------|
| add-item | `https://add-borrow-json.martin-jakubuv.workers.dev` | Add borrowed item to `items.json` |
| remove-item | `https://remove-borrow.martin-jakubuv.workers.dev` | Remove borrowed item from `items.json` |
| img-replace | `https://img-replace-worker.martin-jakubuv.workers.dev` | Upload photo to gallery |
| pdf-replace | `https://pdf-replace-worker.martin-jakubuv.workers.dev` | Upload/replace program PDF |
| change-password | `https://change-password.martin-jakubuv.workers.dev` | Change user password in `user.json` |

### Worker Environment Variables

Each worker requires these secrets configured in Cloudflare dashboard:

| Variable | Type | Description |
|----------|------|-------------|
| `GITHUB_TOKEN` | Secret | Fine-grained PAT with Contents: Read & Write for this repo |
| `ADMIN_KEY` | Secret | Admin key checked against `x-admin-key` header |

### CORS

All workers restrict CORS to these origins:
- `https://3vomunl.cz`
- `https://martinecececek.github.io`
- `http://127.0.0.1:5500`
- `http://localhost:5500`

---

## Admin Panel

### Access

1. Navigate to `/admin/login.html`
2. Enter the admin password
3. The password decrypts the admin key (AES-256-GCM) and stores it in `sessionStorage`
4. All admin pages check for the key in `sessionStorage`, redirecting to login if missing

### Navigation

Every admin page shares one nav bar (`admin/JS/admin-nav.js`, mounted via `renderAdminNav("<page>")`), so it's always possible to jump directly between tools and log out, instead of relying on page-specific "back" links.

### Features

- **Photo Upload** - Upload images to the gallery via GitHub API, drag-and-drop or click-to-browse
- **PDF Upload** - Upload/replace the season program PDF, drag-and-drop or click-to-browse
- **Item Tracker** - Add/remove borrowed equipment per person
- **Password Change** - Change any user's login password

### Item Categories

Borrowed items use these categories:
`Padlo`, `Vesta`, `Helma`, `Padlo jine`, `Lodak/Batoh`, `Bezky`, `Hulky`, `Bezecke boty`, `Ostatni`

---

## Data Files

### `src/data/items.json`

```json
{
  "people": [
    {
      "id": 1,
      "name": "Name",
      "surname": "Surname",
      "borrowed_items": [
        {
          "id": "borrow-...",
          "category": "Helma",
          "description": "Red helmet",
          "itemNumber": "H-001",
          "date": "2026-02-10"
        }
      ]
    }
  ]
}
```

### `src/data/user.json`

```json
{
  "users": [
    {
      "personId": 1,
      "username": "vojbal",
      "password": "1234"
    }
  ]
}
```

`personId` maps to `id` in `items.json` to link users to their borrowed items.

### `src/data/gallery.json`

Contains metadata for gallery images (paths, descriptions).

---

## Local Development

1. Open the project in VS Code
2. Use **Live Server** extension (port 5500)
3. Admin pages work on `http://127.0.0.1:5500` and `http://localhost:5500` (whitelisted in CORS)

No build step required - everything is plain HTML/CSS/JS.

---

## Deploying Worker Changes

When you modify worker source code in `admin/cloudeflare-worker/`:

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages**
3. Select the worker to update
4. Paste the updated code from the corresponding file
5. Click **Save and Deploy**

The worker files in this repo are **reference copies only** - Cloudflare runs its own deployed version.

---

## Security Notes

- Admin pages are blocked from search engine indexing (`robots.txt` + `<meta name="robots">`)
- Admin key is never hardcoded in client JS - it's stored encrypted and decrypted at login
- All workers validate `x-admin-key` header before processing requests
- CORS is restricted to known origins only
- User passwords in `user.json` are stored in plaintext (acceptable for this use case - internal club tool)
- Never commit a `GITHUB_TOKEN` (or any other secret) to this repo — it's public, and anything committed here, including past commits, is readable by anyone. Rotate immediately if one ever leaks.
