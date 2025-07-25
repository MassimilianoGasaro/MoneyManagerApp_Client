import { getHeaderAndFooter } from "./import.js";
import { DraggablePopup } from './popup.js';
import { HandleExpenses } from './expensesFunction.js';
import { ExcelService } from './excelService.js';
import { TableManager } from './tableManager.js';
import toast from "./toast.js";
import { HandleTypologies } from "./handleTypes.js";

// Istanza globale del servizio API
const expensesService = new HandleExpenses();
// Istanza globale del servizio per le tipologie
const typologiesService = new HandleTypologies();

// Istanza globale del gestore tabella
const tableManager = new TableManager();

// Imposta il callback per aggiornare le statistiche quando i dati cambiano
tableManager.setOnDataChange(updateStatistics);

// Esponi tableManager globalmente per debug
window.tableManager = tableManager;

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

// Funzione per aggiornare le statistiche nella barra
function updateStatistics(records) {
    // Elementi della barra statistiche
    const totalRecordsEl = document.getElementById('stats-total-records');
    const totalExpensesEl = document.getElementById('stats-total-expenses');
    const totalIncomeEl = document.getElementById('stats-total-income');
    const balanceEl = document.getElementById('stats-balance');
    
    if (!totalRecordsEl || !totalExpensesEl || !totalIncomeEl || !balanceEl) {
        console.warn('Elementi della barra statistiche non trovati');
        return;
    }
    
    // Calcola le statistiche
    const totalRecords = records.length;
    let totalExpenses = 0;
    let totalIncome = 0;
    
    records.forEach(record => {
        const amount = parseFloat(record.amount) || 0;
        if (record.type === 'uscita' || record.type === 'expense') {
            totalExpenses += amount;
        } else if (record.type === 'entrata' || record.type === 'income') {
            totalIncome += amount;
        }
    });
    
    const balance = totalIncome - totalExpenses;
    
    // Aggiorna i valori con animazione
    animateValue(totalRecordsEl, totalRecords, 0, 'number');
    animateValue(totalExpensesEl, totalExpenses, 2, 'currency');
    animateValue(totalIncomeEl, totalIncome, 2, 'currency');
    animateValue(balanceEl, balance, 2, 'currency');
    
    // Aggiorna la classe del bilancio per il colore
    balanceEl.classList.remove('positive', 'negative', 'zero');
    if (balance > 0) {
        balanceEl.classList.add('positive');
    } else if (balance < 0) {
        balanceEl.classList.add('negative');
    } else {
        balanceEl.classList.add('zero');
    }
}

// Funzione per animare i valori numerici
function animateValue(element, targetValue, decimals = 0, type = 'number') {
    const currentValue = parseFloat(element.textContent.replace(/[€.,]/g, '')) || 0;
    const difference = targetValue - currentValue;
    const duration = 500; // ms
    const steps = 30;
    const stepValue = difference / steps;
    const stepTime = duration / steps;
    
    let currentStep = 0;
    
    const timer = setInterval(() => {
        currentStep++;
        const newValue = currentValue + (stepValue * currentStep);
        
        if (currentStep >= steps) {
            clearInterval(timer);
            // Assicurati che il valore finale sia esatto
            updateElementValue(element, targetValue, decimals, type);
        } else {
            updateElementValue(element, newValue, decimals, type);
        }
    }, stepTime);
}

// Funzione helper per aggiornare il valore dell'elemento
function updateElementValue(element, value, decimals, type) {
    let formattedValue;
    
    if (type === 'currency') {
        formattedValue = '€' + value.toFixed(decimals).replace('.', ',');
    } else if (type === 'number') {
        formattedValue = Math.round(value).toString();
    } else {
        formattedValue = value.toFixed(decimals);
    }
    
    element.textContent = formattedValue;
}

// Funzione per popolare la tabella
function populateTable(records) {
    // Usa il TableManager per gestire i dati (sia tabella desktop che versione mobile)
    tableManager.setData(records);
    
    // Aggiorna le statistiche
    updateStatistics(records);
}

// Funzione per aprire il popup per aggiungere un nuovo record
async function openCreatePopup() {
    console.log('Apertura del popup per aggiungere un nuovo record');

    try {
        // Chiamata per ottenere le tipologie
        const res = await getExpenseTypes();
        if (!res.success) {
            toast.error(`${res.message}`);
            return; 
        }

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

        // Popola la select delle tipologie DOPO aver mostrato il popup
        setTimeout(() => {
            populateTypeSelect('createPopup', res.data || []);
        }, 100);

    } catch (error) {
        console.error('Errore durante l\'apertura del popup:', error);
        toast.error('Errore durante il caricamento delle tipologie');
    }
}

