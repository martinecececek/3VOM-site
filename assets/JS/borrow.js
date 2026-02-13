const tableBody = document.getElementById("borrowTableBody");
if (!tableBody) {
   console.error("borrowTableBody not found");
} else {
   // --- get saved personId from login ---
   const PERSON_ID_KEY = "personId";
   const savedPersonIdRaw =
      localStorage.getItem(PERSON_ID_KEY) ??
      sessionStorage.getItem(PERSON_ID_KEY);

   const savedPersonId = savedPersonIdRaw ? Number(savedPersonIdRaw) : null;

   if (!savedPersonId || Number.isNaN(savedPersonId)) {
      tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="padding: 12px; color: var(--muted);">
          Nejste přihlášen / chybí ID uživatele.<br>
          <small>Vraťte se prosím na přihlášení.</small>
        </td>
      </tr>
    `;
      // Optional: redirect to login page instead of showing message
      // window.location.href = "login.html";
   } else {
      const jsonUrl = new URL("../../src/data/items.json", import.meta.url);

      console.log("borrow.js:", import.meta.url);
      console.log("Fetching JSON:", jsonUrl.href);

      fetch(jsonUrl, { cache: "no-store" })
         .then((response) => {
            if (!response.ok) {
               throw new Error(
                  `Cannot load items.json (HTTP ${response.status}) from ${jsonUrl.href}`,
               );
            }
            return response.json();
         })
         .then((data) => renderPersonById(data, savedPersonId))
         .catch((error) => {
            console.error("Error loading JSON:", error);
            tableBody.innerHTML = `
          <tr>
            <td colspan="4" style="padding: 12px; color: var(--muted);">
              Nepodařilo se načíst data.<br>
              <small>${String(error.message)}</small>
            </td>
          </tr>
        `;
         });
   }
}

function renderPersonById(data, personId) {
   tableBody.innerHTML = "";

   if (!data || !Array.isArray(data.people)) {
      throw new Error("items.json must have a 'people' array");
   }

   const person = data.people.find((p) => Number(p.id) === Number(personId));

   if (!person) {
      tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="padding: 12px; color: var(--muted);">
          Uživatel s ID <strong>${personId}</strong> nebyl nalezen.<br>
          <small>Zkuste se odhlásit a přihlásit znovu.</small>
        </td>
      </tr>
    `;
      return;
   }

   const initials =
      (person.name?.charAt(0) || "?") + (person.surname?.charAt(0) || "?");

   const personRow = document.createElement("tr");
   personRow.className = "person-row";
   personRow.dataset.personId = person.id;

   personRow.innerHTML = `
    <td colspan="4">
      <div class="person-name">
        <span class="person-badge">${initials}</span>
        ${person.name || ""} ${person.surname || ""}
      </div>
    </td>
  `;

   tableBody.appendChild(personRow);

   if (!person.borrowed_items || person.borrowed_items.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = `
      <td colspan="3">
        <span class="borrow-empty">Nothing borrowed</span>
      </td>
      <td class="tom-num">—</td>
    `;
      tableBody.appendChild(emptyRow);
      return;
   }

   person.borrowed_items.forEach((item) => {
      const itemRow = document.createElement("tr");
      itemRow.className = "item-row";
      itemRow.dataset.personId = person.id;
      itemRow.dataset.itemId = item.id;

      itemRow.innerHTML = `
      <td>${item.category || ""}</td>
      <td>${item.description || ""}</td>
      <td>${item.itemNumber || ""}</td>
      <td class="tom-num">${item.date || ""}</td>
    `;

      tableBody.appendChild(itemRow);
   });
}
