import { getHeaderAndFooter } from "./import.js";
import { DraggablePopup } from './popup.js';
import { HandleExpenses } from './expensesFunction.js';
import { ExcelService } from './excelService.js';
import toast from "./toast.js";

// Istanza globale del servizio API
const expensesService = new HandleExpenses();

// Istanze globali inizializzate a null
let createPopup = null;
let updatePopup = null;
let deletePopup = null;
let popupIdx = [];

// Funzione semplificata
function getPopupInstance(popupId) {
    switch (popupId) {
        case 'createPopup':
            if (!createPopup) {
                createPopup = new DraggablePopup('createPopup');
                popupIdx.push(createPopup);
                console.log('Creata istanza createPopup');
            }
            return createPopup;
            
        case 'updatePopup':
            if (!updatePopup) {
                updatePopup = new DraggablePopup('updatePopup');
                popupIdx.push(updatePopup);
                console.log('Creata istanza updatePopup');
            }
            return updatePopup;
            
        case 'deletePopup':
            if (!deletePopup) {
                deletePopup = new DraggablePopup('deletePopup');
                popupIdx.push(deletePopup);
                console.log('Creata istanza deletePopup');
            }
            return deletePopup;
            
        default:
            console.error(`Popup ID non valido: ${popupId}`);
            return null;
    }
}

// Funzione per pulire completamente il popup se necessario
function resetPopupInstance() {
    if (popupIdx.length > 0) {
        popupIdx.forEach(popup => {
            if (popup) {
                popup.destroy();
                popup = null;
                console.log('Istanza del popup distrutta');
            }
        });
    }
}

// Funzioni AJAX per le chiamate HTTP
async function fetchRecords() {
    try {
        const response = await expensesService.getListByUser();
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
                <button class="btn edit-btn" data-id="${record._id}">✏️ Modifica</button>
                <button class="btn delete-btn" data-id="${record._id}">🗑️ Elimina</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Funzione per aprire il popup per aggiungere un nuovo record
function openCreatePopup() {
    console.log('Apertura del popup per aggiungere un nuovo record');
    
    // Usa l'istanza globale, creandola solo se non esiste
    const popup = getPopupInstance("createPopup");

    // Reset del form prima di configurare
    popup.resetForm();

    // Configura il popup per l'aggiunta
    popup.show({
        title: 'Aggiungi Record',
        saveBtnText: 'Salva',
        onSave: async () => {
            await saveNewRecord();
        },
        onError: (error) => {
            console.error('Errore durante il salvataggio:', error);
            toast.error(`${error.message}`);
        }
    });
}

// Funzione separata per salvare un nuovo record
async function saveNewRecord() {
    try {
        toast.info('Salvataggio in corso...');
        
        // Raccogli i dati dal form
        const formData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            amount: parseFloat(document.getElementById('amount').value),
            type: document.getElementById('type-select').value,
            date: document.getElementById('date').value
        };

        if (!formData.title || !formData.amount || !formData.date) {
            throw new Error('I campi Titolo, Valore e Data sono obbligatori');
        }

        const body = { 
            name: formData.title, 
            amount: formData.amount, 
            description: formData.description || "", 
            date: formData.date , 
            type: formData.type
        };

        const response = await expensesService.addExpense(body)
        if (!response.success) {
            throw new Error(`Errore nell'inserimento del dato: ${response.message}`);
        }
    } catch (error) {
        throw error; // Rilancia per gestione in onError
    }
}

// Funzione per aprire il popup per modificare un record
function openEditPopup(recordId) {
    console.log('Apertura del popup per modificare record:', recordId);
    
    // Usa la stessa istanza globale
    const popup = getPopupInstance("updatePopup");

    // Configura il popup per la modifica
    popup.show({
        title: 'Modifica Record',
        saveBtnText: 'Aggiorna',
        onSave: async () => {
            await updateRecord(recordId);
        },
        onError: (error) => {
            console.error('Errore durante l\'aggiornamento:', error);
            toast.error(`Errore: ${error.message}`);
        }
    });
    
    // Carica i dati del record nel form
    loadRecordData(recordId);
}

// Funzione per caricare i dati di un record nel form (per la modifica)
async function loadRecordData(recordId) {
    try {
        const response = await expensesService.getExpenseById(recordId);
        if (!response.ok) {
            throw new Error(response.message);
        }
        const recordData = await response.json();
        
        // Popola il form con i dati del record
        document.getElementById('title').value = recordData.title || '';
        document.getElementById('description').value = recordData.description || '';
        document.getElementById('amount').value = recordData.amount || '';
        document.getElementById('type-select').value = recordData.type || '';
        document.getElementById('date').value = recordData.date || '';
        
    } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        toast.error('Errore nel caricamento dei dati del record');
    }
}

