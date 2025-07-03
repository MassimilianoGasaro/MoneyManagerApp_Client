import { getList } from "./function.js";
// per caricare header e footer in modo dinamico
Promise.all([
    fetch("../header.html").then(res => res.text()),
    fetch("../footer.html").then(res => res.text())
  ])
    .then(([headerData, footerData]) => {
      document.getElementById("header").innerHTML = headerData;
      document.getElementById("footer").innerHTML = footerData;
    })
    .catch(error => console.error("Errore durante il fetch:", error));

getList().forEach(record => {
    const tableBody = document.querySelector(".styled-table tbody");
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${record.descrizione}</td>
        <td>${record.valore.toFixed(2)}</td>
        <td>${new Date(record.data).toLocaleDateString()}</td>
        <td>
            <button class="btn edit-btn">Modifica</button>
            <button class="btn delete-btn">Cancella</button>
        </td>
    `;
    tableBody.appendChild(row);
});

