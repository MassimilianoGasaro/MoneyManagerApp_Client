export class TableManager {
    constructor() {
        this.originalData = [];
        this.filteredData = [];
        this.currentSort = { column: null, direction: 'asc' };
        this.filters = {
            search: '',
            type: '',
            dateFrom: '',
            dateTo: '',
            amountMin: '',
            amountMax: ''
        };
        
        // Callback per notificare cambiamenti nei dati
        this.onDataChange = null;
        
        this.initializeEventListeners();
    }

    // Inizializza i dati originali
    setData(data) {
        this.originalData = [...data];
        this.filteredData = [...data];
        this.applyFiltersAndSort();
    }

    // Imposta il callback per notificare cambiamenti nei dati
    setOnDataChange(callback) {
        this.onDataChange = callback;
    }

    // Inizializza gli event listeners
    initializeEventListeners() {
        // Filtri
        document.getElementById('search-input')?.addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.applyFiltersAndSort();
        });

        document.getElementById('type-filter')?.addEventListener('change', (e) => {
            this.filters.type = e.target.value;
            this.applyFiltersAndSort();
        });

        document.getElementById('date-from')?.addEventListener('change', (e) => {
            this.filters.dateFrom = e.target.value;
            this.applyFiltersAndSort();
        });

        document.getElementById('date-to')?.addEventListener('change', (e) => {
            this.filters.dateTo = e.target.value;
            this.applyFiltersAndSort();
        });

        document.getElementById('amount-min')?.addEventListener('input', (e) => {
            this.filters.amountMin = e.target.value;
            this.applyFiltersAndSort();
        });

        document.getElementById('amount-max')?.addEventListener('input', (e) => {
            this.filters.amountMax = e.target.value;
            this.applyFiltersAndSort();
        });

        // Bottoni filtri
        document.getElementById('apply-filters')?.addEventListener('click', () => {
            this.applyFiltersAndSort();
        });

        document.getElementById('clear-filters')?.addEventListener('click', () => {
            this.clearFilters();
        });

        // Ordinamento colonne
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.column;
                this.toggleSort(column);
            });
        });
    }

    // Applica filtri ai dati
    applyFilters() {
        this.filteredData = this.originalData.filter(record => {
            // Filtro ricerca testuale
            if (this.filters.search) {
                const searchLower = this.filters.search.toLowerCase();
                const titleMatch = (record.title || record.name || '').toLowerCase().includes(searchLower);
                const descMatch = (record.description || '').toLowerCase().includes(searchLower);
                if (!titleMatch && !descMatch) return false;
            }

            // Filtro tipo - gestisce sia struttura vecchia che nuova
            if (this.filters.type) {
                let recordType = '';
                if (typeof record.type === 'string') {
                    recordType = record.type;
                } else if (record.type && typeof record.type === 'object' && record.type.name) {
                    recordType = record.type.name;
                } else if (record.type && typeof record.type === 'object' && record.type._id) {
                    recordType = record.type._id;
                }
                
                if (recordType !== this.filters.type) {
                    return false;
                }
            }

            // Filtro data da
            if (this.filters.dateFrom) {
                const recordDate = new Date(record.date);
                const fromDate = new Date(this.filters.dateFrom);
                if (recordDate < fromDate) return false;
            }

            // Filtro data a
            if (this.filters.dateTo) {
                const recordDate = new Date(record.date);
                const toDate = new Date(this.filters.dateTo);
                if (recordDate > toDate) return false;
            }

            // Filtro importo minimo
            if (this.filters.amountMin !== '') {
                const minAmount = parseFloat(this.filters.amountMin);
                if (record.amount < minAmount) return false;
            }

            // Filtro importo massimo
            if (this.filters.amountMax !== '') {
                const maxAmount = parseFloat(this.filters.amountMax);
                if (record.amount > maxAmount) return false;
            }

            return true;
        });
    }

    // Applica ordinamento ai dati filtrati
    applySorting() {
        if (!this.currentSort.column) return;

        this.filteredData.sort((a, b) => {
            let valueA = a[this.currentSort.column];
            let valueB = b[this.currentSort.column];

            // Gestione nomi/titoli
            if (this.currentSort.column === 'title') {
                valueA = a.title || a.name || '';
                valueB = b.title || b.name || '';
            }

            // Gestione tipo - considera la nuova struttura
            if (this.currentSort.column === 'type') {
                if (typeof valueA === 'object' && valueA && valueA.name) {
                    valueA = valueA.name;
                } else if (typeof valueA !== 'string') {
                    valueA = '';
                }
                
                if (typeof valueB === 'object' && valueB && valueB.name) {
                    valueB = valueB.name;
                } else if (typeof valueB !== 'string') {
                    valueB = '';
                }
            }

            // Gestione date
            if (this.currentSort.column === 'date') {
                valueA = new Date(valueA);
                valueB = new Date(valueB);
            }

            // Gestione numeri
            if (this.currentSort.column === 'amount') {
                valueA = parseFloat(valueA) || 0;
                valueB = parseFloat(valueB) || 0;
            }

            // Gestione stringhe
            if (typeof valueA === 'string' && typeof valueB === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }

            let result = 0;
            if (valueA < valueB) result = -1;
            else if (valueA > valueB) result = 1;

            return this.currentSort.direction === 'desc' ? -result : result;
        });
    }

    // Applica filtri e ordinamento
    applyFiltersAndSort() {
        this.applyFilters();
        this.applySorting();
        this.updateTable();
        this.updateFilterInfo();
        
        // Notifica il cambiamento dei dati se c'è un callback
        if (this.onDataChange && typeof this.onDataChange === 'function') {
            this.onDataChange(this.filteredData);
        }
        
        // Le selezioni vengono gestite direttamente in updateTable()
        // Non pulire automaticamente qui per permettere il mantenimento delle selezioni
    }

    // Toggle ordinamento per colonna
    toggleSort(column) {
        if (this.currentSort.column === column) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.column = column;
            this.currentSort.direction = 'asc';
        }

        this.applySorting();
        this.updateTable();
        this.updateSortIndicators();
    }

    // Aggiorna indicatori di ordinamento
    updateSortIndicators() {
        document.querySelectorAll('.sortable .sort-indicator').forEach(indicator => {
            indicator.textContent = '⇅';
        });

        if (this.currentSort.column) {
            const activeHeader = document.querySelector(`.sortable[data-column="${this.currentSort.column}"] .sort-indicator`);
            if (activeHeader) {
                activeHeader.textContent = this.currentSort.direction === 'asc' ? '⬆️' : '⬇️';
            }
        }
    }

    // Pulisci tutti i filtri
    clearFilters() {
        this.filters = {
            search: '',
            type: '',
            dateFrom: '',
            dateTo: '',
            amountMin: '',
            amountMax: ''
        };

        // Reset form elements
        document.getElementById('search-input').value = '';
        document.getElementById('type-filter').value = '';
        document.getElementById('date-from').value = '';
        document.getElementById('date-to').value = '';
        document.getElementById('amount-min').value = '';
        document.getElementById('amount-max').value = '';

        this.applyFiltersAndSort();
        
        // Pulisci le selezioni quando vengono resettati i filtri
        setTimeout(() => {
            this.clearSelections();
        }, 100);
    }

    updateTable() {
        const tableBody = document.querySelector(".styled-table tbody");
        if (!tableBody) return;

        // Salva lo stato delle selezioni prima di ricreare la tabella
        const selectedIds = this.getSelectedRecords();

        tableBody.innerHTML = '';

        this.filteredData.forEach(record => {
            const row = document.createElement("tr");
            row.style.backgroundColor = record.type?.type === 'expense' ? 
                'var(--background-expense)' : 'var(--background-income)'; // Colore di sfondo per il tipo
            
            // Controlla se questo record era selezionato
            const isSelected = selectedIds.includes(record._id);
            
            row.innerHTML = `
                <td class="checkbox-column">
                    <input type="checkbox" class="row-checkbox" data-id="${record._id}" ${isSelected ? 'checked' : ''}>
                </td>
                <td>${record.title || record.name || ''}</td>
                <td>${record.amount ? `€ ${record.amount.toFixed(2)}` : '€0.00'}</td>
                <td>${record.date ? new Date(record.date).toLocaleDateString('it-IT') : ''}</td>
                <td>${record.type?.name || ''}</td>
                <td>
                    <button class="btn edit-btn" data-id="${record._id}">✏️ Modifica</button>
                    <button class="btn delete-btn" data-id="${record._id}">🗑️ Elimina</button>
                </td>
            `;
            
            // Applica lo stile di selezione se necessario
            if (isSelected) {
                row.classList.add('selected');
            }
            
            tableBody.appendChild(row);
        });
        
        // Aggiorna anche le mobile cards
        this.updateMobileCards(selectedIds);
        
        // Aggiorna lo stato delle selezioni dopo aver ricreato la tabella
        // Usa requestAnimationFrame per assicurarsi che il DOM sia completamente aggiornato
        requestAnimationFrame(() => {
            this.updateSelectionState();
        });
    }
    
    // Aggiorna le mobile cards
    updateMobileCards(selectedIds = []) {
        const mobileContainer = document.getElementById('mobile-table-container');
        if (!mobileContainer) return;
        
        if (!this.filteredData || this.filteredData.length === 0) {
            mobileContainer.innerHTML = `
                <div class="mobile-card">
                    <div class="mobile-card-header">
                        <div class="mobile-card-title">Nessun record trovato</div>
                    </div>
                    <div class="mobile-card-details">
                        <div class="mobile-card-detail">
                            <span class="mobile-card-label">📝 Prova a modificare i filtri</span>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        const cardsHtml = this.filteredData.map(record => {
            // Gestisce la nuova struttura del tipo
            let typeClass = 'expense'; // default
            let typeIcon = '💸'; // default
            let typeName = '';
            
            if (record.type) {
                if (typeof record.type === 'object' && record.type.name) {
                    typeName = record.type.name;
                    // Classifica in base al nome della tipologia
                    const typeNameLower = typeName.toLowerCase();
                    if (typeNameLower.includes('entrata') || typeNameLower.includes('income') || typeNameLower.includes('guadagno')) {
                        typeClass = 'income';
                        typeIcon = '💰';
                    }
                } else if (typeof record.type === 'string') {
                    typeName = record.type;
                    if (record.type === 'income' || record.type === 'entrata') {
                        typeClass = 'income';
                        typeIcon = '💰';
                    }
                }
            }

            // Controlla se questo record era selezionato
            const isSelected = selectedIds.includes(record._id);
            const selectedClass = isSelected ? 'selected' : '';
            const checkedAttr = isSelected ? 'checked' : '';
            
            return `
                <div class="mobile-card ${selectedClass}" data-type="${typeClass}">
                    <input type="checkbox" class="mobile-card-checkbox row-checkbox" data-id="${record._id}" ${checkedAttr}>
                    <div class="mobile-card-header">
                        <div>
                            <div class="mobile-card-title">${record.title || record.name || ''}</div>
                            <div class="type-badge ${typeClass}">
                                ${typeIcon} ${typeName}
                            </div>
                        </div>
                        <div class="mobile-card-amount ${typeClass}">€${record.amount ? record.amount.toFixed(2) : '0.00'}</div>
                    </div>
                    
                    <div class="mobile-card-details">
                        <div class="mobile-card-detail">
                            <span class="mobile-card-label">📝 Descrizione:</span>
                            <span class="mobile-card-value">${record.description || 'N/A'}</span>
                        </div>
                        <div class="mobile-card-detail">
                            <span class="mobile-card-label">📅 Data:</span>
                            <span class="mobile-card-value">${this.formatDate(record.date)}</span>
                        </div>
                        <div class="mobile-card-detail">
                            <span class="mobile-card-label">🕒 Creato:</span>
                            <span class="mobile-card-value">${this.formatDate(record.createdAt)}</span>
                        </div>
                    </div>
                    
                    <div class="mobile-card-actions">
                        <button class="btn edit-btn" data-id="${record._id}">
                            ✏️ Modifica
                        </button>
                        <button class="btn delete-btn" data-id="${record._id}">
                            🗑️ Elimina
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        mobileContainer.innerHTML = cardsHtml;
    }
    
    // Funzione helper per formattare le date
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('it-IT', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Errore nel parsing della data:', error);
            return 'Data non valida';
        }
    }

    // Aggiorna info sui filtri
    updateFilterInfo() {
        const total = this.originalData.length;
        const filtered = this.filteredData.length;
        
        const resultsInfo = document.getElementById('results-info');
        if (resultsInfo) {
            if (filtered === total) {
                resultsInfo.textContent = `📊 ${total} record totali`;
            } else {
                resultsInfo.textContent = `📊 ${filtered} di ${total} record`;
            }
        }
    }

    // Ottieni dati filtrati (per export)
    getFilteredData() {
        return this.filteredData;
    }

    // Ottieni dati originali
    getOriginalData() {
        return this.originalData;
    }

    // ===== GESTIONE SELEZIONI MULTIPLE =====
    
    // Ottieni tutti i record selezionati
    getSelectedRecords() {
        const selectedIds = [];
        
        // Controlla checkbox desktop
        document.querySelectorAll('.row-checkbox:checked').forEach(checkbox => {
            const id = checkbox.dataset.id;
            if (id) selectedIds.push(id);
        });
        
        console.log(`GetSelectedRecords: trovati ${selectedIds.length} record selezionati:`, selectedIds);
        return selectedIds;
    }
    
    // Seleziona/deseleziona tutti i record
    toggleSelectAll() {
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        const isChecked = selectAllCheckbox?.checked || false;
        
        console.log(`ToggleSelectAll: impostando tutte le checkbox a ${isChecked}`);
        
        // Aggiorna tutte le checkbox
        const allCheckboxes = document.querySelectorAll('.row-checkbox');
        allCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
            this.updateRowSelection(checkbox);
        });
        
        // Aggiorna lo stato dopo un piccolo delay per assicurarsi che tutti i DOM updates siano completati
        setTimeout(() => {
            this.updateSelectionState();
        }, 10);
    }
    
    // Aggiorna lo stato visivo della riga selezionata
    updateRowSelection(checkbox) {
        const isChecked = checkbox.checked;
        
        // Per la tabella desktop
        const row = checkbox.closest('tr');
        if (row) {
            if (isChecked) {
                row.classList.add('selected');
            } else {
                row.classList.remove('selected');
            }
        }
        
        // Per le mobile cards
        const mobileCard = checkbox.closest('.mobile-card');
        if (mobileCard) {
            if (isChecked) {
                mobileCard.classList.add('selected');
            } else {
                mobileCard.classList.remove('selected');
            }
        }
    }
    
    // Aggiorna lo stato generale delle selezioni
    updateSelectionState() {
        // Usa un piccolo delay per assicurarsi che il DOM sia aggiornato
        requestAnimationFrame(() => {
            const allCheckboxes = document.querySelectorAll('.row-checkbox');
            const checkedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
            const selectAllCheckbox = document.getElementById('select-all-checkbox');
            const deleteSelectedBtn = document.getElementById('delete-selected-btn');
            
            console.log(`UpdateSelectionState: ${checkedCheckboxes.length}/${allCheckboxes.length} checkbox selezionate`);
            
            // Aggiorna checkbox "Seleziona tutto"
            if (selectAllCheckbox) {
                if (checkedCheckboxes.length === 0) {
                    selectAllCheckbox.indeterminate = false;
                    selectAllCheckbox.checked = false;
                } else if (checkedCheckboxes.length === allCheckboxes.length && allCheckboxes.length > 0) {
                    selectAllCheckbox.indeterminate = false;
                    selectAllCheckbox.checked = true;
                } else {
                    selectAllCheckbox.indeterminate = true;
                    selectAllCheckbox.checked = false;
                }
            }
            
            // Mostra/nascondi bottone eliminazione multipla
            if (deleteSelectedBtn) {
                if (checkedCheckboxes.length > 0) {
                    deleteSelectedBtn.style.display = 'inline-block';
                    deleteSelectedBtn.textContent = `🗑️ Elimina Selezionati (${checkedCheckboxes.length})`;
                } else {
                    deleteSelectedBtn.style.display = 'none';
                }
            }
            
            // Aggiorna il badge del FAB mobile se disponibile
            if (typeof window.updateFABBadge === 'function') {
                window.updateFABBadge(checkedCheckboxes.length);
            }
        });
    }
    
    // Deseleziona tutto
    clearSelections() {
        console.log('ClearSelections: pulendo tutte le selezioni');
        
        document.querySelectorAll('.row-checkbox').forEach(checkbox => {
            checkbox.checked = false;
            this.updateRowSelection(checkbox);
        });
        
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
        
        this.updateSelectionState();
    }

    // Metodo di debug per ispezionare lo stato delle selezioni
    debugSelectionState() {
        const allCheckboxes = document.querySelectorAll('.row-checkbox');
        const checkedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        const deleteSelectedBtn = document.getElementById('delete-selected-btn');
        
        console.log('=== DEBUG SELECTION STATE ===');
        console.log('Total checkboxes:', allCheckboxes.length);
        console.log('Checked checkboxes:', checkedCheckboxes.length);
        console.log('Select all checkbox state:', {
            checked: selectAllCheckbox?.checked,
            indeterminate: selectAllCheckbox?.indeterminate
        });
        console.log('Delete button text:', deleteSelectedBtn?.textContent);
        console.log('Delete button visible:', deleteSelectedBtn?.style.display !== 'none');
        console.log('Selected IDs:', this.getSelectedRecords());
        console.log('============================');
        
        return {
            totalCheckboxes: allCheckboxes.length,
            checkedCheckboxes: checkedCheckboxes.length,
            selectAllState: {
                checked: selectAllCheckbox?.checked,
                indeterminate: selectAllCheckbox?.indeterminate
            },
            deleteButtonText: deleteSelectedBtn?.textContent,
            selectedIds: this.getSelectedRecords()
        };
    }
}
