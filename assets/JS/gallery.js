async function loadGallery() {
   const container = document.getElementById("galleryGrid");
   if (!container) return;

   try {
      // ✅ Resolve JSON relative to this file: assets/JS/gallery.js
      // assets/JS/gallery.js -> src/data/gallery.json
      const jsonUrl = new URL("../../src/data/gallery.json", import.meta.url);

      // Enable caching for faster subsequent loads
      const response = await fetch(jsonUrl, {
         cache: "force-cache",
      });

      if (!response.ok) {
         throw new Error(`Cannot load gallery.json (HTTP ${response.status})`);
      }

      const images = await response.json();
      if (!Array.isArray(images)) {
         throw new Error("gallery.json must be an array");
      }

      // newest first
      images.sort((a, b) => new Date(b.date) - new Date(a.date));

      // take only 12 newest
      const newest12 = images.slice(0, 12);

      // Use DocumentFragment for batch DOM operations (prevents multiple reflows)
      const fragment = document.createDocumentFragment();

      newest12.forEach((img, index) => {
         const file = (img.file || "").trim();
         const captionText = (img.caption || "").trim() || "Fotografie";
         if (!file) return;

         const figure = document.createElement("figure");
         figure.className = "gallery-item";

         const imageEl = document.createElement("img");

         // ✅ Resolve images relative to this JS file too:
         // assets/JS/gallery.js -> assets/image/gallery-12-pics/<file>
         const imgUrl = new URL(
            `../image/gallery-12-pics/${encodeURIComponent(file)}`,
            import.meta.url,
         );

         imageEl.src = imgUrl.href;
         imageEl.alt = captionText;

         // Eager load first 3 images (above the fold), lazy load the rest
         imageEl.loading = index < 3 ? "eager" : "lazy";
         imageEl.decoding = "async";

         // Add fetchpriority for first image
         if (index === 0) {
            imageEl.fetchPriority = "high";
         }

         // Prevent layout shift by setting aspect ratio
         imageEl.style.aspectRatio = "1 / 1";
         imageEl.style.objectFit = "cover";
         imageEl.style.width = "100%";
         imageEl.style.height = "auto";

         imageEl.addEventListener("error", () => {
            console.error("IMAGE NOT FOUND:", imageEl.src, "JSON file:", file);
         });

         const caption = document.createElement("figcaption");
         caption.textContent = captionText;

         figure.appendChild(imageEl);
         figure.appendChild(caption);
         fragment.appendChild(figure);
      });

      // Single DOM update - much faster than appending one by one
      container.innerHTML = "";
      container.appendChild(fragment);
   } catch (error) {
      console.error("Gallery load error:", error);
      container.innerHTML = `
      <p style="color: var(--muted);">
        Galerii se nepodařilo načíst.
      </p>
    `;
   }
}

loadGallery();
