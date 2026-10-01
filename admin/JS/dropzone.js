// admin/JS/dropzone.js
// Upgrades every .upload-box on the page into a real drag-and-drop target.
// Populates the existing <input type="file"> on drop, so upload scripts
// (send-img.js, send-file.js) need no changes — they already read the file
// from that same input at submit time.
(function () {
   function initDropzones(selector) {
      document.querySelectorAll(selector).forEach((box) => {
         const input = box.querySelector('input[type="file"]');
         if (!input) return;

         let preview = box.querySelector(".upload-filename");
         if (!preview) {
            preview = document.createElement("p");
            preview.className = "upload-filename";
            box.appendChild(preview);
         }

         const showFileName = () => {
            const file = input.files && input.files[0];
            preview.textContent = file ? `Vybráno: ${file.name}` : "";
         };

         // Covers both click-to-browse selection AND files assigned via drop below
         input.addEventListener("change", showFileName);

         ["dragenter", "dragover"].forEach((evt) =>
            box.addEventListener(evt, (e) => {
               e.preventDefault();
               e.stopPropagation();
               box.classList.add("is-dragover");
            }),
         );

         ["dragleave", "dragend"].forEach((evt) =>
            box.addEventListener(evt, (e) => {
               e.preventDefault();
               e.stopPropagation();
               box.classList.remove("is-dragover");
            }),
         );

         box.addEventListener("drop", (e) => {
            e.preventDefault();
            e.stopPropagation();
            box.classList.remove("is-dragover");

            const dropped = e.dataTransfer && e.dataTransfer.files;
            if (!dropped || !dropped.length) return;

            const dt = new DataTransfer();
            dt.items.add(dropped[0]);
            input.files = dt.files;
            input.dispatchEvent(new Event("change", { bubbles: true }));
         });
      });
   }

   document.addEventListener("DOMContentLoaded", () => {
      const boxes = document.querySelectorAll(".upload-box");
      if (!boxes.length) return;

      // Prevent the browser from navigating away if a file is dropped
      // slightly outside the dropzone itself.
      window.addEventListener("dragover", (e) => e.preventDefault());
      window.addEventListener("drop", (e) => e.preventDefault());

      initDropzones(".upload-box");
   });
})();
