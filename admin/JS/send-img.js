const WORKER_URL = "https://-img-replace-worker.martin-jakubuv.workers.dev";

const form = document.getElementById("uploadForm");
const statusEl = document.getElementById("uploadStatus");
const btn = document.getElementById("uploadBtn");

form.addEventListener("submit", async (e) => {
   e.preventDefault();

   const caption = document.getElementById("photoTitle").value.trim();
   const adminKey = sessionStorage.getItem("ADMIN_KEY");
   const fileInput = document.getElementById("photoFile");
   const file = fileInput.files && fileInput.files[0];

   if (!adminKey) {
      statusEl.textContent = "Chybí admin key.";
      return;
   }
   if (!file) {
      statusEl.textContent = "Vyber prosím soubor.";
      return;
   }

   const allowed = ["image/jpeg", "image/png", "image/webp"];
   if (!allowed.includes(file.type)) {
      statusEl.textContent = "Nepodporovaný formát. Použij JPG, PNG nebo WebP.";
      return;
   }

   const fd = new FormData();
   fd.append("file", file);
   fd.append("caption", caption);

   btn.disabled = true;
   statusEl.textContent = "Nahrávám…";

   try {
      const res = await fetch(WORKER_URL, {
         method: "POST",
         headers: { "x-admin-key": adminKey },
         body: fd,
      });

      if (!res.ok) {
         const text = await res.text();
         statusEl.textContent = `Chyba (${res.status}): ${text}`;
         return;
      }

      const data = await res.json();
      const fileName =
         data.entry?.file || data.uploadedPath || "(neznámý soubor)";
      const publicUrl = data.publicUrl || "";

      statusEl.innerHTML = publicUrl
         ? `Hotovo ✅ Soubor: <strong>${fileName}</strong><br><a href="${publicUrl}" target="_blank">Otevřít obrázek</a>`
         : `Hotovo ✅ Soubor: ${fileName}`;
   } catch (err) {
      statusEl.textContent = `Chyba: ${err}`;
   } finally {
      btn.disabled = false;
   }
});
