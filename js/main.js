import { getHeaderAndFooter } from "./import.js";
import { DraggablePopup } from './popup.js';
import { getListByUser } from './expensesFunction.js';
import toast from "./toast.js";

// Funzioni AJAX per le chiamate HTTP
async function fetchRecords() {
    try {
        const response = await getListByUser();
        if (!response.success) {
            toast.error("Errore nel recupero dei dati: " + response.message);
            throw new Error(`HTTP error! status: ${response.success}`);
        }
        return response.data;
    } catch (error) {
        console.error('Errore nel fetch dei record:', error);
        return [];
    }
}

// Funzione per popolare la tabella
function populateTable(records) {
    const tableBody = document.querySelector(".styled-table tbody");
    tableBody.innerHTML = ''; // Pulisce la tabella
    
    records.forEach(record => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${record.name}</td>
            <td>${record.amount.toFixed(2)}</td>
            <td>${new Date(record.date).toLocaleDateString()}</td>
            <td>
                <button class="btn edit-btn" data-id="${record._id}">Modifica</button>
                <button class="btn delete-btn" data-id="${record._id}">Cancella</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Funzione per aprire il popup per aggiungere un nuovo record
function openPopup() {
    console.log('Apertura del popup per aggiungere un nuovo record');
    const popup = new DraggablePopup('registerPopup');

    // Apri il popup
    popup.open();
}

// Funzione per salvati i dati e chiudere il popup

// Funzione per caricare i dati
async function loadData() {
    const records = await fetchRecords();
    populateTable(records);
}

// Inizializzazione dell'applicazione
async function init() {
    // Carica header e footer
    getHeaderAndFooter();
    
    // Carica i dati dalla API
    await loadData();

    // Aggiungi evento per il pulsante "Aggiungi Record"
    const addRecordBtn = document.querySelector('.add-btn');
    if (addRecordBtn) addRecordBtn.addEventListener('click', openPopup);
    else console.error('Pulsante "Aggiungi Record" non trovato.');
    
}

// Avvia l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', init);