const PDF_WORKER_URL = "https://pdf-replace-worker.martin-jakubuv.workers.dev";

const pdfForm = document.getElementById("pdfForm");
const pdfStatus = document.getElementById("pdfStatus");
const pdfBtn = document.getElementById("pdfBtn");

pdfForm.addEventListener("submit", async (e) => {
   e.preventDefault();

   const adminKey =
      "bHKJKHJKJHG6Jadpiadasd14a6s5d15691ASDADASD541a5sd1a651d3a1sd65198451ASDASASDASDASDDa16jh5gk4h665161K"; // hardcoded for simplicity, ideally should be stored securely
   const input = document.getElementById("anyFile");
   const file = input.files && input.files[0];

   if (!adminKey) {
      pdfStatus.textContent = "Chybí admin key.";
      return;
   }
   if (!file) {
      pdfStatus.textContent = "Vyber prosím PDF soubor.";
      return;
   }

   const fd = new FormData();
   fd.append("file", file);

   pdfBtn.disabled = true;
   pdfStatus.textContent = "Nahrávám program.pdf…";

   try {
      const res = await fetch(PDF_WORKER_URL, {
         method: "POST",
         headers: { "x-admin-key": adminKey },
         body: fd,
      });

      const text = await res.text();
      if (!res.ok) {
         pdfStatus.textContent = `Chyba (${res.status}): ${text}`;
         return;
      }

      const data = JSON.parse(text);
      pdfStatus.innerHTML = `Hotovo ✅<br>
      <a href="${data.publicUrl}" target="_blank" rel="noopener">Otevřít program.pdf</a>`;
   } catch (err) {
      pdfStatus.textContent = `Chyba: ${err}`;
   } finally {
      pdfBtn.disabled = false;
   }
});
