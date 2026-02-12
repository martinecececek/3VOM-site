// ==============================
// CONFIG (EDIT ONLY HERE)
// ==============================
const CONFIG = {
   WORKER_URL: "https://add-borrow-json.martin-jakubuv.workers.dev",
   ADMIN_KEY: "PUT_YOUR_ADMIN_KEY_HERE",

   // set to true only if you already implemented DELETE in the worker
   ENABLE_REMOTE_DELETE: false,
};

// ==============================
// INIT
// ==============================
const tbody = document.getElementById("borrowAdminBody");

if (!tbody) {
   console.error('admin.js: Missing <tbody id="borrowAdminBody"> in HTML.');
} else {
   fetch("../data/items.json")
      .then((r) => r.json())
      .then((data) => renderAdmin(data))
      .catch((err) => console.error("Error loading items.json:", err));
}

// ==============================
// RENDER
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

      // ITEMS
      items.forEach((item) => {
         tbody.appendChild(buildItemRow(userId, item));
      });
   });
}

function buildItemRow(userId, item) {
   const tr = document.createElement("tr");
   tr.className = "item-row";

   // hidden values
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
      <button type="button"
              class="admin-btn danger remove-item-btn"
              data-user-id="${escapeAttr(userId)}"
              data-borrow-id="${escapeAttr(item.id)}">
        Remove
      </button>
    </td>
  `;
   return tr;
}

// ==============================
// EVENTS (delegation)
// ==============================
tbody.addEventListener("click", async (e) => {
   const t = e.target;

   // ADD editor row
   if (t.classList.contains("add-item-btn")) {
      insertEditorRow(t.dataset.userId, t.closest("tr"));
      return;
   }

   // CANCEL editor
   if (t.classList.contains("cancel-btn")) {
      t.closest("tr")?.remove();
      return;
   }

   // SAVE -> worker
   if (t.classList.contains("save-btn")) {
      await handleSave(t);
      return;
   }

   // REMOVE (local remove, optional remote delete)
   if (t.classList.contains("remove-item-btn")) {
      await handleRemove(t);
      return;
   }
});

// ==============================
// SAVE -> CALL WORKER
// ==============================
async function handleSave(btn) {
   const editorRow = btn.closest("tr");
   const userId = editorRow.dataset.userId;

   const category = editorRow.querySelector(".edit-category")?.value || "";
   const desc = (editorRow.querySelector(".edit-desc")?.value || "").trim();
   const itemNum = (
      editorRow.querySelector(".edit-itemnum")?.value || ""
   ).trim();
   const date = editorRow.querySelector(".edit-date")?.value || "";

   if (!category || !desc || !itemNum || !date) {
      alert("Please fill all fields.");
      return;
   }

   if (!CONFIG.ADMIN_KEY) {
      alert("ADMIN_KEY not set in CONFIG.");
      return;
   }

   btn.disabled = true;
   const oldText = btn.textContent;
   btn.textContent = "Saving...";

   try {
      const res = await fetch(
         `${CONFIG.WORKER_URL}/api/members/${encodeURIComponent(userId)}/borrow`,
         {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               "X-Admin-Key": CONFIG.ADMIN_KEY,
            },
            body: JSON.stringify({
               category,
               description: desc,
               itemNumber: itemNum,
               date,
            }),
         },
      );

      const out = await res.json().catch(() => ({}));

      if (!res.ok) {
         console.error("Worker error:", out);
         alert(out?.error || "Save failed.");
         return;
      }

      const created = out.created;
      if (!created || created.id == null) {
         console.error("Invalid worker response:", out);
         alert("Save failed (invalid response).");
         return;
      }

      removeEmptyRowForUser(userId);

      const newRow = buildItemRow(userId, created);
      editorRow.parentNode.insertBefore(newRow, editorRow.nextSibling);
      editorRow.remove();
   } catch (err) {
      console.error(err);
      alert("Network error.");
   } finally {
      if (document.body.contains(btn)) {
         btn.disabled = false;
         btn.textContent = oldText;
      }
   }
}

// ==============================
// REMOVE (UI now) + optional Worker delete later
// ==============================
async function handleRemove(btn) {
   const userId = btn.dataset.userId;
   const borrowId = btn.dataset.borrowId;

   if (!confirm("Remove this borrowed item?")) return;

   // remove row from UI instantly
   btn.closest("tr")?.remove();
   ensureEmptyState(userId);

   // OPTIONAL: call worker delete if you add it later
   if (!CONFIG.ENABLE_REMOTE_DELETE) return;

   try {
      const res = await fetch(
         `${CONFIG.WORKER_URL}/api/members/${encodeURIComponent(userId)}/borrow/${encodeURIComponent(borrowId)}`,
         {
            method: "DELETE",
            headers: { "X-Admin-Key": CONFIG.ADMIN_KEY },
         },
      );

      if (!res.ok) {
         const out = await res.json().catch(() => ({}));
         console.error("Delete failed:", out);
         alert(out?.error || "Delete failed on server.");
      }
   } catch (err) {
      console.error(err);
      alert("Network error during delete.");
   }
}

// ==============================
// EDITOR ROW
// ==============================
function insertEditorRow(userId, personHeaderRow) {
   if (!personHeaderRow) return;

   // prevent multiple editor rows under same person
   const next = personHeaderRow.nextElementSibling;
   if (next && next.classList.contains("editor-row")) return;

   removeEmptyRowForUser(userId);

   const tr = document.createElement("tr");
   tr.className = "editor-row";
   tr.dataset.userId = userId;

   tr.innerHTML = `
    <td colspan="5">
      <div class="editor-grid">

        <div class="ui-select is-empty" data-name="category">
          <button type="button" class="ui-select__btn" aria-haspopup="listbox" aria-expanded="false">
            <span class="ui-select__value" data-placeholder="Category">Category</span>
            <span class="ui-select__chev" aria-hidden="true"></span>
          </button>

          <div class="ui-select__menu" role="listbox" tabindex="-1">
            <div class="ui-select__option" role="option" data-value="Book">Book</div>
            <div class="ui-select__option" role="option" data-value="Equipment">Equipment</div>
            <div class="ui-select__option" role="option" data-value="Other">Other</div>
          </div>

          <input type="hidden" class="edit-category" value="">
        </div>

        <input class="edit-desc" type="text" placeholder="Description" />
        <input class="edit-itemnum" type="text" placeholder="Item Number" />
        <input class="edit-date" type="date" />

        <div class="editor-actions">
          <button type="button" class="admin-btn save-btn">Save</button>
          <button type="button" class="admin-btn danger cancel-btn">Cancel</button>
        </div>

      </div>
    </td>
  `;

   personHeaderRow.parentNode.insertBefore(tr, personHeaderRow.nextSibling);

   initUISelect(tr);
   tr.querySelector(".edit-desc")?.focus();
}

// ==============================
// CUSTOM UI SELECT (Category)
// ==============================
function initUISelect(root = document) {
   root.querySelectorAll(".ui-select").forEach((select) => {
      if (select.dataset.bound === "1") return;
      select.dataset.bound = "1";

      const btn = select.querySelector(".ui-select__btn");
      const menu = select.querySelector(".ui-select__menu");
      const valueEl = select.querySelector(".ui-select__value");
      const hidden = select.querySelector(".edit-category");
      const options = Array.from(select.querySelectorAll(".ui-select__option"));

      function open() {
         closeAllUISelects(select);
         select.classList.add("is-open");
         btn.setAttribute("aria-expanded", "true");

         const selected = options.find((o) => o.dataset.value === hidden.value);
         setActive(selected || options[0]);
         menu.focus();
      }

      function close() {
         select.classList.remove("is-open");
         btn.setAttribute("aria-expanded", "false");
         clearActive();
      }

      function clearActive() {
         options.forEach((o) => o.classList.remove("is-active"));
      }

      function setActive(opt) {
         clearActive();
         if (!opt) return;
         opt.classList.add("is-active");
         opt.scrollIntoView({ block: "nearest" });
      }

      function choose(opt) {
         const val = opt.dataset.value;

         hidden.value = val;
         valueEl.textContent = val;
         select.classList.remove("is-empty");

         options.forEach((o) => {
            o.classList.toggle("is-selected", o === opt);
         });

         close();
         btn.focus();
      }

      btn.addEventListener("click", () => {
         select.classList.contains("is-open") ? close() : open();
      });

      options.forEach((opt) =>
         opt.addEventListener("click", () => choose(opt)),
      );

      select.addEventListener("keydown", (e) => {
         const isOpen = select.classList.contains("is-open");

         if (!isOpen) {
            if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
               e.preventDefault();
               open();
            }
            return;
         }

         const activeIndex = options.findIndex((o) =>
            o.classList.contains("is-active"),
         );

         if (e.key === "Escape") {
            e.preventDefault();
            close();
            btn.focus();
         }
         if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive(options[Math.min(activeIndex + 1, options.length - 1)]);
         }
         if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive(options[Math.max(activeIndex - 1, 0)]);
         }
         if (e.key === "Enter") {
            e.preventDefault();
            const active = options[activeIndex];
            if (active) choose(active);
         }
      });

      if (!document.documentElement.dataset.uiSelectGlobal) {
         document.documentElement.dataset.uiSelectGlobal = "1";
         document.addEventListener("click", (e) => {
            document.querySelectorAll(".ui-select.is-open").forEach((s) => {
               if (!s.contains(e.target)) {
                  s.classList.remove("is-open");
                  const b = s.querySelector(".ui-select__btn");
                  if (b) b.setAttribute("aria-expanded", "false");
                  s.querySelectorAll(".ui-select__option").forEach((o) =>
                     o.classList.remove("is-active"),
                  );
               }
            });
         });
      }
   });
}

function closeAllUISelects(except) {
   document.querySelectorAll(".ui-select.is-open").forEach((s) => {
      if (s !== except) {
         s.classList.remove("is-open");
         const b = s.querySelector(".ui-select__btn");
         if (b) b.setAttribute("aria-expanded", "false");
         s.querySelectorAll(".ui-select__option").forEach((o) =>
            o.classList.remove("is-active"),
         );
      }
   });
}

// ==============================
// EMPTY STATE helpers
// ==============================
function removeEmptyRowForUser(userId) {
   const empty = tbody.querySelector(
      `.empty-row[data-user-id="${cssEscape(String(userId))}"]`,
   );
   if (empty) empty.remove();
}

function ensureEmptyState(userId) {
   const header = tbody.querySelector(
      `.person-row[data-user-id="${cssEscape(String(userId))}"]`,
   );
   if (!header) return;

   let hasItem = false;
   let node = header.nextElementSibling;

   while (node && !node.classList.contains("person-row")) {
      if (
         node.classList.contains("item-row") &&
         node.dataset.userId === String(userId)
      ) {
         hasItem = true;
         break;
      }
      node = node.nextElementSibling;
   }

   if (!hasItem) {
      removeEmptyRowForUser(userId);

      const empty = document.createElement("tr");
      empty.className = "empty-row";
      empty.dataset.userId = userId;
      empty.innerHTML = `
      <td colspan="4"><span class="borrow-empty">Nothing borrowed</span></td>
      <td></td>
    `;

      const after = header.nextElementSibling;
      if (after && after.classList.contains("editor-row")) {
         tbody.insertBefore(empty, after.nextElementSibling);
      } else {
         tbody.insertBefore(empty, after);
      }
   }
}

// ==============================
// Escaping helpers
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

function cssEscape(v) {
   return String(v).replaceAll('"', '\\"');
}
