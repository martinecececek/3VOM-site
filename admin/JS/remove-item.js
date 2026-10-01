(function () {
   // Wrap in IIFE to avoid global scope conflicts
   const REMOVE_ITEM_WORKER_URL =
      "https://remove-borrow.martin-jakubuv.workers.dev";
   const ADMIN_KEY = sessionStorage.getItem("ADMIN_KEY");

   const tbody = document.getElementById("borrowAdminBody");

   if (tbody) {
      tbody.addEventListener("click", async (e) => {
         const removeBtn = e.target.closest(".remove-item-btn");
         if (!removeBtn) return;

         const itemRow = removeBtn.closest(".item-row");
         if (!itemRow) return;

         const userId = itemRow.dataset.userId;
         const borrowId = itemRow.dataset.borrowId;

         if (!userId || !borrowId) {
            alert("Chybí ID uživatele nebo položky.");
            return;
         }

         // Confirm deletion
         if (!confirm("Opravdu chceš odstranit tuto položku?")) {
            return;
         }

         // Disable button during request
         removeBtn.disabled = true;
         removeBtn.textContent = "Odstraňuji...";

         const payload = {
            userId: userId,
            borrowId: borrowId,
         };

         try {
            const res = await fetch(REMOVE_ITEM_WORKER_URL, {
               method: "DELETE",
               headers: {
                  "Content-Type": "application/json",
                  "x-admin-key": ADMIN_KEY,
               },
               body: JSON.stringify(payload),
            });

            if (!res.ok) {
               const text = await res.text();
               alert(`Chyba při odstraňování (${res.status}): ${text}`);
               return;
            }

            const data = await res.json();

            if (data.ok) {
               // Remove the row directly instead of reloading the page —
               // a reload can hit a briefly cached (stale) items.json on
               // GitHub Pages' CDN and show this same already-deleted row again.
               itemRow.remove();
            } else {
               alert(`Chyba: ${data.error || "Neznámá chyba"}`);
            }
         } catch (err) {
            alert(`Chyba při odstraňování: ${err.message}`);
            console.error("Remove item error:", err);
         } finally {
            removeBtn.disabled = false;
            removeBtn.textContent = "Odebrat";
         }
      });
   }
})();