// Funzione per aprire il popup per aggiungere una spesa (uscita)
async function openExpensePopup() {
    console.log('Apertura del popup per aggiungere una spesa');

    try {
        // Chiamata per ottenere solo le tipologie di spesa
        const res = await getExpenseTypologies();
        if (!res.success) {
            toast.error(`${res.message}`);
            return; 
        }

        // Usa l'istanza globale, creandola solo se non esiste
        const popup = getPopupInstance("createPopup");

        // Reset del form prima di configurare
        popup.resetForm();

        // Configura il popup per l'aggiunta di una spesa
        popup.show({
            title: '💸 Aggiungi Uscita',
            saveBtnText: 'Salva Uscita',
            onSave: async () => {
                await saveNewRecord();
            },
            onError: (error) => {
                console.error('Errore durante il salvataggio:', error);
                toast.error(`${error.message}`);
            }
        });

        // Popola la select delle tipologie di spesa DOPO aver mostrato il popup
        setTimeout(() => {
            populateTypeSelect('createPopup', res.data || []);
        }, 100);

    } catch (error) {
        console.error('Errore durante l\'apertura del popup per le spese:', error);
        toast.error('Errore durante il caricamento delle tipologie di spesa');
    }
}

// Funzione per aprire il popup per aggiungere un'entrata
async function openIncomePopup() {
    console.log('Apertura del popup per aggiungere un\'entrata');

    try {
        // Chiamata per ottenere solo le tipologie di entrata
        const res = await getIncomeTypologies();
        if (!res.success) {
            toast.error(`${res.message}`);
            return; 
        }

        // Usa l'istanza globale, creandola solo se non esiste
        const popup = getPopupInstance("createPopup");

        // Reset del form prima di configurare
        popup.resetForm();

        // Configura il popup per l'aggiunta di un'entrata
        popup.show({
            title: '💰 Aggiungi Entrata',
            saveBtnText: 'Salva Entrata',
            onSave: async () => {
                await saveNewRecord();
            },
            onError: (error) => {
                console.error('Errore durante il salvataggio:', error);
                toast.error(`${error.message}`);
            }
        });

        // Popola la select delle tipologie di entrata DOPO aver mostrato il popup
        setTimeout(() => {
            populateTypeSelect('createPopup', res.data || []);
        }, 100);

    } catch (error) {
        console.error('Errore durante l\'apertura del popup per le entrate:', error);
        toast.error('Errore durante il caricamento delle tipologie di entrata');
    }
}

// Funzione separata per salvare un nuovo record
async function saveNewRecord() {
    try {
        toast.info('Salvataggio in corso...');

        // Trova il popup specifico e cerca gli elementi al suo interno
        const createPopupElement = document.getElementById('createPopup');

        if (!createPopupElement) {
            console.error('Popup createPopup non trovato nel DOM');
            return;
        }

        const titleElement = createPopupElement.querySelector('#title');
        const descriptionElement = createPopupElement.querySelector('#description');
        const amountElement = createPopupElement.querySelector('#amount');
        const typeElement = createPopupElement.querySelector('#type-select');
        const dateElement = createPopupElement.querySelector('#date');
        
        // Raccogli i dati dal form
        const formData = {
            title: titleElement.value,
            description: descriptionElement.value,
            amount: parseFloat(amountElement.value),
            type: typeElement.value,
            date: dateElement.value
        };

        if (!formData.title || !formData.amount || !formData.date) {
            throw new Error('I campi Titolo, Valore e Data sono obbligatori');
        }

        const body = { 
            name: formData.title, 
            amount: formData.amount, 
            description: formData.description || "", 
            date: formData.date, 
            type: formData.type
        };

        const response = await expensesService.addExpense(body)
        if (!response.success) {
            throw new Error(`Errore nell'inserimento del dato: ${response.message}`);
        }

        toast.success('Record aggiunto con successo!');

        await loadData(true); // Ricarica i dati nella tabella, preservando le selezioni

    } catch (error) {
        throw error; // Rilancia per gestione in onError
    }
}

// Funzione per aprire il popup per modificare un record
async function openEditPopup(recordId) {
    console.log('Apertura del popup per modificare record:', recordId);

    try {
        // Carica i dati del record e le tipologie in parallelo
        const [recordData, typesResponse] = await Promise.all([
            loadRecordData(recordId),
            getActiveTypologies()
        ]);

        if (!typesResponse.success) {
            toast.error(`Errore nel caricamento delle tipologie: ${typesResponse.message}`);
            return;
        }

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

        // Popola la select delle tipologie e il form DOPO aver mostrato il popup
        setTimeout(() => {
            // Prima popola la select con tutte le tipologie
            populateTypeSelect('updatePopup', typesResponse.data || [], recordData.type);
            
            // Poi popola il resto del form
            populateEditForm(recordData);
        }, 100);

    } catch (error) {
        console.error('Errore durante l\'apertura del popup di modifica:', error);
        toast.error('Errore durante il caricamento dei dati');
    }
}

