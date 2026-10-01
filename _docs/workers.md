# Cloudflare Workers

## Why they exist

GitHub Pages only serves static files; a web page cannot save anything. A **Cloudflare Worker** is a small server
function that can. Each worker receives a request from the admin panel, checks the admin key, and then edits a file
in this GitHub repository through the GitHub API. GitHub Pages then republishes the site.

```
Admin page (browser)
   │  fetch(worker URL) + header  x-admin-key: <ADMIN_KEY>
   ▼
Cloudflare Worker
   1. CORS check (is the request from an allowed website?)
   2. Auth: x-admin-key must equal the worker's own ADMIN_KEY secret
   3. Validate the request
   4. GitHub API: read the file (returns content + its "sha")
   5. Change the content
   6. GitHub API: write it back (PUT with that sha)  → this creates a commit on `main`
   ▼
GitHub Pages rebuilds the site (~1–2 min) → change is live
```

## The five workers

Live URL pattern: `https://<worker-name>.martin-jakubuv.workers.dev`. The URL each page calls is written at the top
of the matching script in `admin/JS/` (and in `admin/change-password.html`) – check there if in doubt.

| Worker name | Source copy in `admin/cloudeflare-worker/` | Called from | Method |
|---|---|---|---|
| `add-borrow-json` | `add-item-worker.js` | `admin/JS/add-item.js` | POST |
| `remove-borrow` | `remove-item-worker.js` | `admin/JS/remove-item.js` | DELETE |
| `img-replace-worker` | `img-replace-worker.js` | `admin/JS/send-img.js` | POST |
| `pdf-replace-worker` | `pdf-replace-worker.js` | `admin/JS/send-file.js` | POST |
| `change-password` | `change-password-worker.js` | `admin/change-password.html` | POST |

> The files in `admin/cloudeflare-worker/` are **reference copies**. The code that actually runs is what is pasted in
> the Cloudflare dashboard. Editing the file in the repo changes nothing until you paste it into the worker and Deploy
> (see [maintenance.md](maintenance.md)). Keep the two identical.

### add-borrow-json – add a borrowed item
- Request: JSON `{ "userId": 1, "item": { "category": "Helma", "description": "…", "itemNumber": "…", "date": "2026-02-15" } }`.
  `category` and `description` are required; `itemNumber` defaults to `""`, `date` to today.
- Changes: `src/data/items.json` – appends to that person's `borrowed_items` with a generated id
  `borrow-<timestamp>-<random>`.
- Success: `{ ok: true, message, borrowId, item }`.
- Errors: `400` invalid JSON / missing fields / bad userId, `404` `items.json` or the user not found, `500` `items.json` is not valid JSON.

### remove-borrow – remove a borrowed item
- Request: JSON `{ "userId": 1, "borrowId": "borrow-…" }`.
- Changes: `src/data/items.json` – removes the item with that id from that person.
- Success: `{ ok: true, message, borrowId }`. Errors: `400`, `404` (user or item not found).
- It deletes; it does not "hide". (Show/hide is an open TODO.)

### img-replace-worker – upload a gallery photo
- Request: multipart form: `file` (JPEG/PNG/WebP/GIF/SVG, max 6 MB → `413` if bigger) and `caption`.
- Steps:
  1. File name is cleaned (diacritics removed, unsafe characters → `-`) and `-<timestamp>` is appended.
  2. Uploads the image to `assets/image/gallery-12-pics/<name>`.
  3. Reads `src/data/gallery.json`, appends `{ file, caption, date }`, keeps only the **newest 12** entries.
  4. Writes `gallery.json` (one retry). **If this fails, the just-uploaded image is deleted again** (rollback).
  5. Only after both succeeded, deletes the images that fell out of the newest 12.
- Success: `{ ok, uploaded: { file, caption, date, publicUrl }, removed: [...], deleted: [...], deleteFailures: [...] }`.

### pdf-replace-worker – replace the program PDF
- Request: multipart form: `file` (must be `application/pdf`, max 10 MB).
- Overwrites `pdf/program_jaro_26.pdf` (the path is a constant, `PDF_PATH`, in the worker). The activities page links
  to exactly that path, so the file name must stay the same unless you change both.
- Success: `{ ok, file, path, publicUrl, size, uploaded, action: "replaced" | "created" }`.

