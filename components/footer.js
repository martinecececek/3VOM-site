function renderFooter() {
   const footerHTML = `
<footer class="site-footer">
  <div class="footer-inner">

    <div class="footer-brand">
      <div class="footer-logo">
        <img src="./images/logo/3VOM-logo.png" alt="3VOM oddílové logo" />
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
            <li><a href="about.html">O nás</a></li>
            <li><a href="activities.html">Události</a></li>
            <li><a href="gallery.html">Galerie</a></li>
            <li><a href="join.html">Přidej se</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Informace</h4>
          <ul>
            <li><a href="safety.html">Bezpečnost</a></li>
            <li><a href="bring.html">Co s sebou</a></li>
            <li><a href="vybaveni.html">Vybavení</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Odkazy</h4>
          <ul>
            <li><a href="https://www.instagram.com/3.vom_usti/">Instagram</a></li>
            <li><a href="https://www.facebook.com/profile.php?id=100043338507100">Facebook</a></li>
            <li><a href="https://www.ddmul.cz/">DDM UNL</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-sep"></div>

      <div class="footer-logos">
        <a class="footer-logo-item" href="https://www.a-tom.cz/">
          <img src="./images/logo/ATOM-logo.png" alt="ATOM logo" />
        </a>

        <a class="footer-logo-item" href="https://kct.cz/">
          <img src="./images/logo/KCT-logo.png" alt="KCT logo" />
        </a>
      </div>

    </div>

    <div class="footer-bottom">
      <p>© 2026 Canoeing Club. All rights reserved.</p>
    </div>

  </div>
</footer>
  `;

   document.getElementById("footer").innerHTML = footerHTML;
}
