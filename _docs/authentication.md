# Authentication: admin login, member login, keys

There are **four different secrets** in this project. Mixing them up is the most common source of confusion.

| Secret | Who uses it | Where it lives |
|---|---|---|
| **Admin login password** | The person opening `admin/login.html` | Only in your head / password manager. Never stored anywhere. |
| **`ADMIN_KEY`** | The admin pages send it to the workers; the workers compare it | Encrypted inside `admin/login.html`; plain text as a Secret in each worker; in `sessionStorage` while logged in |
| **`GITHUB_TOKEN`** | The workers, to write to the repo | Cloudflare Secret in each worker (and your password manager) |
| **Member passwords** | Members logging in to see borrowed items | Plain text in `src/data/user.json` |

## Admin login (`admin/login.html`)

The browser does all the work; nothing is sent to a server when you log in.

1. `login.html` contains `ENCRYPTED_ADMIN_KEY` – the admin key encrypted with the admin password.
   Format: `base64( salt[16] + iv[12] + authTag[16] + ciphertext )`.
2. You type the password. It is stretched with **PBKDF2** (SHA-256, 100 000 iterations, the salt from the blob) into an
   **AES-256-GCM** key, which tries to decrypt the blob (Web Crypto API).
3. Wrong password → AES-GCM authentication fails → "Nesprávné heslo". There is no stored password to compare to.
4. Correct password → the decrypted text **is** the admin key. It is saved to `sessionStorage.ADMIN_KEY` and you are
   redirected to `admin/index.html`.
5. Every admin page starts with a script that redirects to `login.html` if `sessionStorage.ADMIN_KEY` is missing.
   This is only a convenience – anyone can fake it in devtools. **The real protection is the workers**, which reject
   any request whose `x-admin-key` header is not the real key.
6. `sessionStorage` disappears when the tab is closed; "Odhlásit se" on the dashboard removes the key too.

So: the *password* only unlocks the *key*; the *key* is what the workers check.

## Worker authorization

Each admin script sends `x-admin-key: <key from sessionStorage>`. The worker compares it with its own `ADMIN_KEY`
secret and answers `401 Unauthorized` on mismatch. See [workers.md](workers.md).

## Changing the admin password

The blob in `login.html` is public, but it can only be decrypted with the password. To change the password you
generate a new blob. Use the script below (Node 18+; no packages needed).

Save it as `gen-admin-key.mjs` **outside the repository** and run:

```
node gen-admin-key.mjs "<new login password>" [existing-admin-key]
```

```js
// Prints the ADMIN_KEY (for the Cloudflare workers) and the ENCRYPTED_ADMIN_KEY (for admin/login.html).
// Blob format: base64( salt[16] + iv[12] + authTag[16] + ciphertext ), PBKDF2-SHA256 x100000, AES-256-GCM.

const password = process.argv[2];
if (!password) {
   console.error('Usage: node gen-admin-key.mjs "<login password>" [existing-admin-key]');
   process.exit(1);
}

const adminKey =
   process.argv[3] ||
   Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
      b.toString(16).padStart(2, "0"),
   ).join("");

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));

const keyMaterial = await crypto.subtle.importKey(
   "raw",
   new TextEncoder().encode(password),
   "PBKDF2",
   false,
   ["deriveKey"],
);
const aesKey = await crypto.subtle.deriveKey(
   { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
   keyMaterial,
   { name: "AES-GCM", length: 256 },
   false,
   ["encrypt"],
);

// Web Crypto returns ciphertext + 16-byte tag; the page expects the tag BEFORE the ciphertext.
const out = new Uint8Array(
   await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, new TextEncoder().encode(adminKey)),
);
const tag = out.slice(-16);
const ciphertext = out.slice(0, -16);

const blob = new Uint8Array([...salt, ...iv, ...tag, ...ciphertext]);

console.log("ADMIN_KEY           =", adminKey);
console.log("ENCRYPTED_ADMIN_KEY =", btoa(String.fromCharCode(...blob)));
```

**Case A – you still can log in, you only want a new password (workers stay untouched):**
1. Log in with the old password, open devtools → Console, run `sessionStorage.getItem("ADMIN_KEY")` and copy the result.
2. Run the script with the new password **and** that key as the second argument.
3. Replace the value of `ENCRYPTED_ADMIN_KEY` in `admin/login.html` with the printed blob.
4. `git pull`, commit, push. After the Pages rebuild, hard-refresh the login page and test the new password.

**Case B – password lost, or you want to rotate the key as well:**
1. Run the script with only the new password. It generates a **new random key**.
2. Put the printed `ADMIN_KEY` into the `ADMIN_KEY` secret of **all five workers** and Deploy each (until you do, saves fail with 401).
3. Replace `ENCRYPTED_ADMIN_KEY` in `admin/login.html`, commit, push.
4. Anyone still logged in with the old key must log out / close the tab.

Notes:
- Nothing recovers a lost password – the blob cannot be reversed. Case B is the recovery path.
- The password on the command line stays in your shell history; clear it afterwards.
- Because the blob is public, an attacker can try passwords offline. **Use a long passphrase**, not something guessable
  like club name + year, and store it in a password manager.
- If the login still fails after pushing, the usual reason is that the new `login.html` is not live yet
  (check `git status` – "ahead of origin" means it was not pushed) or the browser cached the old page (Ctrl+F5).

## Member login (`pages/prihlaseni.html`, `assets/JS/login.js`)

A deliberately lightweight "testing-stage" login for the borrowed-items page:

1. The form's username/password are compared with `src/data/user.json` (fetched as a public file) in the browser.
2. On a match, the user's `personId` is stored in `localStorage.personId` and the browser goes to `pujceni.html`.
3. `borrowed-items-display.js` reads `personId`, loads `items.json` and shows only that person's items.

Limitations you should be aware of:
- **Not real security.** Anyone can read `user.json` (it is a public file with plain-text passwords) or set
  `localStorage.personId` in devtools. It only hides a borrowing list from casual visitors. Members must not reuse a
  real password here.
- The same applies to `items.json`: all members' items are publicly readable.
- **Currently broken on `3vomunl.cz`** – see "Known issues" in [site-overview.md](site-overview.md).

Managing members:
- Change a member's password: admin panel → *Změna hesla* (uses the `change-password` worker).
- Add a member: edit two files by hand and keep the ids in sync – add `{ "id": N, "name", "surname", "borrowed_items": [] }`
  to `people` in `items.json` and `{ "personId": N, "username", "password" }` to `users` in `user.json`.
- Remove a member: delete their entries from both files.
