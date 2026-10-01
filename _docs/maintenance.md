# Maintenance: routine tasks and checklists

## Publishing a change

```
git pull                 # ALWAYS first – the workers commit to main, so your clone is often behind
# edit files
git add <files>          # avoid `git add .` – check `git status` for anything that must not be public
git commit -m "message"
git push
```
Live after ~1–2 minutes (hard-refresh with Ctrl+F5). Hosting details: [site-overview.md](site-overview.md).

## Updating a worker's code

1. Edit the source in `admin/cloudeflare-worker/<name>.js`, commit it.
2. Cloudflare dashboard → **Workers & Pages** → the worker → **Edit code** → select all, paste the file, **Deploy**.
3. Test from the admin panel. Do this for every worker you changed.

## Renewing the GitHub token (do this when workers say "Bad credentials", and before the token expires)

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. *Repository access:* only `martinecececek/3VOM-site`.
   *Permissions → Repository permissions → Contents:* **Read and write**.
3. Pick an expiry and write the date in your calendar. Copy the token (`github_pat_…`, shown once).
4. Cloudflare → each of the 5 workers → **Settings → Variables and Secrets** → edit `GITHUB_TOKEN` → paste → Deploy.
5. Revoke the old token on GitHub. Test one action (e.g. add and remove a borrowed item).

**Never put the token in a file in this repository** (not even a `.txt` "for later"). The repo is public and everything
in it is published on the website. Keep it in a password manager.

## Changing the admin password / rotating the admin key
See [authentication.md](authentication.md#changing-the-admin-password).

## Changing a member's password
Admin panel → *Změna hesla*. (Or edit `src/data/user.json`.)

## Borrowed equipment
Admin panel → *Správa půjčených položek* – add or remove items per member. Adding/removing *members* is manual
(see [authentication.md](authentication.md#member-login-pagesprihlasenihtml-assetsjsloginjs)).

## Adding a photo to the gallery
1. Shrink/convert it first (WebP, ≤ 1500 px wide is what the rest of the site uses; the upload limit is 6 MB).
2. Admin panel → *Nahrát fotku*, choose the file, write a Czech caption.
3. The gallery always shows the 12 newest; the oldest image is deleted automatically.
4. Wait for the Pages rebuild, then check the gallery page. Remember `git pull` before local work.

## Replacing the program PDF
Admin panel → *Nahrát PDF*. It overwrites `pdf/program_jaro_26.pdf`, the file linked from the activities page.
(The file name says "jaro 26"; it is reused for every season. To rename it, change `PDF_PATH` in the PDF worker
**and** the link in `pages/aktivity.html`.)

## The recruit popup
Text/layout: `assets/JS/recruit-popup.js`; styling: `css/components/popup.css`. Shown once per browser session on the
homepage. To retire it, remove the `<script src="assets/JS/recruit-popup.js">` line from `index.html`.

## Changing the domain
1. Update the `CNAME` file and the DNS records at the registrar; enable HTTPS in the repo's Pages settings.
2. Add the new origin to `ALLOWED_ORIGINS` in **all five workers** and redeploy them.
3. Update the base URL in `src/components/header.js` (`siteUrl`), the JSON-LD in `index.html`, `sitemap.xml`,
   `robots.txt`, and the site references in `README.md`/`CLAUDE.md`.
4. Search the code for hard-coded old domains/paths (e.g. the `/3VOM-site/` prefix in `assets/JS/login.js`).

## Security checklist

- The repository is public and **everything except `_`/`.`-prefixed paths is published**. Never commit tokens, keys,
  passwords or private notes; check `git status` before every commit.
- If a secret is ever committed or published: **revoke/rotate it immediately** (deleting the file is not enough – git
  history is public too). For a GitHub token: revoke it on GitHub, create a new one, update the workers.
- Anyone with the admin key can change the site (through the workers); anyone with the GitHub token can change the
  repository directly. Treat both like admin passwords.
- Member passwords in `user.json` are public plain text. Fine for a low-stakes borrowing list, but tell members not
  to reuse real passwords.
- Use a long passphrase for the admin login: the encrypted key in `login.html` is public, so weak passwords can be
  guessed offline.

## Where to look when something breaks

| Problem | Start here |
|---|---|
| Admin login rejects the password | [authentication.md](authentication.md) – usually the new `login.html` is not pushed/live yet, or cache |
| Saves fail (401 / CORS / Bad credentials / Failed to fetch) | Troubleshooting table in [workers.md](workers.md) |
| A page has no nav/footer | The page is missing the `renderHeader`/`renderFooter` scripts, or a wrong script path |
| Wrong/missing favicon or image on one page | Check the relative path (`../assets/...` from `pages/`, `assets/...` from the root) |
| Something works locally but not live | The change is not pushed, Pages hasn't rebuilt yet, or the path only works under Live Server |
| Member login fails | Known issue on the custom domain – [site-overview.md](site-overview.md#known-issues-as-of-this-writing) |
