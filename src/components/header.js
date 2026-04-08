// src/components/header.js
function renderHeader(activePage = "home") {
   // If we are on /docs/pages/*.html we need to go up one level to reach /docs/
   const base = window.location.pathname.includes("/pages/") ? "../" : "";

   // Use Czech translations from i18n
   const navItems = [
      { page: "home", file: "index", text: getPageTitle("home") },
      { page: "activities", file: "pages/aktivity", text: getPageTitle("activities") },
      { page: "gallery", file: "pages/galerie", text: getPageTitle("gallery") },
      { page: "about", file: "pages/o-nas", text: getPageTitle("about") },
      { page: "contacts", file: "pages/kontakty", text: getPageTitle("contacts") },
   ];

   const navLinks = navItems
      .map(
         (item) =>
            `<a href="${base}${item.file}.html" data-page="${item.page}">${item.text}</a>`
      )
      .join("\n            ");

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
            ${navLinks}
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

   // Auto-update page title to Czech
   if (activePage) {
      updatePageTitle(activePage);
      injectSeoMeta(activePage);
   }
}

function injectSeoMeta(pageId) {
   const entry = i18n[pageId];
   if (!entry) return;

   const siteUrl = "https://martinecececek.github.io/3VOM-site/";
   const canonical = window.location.href.split("?")[0].split("#")[0];

   const setMeta = (attr, value, content) => {
      let el = document.querySelector(`meta[${attr}="${value}"]`);
      if (!el) {
         el = document.createElement("meta");
         el.setAttribute(attr, value);
         document.head.appendChild(el);
      }
      el.setAttribute("content", content);
   };

   const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
         el = document.createElement("link");
         el.rel = rel;
         document.head.appendChild(el);
      }
      el.href = href;
   };

   // Core meta
   if (entry.description) setMeta("name", "description", entry.description);
   setLink("canonical", canonical);

   // Open Graph
   setMeta("property", "og:type", "website");
   setMeta("property", "og:url", canonical);
   setMeta("property", "og:title", entry.fullTitle || document.title);
   if (entry.description) setMeta("property", "og:description", entry.description);
   setMeta("property", "og:locale", "cs_CZ");
   setMeta("property", "og:site_name", "3. Vodácký oddíl mládeže");
   setMeta("property", "og:image", siteUrl + "assets/image/logo/3VOM-logo.png");

   // Twitter Card
   setMeta("name", "twitter:card", "summary");
   setMeta("name", "twitter:title", entry.fullTitle || document.title);
   if (entry.description) setMeta("name", "twitter:description", entry.description);
   setMeta("name", "twitter:image", siteUrl + "assets/image/logo/3VOM-logo.png");
}