// Funzione per caricare i dati di un record nel form (per la modifica)
async function loadRecordData(recordId) {
    try {
        const response = await expensesService.getExpenseById(recordId);
        if (!response.success) {
            throw new Error(response.message);
        }
        
        console.log('Dati del record caricati:', response.data);
        return response.data;
    } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        toast.error('Errore nel caricamento dei dati del record');
        throw error; // Rilancia l'errore per gestirlo nel chiamante
    }
}

// Funzione per popolare il form di modifica con i dati del record
function populateEditForm(data) {
    // Trova il popup specifico e cerca gli elementi al suo interno
    const updatePopupElement = document.getElementById('updatePopup');
    console.log('Popup updatePopup trovato:', updatePopupElement);
    
    if (!updatePopupElement) {
        console.error('Popup updatePopup non trovato nel DOM');
        return;
    }
    
    // Cerca gli elementi del form nel popup specifico
    const titleElement = updatePopupElement.querySelector('#title');
    const descriptionElement = updatePopupElement.querySelector('#description');
    const amountElement = updatePopupElement.querySelector('#amount');
    const typeElement = updatePopupElement.querySelector('#type-select');
    const dateElement = updatePopupElement.querySelector('#date');
    
    
    // Popola il form se gli elementi esistono
    if (titleElement) {
        titleElement.value = data.name || '';
        titleElement.dispatchEvent(new Event('input', { bubbles: true }));
        console.log("Title impostato:", titleElement.value);
    } else {
        console.error('Elemento title non trovato nel popup');
    }
    
    if (descriptionElement) {
        descriptionElement.value = data.description || '';
        descriptionElement.dispatchEvent(new Event('input', { bubbles: true }));
        console.log("Description impostato:", descriptionElement.value);
    }
    
    if (amountElement) {
        amountElement.value = data.amount || '';
        amountElement.dispatchEvent(new Event('input', { bubbles: true }));
        console.log("Amount impostato:", amountElement.value);
    }
    
    if (typeElement) {
        // Il tipo dovrebbe già essere preselezionato dalla populateTypeSelect
        // Ma forziamo la selezione se necessario
        if (data.type) {
            typeElement.value = data.type;
            typeElement.dispatchEvent(new Event('change', { bubbles: true }));
            console.log("Type impostato:", typeElement.value);
        }
    }
    
    if (dateElement) {
        // Formatta la data per input type="date"
        const formattedDate = data.date ? new Date(data.date).toISOString().split('T')[0] : '';
        dateElement.value = formattedDate;
        dateElement.dispatchEvent(new Event('input', { bubbles: true }));
        console.log("Date impostato:", dateElement.value);
    }
}

// Funzione per aggiornare un record esistente
async function updateRecord(recordId) {
    try {
        toast.info('Aggiornamento in corso...');
        
        // Trova il popup specifico e cerca gli elementi al suo interno
        const updatePopupElement = document.getElementById('updatePopup');
        
        if (!updatePopupElement) {
            console.error('Popup updatePopup non trovato nel DOM');
            return;
        }
        
        // Cerca gli elementi del form nel popup specifico
        const titleElement = updatePopupElement.querySelector('#title');
        const descriptionElement = updatePopupElement.querySelector('#description');
        const amountElement = updatePopupElement.querySelector('#amount');
        const typeElement = updatePopupElement.querySelector('#type-select');
        const dateElement = updatePopupElement.querySelector('#date');

        // Raccogli i dati dal form
        const formData = {
            title: titleElement.value,
            description: descriptionElement.value,
            amount: parseFloat(amountElement.value),
            type: typeElement.value,
            date: dateElement.value
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
        if (!response.success) {
            throw new Error(response.message);
        }
        toast.success('Record aggiornato con successo!');
        
        // Ricarica i dati nella tabella
        await loadData(true);
        
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
        
        // Gestione checkbox righe
        tableBody.addEventListener('change', (e) => {
            if (e.target.classList.contains('row-checkbox')) {
                tableManager.updateRowSelection(e.target);
                tableManager.updateSelectionState();
            }
        });
    }
    
    // Event listeners per le mobile cards
    const mobileContainer = document.getElementById('mobile-table-container');
    if (mobileContainer) {
        mobileContainer.addEventListener('click', (e) => {
            const recordId = e.target.dataset.id;
            console.log('Evento click mobile su:', e.target, 'ID record:', recordId);
            
            if (e.target.classList.contains('edit-btn') && recordId) {
                openEditPopup(recordId);
            } else if (e.target.classList.contains('delete-btn') && recordId) {
                deleteRecord(recordId);
            }
        });
        
        // Gestione checkbox mobile cards
        mobileContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('row-checkbox')) {
                tableManager.updateRowSelection(e.target);
                tableManager.updateSelectionState();
            }
        });
    }
    
    // Gestione checkbox "Seleziona tutto"
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
            tableManager.toggleSelectAll();
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
                if (!response.success) {
                    throw new Error(response.message);
                }
                
                toast.success('Record eliminato con successo!');
                
                // Pulisci selezioni e ricarica i dati nella tabella
                tableManager.clearSelections();
                await loadData(true); // Preserva le selezioni perché abbiamo già pulito
        
            } catch (error) {
                throw error; // Rilancia per gestione in onError
            }
        },
        onError: (error) => {
            console.error('Errore durante l\'eliminazione:', error);
            toast.error(`Errore: ${error.message}`);
        }
    });
}

