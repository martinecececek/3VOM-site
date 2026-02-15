// src/i18n.js - Static translation mapping
// Maps internal page identifiers to Czech display names

const i18n = {
   // Main pages
   home: {
      title: "Hlavní stránka",
      fullTitle: "3.VOM | Hlavní stránka",
   },
   activities: {
      title: "Události",
      fullTitle: "3.VOM | Události",
   },
   gallery: {
      title: "Galerie",
      fullTitle: "3.VOM | Galerie",
   },
   about: {
      title: "O nás",
      fullTitle: "3.VOM | O nás",
   },
   contacts: {
      title: "Kontakty",
      fullTitle: "3.VOM | Kontakty",
   },
   join: {
      title: "Přidej se",
      fullTitle: "3.VOM | Přidej se k nám",
   },

   // Information pages
   safety: {
      title: "Bezpečnost",
      fullTitle: "3.VOM | Bezpečnost",
   },
   bring: {
      title: "Co s sebou",
      fullTitle: "3.VOM | Co s sebou",
   },
   vybaveni: {
      title: "Vybavení",
      fullTitle: "3.VOM | Vybavení",
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
