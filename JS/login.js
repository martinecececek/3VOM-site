/* JS/login.js
   Always require password.
   No remembering login.
   Folder structure:
   - login.html (root)
   - pujceni.html (root)
   - JS/login.js
*/

(() => {
   // =========================
   // CONFIG
   // =========================
   const CORRECT_PASSWORD = "1234"; // <-- change this
   const LOGIN_PAGE = "../login.html";
   const REDIRECT_AFTER_LOGIN = "../pujceni.html"; // <-- change target page

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

            const entered = passInput.value.trim();

            if (entered === CORRECT_PASSWORD) {
               window.location.href = REDIRECT_AFTER_LOGIN;
            } else {
               errorBox.style.display = "block";
               passInput.value = "";
               passInput.focus();
            }
         });

         passInput.addEventListener("input", () => {
            errorBox.style.display = "none";
         });

         return; // stop here if we are on login page
      }

      // =========================
      // PROTECTED PAGE GUARD
      // =========================
      // Add this to protected pages:
      // <body data-protected="true">

      const isProtected = document.body.dataset.protected === "true";

      if (isProtected) {
         // If someone opens protected page directly → send to login
         window.location.href = LOGIN_PAGE;
      }
   });
})();
