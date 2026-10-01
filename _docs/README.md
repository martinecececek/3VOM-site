# 3VOM site – maintainer documentation

Documentation for whoever looks after the 3. Vodácký oddíl mládeže website (https://3vomunl.cz/).
Written for a maintainer who has forgotten (or never knew) how the pieces fit together.

| Document | Read it when you need to… |
|---|---|
| [site-overview.md](site-overview.md) | understand how the site is built, hosted and structured |
| [workers.md](workers.md) | understand or fix the Cloudflare Workers (the "backend") |
| [authentication.md](authentication.md) | understand the admin login, member login, and how passwords/keys work |
| [maintenance.md](maintenance.md) | do a routine task (publish a change, renew the GitHub token, change a password…) or debug an error |

## Where this folder is (and isn't) visible

- The folder is called `_docs` on purpose. GitHub Pages builds the site with Jekyll, and Jekyll **does not publish
  files or folders that start with `_` or `.`** – so these files are not served at https://3vomunl.cz/.
  (Verified: `/.gitignore` returns 404 on the live site while `/README.md` returns 200.)
- **Do not rename the folder to something without the underscore, and do not add a file called `.nojekyll`** –
  either would publish everything in here.
- The GitHub repository is **public**, so anyone can still read these files on github.com.
  **Never write passwords, the admin key, GitHub tokens or any other secret into this folder (or anywhere in the repo).**
  Secrets belong in a password manager and in the Cloudflare dashboard.

## Quick facts

- Static site (vanilla HTML/CSS/JS, no build step) on GitHub Pages, deployed by pushing to `main`.
- Live domain: `3vomunl.cz` (the `CNAME` file). Old address: `martinecececek.github.io/3VOM-site/`.
- "Backend" = 5 small Cloudflare Workers that edit files in this repository through the GitHub API.
- The JSON files in `src/data/` are the database.
- Repository: `martinecececek/3VOM-site`, branch `main`.
