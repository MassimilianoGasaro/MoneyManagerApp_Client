export function getList() {
    return [
        {
            id: 1,
            descrizione: "Spesa mensile",
            valore: 150.00,
            data: "2023-10-01"
        },
        {
            id: 2,
            descrizione: "Stipendio",
            valore: 2000.00,
            data: "2023-10-05"
        },
        {
            id: 3,
            descrizione: "Affitto",
            valore: 800.00,
            data: "2023-10-10"
        }
    ];

    // document.addEventListener("DOMContentLoaded", () => {
    //     const tableBody = document.querySelector(".styled-table tbody");
      
    //     // Funzione per ottenere i dati dal backend
    //     fetch("http://localhost:3000/api/records")
    //       .then(response => response.json())
    //       .then(data => {
    //         // Popola la tabella con i dati ricevuti
    //         data.forEach(record => {
    //           const row = document.createElement("tr");
    //           row.innerHTML = `
    //             <td>${record.descrizione}</td>
    //             <td>${record.valore}</td>
    //             <td>${record.data}</td>
    //             <td>
    //               <button class="btn edit-btn">Modifica</button>
    //               <button class="btn delete-btn">Cancella</button>
    //             </td>
    //           `;
    //           tableBody.appendChild(row);
    //         });
    //       })
    //       .catch(error => console.error("Errore durante il fetch:", error));
    //   });
}
