async function loadGallery() {
   const container = document.getElementById("galleryGrid");
   if (!container) return;

   try {
      const response = await fetch("./images/gallery.json", {
         cache: "no-store",
      });
      if (!response.ok)
         throw new Error(`Cannot load gallery.json (HTTP ${response.status})`);

      const images = await response.json();
      if (!Array.isArray(images))
         throw new Error("gallery.json must be an array");

      // newest first
      images.sort((a, b) => new Date(b.date) - new Date(a.date));

      // take only 12 newest
      const newest12 = images.slice(0, 12);

      container.innerHTML = "";

      newest12.forEach((img) => {
         const file = (img.file || "").trim();
         const captionText = (img.caption || "").trim() || "Fotografie";
         if (!file) return;

         const figure = document.createElement("figure");
         figure.className = "gallery-item";

         const imageEl = document.createElement("img");
         imageEl.src = `./images/gallery-12-pics/${encodeURIComponent(file)}`;
         imageEl.alt = captionText;

         // ⭐ optional UX / perf
         imageEl.loading = "lazy";
         imageEl.decoding = "async";

         imageEl.addEventListener("error", () => {
            console.error("IMAGE NOT FOUND:", imageEl.src, "JSON file:", file);
         });

         const caption = document.createElement("figcaption");
         caption.textContent = captionText;

         figure.appendChild(imageEl);
         figure.appendChild(caption);
         container.appendChild(figure);
      });
   } catch (error) {
      console.error("Gallery load error:", error);
      container.innerHTML = `
      <p style="color: var(--muted);">
        Galerii se nepodařilo načíst. Zkontroluj <strong>./images/gallery.json</strong>.
      </p>
    `;
   }
}

loadGallery();
