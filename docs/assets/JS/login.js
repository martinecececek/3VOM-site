/* JS/login.js
   Always require password (no remembering)
   Works even if URL is mistakenly opened like: login.html/
*/

(() => {
   // =========================
   // CONFIG
   // =========================
   const CORRECT_PASSWORD = "1234"; // <-- change this
   const LOGIN_FILE = "login.html";
   const AFTER_LOGIN_FILE = "pujceni.html";

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

   document.addEventListener("DOMContentLoaded", () => {
      // =========================
      // LOGIN PAGE LOGIC
      // =========================
      const form = document.getElementById("loginForm");
      const passInput = document.getElementById("password");
      const errorBox = document.getElementById("errorBox");

      if (form && passInput && errorBox) {
         form.addEventListener("submit", (e) => {
            e.preventDefault();

            if (passInput.value.trim() === CORRECT_PASSWORD) {
               goTo(AFTER_LOGIN_FILE);
            } else {
               errorBox.style.display = "block";
               passInput.value = "";
               passInput.focus();
            }
         });

         passInput.addEventListener("input", () => {
            errorBox.style.display = "none";
         });

         return;
      }

      // =========================
      // PROTECTED PAGE GUARD
      // =========================
      const isProtected = document.body?.dataset?.protected === "true";
      if (isProtected) {
         goTo(LOGIN_FILE);
      }
   });
})();
