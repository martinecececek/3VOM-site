/* JS/login.js
   Testing-stage login:
   - Compares username + password against users.json
   - On success, saves personId for use on another page
   - Redirects to the protected page
   - Still works if URL is mistakenly opened like: login.html/
*/

(() => {
   // =========================
   // CONFIG
   // =========================
   const LOGIN_FILE = "login.html";
   const AFTER_LOGIN_FILE = "pujceni.html";

   // Path to your separate login JSON (adjust if your folder differs)
   // Example assumes: /assets/data/users.json relative to current folder
   const USERS_JSON_PATH = "./../src/data/user.json";

   // Storage key for the logged-in personId
   const PERSON_ID_KEY = "personId";

   // Build a proper base directory (folder), not based on full URL
   const getBaseDir = () => {
      const url = new URL(window.location.href);

      // If someone opened /login.html/ (trailing slash), fix it to /
      if (url.pathname.endsWith(".html/")) {
         url.pathname = url.pathname.replace(/\.html\/$/, "/");
      }

      // Always return directory path (ends with /)
      const dirPath = url.pathname.replace(/[^/]*$/, "");
      return url.origin + dirPath;
   };

   const BASE_DIR = getBaseDir();

   const goTo = (file) => {
      window.location.href = BASE_DIR + file;
   };

   const setPersonId = (personId) => {
      try {
         localStorage.setItem(PERSON_ID_KEY, String(personId));
      } catch {
         // If localStorage is blocked, fallback to sessionStorage
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

   const fetchUsers = async () => {
      const res = await fetch(USERS_JSON_PATH, { cache: "no-store" });
      if (!res.ok) {
         throw new Error(`Failed to load users.json (${res.status})`);
      }
      const data = await res.json();
      if (!data || !Array.isArray(data.users)) {
         throw new Error("Invalid users.json format: expected { users: [] }");
      }
      return data.users;
   };

   const normalize = (s) => (s ?? "").toString().trim().toLowerCase();

   document.addEventListener("DOMContentLoaded", () => {
      // =========================
      // LOGIN PAGE LOGIC
      // =========================
      const form = document.getElementById("loginForm");
      const userInput = document.getElementById("username");
      const passInput = document.getElementById("password");
      const errorBox = document.getElementById("errorBox");

      if (form && userInput && passInput && errorBox) {
         form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = normalize(userInput.value);
            const password = passInput.value.trim();

            // Basic validation
            if (!username || !password) {
               errorBox.style.display = "block";
               return;
            }

            try {
               const users = await fetchUsers();

               // Find matching user
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
               // Treat loading issues as login failure for now
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
      // PROTECTED PAGE GUARD (testing-stage)
      // =========================
      const isProtected = document.body?.dataset?.protected === "true";
      if (isProtected) {
         // If no saved personId, force login
         if (!getPersonId()) {
            goTo(LOGIN_FILE);
         }
      }
   });
})();
