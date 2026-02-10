"use strict";

/*
  lightbox.js (FULL)
  - Works with dynamically inserted images inside #galleryGrid
  - Requires lightbox HTML to exist on the page:
      #lightbox, #lightboxImg, #lightboxCaption
  - Supports:
      - click thumbnails to open
      - next/prev buttons (desktop)
      - ESC + arrow keys
      - backdrop click to close
      - swipe left/right on mobile
*/

document.addEventListener("DOMContentLoaded", () => {
   const grid = document.getElementById("galleryGrid");
   if (!grid) {
      console.warn("lightbox.js: #galleryGrid not found");
      return;
   }

   const lb = document.getElementById("lightbox");
   const lbImg = document.getElementById("lightboxImg");
   const lbCaption = document.getElementById("lightboxCaption");

   if (!lb || !lbImg || !lbCaption) {
      console.warn(
         "lightbox.js: Lightbox HTML missing (#lightbox, #lightboxImg, #lightboxCaption)",
      );
      return;
   }

   let currentIndex = -1;

   const getImages = () =>
      Array.from(grid.querySelectorAll("figure.gallery-item img"));

   const setFromIndex = (index) => {
      const imgs = getImages();
      if (!imgs.length) return;

      currentIndex = (index + imgs.length) % imgs.length;
      const img = imgs[currentIndex];

      lbImg.src = img.src;
      lbImg.alt = img.alt || "Fotografie";
      lbCaption.textContent = img.alt || "";
   };

   const open = (index) => {
      setFromIndex(index);
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
   };

   const close = () => {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";

      // stop loading if user closes quickly
      lbImg.src = "";
      currentIndex = -1;
   };

   const next = () => {
      if (currentIndex === -1) return;
      setFromIndex(currentIndex + 1);
   };

   const prev = () => {
      if (currentIndex === -1) return;
      setFromIndex(currentIndex - 1);
   };

   // -----------------------------
   // Open from thumbnail click (dynamic-safe)
   // -----------------------------
   grid.addEventListener("click", (e) => {
      const img = e.target.closest("img");
      if (!img) return;

      const imgs = getImages();
      const idx = imgs.indexOf(img);
      if (idx !== -1) open(idx);
   });

   // -----------------------------
   // Clicks inside lightbox
   // - backdrop / close button closes
   // - arrows navigate
   // -----------------------------
   lb.addEventListener("click", (e) => {
      if (e.target.closest("[data-lb-close]")) close();
      else if (e.target.closest("[data-lb-next]")) next();
      else if (e.target.closest("[data-lb-prev]")) prev();
   });

   // -----------------------------
   // Keyboard controls
   // -----------------------------
   document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;

      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
   });

   // -----------------------------
   // Swipe support (mobile)
   // -----------------------------
   let touchStartX = 0;
   let touchStartY = 0;

   lb.addEventListener(
      "touchstart",
      (e) => {
         if (!lb.classList.contains("is-open")) return;
         const t = e.changedTouches[0];
         touchStartX = t.clientX;
         touchStartY = t.clientY;
      },
      { passive: true },
   );

   lb.addEventListener(
      "touchend",
      (e) => {
         if (!lb.classList.contains("is-open")) return;
         const t = e.changedTouches[0];

         const dx = t.clientX - touchStartX;
         const dy = t.clientY - touchStartY;

         // ignore vertical gestures
         if (Math.abs(dy) > Math.abs(dx)) return;

         const threshold = 40;
         if (dx > threshold) prev();
         else if (dx < -threshold) next();
      },
      { passive: true },
   );

   console.log("lightbox.js: initialized ✅");
});
