const tableBody = document.getElementById("borrowTableBody");

fetch("../../src/data/items.json")
   .then(response => response.json())
   .then(data => renderPeople(data))
   .catch(error => console.error("Error loading JSON:", error));

function renderPeople(data) {
   tableBody.innerHTML = "";

   data.people.forEach(person => {

      const initials =
         person.name.charAt(0) + person.surname.charAt(0);

      const personRow = document.createElement("tr");
      personRow.className = "person-row";
      personRow.dataset.personId = person.id;

      personRow.innerHTML = `
         <td colspan="4">
            <div class="person-name">
               <span class="person-badge">${initials}</span>
               ${person.name} ${person.surname}
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

      person.borrowed_items.forEach(item => {

         const itemRow = document.createElement("tr");
         itemRow.className = "item-row";
         itemRow.dataset.personId = person.id;
         itemRow.dataset.itemId = item.id;

         itemRow.innerHTML = `
            <td>${item.category}</td>
            <td>${item.description}</td>
            <td>${item.itemNumber}</td>
            <td class="tom-num">${item.date}</td>
         `;

         tableBody.appendChild(itemRow);
      });
   });
}