// Funzione per eliminazione multipla
async function deleteSelectedRecords() {
    const selectedIds = tableManager.getSelectedRecords();
    
    if (selectedIds.length === 0) {
        toast.warning('Nessun record selezionato');
        return;
    }
    
    console.log('Conferma per eliminazione multipla di:', selectedIds);
    
    // Usa lo stesso popup di eliminazione singola
    const popup = getPopupInstance("deletePopup");

    // Configura il popup per l'eliminazione multipla
    popup.show({
        title: `Elimina ${selectedIds.length} Record`,
        saveBtnText: `Elimina ${selectedIds.length} Record`,
        onSave: async () => {
            try {
                toast.info(`Eliminazione di ${selectedIds.length} record in corso...`);
                
                let successCount = 0;
                let errorCount = 0;
                
                // Elimina tutti i record selezionati
                for (const recordId of selectedIds) {
                    try {
                        const response = await expensesService.deleteExpenseById(recordId);
                        if (response.success) {
                            successCount++;
                        } else {
                            errorCount++;
                            console.error(`Errore eliminazione record ${recordId}:`, response.message);
                        }
                    } catch (error) {
                        errorCount++;
                        console.error(`Errore eliminazione record ${recordId}:`, error);
                    }
                }
                
                // Mostra risultati
                if (successCount > 0) {
                    toast.success(`${successCount} record eliminati con successo!`);
                }
                
                if (errorCount > 0) {
                    toast.warning(`${errorCount} record non sono stati eliminati`);
                }
                
                // Pulisci selezioni e ricarica dati
                tableManager.clearSelections();
                await loadData(true); // Preserva le selezioni perché abbiamo già pulito
        
            } catch (error) {
                throw error; // Rilancia per gestione in onError
            }
        },
        onError: (error) => {
            console.error('Errore durante l\'eliminazione multipla:', error);
            toast.error(`Errore: ${error.message}`);
        }
    });
    
    // Personalizza il contenuto del popup per mostrare i dettagli
    const popup_element = document.getElementById('deletePopup');
    const content = popup_element.querySelector('.popup-content');
    if (content) {
        const existingP = content.querySelector('p');
        if (existingP) {
            existingP.innerHTML = `
                Sei sicuro di voler eliminare <strong>${selectedIds.length}</strong> record selezionati?
                <br><br>
                <small>⚠️ Questa operazione non può essere annullata.</small>
            `;
        }
    }
}

