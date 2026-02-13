// src/components/header.js
function renderHeader(activePage = "home") {
   // If we are on /docs/pages/*.html we need to go up one level to reach /docs/
   const base = window.location.pathname.includes("/pages/") ? "../" : "";

   const headerHTML = `
    <header class="top-header">
      <div class="header-inner">

        <div class="header-logo">
          <a href="${base}index.html">
            <img src="${base}assets/image/logo/3VOM-logo.png" alt="Logo oddilu 3VOM">
          </a>
        </div>

        <div class="header-content">
          <h1>3. Vodácký oddíl mládeže</h1>
          <h3 class="tom-num">TOM 7104</h3>

          <nav class="top-nav">
            <a href="${base}index.html" data-page="home">Hlavní stránka</a>
            <a href="${base}pages/activities.html" data-page="activities">Události</a>
            <a href="${base}pages/gallery.html" data-page="gallery">Galerie</a>
            <a href="${base}pages/about.html" data-page="about">O nás</a>
            <a href="${base}pages/contacts.html" data-page="contacts">Kontakty</a>
          </nav>
        </div>

      </div>
    </header>
  `;

   const mount = document.getElementById("header");
   if (!mount) return;

   mount.innerHTML = headerHTML;

   // set active class
   document.querySelectorAll(".top-nav a").forEach((link) => {
      if (link.dataset.page === activePage) link.classList.add("active");
   });
}