// Funzione per aggiornare un record esistente
async function updateRecord(recordId) {
    try {
        toast.info('Aggiornamento in corso...');
        
        // Raccogli i dati dal form
        const formData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            amount: parseFloat(document.getElementById('amount').value),
            type: document.getElementById('type-select').value,
            date: document.getElementById('date').value
        };
        
        // Validazione base
        if (!formData.title || !formData.amount || !formData.date) {
            throw new Error('Tutti i campi sono obbligatori');
        }

        const body = { 
            name: formData.title, 
            amount: formData.amount, 
            description: formData.description || "", 
            date: formData.date, 
            type: formData.type
        };
        
        const response = await expensesService.updateExpenseById(recordId, body);
        if (!response.ok) {
            throw new Error(response.message);
        }
        toast.success('Record aggiornato con successo!');
        
        // Ricarica i dati nella tabella
        await loadData();
        
    } catch (error) {
        throw error; // Rilancia per gestione in onError
    }
}

// Event delegation per gestire i click sui bottoni di modifica e cancellazione
function setupTableEventListeners() {
    const tableBody = document.querySelector(".styled-table tbody");
    
    if (tableBody) {
        tableBody.addEventListener('click', (e) => {
            const recordId = e.target.dataset.id;
            console.log('Evento click su:', e.target, 'ID record:', recordId);
            
            if (e.target.classList.contains('edit-btn') && recordId) {
                openEditPopup(recordId);
            } else if (e.target.classList.contains('delete-btn') && recordId) {
                deleteRecord(recordId);
            }
        });
    }
}

// Funzione per eliminare un record
async function deleteRecord(recordId) {
    console.log('Conferma per eliminazione record:', recordId);
    
    // Usa la stessa istanza globale
    const popup = getPopupInstance("deletePopup");

    // Configura il popup per la modifica
    popup.show({
        title: 'Elimina Record',
        saveBtnText: 'Elimina',
        onSave: async () => {
            try {
                toast.info('Eliminazione in corso...');
                
                const response = await expensesService.deleteExpenseById(recordId);
                if (!response.ok) {
                    throw new Error(response.message);
                }
                
                toast.success('Record eliminato con successo!');
                
                // Ricarica i dati nella tabella
                await loadData();
        
            } catch (error) {
                toast.error(`Errore nell'eliminazione: ${error.message}`);
            }
        },
        onError: (error) => {
            console.error('Errore durante l\'aggiornamento:', error);
            toast.error(`Errore: ${error.message}`);
        }
    });
}

// Funzione per caricare i dati
async function loadData() {
    const records = await fetchRecords();
    populateTable(records);
}

// ===== FUNZIONALITÀ EXCEL =====

