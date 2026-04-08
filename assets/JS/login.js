/* JS/login.js
   Testing-stage login:
   - Compares username + password against src/data/user.json
   - On success, saves personId for use on another page
   - Redirects to the protected page
   - Works on localhost + GitHub Pages

   IMPORTANT:
   This version uses the repo name explicitly to avoid GitHub Pages base-path issues.
*/

(() => {
   // =========================
   // CONFIG
   // =========================
   const LOGIN_FILE = "prihlaseni.html";
   const AFTER_LOGIN_FILE = "pujceni.html";

   // Your GitHub Pages repo name (the folder after your domain)
   const REPO_NAME = "3VOM-site";

   // JSON location inside the repo
   const USERS_JSON_ABS_PATH = `/${REPO_NAME}/src/data/user.json`;

   // Storage key for logged user
   const PERSON_ID_KEY = "personId";

   // =========================
   // HELPERS
   // =========================
   const normalize = (s) => (s ?? "").toString().trim().toLowerCase();

   const setPersonId = (personId) => {
      try {
         localStorage.setItem(PERSON_ID_KEY, String(personId));
      } catch {
         sessionStorage.setItem(PERSON_ID_KEY, String(personId));
      }
   };

   const clearPersonId = () => {
      try {
         localStorage.removeItem(PERSON_ID_KEY);
      } catch {
         sessionStorage.removeItem(PERSON_ID_KEY);
      }
   };

   const getPersonId = () => {
      try {
         return (
            localStorage.getItem(PERSON_ID_KEY) ??
            sessionStorage.getItem(PERSON_ID_KEY)
         );
      } catch {
         return sessionStorage.getItem(PERSON_ID_KEY);
      }
   };

   // Build a proper base directory (folder) for redirects (login.html -> pujceni.html)
   const getBaseDir = () => {
      const url = new URL(window.location.href);

      // Fix accidental /login.html/ => /login.html
      if (url.pathname.endsWith(".html/")) {
         url.pathname = url.pathname.replace(/\.html\/$/, ".html");
      }

      // Directory path (ends with /)
      const dirPath = url.pathname.replace(/[^/]*$/, "");
      return url.origin + dirPath;
   };

   const BASE_DIR = getBaseDir();

   const goTo = (file) => {
      window.location.href = BASE_DIR + file;
   };

   // =========================
   // FETCH USERS (GitHub Pages-safe)
   // =========================
   const fetchUsers = async () => {
      // Absolute path that keeps /3VOM-site/ (repo) on GitHub Pages
      const usersUrl = new URL(USERS_JSON_ABS_PATH, window.location.origin);

      console.log("Login page:", window.location.href);
      console.log("Fetching users JSON:", usersUrl.href);

      const res = await fetch(usersUrl.href, { cache: "no-store" });
      if (!res.ok) {
         throw new Error(
            `Failed to load user.json (HTTP ${res.status}) from ${usersUrl.href}`,
         );
      }

      const data = await res.json();
      if (!data || !Array.isArray(data.users)) {
         throw new Error("Invalid user.json format: expected { users: [] }");
      }
      return data.users;
   };

   // =========================
   // MAIN
   // =========================
   document.addEventListener("DOMContentLoaded", () => {
      const form = document.getElementById("loginForm");
      const userInput = document.getElementById("username");
      const passInput = document.getElementById("password");
      const errorBox = document.getElementById("errorBox");

      // =========================
      // LOGIN PAGE
      // =========================
      if (form && userInput && passInput && errorBox) {
         form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = normalize(userInput.value);
            const password = passInput.value.trim();

            if (!username || !password) {
               errorBox.style.display = "block";
               return;
            }

            try {
               const users = await fetchUsers();

               const match = users.find(
                  (u) =>
                     normalize(u.username) === username &&
                     String(u.password) === password,
               );

               if (match && typeof match.personId !== "undefined") {
                  setPersonId(match.personId);
                  goTo(AFTER_LOGIN_FILE);
               } else {
                  clearPersonId();
                  errorBox.style.display = "block";
                  passInput.value = "";
                  passInput.focus();
               }
            } catch (err) {
               console.error(err);
               clearPersonId();
               errorBox.style.display = "block";
            }
         });

         const hideError = () => {
            errorBox.style.display = "none";
         };

         userInput.addEventListener("input", hideError);
         passInput.addEventListener("input", hideError);

         return;
      }

      // =========================
      // PROTECTED PAGE GUARD
      // =========================
      const isProtected = document.body?.dataset?.protected === "true";
      if (isProtected && !getPersonId()) {
         goTo(LOGIN_FILE);
      }
   });
})();
