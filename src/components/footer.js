function renderFooter() {
   // If current URL contains "/pages/", we are inside the pages folder
   const isInPages = window.location.pathname.includes("/pages/");

   // Links to pages:
   // - from index: "pages/about.html"
   // - from /pages/*: "about.html"
   const pageHref = (file) =>
      isInPages ? `${file}.html` : `pages/${file}.html`;

   // Assets:
   // - from index: "docs/..."
   // - from /pages/*: "../docs/..."
   const assetBase = isInPages
      ? "../docs/assets/image/logo/"
      : "docs/assets/image/logo/";

   const footerHTML = `
<footer class="site-footer">
  <div class="footer-inner">

    <div class="footer-brand">
      <div class="footer-logo">
        <img src="../../docs/assets/image/logo/3VOM-logo.png" alt="3VOM oddílové logo" />
      </div>
      <p class="footer-desc">
        3.VOM je komunita přátelská k začátečníkům, postavená na
        bezpečnosti, blízkosti k přírodě a nezapomenutelných dobrodružstvích.
      </p>
    </div>

    <div class="footer-right">
      <div class="footer-cols">

        <div class="footer-col">
          <h4>Oddíl</h4>
          <ul>
            <li><a href="${pageHref("about")}">O nás</a></li>
            <li><a href="${pageHref("activities")}">Události</a></li>
            <li><a href="${pageHref("gallery")}">Galerie</a></li>
            <li><a href="${pageHref("join")}">Přidej se</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Informace</h4>
          <ul>
            <li><a href="${pageHref("safety")}">Bezpečnost</a></li>
            <li><a href="${pageHref("bring")}">Co s sebou</a></li>
            <li><a href="${pageHref("vybaveni")}">Vybavení</a></li>
            <li><a href="${pageHref("login")}">Zápůjčky</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Odkazy</h4>
          <ul>
            <li><a href="https://www.instagram.com/3.vom_usti/" target="_blank" rel="noopener">Instagram</a></li>
            <li><a href="https://www.facebook.com/profile.php?id=100043338507100" target="_blank" rel="noopener">Facebook</a></li>
          </ul>
        </div>

      </div>

      <div class="footer-sep"></div>

      <div class="footer-logos">
        <a class="footer-logo-item" href="https://www.a-tom.cz/" target="_blank" rel="noopener">
          <img src="../assets/image/logo/ATOM-logo.png" alt="ATOM logo" />
        </a>

        <a class="footer-logo-item" href="https://kct.cz/" target="_blank" rel="noopener">
          <img src="../assets/image/logo/KCT-logo.png" alt="KCT logo" />
        </a>

        <a class="footer-logo-item" href="https://www.ddmul.cz/" target="_blank" rel="noopener">
          <img src="../assets/image/logo/DDM-logo.png" alt="DDM logo" />
        </a>
      </div>
    </div>

    <div class="footer-bottom">
      <p>© 2026 Canoeing Club. All rights reserved.</p>
    </div>

  </div>
</footer>
  `;

   const mount = document.getElementById("footer");
   if (!mount) {
      console.warn("renderFooter: #footer not found");
      return;
   }
   mount.innerHTML = footerHTML;
}
