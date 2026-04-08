// Prefetch gallery images in the background after any page finishes loading.
// Runs only at idle time so it never competes with the visible page content.
// The service worker (service-worker.js) will cache each image as it's fetched.

// Derive the site root from this script's own URL so it works from any page depth.
const _base = (document.currentScript?.src || "")
   .replace(/assets\/JS\/gallery-precache\.js.*$/, "");

window.addEventListener("load", () => {
   const run = () => prefetchGallery();

   if ("requestIdleCallback" in window) {
      requestIdleCallback(run, { timeout: 5000 });
   } else {
      setTimeout(run, 3000);
   }
});

async function prefetchGallery() {
   try {
      const res = await fetch(`${_base}src/data/gallery.json`, { cache: "force-cache" });
      if (!res.ok) return;

      const images = await res.json();
      if (!Array.isArray(images)) return;

      // Same logic as gallery-img-load.js: 12 newest by date
      const newest12 = images
         .slice()
         .sort((a, b) => new Date(b.date) - new Date(a.date))
         .slice(0, 12);

      newest12.forEach(({ file }) => {
         if (!file) return;
         const img = new Image();
         img.decoding = "async";
         img.src = `${_base}assets/image/gallery-12-pics/${encodeURIComponent(file.trim())}`;
      });
   } catch {
      // Silently ignore — prefetch is best-effort
   }
}
