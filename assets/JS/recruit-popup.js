// "Nabíráme nové členy" popup — shown once per browser session (tab visit).
(() => {
   const STORAGE_KEY = "recruitPopupShown";
   const SHOW_DELAY_MS = 800;

   const base = (document.currentScript?.src || "").replace(
      /assets\/JS\/recruit-popup\.js.*$/,
      "",
   );

   const alreadyShown = () => {
      try {
         return sessionStorage.getItem(STORAGE_KEY) === "1";
      } catch {
         return false;
      }
   };

   const markShown = () => {
      try {
         sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
         /* storage blocked — popup may show again on next visit */
      }
   };

   const open = () => {
      const previouslyFocused = document.activeElement;

      const overlay = document.createElement("div");
      overlay.className = "recruit-overlay";
      overlay.innerHTML = `
         <div class="recruit-dialog" role="dialog" aria-modal="true" aria-labelledby="recruitTitle">
            <button type="button" class="recruit-close" aria-label="Zavřít">&times;</button>
            <span class="recruit-badge">Nábor</span>
            <img class="recruit-logo" src="${base}assets/image/logo/3VOM-logo.webp" alt="Logo 3. vodáckého oddílu mládeže" />
            <h2 id="recruitTitle">Nabíráme nové členy!</h2>
            <p class="recruit-age">Pro kluky a holky od 10 let</p>
            <p class="recruit-text">
               Chceš zažít vodu, přírodu a skvělou partu? Nemáš zkušenosti?
               Nevadí, vše tě naučíme.
            </p>
            <p class="recruit-meta">Každou středu v 17:00 vodácký výcvik na Labi.</p>
            <div class="recruit-actions">
               <a href="${base}pages/pridej-se.html" class="btn primary">Přidej se k nám</a>
               <button type="button" class="btn secondary recruit-dismiss">Možná později</button>
            </div>
         </div>
      `;

      const close = () => {
         document.removeEventListener("keydown", onKeydown);
         overlay.classList.remove("is-visible");
         document.body.classList.remove("recruit-open");
         const remove = () => overlay.remove();
         overlay.addEventListener("transitionend", remove, { once: true });
         setTimeout(remove, 400);
         if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
      };

      const onKeydown = (e) => {
         if (e.key === "Escape") {
            close();
            return;
         }
         if (e.key !== "Tab") return;

         const focusable = overlay.querySelectorAll("a[href], button");
         const first = focusable[0];
         const last = focusable[focusable.length - 1];
         if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
         } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
         }
      };

      overlay.addEventListener("click", (e) => {
         if (e.target === overlay) close();
      });
      overlay.querySelector(".recruit-close").addEventListener("click", close);
      overlay.querySelector(".recruit-dismiss").addEventListener("click", close);
      document.addEventListener("keydown", onKeydown);

      document.body.appendChild(overlay);
      document.body.classList.add("recruit-open");
      requestAnimationFrame(() => overlay.classList.add("is-visible"));
      overlay.querySelector(".btn.primary").focus();
      markShown();
   };

   const init = () => {
      if (alreadyShown()) return;
      setTimeout(open, SHOW_DELAY_MS);
   };

   if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
   } else {
      init();
   }
})();
