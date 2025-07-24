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
    // Usa il TableManager per gestire i dati (sia tabella desktop che versione mobile)
    tableManager.setData(records);
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

        await loadData(); // Ricarica i dati nella tabella

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
                
                // Ricarica i dati nella tabella
                await loadData();
        
            } catch (error) {
                throw error; // Rilancia per gestione in onError
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

// Inizializzazione dell'applicazione
async function init() {
    // Carica header e footer
    getHeaderAndFooter();
    
    // Carica i dati dalla API
    await loadData();

    // Aggiungi eventi per i pulsanti "Aggiungi Uscita" e "Aggiungi Entrata"
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const addIncomeBtn = document.getElementById('add-income-btn');
    
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
    
    // Configura event listeners per la tabella
    setupTableEventListeners();
    
    // Inizializza funzionalità Excel
    initializeExcelFeatures();
    
    // Inizializza il toggle dei filtri
    initializeFiltersToggle();
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

// Avvia l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', init);

// Pulizia quando la pagina viene chiusa o navigata
window.addEventListener('beforeunload', () => {
    resetPopupInstance();
});