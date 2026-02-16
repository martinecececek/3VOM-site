document.addEventListener("DOMContentLoaded", function () {
   const form = document.querySelector(".join-form");
   const popup = document.getElementById("popup");
   const closeBtn = document.getElementById("closePopup");

   emailjs.init("zzphlggCEr4fMFcPx");

   form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const params = {
         childName: document.getElementById("childName").value,
         childSurname: document.getElementById("childSurname").value,
         childBirthDate: document.getElementById("childBirthDate").value,
         email: document.getElementById("childEmail").value,
         parentPhone: document.getElementById("parentPhone").value,
         notes: document.getElementById("notes").value,
      };

      try {
         await Promise.all([
            emailjs.send("service_h2xz6tf", "template_6lvrhzx", params),
            emailjs.send("service_h2xz6tf", "template_1e6z71z", params),
         ]);

         form.reset();
         popup.hidden = false;
      } catch {
         alert("Chyba při odesílání. Zkuste to prosím znovu.");
      }
   });

   closeBtn.addEventListener("click", function () {
      popup.hidden = true;
      window.location.href = "index.html";
   });
});
