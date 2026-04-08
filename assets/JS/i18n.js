// src/i18n.js - Static translation mapping
// Maps internal page identifiers to Czech display names

const i18n = {
   // Main pages
   home: {
      title: "Hlavní stránka",
      fullTitle: "3.VOM | Hlavní stránka",
      description: "3. Vodácký oddíl mládeže v Ústí nad Labem – pádlování, túry a výlety pro děti i dospělé. Přidej se k nám!",
   },
   activities: {
      title: "Události",
      fullTitle: "3.VOM | Události",
      description: "Přehled aktivit 3.VOM – vodácké výlety, pěší turistika a běžky. Pravidelné schůzky každou středu od 17:00.",
   },
   gallery: {
      title: "Galerie",
      fullTitle: "3.VOM | Galerie",
      description: "Fotogalerie ze života oddílu 3.VOM. Výlety, akce a nezapomenutelné momenty na vodě i v přírodě.",
   },
   about: {
      title: "O nás",
      fullTitle: "3.VOM | O nás",
      description: "Kdo jsme? 3. Vodácký oddíl mládeže TOM 7104 z Ústí nad Labem. Přečti si historii a hodnoty našeho oddílu.",
   },
   contacts: {
      title: "Kontakty",
      fullTitle: "3.VOM | Kontakty",
      description: "Kontaktuj 3.VOM – vedoucí oddílu Petr Balda, Jiří Magasanik a Renata Brodská. Najdi nás na mapě v Ústí nad Labem.",
   },
   join: {
      title: "Přidej se",
      fullTitle: "3.VOM | Přidej se k nám",
      description: "Chceš se přidat do 3.VOM? Vyplň formulář a staň se součástí naší oddílové rodiny. Vítáme začátečníky i zkušené pádlaře.",
   },

   // Information pages
   safety: {
      title: "Bezpečnost",
      fullTitle: "3.VOM | Bezpečnost",
      description: "Bezpečnost je u nás na prvním místě. Přečti si základní pravidla chování na akcích a vodáckých výletech 3.VOM.",
   },
   bring: {
      title: "Co s sebou",
      fullTitle: "3.VOM | Co s sebou",
      description: "Co si vzít s sebou na vodácký výlet, pěší túru nebo běžky? Kompletní seznam potřebného vybavení od 3.VOM.",
   },
   vybaveni: {
      title: "Vybavení",
      fullTitle: "3.VOM | Vybavení",
      description: "Vybavení oddílu 3.VOM – lodě, pádla, vesty a další gear dostupný členům. Přehled toho, co máme k dispozici.",
   },
   login: {
      title: "Zápůjčky",
      fullTitle: "3.VOM | Zápůjčky",
   },
   pujceni: {
      title: "Půjčení",
      fullTitle: "3.VOM | Půjčení",
   },
};

// Helper function to get translated page title
function getPageTitle(pageId) {
   return i18n[pageId]?.title || pageId;
}

// Helper function to get full page title (for <title> tag)
function getPageFullTitle(pageId) {
   return i18n[pageId]?.fullTitle || "3.VOM";
}

// Auto-update page title based on current page
function updatePageTitle(pageId) {
   if (pageId && i18n[pageId]) {
      document.title = i18n[pageId].fullTitle;
   }
}