// Funzione per caricare i dati
async function loadData(preserveSelections = false) {
    const records = await fetchRecords();
    populateTable(records);
    
    // Pulisci le selezioni solo se esplicitamente richiesto
    if (!preserveSelections) {
        setTimeout(() => {
            tableManager.clearSelections();
        }, 100);
    }
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
            
            // Esporta solo i dati filtrati
            const data = tableManager.getFilteredData();
            
            if (data.length === 0) {
                toast.warning('Nessun dato da esportare');
                return;
            }
            
            ExcelService.exportToExcel(data, 'spese_filtrate');
            toast.success('File Excel esportato con successo!');
            
        } catch (error) {
            console.error('Errore durante l\'esportazione:', error);
            toast.error('Errore durante l\'esportazione del file');
        }
    });

    // Template Excel
    if (templateBtn) {
        templateBtn.addEventListener('click', async () => {
            try {
                // Recupera le tipologie per creare un template più completo
                const typologiesResponse = await getActiveTypologies();
                const typologies = typologiesResponse.success ? typologiesResponse.data || [] : [];
                
                ExcelService.generateTemplate(typologies);
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

            console.log('Dati importati:', importedData);
            
            if (importedData.length === 0) {
                toast.warning('Nessun dato trovato nel file');
                return;
            }

            // Recupera le tipologie per la validazione
            const typologiesResponse = await getActiveTypologies();
            const typologies = typologiesResponse.success ? typologiesResponse.data || [] : [];
            
            // Valida i dati con le tipologie
            const validation = ExcelService.validateImportData(importedData, typologies);

            console.log('Dati validati:', validation);
            
            if (validation.invalid.length > 0) {
                showValidationErrors(validation.invalid);
            }
            
            if (validation.valid.length > 0) {
                await importValidData(validation.valid);
            } else if (validation.invalid.length > 0) {
                toast.error(`Tutti i ${validation.invalid.length} record hanno errori di validazione`);
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
        
        // Recupera tutte le tipologie per la mappatura
        const typologiesResponse = await getActiveTypologies();
        if (!typologiesResponse.success) {
            throw new Error('Impossibile recuperare le tipologie per la validazione');
        }
        
        const typologies = typologiesResponse.data || [];
        console.log('Tipologie disponibili per mappatura:', typologies);
        
        for (let item of validData) {
            try {
                // Mappa il nome della tipologia al suo ID
                const mappedItem = await mapTypologyToId(item, typologies);
                
                if (mappedItem) {
                    await expensesService.addExpense(mappedItem);
                    successCount++;
                } else {
                    errorCount++;
                    console.error('Tipologia non trovata per il record:', item);
                }
            } catch (error) {
                errorCount++;
                console.error('Errore nell\'importazione del record:', error);
            }
        }
        
        if (successCount > 0) {
            toast.success(`${successCount} record importati con successo!`);
            await loadData(); // Ricarica la tabella (nuovi dati, selezioni pulite)
        }
        
        if (errorCount > 0) {
            toast.warning(`${errorCount} record non sono stati importati`);
        }
        
    } catch (error) {
        console.error('Errore durante l\'importazione:', error);
        toast.error('Errore durante l\'importazione dei dati');
    }
}

// Funzione per mappare il nome della tipologia al suo ID
async function mapTypologyToId(item, typologies) {
    try {
        // Cerca la tipologia per nome (case-insensitive)
        const typology = typologies.find(t => 
            t.name && t.name.toLowerCase() === item.type.toLowerCase()
        );
        
        if (!typology) {
            console.error(`Tipologia "${item.type}" non trovata`);
            return null;
        }
        
        // Ritorna l'item con l'ID della tipologia invece del nome
        return {
            name: item.name,
            amount: item.amount,
            description: item.description || "",
            date: item.date,
            type: typology._id // Usa l'ID invece del nome
        };
        
    } catch (error) {
        console.error('Errore nella mappatura della tipologia:', error);
        return null;
    }
}

// Funzione per mostrare errori di validazione
function showValidationErrors(invalidData) {
    let errorMessage = `Trovati ${invalidData.length} errori di validazione:\n\n`;
    
    invalidData.slice(0, 10).forEach(item => { // Mostra solo i primi 10 errori
        errorMessage += `Riga ${item.row}: ${item.errors.join(', ')}\n`;
    });
    
    if (invalidData.length > 10) {
        errorMessage += `\n... e altri ${invalidData.length - 10} errori.`;
    }
    
    errorMessage += '\n\nI record validi sono stati importati correttamente.';
    
    // Mostra il messaggio con un toast lungo
    toast.error(errorMessage);
    
    // Log dettagliato in console per debug
    console.error('Errori di validazione dettagliati:', invalidData);
}

// ===== FINE FUNZIONALITÀ EXCEL =====

// Funzione per ottenere tutte le tipologie attive
async function getActiveTypologies() {
    try {
        const response = await typologiesService.getTypologies();
        return response;
    } catch (error) {
        console.error('Errore nel recupero delle tipologie attive:', error);
        throw error;
    }
}

// Funzione per ottenere solo le tipologie di spesa (uscite)
async function getExpenseTypologies() {
    try {
        const response = await typologiesService.getExpenseTypologies();
        return response;
    } catch (error) {
        console.error('Errore nel recupero delle tipologie di spesa:', error);
        throw error;
    }
}

// Funzione per ottenere solo le tipologie di entrata
async function getIncomeTypologies() {
    try {
        const response = await typologiesService.getIncomeTypologies();
        return response;
    } catch (error) {
        console.error('Errore nel recupero delle tipologie di entrata:', error);
        throw error;
    }
}

// Funzione per popolare la select delle tipologie
function populateTypeSelect(popupId, types, selectedType = '') {
    const popupElement = document.getElementById(popupId);
    if (!popupElement) {
        console.error(`Popup ${popupId} non trovato nel DOM`);
        return;
    }
    
    const typeSelect = popupElement.querySelector('#type-select');
    if (!typeSelect) {
        console.error('Select type-select non trovata nel popup');
        return;
    }
    
    // Pulisci le opzioni esistenti
    typeSelect.innerHTML = '';
    
    // Aggiungi opzione di default
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '--Seleziona un tipo--';
    typeSelect.appendChild(defaultOption);
    
    // Aggiungi le tipologie dalla API
    if (types && types.length > 0) {
        types.forEach(type => {
            const option = document.createElement('option');
            if (!type._id || type._id === '') return;
            option.value = type._id || type.name;
            option.textContent = type.name || type.description;
            
            // Seleziona l'opzione se corrisponde al tipo selezionato
            if (selectedType && type._id === selectedType) {
                option.selected = true;
            }
            
            typeSelect.appendChild(option);
        });
    } 
    
    console.log(`Select popolata con ${types.length} tipologie in popup ${popupId}`);
}

// Funzione per inizializzare le statistiche
function initializeStatistics() {
    const totalRecordsEl = document.getElementById('stats-total-records');
    const totalExpensesEl = document.getElementById('stats-total-expenses');
    const totalIncomeEl = document.getElementById('stats-total-income');
    const balanceEl = document.getElementById('stats-balance');
    
    if (totalRecordsEl) totalRecordsEl.textContent = '0';
    if (totalExpensesEl) totalExpensesEl.textContent = '€0,00';
    if (totalIncomeEl) totalIncomeEl.textContent = '€0,00';
    if (balanceEl) {
        balanceEl.textContent = '€0,00';
        balanceEl.classList.add('zero');
    }
}

// Inizializzazione dell'applicazione
async function init() {
    // Carica header e footer
    getHeaderAndFooter();
    
    // Inizializza le statistiche a zero
    initializeStatistics();
    
    // Carica i dati dalla API
    await loadData();

    // Aggiungi eventi per i pulsanti "Aggiungi Uscita" e "Aggiungi Entrata"
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const addIncomeBtn = document.getElementById('add-income-btn');
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    
    if (addExpenseBtn) {
        addExpenseBtn.removeEventListener('click', openExpensePopup); // Rimuovi eventuali listener esistenti
        addExpenseBtn.addEventListener('click', openExpensePopup);
    } else {
        console.error('Pulsante "Aggiungi Uscita" non trovato.');
    }
    
    if (addIncomeBtn) {
        addIncomeBtn.removeEventListener('click', openIncomePopup); // Rimuovi eventuali listener esistenti
        addIncomeBtn.addEventListener('click', openIncomePopup);
    } else {
        console.error('Pulsante "Aggiungi Entrata" non trovato.');
    }
    
    if (deleteSelectedBtn) {
        deleteSelectedBtn.removeEventListener('click', deleteSelectedRecords); // Rimuovi eventuali listener esistenti
        deleteSelectedBtn.addEventListener('click', deleteSelectedRecords);
    } else {
        console.error('Pulsante "Elimina Selezionati" non trovato.');
    }
    
    // Configura event listeners per la tabella
    setupTableEventListeners();
    
    // Inizializza funzionalità Excel
    initializeExcelFeatures();
    
    // Inizializza il toggle dei filtri
    initializeFiltersToggle();
    
    // Inizializza il FAB mobile
    initializeMobileFAB();
    
    // Inizializza il FAB Excel
    initializeExcelFAB();
}

// Funzione per inizializzare il toggle dei filtri
function initializeFiltersToggle() {
    const toggleBtn = document.getElementById('toggle-filters');
    const filtersSection = document.getElementById('filters-section');
    
    if (!toggleBtn || !filtersSection) {
        console.error('Bottone toggle filtri o sezione filtri non trovati');
        return;
    }
    
    // Stato iniziale: collassato
    let isExpanded = false;
    
    toggleBtn.addEventListener('click', () => {
        isExpanded = !isExpanded;
        
        if (isExpanded) {
            // Espandi i filtri
            filtersSection.classList.remove('collapsed');
            filtersSection.classList.add('expanded');
            toggleBtn.textContent = '🔼 Nascondi Filtri';
            toggleBtn.classList.add('active');
        } else {
            // Collassa i filtri
            filtersSection.classList.remove('expanded');
            filtersSection.classList.add('collapsed');
            toggleBtn.textContent = '🔍 Mostra Filtri';
            toggleBtn.classList.remove('active');
        }
        
        console.log(`Filtri ${isExpanded ? 'espansi' : 'collassati'}`);
    });
    
    // Imposta stato iniziale
    filtersSection.classList.add('collapsed');
    toggleBtn.textContent = '🔍 Mostra Filtri';
}

// Funzione per inizializzare il FAB mobile
function initializeMobileFAB() {
    const fabMain = document.getElementById('fab-main');
    const fabMenu = document.getElementById('fab-menu');
    const fabOverlay = document.getElementById('fab-overlay');
    const fabAddExpense = document.getElementById('fab-add-expense');
    const fabAddIncome = document.getElementById('fab-add-income');
    
    if (!fabMain || !fabMenu || !fabOverlay) {
        console.log('Elementi FAB non trovati nel DOM - probabilmente non su mobile');
        return;
    }
    
    let isExpanded = false;
    
    // Funzione per aprire/chiudere il menu FAB
    function toggleFABMenu() {
        isExpanded = !isExpanded;
        
        const fabExcelContainer = document.getElementById('fab-excel-container');
        const fabExcelMain = document.getElementById('fab-excel-main');
        const fabExcelMenu = document.getElementById('fab-excel-menu');
        
        if (isExpanded) {
            // Apri il menu principale
            fabMain.classList.add('expanded');
            fabMenu.classList.add('expanded');
            fabOverlay.classList.add('active');
            fabMain.innerHTML = '✕'; // Icona di chiusura
            
            // Sposta il FAB Excel più in alto per evitare sovrapposizioni
            if (fabExcelContainer) {
                fabExcelContainer.classList.add('main-menu-open');
            }
            
        } else {
            // Chiudi il menu principale
            fabMain.classList.remove('expanded');
            fabMenu.classList.remove('expanded');
            fabOverlay.classList.remove('active');
            fabMain.innerHTML = '➕'; // Icona di aggiunta
            
            // Riporta il FAB Excel alla posizione originale
            if (fabExcelContainer) {
                fabExcelContainer.classList.remove('main-menu-open');
            }
        }
        
        console.log(`FAB menu ${isExpanded ? 'aperto' : 'chiuso'}`);
        
        // Aggiorna l'overlay se necessario
        updateOverlayState();
    }
    
    // Event listeners
    fabMain.addEventListener('click', () => {
        // Effetto ripple
        fabMain.classList.add('clicked');
        setTimeout(() => fabMain.classList.remove('clicked'), 600);
        
        toggleFABMenu();
    });
    fabOverlay.addEventListener('click', () => {
        // Chiudi il menu principale se è aperto
        if (isExpanded) {
            toggleFABMenu();
        }
        
        // Chiudi anche il menu Excel se è aperto
        const fabExcelMain = document.getElementById('fab-excel-main');
        const fabExcelMenu = document.getElementById('fab-excel-menu');
        if (fabExcelMain && fabExcelMenu && fabExcelMenu.classList.contains('expanded')) {
            fabExcelMain.classList.remove('expanded');
            fabExcelMenu.classList.remove('expanded');
            fabExcelMain.innerHTML = '📋';
            
            // Aggiorna l'overlay dopo aver chiuso il menu Excel
            if (typeof window.updateOverlayState === 'function') {
                setTimeout(() => window.updateOverlayState(), 100);
            }
        }
    });
    
    // Collega i bottoni FAB alle funzioni esistenti
    if (fabAddExpense) {
        fabAddExpense.addEventListener('click', () => {
            toggleFABMenu(); // Chiudi il menu
            setTimeout(() => {
                openExpensePopup(); // Apri il popup per le uscite
            }, 300); // Piccolo delay per l'animazione
        });
    }
    
    if (fabAddIncome) {
        fabAddIncome.addEventListener('click', () => {
            toggleFABMenu(); // Chiudi il menu
            setTimeout(() => {
                openIncomePopup(); // Apri il popup per le entrate
            }, 300); // Piccolo delay per l'animazione
        });
    }
    
    // Chiudi il menu quando si fa scroll (UX migliorata)
    let scrollTimeout;
    let lastScrollY = window.scrollY;
    let isScrolling = false;
    
    window.addEventListener('scroll', () => {
        const fabContainer = document.getElementById('fab-container');
        const fabExcelContainer = document.getElementById('fab-excel-container');
        const currentScrollY = window.scrollY;
        
        // Chiudi i menu aperti durante lo scroll
        if (isExpanded) {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                toggleFABMenu();
            }, 150);
        }
        
        // Auto-hide dei FAB durante lo scroll verso il basso
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // Scroll verso il basso - nascondi i FAB
            if (fabContainer) fabContainer.classList.add('hidden');
            if (fabExcelContainer) fabExcelContainer.classList.add('hidden');
        } else {
            // Scroll verso l'alto o fermo - mostra i FAB
            if (fabContainer) fabContainer.classList.remove('hidden');
            if (fabExcelContainer) fabExcelContainer.classList.remove('hidden');
        }
        
        lastScrollY = currentScrollY;
        
        // Reset dell'auto-hide dopo 3 secondi di inattività
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (fabContainer) fabContainer.classList.remove('hidden');
            if (fabExcelContainer) fabExcelContainer.classList.remove('hidden');
        }, 3000);
    });
    
    // Animazione di pulsazione iniziale per attirare l'attenzione
    setTimeout(() => {
        fabMain.classList.add('pulse');
        setTimeout(() => {
            fabMain.classList.remove('pulse');
        }, 4000); // Rimuovi dopo 4 secondi
    }, 1000); // Inizia dopo 1 secondo
    
    console.log('FAB mobile inizializzato con successo');
    
    // Funzione per aggiornare lo stato dell'overlay
    function updateOverlayState() {
        const fabOverlay = document.getElementById('fab-overlay');
        const fabMenu = document.getElementById('fab-menu');
        const fabExcelMenu = document.getElementById('fab-excel-menu');
        
        if (!fabOverlay) return;
        
        const mainMenuOpen = fabMenu && fabMenu.classList.contains('expanded');
        const excelMenuOpen = fabExcelMenu && fabExcelMenu.classList.contains('expanded');
        
        if (mainMenuOpen || excelMenuOpen) {
            fabOverlay.classList.add('active');
            
            // Aggiungi classe speciale se entrambi i menu sono aperti
            if (mainMenuOpen && excelMenuOpen) {
                fabOverlay.classList.add('multiple-menus');
            } else {
                fabOverlay.classList.remove('multiple-menus');
            }
        } else {
            fabOverlay.classList.remove('active', 'multiple-menus');
        }
    }
    
    // Esponi la funzione globalmente per l'uso in altri FAB
    window.updateOverlayState = updateOverlayState;
}

