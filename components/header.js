function renderHeader(activePage = "home") {
   const headerHTML = `
    <header class="top-header">
      <div class="header-inner">

        <div class="header-logo">
          <a href="index.html">
            <img src="./images/logo/3VOM-logo.png" alt="Logo oddilu 3VOM">
          </a>
        </div>

        <div class="header-content">
          <h1>3. Vodácký oddíl mládeže</h1>

          <h3 class="tom-num">TOM 7104</h3>

          <nav class="top-nav">
            <a href="index.html" data-page="home">Hlavní stránka</a>
            <a href="activities.html" data-page="activities">Události</a>
            <a href="gallery.html" data-page="gallery">Galerie</a>
            <a href="about.html" data-page="about">O nás</a>
            <a href="contacts.html" data-page="contacts">Kontakty</a>
          </nav>
        </div>

      </div>
    </header>
  `;

   document.getElementById("header").innerHTML = headerHTML;

   /* set active class */
   const links = document.querySelectorAll(".top-nav a");

   links.forEach((link) => {
      if (link.dataset.page === activePage) {
         link.classList.add("active");
      }
   });
}
