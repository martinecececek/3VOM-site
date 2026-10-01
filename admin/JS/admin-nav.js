// admin/JS/admin-nav.js
function renderAdminNav(activePage) {
   const navItems = [
      { page: "index", file: "index.html", text: "Přehled" },
      { page: "photo", file: "Admin-Photo-Upload.html", text: "Fotky" },
      { page: "pdf", file: "Admin-PDF-Upload.html", text: "PDF" },
      { page: "items", file: "admin-item-tracker.html", text: "Půjčené položky" },
      { page: "password", file: "change-password.html", text: "Heslo uživatele" },
   ];

   const navLinks = navItems
      .map(
         (item) =>
            `<a href="${item.file}" data-page="${item.page}">${item.text}</a>`,
      )
      .join("\n        ");

   const navHTML = `
      <nav class="admin-nav">
        <div class="admin-nav-links">
          ${navLinks}
        </div>
        <button type="button" id="adminLogoutBtn" class="admin-nav-logout">Odhlásit se</button>
      </nav>
   `;

   const mount = document.getElementById("admin-nav");
   if (!mount) return;

   mount.innerHTML = navHTML;

   document.querySelectorAll(".admin-nav-links a").forEach((link) => {
      if (link.dataset.page === activePage) link.classList.add("active");
   });

   const logoutBtn = document.getElementById("adminLogoutBtn");
   if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
         sessionStorage.removeItem("ADMIN_KEY");
         window.location.replace("login.html");
      });
   }
}