### change-password – change a member's password
- Request: JSON `{ "personId": 1, "newPassword": "…" }` (`personId` must be a number).
- Changes: `src/data/user.json` – sets that user's `password`.
- Success: `{ ok: true, personId, username }`. Errors: `400`, `404` (no such personId).
- This is the **member** password (the borrowed-items login), not the admin password (see [authentication.md](authentication.md)).

## Configuration inside each worker

Set in the Cloudflare dashboard: worker → **Settings → Variables and Secrets** (set as *Secret*):

| Name | What it is |
|---|---|
| `ADMIN_KEY` | The admin key. Must be **identical in all five workers** and equal to the key that the admin login page decrypts. |
| `GITHUB_TOKEN` | A GitHub fine-grained personal access token for repo `martinecececek/3VOM-site` with **Contents: Read and write**. Same token can be used in all five. It **expires** – when it does, every worker fails with `Bad credentials` (401 from GitHub). |

Hard-coded near the top of each worker's code:

- `OWNER = "martinecececek"`, `REPO = "3VOM-site"`, `BRANCH = "main"` and the file paths (`src/data/items.json`, `assets/image/gallery-12-pics`, `pdf/program_jaro_26.pdf`, …). If the repo is renamed/moved or folders change, update these.
- `ALLOWED_ORIGINS` (CORS): `https://3vomunl.cz`, `https://martinecececek.github.io`, `http://127.0.0.1:5500`, `http://localhost:5500`.
  If the site ever moves to another domain, add it here **in all five workers**, otherwise the browser blocks every request.

## Things worth knowing

- **CORS / preflight.** Because the admin pages send a custom header (`x-admin-key`), the browser first sends an
  `OPTIONS` request. Every worker answers it and returns `Access-Control-Allow-Origin` only for the allowed origins.
  A "blocked by CORS policy" error in the browser console means the site's origin is not in `ALLOWED_ORIGINS` of the
  *deployed* worker (or the worker is not deployed / URL is wrong).
- **Czech letters.** GitHub returns file content as base64 of UTF-8 bytes. `atob`/`btoa` alone break on letters such
  as ě, š, ř, č. The workers therefore convert with `TextDecoder`/`TextEncoder` (`b64ToUtf8` / `utf8ToB64`). Don't
  "simplify" that back to plain `btoa`/`atob` for JSON text. (Raw image/PDF bytes are encoded separately and are fine.)
- **Every save is a commit on `main`.** After using the admin panel, your local clone is behind. **Run `git pull`
  before you edit or push anything locally**, or your push will be rejected.
- **Not instant.** After a save, GitHub Pages needs ~1–2 minutes to publish; the admin table (which reads
  `items.json` with `cache: "no-store"`) can lag behind until then.
- **Concurrent edits.** GitHub rejects a write if the file changed since it was read (sha mismatch → 409/422). Just retry.
- **Whoever has the admin key can write to the repository** through these workers. Keep it secret.

## Troubleshooting

| What you see | Likely cause |
|---|---|
| `401 Unauthorized` (plain text) | The worker's `ADMIN_KEY` differs from the key the login decrypted. Also happens if you are still using an old key saved in `sessionStorage` – close the tab / `sessionStorage.clear()` and log in again. |
| `Failed to read … { "message": "Bad credentials" … }` | The worker passed the admin check but GitHub rejected `GITHUB_TOKEN` (expired, revoked, mistyped, or the admin key was pasted there by mistake). Create a new token and update it in all workers. |
| `403` / `404` from GitHub | Token is valid but has no access to the repo or lacks "Contents: Read and write". |
| "blocked by CORS policy" in the console | Origin not in `ALLOWED_ORIGINS` of the deployed code. |
| "Failed to fetch", nothing else | Wrong worker URL, worker not deployed, or you are offline. |
| `404 User not found` | `userId` / `personId` does not exist in `items.json` / `user.json`. |
| Save says OK but the site looks unchanged | Wait for the Pages rebuild, then hard-refresh (Ctrl+F5). |
| `413` | File too large (photo > 6 MB, PDF > 10 MB). |

## Adding or changing a worker

1. Copy an existing worker file as a starting point (they share the same CORS/auth/GitHub helper boilerplate).
2. In Cloudflare: **Workers & Pages → Create → Worker**, paste the code, add the `ADMIN_KEY` and `GITHUB_TOKEN` secrets, Deploy.
3. Save the source in `admin/cloudeflare-worker/` and put the new URL into the admin script that calls it.
4. Add the new worker to the table above.
