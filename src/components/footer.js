function renderFooter() {
   const isInPages = window.location.pathname.includes("/pages/");

   // ✅ Works on GitHub project pages (/3VOM-site/) and locally (/)
   const siteBase = window.location.pathname.includes("/3VOM-site/")
      ? "/3VOM-site/"
      : "/";

   // Links to pages:
   // - from index: "pages/about.html"
   // - from /pages/*: "about.html"
   const pageHref = (file) =>
      isInPages ? `${file}.html` : `pages/${file}.html`;

   const footerHTML = `
<footer class="site-footer">
  <div class="footer-inner">

    <div class="footer-brand">
      <div class="footer-logo">
        <img src="${siteBase}assets/image/logo/3VOM-logo.png" alt="3VOM oddílové logo" />
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
            <li><a href="${pageHref("about")}">${getPageTitle("about")}</a></li>
            <li><a href="${pageHref("activities")}">${getPageTitle("activities")}</a></li>
            <li><a href="${pageHref("gallery")}">${getPageTitle("gallery")}</a></li>
            <li><a href="${pageHref("join")}">${getPageTitle("join")}</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Informace</h4>
          <ul>
            <li><a href="${pageHref("safety")}">${getPageTitle("safety")}</a></li>
            <li><a href="${pageHref("bring")}">${getPageTitle("bring")}</a></li>
            <li><a href="${pageHref("vybaveni")}">${getPageTitle("vybaveni")}</a></li>
            <li><a href="${pageHref("login")}">${getPageTitle("login")}</a></li>
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
          <img src="${siteBase}assets/image/logo/ATOM-logo.png" alt="ATOM logo" />
        </a>

        <a class="footer-logo-item" href="https://kct.cz/" target="_blank" rel="noopener">
          <img src="${siteBase}assets/image/logo/KCT-logo.png" alt="KCT logo" />
        </a>

        <a class="footer-logo-item" href="https://www.ddmul.cz/" target="_blank" rel="noopener">
          <img src="${siteBase}assets/image/logo/DDM-logo.png" alt="DDM logo" />
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
