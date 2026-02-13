document.addEventListener("DOMContentLoaded", function () {
   const form = document.querySelector(".join-form");
   const popup = document.getElementById("popup");
   const closeBtn = document.getElementById("closePopup");

   form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(form);

      try {
         const response = await fetch(form.action, {
            method: "POST",
            body: formData,
            headers: { Accept: "application/json" },
         });

         const result = await response.json().catch(() => ({}));

         if (response.ok) {
            form.reset();
            popup.hidden = false;
         } else {
            alert(result.error || "Došlo k chybě při odesílání.");
         }
      } catch {
         alert("Chyba připojení.");
      }
   });

   closeBtn.addEventListener("click", function () {
      popup.hidden = true;
      window.location.href = "index.html";
   });
});
