(function() {
   // Wrap in IIFE to avoid global scope conflicts
   const ADD_ITEM_WORKER_URL = "https://add-borrow-json.martin-jakubuv.workers.dev";
   const ADMIN_KEY = "bHKJKHJKJHG6Jadpiadasd14a6s5d15691ASDADASD541a5sd1a651d3a1sd65198451ASDASASDASDASDDa16jh5gk4h665161K";

   const tbody = document.getElementById("borrowAdminBody");

   if (tbody) {
      tbody.addEventListener("click", async (e) => {
         const saveBtn = e.target.closest(".save-btn");
         if (!saveBtn) return;

         const editorRow = saveBtn.closest(".editor-row");
         if (!editorRow) return;

         const userId = editorRow.dataset.userId;

         // Get form values
         const category = editorRow.querySelector(".edit-category")?.value?.trim();
         const description = editorRow.querySelector(".edit-desc")?.value?.trim();
         const itemNumber = editorRow.querySelector(".edit-itemnum")?.value?.trim();
         const date = editorRow.querySelector(".edit-date")?.value?.trim();

         // Validation
         if (!category) {
            alert("Vyber prosím kategorii.");
            return;
         }
         if (!description) {
            alert("Vyplň prosím popis.");
            return;
         }

         // Disable button during request
         saveBtn.disabled = true;
         saveBtn.textContent = "Ukládám...";

         const payload = {
            userId: userId,
            item: {
               category: category,
               description: description,
               itemNumber: itemNumber || "",
               date: date || new Date().toISOString().split('T')[0],
            }
         };

         try {
            const res = await fetch(ADD_ITEM_WORKER_URL, {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
                  "x-admin-key": ADMIN_KEY,
               },
               body: JSON.stringify(payload),
            });

            if (!res.ok) {
               const text = await res.text();
               alert(`Chyba při přidávání (${res.status}): ${text}`);
               return;
            }

            const data = await res.json();

            if (data.ok) {
               // Success - reload the page or update UI
               alert("Položka úspěšně přidána ✅");
               location.reload(); // Reload to show updated data
            } else {
               alert(`Chyba: ${data.error || "Neznámá chyba"}`);
            }

         } catch (err) {
            alert(`Chyba při ukládání: ${err.message}`);
            console.error("Add item error:", err);
         } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = "Save";
         }
      });
   }
})();
