// ==============================
// INIT — LOAD ITEMS
// ==============================
const tbody = document.getElementById("borrowAdminBody");

if (!tbody) {
   console.error('Missing <tbody id="borrowAdminBody">');
} else {
   fetch("../src/data/items.json", { cache: "no-store" })
      .then((r) => {
         if (!r.ok) throw new Error(`HTTP ${r.status}`);
         return r.json();
      })
      .then((data) => renderAdmin(data))
      .catch((err) => console.error("Error loading items.json:", err));
}

// ==============================
// RENDER TABLE
// ==============================
function renderAdmin(data) {
   tbody.innerHTML = "";

   (data.people || []).forEach((person) => {
      const userId = person.id;
      const fullName = `${person.name ?? ""} ${person.surname ?? ""}`.trim();
      const initials =
         ((person.name || "?")[0] || "?") + ((person.surname || "?")[0] || "?");

      // PERSON HEADER
      const header = document.createElement("tr");
      header.className = "person-row";
      header.dataset.userId = userId;

      header.innerHTML = `
      <td colspan="5">
        <div class="person-name">
          <span class="person-badge">${escapeHtml(initials)}</span>
          ${escapeHtml(fullName)}

          <button type="button"
                  class="admin-btn add-item-btn"
                  data-user-id="${escapeAttr(userId)}">
            + Add item
          </button>
        </div>
      </td>
    `;
      tbody.appendChild(header);

      const items = person.borrowed_items || [];

      // EMPTY STATE
      if (items.length === 0) {
         const empty = document.createElement("tr");
         empty.className = "empty-row";
         empty.dataset.userId = userId;

         empty.innerHTML = `
        <td colspan="4"><span class="borrow-empty">Nothing borrowed</span></td>
        <td></td>
      `;
         tbody.appendChild(empty);
         return;
      }

      // ITEM ROWS
      items.forEach((item) => {
         tbody.appendChild(buildItemRow(userId, item));
      });
   });
}

// ==============================
// ITEM ROW
// ==============================
function buildItemRow(userId, item) {
   const tr = document.createElement("tr");
   tr.className = "item-row";
   tr.dataset.userId = userId;
   tr.dataset.borrowId = item.id;

   tr.innerHTML = `
    <td>
      <div class="borrow-items">
        <span class="borrow-pill">
          <span class="dot"></span> ${escapeHtml(item.category ?? "")}
        </span>
      </div>
    </td>
    <td>${escapeHtml(item.description ?? "")}</td>
    <td>${escapeHtml(item.itemNumber ?? "")}</td>
    <td class="tom-num">${escapeHtml(item.date ?? "")}</td>
    <td>
      <button class="admin-btn danger remove-item-btn">Remove</button>
    </td>
  `;
   return tr;
}

// ==============================
// BUTTON EVENTS (ONLY UI)
// ==============================
tbody.addEventListener("click", (e) => {
   const t = e.target;

   // ADD BUTTON → show editor row
   if (t.classList.contains("add-item-btn")) {
      insertEditorRow(t.dataset.userId, t.closest("tr"));
      return;
   }

   // CANCEL editor
   if (t.classList.contains("cancel-btn")) {
      t.closest("tr")?.remove();
      return;
   }
});

// ==============================
// INSERT EDITOR ROW (UI ONLY)
// ==============================
function insertEditorRow(userId, personHeaderRow) {
   if (!personHeaderRow) return;

   const next = personHeaderRow.nextElementSibling;
   if (next && next.classList.contains("editor-row")) return;

   const tr = document.createElement("tr");
   tr.className = "editor-row";
   tr.dataset.userId = userId;

   tr.innerHTML = `
    <td colspan="5">
      <div class="editor-grid">

        <select class="edit-category">
          <option value="">Kategorie</option>
          <option value="Pádlo">Pádlo</option>
          <option value="Vesta">Vesta</option>
          <option value="Helma">Helma</option>
          <option value="Pádlo jiné">Pádlo jiné</option>
          <option value="Loďák/Batoh">Loďák/Batoh</option>
          <option value="Běžky">Běžky</option>
          <option value="Hůlky">Hůlky</option>
          <option value="Běžecké boty">Běžecké boty</option>
          <option value="Ostatní">Ostatní</option>
        </select>

        <input class="edit-desc" type="text" placeholder="Description" />
        <input class="edit-itemnum" type="text" placeholder="Item Number" />
        <input class="edit-date" type="date" />

        <div class="editor-actions">
          <button class="admin-btn save-btn">Save</button>
          <button class="admin-btn danger cancel-btn">Cancel</button>
        </div>

      </div>
    </td>
  `;

   personHeaderRow.parentNode.insertBefore(tr, personHeaderRow.nextSibling);

   tr.querySelector(".edit-desc")?.focus();
}

// ==============================
// HELPERS
// ==============================
function escapeHtml(v) {
   return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
}

function escapeAttr(v) {
   return String(v ?? "").replaceAll('"', "&quot;");
}