// Inizializza le funzionalità Excel
function initializeExcelFeatures() {
    const exportBtn = document.getElementById('export-excel');
    const importBtn = document.getElementById('import-excel');
    const templateBtn = document.getElementById('download-template');
    const fileInput = document.getElementById('excel-file-input');

    if (!exportBtn || !importBtn || !fileInput) {
        console.error('Bottoni Excel non trovati nel DOM');
        return;
    }

    // Export Excel
    exportBtn.addEventListener('click', async () => {
        try {
            toast.info('Esportazione in corso...');
            const data = await fetchRecords();
            
            if (data.length === 0) {
                toast.warning('Nessun dato da esportare');
                return;
            }
            
            ExcelService.exportToExcel(data, 'spese');
            toast.success('File Excel esportato con successo!');
            
        } catch (error) {
            console.error('Errore durante l\'esportazione:', error);
            toast.error('Errore durante l\'esportazione del file');
        }
    });

    // Template Excel
    if (templateBtn) {
        templateBtn.addEventListener('click', () => {
            try {
                ExcelService.generateTemplate();
                toast.success('Template Excel scaricato con successo!');
            } catch (error) {
                console.error('Errore durante il download del template:', error);
                toast.error('Errore durante il download del template');
            }
        });
    }

    // Import Excel - apri file dialog
    importBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // Gestisci file selezionato
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            toast.info('Importazione in corso...');
            
            const importedData = await ExcelService.importFromExcel(file);
            
            if (importedData.length === 0) {
                toast.warning('Nessun dato trovato nel file');
                return;
            }

            // Valida i dati
            const validation = ExcelService.validateImportData(importedData);
            
            if (validation.invalid.length > 0) {
                showValidationErrors(validation.invalid);
            }
            
            if (validation.valid.length > 0) {
                await importValidData(validation.valid);
            }
            
        } catch (error) {
            console.error('Errore durante l\'importazione:', error);
            toast.error('Errore durante l\'importazione del file');
        } finally {
            // Reset input
            fileInput.value = '';
        }
    });
}

// Funzione per importare i dati validi
async function importValidData(validData) {
    try {
        let successCount = 0;
        let errorCount = 0;
        
        toast.info(`Importazione di ${validData.length} record in corso...`);
        
        for (let item of validData) {
            try {
                await expensesService.addExpense(item);
                successCount++;
            } catch (error) {
                errorCount++;
                console.error('Errore nell\'importazione del record:', error);
            }
        }
        
        if (successCount > 0) {
            toast.success(`${successCount} record importati con successo!`);
            await loadData(); // Ricarica la tabella
        }
        
        if (errorCount > 0) {
            toast.warning(`${errorCount} record non sono stati importati`);
        }
        
    } catch (error) {
        console.error('Errore durante l\'importazione:', error);
        toast.error('Errore durante l\'importazione dei dati');
    }
}

// Funzione per mostrare errori di validazione
function showValidationErrors(invalidData) {
    // const popup = getPopupInstance('createPopup');
    
    // let errorHtml = '<div class="validation-errors">';
    // errorHtml += '<h4>Errori di validazione trovati:</h4>';
    
    // invalidData.forEach(item => {
    //     errorHtml += `<div class="error-item">`;
    //     errorHtml += `<strong>Riga ${item.row}:</strong> ${item.errors.join(', ')}`;
    //     errorHtml += `</div>`;
    // });
    
    // errorHtml += '</div>';
    // errorHtml += '<p>I record validi sono stati importati correttamente.</p>';
    
    // popup.show({
    //     title: 'Errori di Validazione',
    //     saveBtnText: 'Chiudi',
    //     onSave: () => {
    //         // Non fare nulla, il popup si chiude automaticamente
    //     }
    // });
    
    // // Sostituisci il contenuto del popup con gli errori
    // const contentArea = popup.popup.querySelector('.popup-content');
    // contentArea.innerHTML = errorHtml + `
    //     <div class="form-actions">
    //         <button type="button" class="btn confirm-btn">Chiudi</button>
    //     </div>
    // `;
}

// ===== FINE FUNZIONALITÀ EXCEL =====

// Inizializzazione dell'applicazione
async function init() {
    // Carica header e footer
    getHeaderAndFooter();
    
    // Carica i dati dalla API
    await loadData();

    // Aggiungi evento per il pulsante "Aggiungi Record"
    const addRecordBtn = document.querySelector('.add-btn');
    if (addRecordBtn) {
        addRecordBtn.removeEventListener('click', openCreatePopup); // Rimuovi eventuali listener esistenti
        addRecordBtn.addEventListener('click', openCreatePopup);
    } 
    else console.error('Pulsante "Aggiungi Record" non trovato.');
    
    // Configura event listeners per la tabella
    setupTableEventListeners();
    
    // Inizializza funzionalità Excel
    initializeExcelFeatures();
}

// Avvia l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', init);

// Pulizia quando la pagina viene chiusa o navigata
window.addEventListener('beforeunload', () => {
    resetPopupInstance();
});