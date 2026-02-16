# 3VOM Site - 3. Vodacky oddil mladeze

Website for the 3rd Youth Paddling Club (3. Vodacky oddil mladeze) based in Usti nad Labem. Static site hosted on GitHub Pages with Cloudflare Workers as serverless backend.

**Live site:** https://martinecececek.github.io/3VOM-site/

---

## Project Structure

```
3VOM-site/
├── index.html                  # Homepage
├── robots.txt                  # Search engine rules (blocks /admin/)
│
├── pages/                      # Public pages
│   ├── about.html              # About the club
│   ├── activities.html         # Activities & events
│   ├── gallery.html            # Photo gallery
│   ├── join.html               # Join the club form
│   ├── contacts.html           # Contact info
│   ├── safety.html             # Safety information
│   ├── vybaveni.html           # Equipment overview
│   ├── bring.html              # What to bring
│   ├── login.html              # User login (members)
│   └── pujceni.html            # Borrowed items (members, requires login)
│
├── admin/                      # Admin panel (password-protected)
│   ├── login.html              # Admin login (AES-256-GCM encrypted key)
│   ├── index.html              # Admin dashboard
│   ├── Admin-Photo-Upload.html # Upload photos to gallery
│   ├── Admin-PDF-Upload.html   # Upload/replace program PDF
│   ├── admin-item-tracker.html # Manage borrowed items
│   ├── change-password.html    # Change user passwords
│   ├── JS/                     # Admin client-side scripts
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
│       ├── lightbox.js         # Image lightbox viewer
│       ├── location-map.js     # Contact page map
│       ├── contact-form-handler.js # Contact form handling
│       └── service-worker.js   # PWA service worker
│
├── src/
│   ├── components/             # Reusable HTML components
│   │   ├── header.js           # Site header/navigation
│   │   └── footer.js           # Site footer
│   ├── data/                   # JSON data files
│   │   ├── items.json          # People & their borrowed items
│   │   ├── user.json           # User accounts (username, password, personId)
│   │   └── gallery.json        # Gallery image metadata
│   └── pdf/
│       └── program.pdf         # Current season program
│
├── css/
│   ├── styles.css              # Main stylesheet (imports all below)
│   ├── fff.css                 # Admin-specific styles
│   ├── base/                   # Reset, variables, typography, layout
│   ├── components/             # Buttons, forms, header, footer, popup
│   ├── features/               # Borrow, lightbox, map
│   └── pages/                  # Page-specific styles
│
└── TODO.md                     # Known issues & improvements
```

---

## How It Works

### Architecture

- **Frontend:** Static HTML/CSS/JS hosted on GitHub Pages
- **Backend:** Cloudflare Workers (serverless functions) that read/write data to this repo via GitHub API
- **Data storage:** JSON files in `src/data/` committed directly to the repo
- **Authentication:** Two separate systems:
  - **User login** (`pages/login.html`) - members log in with username/password from `user.json`, personId stored in `sessionStorage`
  - **Admin login** (`admin/login.html`) - admin key encrypted with AES-256-GCM, decrypted client-side with password

### Data Flow

```
Browser → Cloudflare Worker → GitHub API → src/data/*.json (commit)
                ↑
          x-admin-key header (from sessionStorage)
```

All admin operations (add/remove items, upload photos/PDFs, change passwords) go through Cloudflare Workers which authenticate via `x-admin-key` header and then use a GitHub PAT to read/write files in this repo.

---

## Cloudflare Workers

Each worker is deployed separately on Cloudflare. Source code is stored in `admin/cloudeflare-worker/` for reference.

| Worker | URL | Purpose |
|--------|-----|---------|
| add-item | `https://add-borrow.martin-jakubuv.workers.dev` | Add borrowed item to `items.json` |
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

### Features

- **Photo Upload** - Upload images to the gallery via GitHub API
- **PDF Upload** - Upload/replace the season program PDF
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