// Funzione per inizializzare il FAB Excel
function initializeExcelFAB() {
    const fabExcelMain = document.getElementById('fab-excel-main');
    const fabExcelMenu = document.getElementById('fab-excel-menu');
    const fabExportExcel = document.getElementById('fab-export-excel');
    const fabImportExcel = document.getElementById('fab-import-excel');
    const fabDownloadTemplate = document.getElementById('fab-download-template');
    
    if (!fabExcelMain || !fabExcelMenu) {
        console.log('Elementi FAB Excel non trovati nel DOM - probabilmente non su mobile');
        return;
    }
    
    let isExcelExpanded = false;
    
    // Funzione per aprire/chiudere il menu FAB Excel
    function toggleExcelFABMenu() {
        isExcelExpanded = !isExcelExpanded;
        
        if (isExcelExpanded) {
            // Apri il menu Excel
            fabExcelMain.classList.add('expanded');
            fabExcelMenu.classList.add('expanded');
            fabExcelMain.innerHTML = '✕'; // Icona di chiusura
        } else {
            // Chiudi il menu Excel
            fabExcelMain.classList.remove('expanded');
            fabExcelMenu.classList.remove('expanded');
            fabExcelMain.innerHTML = '📋'; // Icona Excel
        }
        
        console.log(`FAB Excel menu ${isExcelExpanded ? 'aperto' : 'chiuso'}`);
        
        // Aggiorna l'overlay se necessario
        if (typeof window.updateOverlayState === 'function') {
            window.updateOverlayState();
        }
    }
    
    // Event listeners
    fabExcelMain.addEventListener('click', () => {
        // Effetto ripple
        fabExcelMain.classList.add('clicked');
        setTimeout(() => fabExcelMain.classList.remove('clicked'), 600);
        
        toggleExcelFABMenu();
    });
    
    // Collega i bottoni FAB Excel alle funzioni esistenti
    if (fabExportExcel) {
        fabExportExcel.addEventListener('click', () => {
            toggleExcelFABMenu(); // Chiudi il menu
            setTimeout(() => {
                // Trigger dell'evento click sul bottone desktop
                document.getElementById('export-excel')?.click();
            }, 200);
        });
    }
    
    if (fabImportExcel) {
        fabImportExcel.addEventListener('click', () => {
            toggleExcelFABMenu(); // Chiudi il menu
            setTimeout(() => {
                // Trigger dell'evento click sul bottone desktop
                document.getElementById('import-excel')?.click();
            }, 200);
        });
    }
    
    if (fabDownloadTemplate) {
        fabDownloadTemplate.addEventListener('click', () => {
            toggleExcelFABMenu(); // Chiudi il menu
            setTimeout(() => {
                // Trigger dell'evento click sul bottone desktop
                document.getElementById('download-template')?.click();
            }, 200);
        });
    }
    
    // Chiudi il menu Excel quando si apre il menu principale e viceversa
    // (questa logica è già gestita nelle funzioni toggle)
    
    console.log('FAB Excel inizializzato con successo');
}

// Avvia l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', init);

// Pulizia quando la pagina viene chiusa o navigata
window.addEventListener('beforeunload', () => {
    resetPopupInstance();
});