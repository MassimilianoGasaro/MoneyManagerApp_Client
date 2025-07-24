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
        
        this.initializeEventListeners();
    }

    // Inizializza i dati originali
    setData(data) {
        this.originalData = [...data];
        this.filteredData = [...data];
        this.applyFiltersAndSort();
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

            // Filtro tipo
            if (this.filters.type && record.type !== this.filters.type) {
                return false;
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

    // Applica ordinamento ai dati
    applySort() {
        if (!this.currentSort.column) return;

        this.filteredData.sort((a, b) => {
            let aValue = a[this.currentSort.column];
            let bValue = b[this.currentSort.column];

            // Gestione valori specifici
            if (this.currentSort.column === 'amount') {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            } else if (this.currentSort.column === 'date') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            } else if (this.currentSort.column === 'title') {
                aValue = (a.title || a.name || '').toLowerCase();
                bValue = (b.title || b.name || '').toLowerCase();
            } else {
                aValue = (aValue || '').toString().toLowerCase();
                bValue = (bValue || '').toString().toLowerCase();
            }

            let result = 0;
            if (aValue < bValue) result = -1;
            else if (aValue > bValue) result = 1;

            return this.currentSort.direction === 'desc' ? -result : result;
        });
    }

    // Applica filtri e ordinamento
    applyFiltersAndSort() {
        this.applyFilters();
        this.applySort();
        this.updateTable();
        this.updateFilterInfo();
    }

    // Cambia ordinamento
    toggleSort(column) {
        if (this.currentSort.column === column) {
            // Cambia direzione
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            // Nuova colonna
            this.currentSort.column = column;
            this.currentSort.direction = 'asc';
        }

        this.updateSortIndicators();
        this.applyFiltersAndSort();
    }

    // Aggiorna indicatori di ordinamento
    updateSortIndicators() {
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('asc', 'desc');
            if (header.dataset.column === this.currentSort.column) {
                header.classList.add(this.currentSort.direction);
            }
        });
    }

    // Pulisce tutti i filtri
    clearFilters() {
        this.filters = {
            search: '',
            type: '',
            dateFrom: '',
            dateTo: '',
            amountMin: '',
            amountMax: ''
        };

        // Reset dei campi input
        document.getElementById('search-input').value = '';
        document.getElementById('type-filter').value = '';
        document.getElementById('date-from').value = '';
        document.getElementById('date-to').value = '';
        document.getElementById('amount-min').value = '';
        document.getElementById('amount-max').value = '';

        // Riapplica
        this.applyFiltersAndSort();
    }

    // Aggiorna la tabella con i dati filtrati
    updateTable() {
        const tableBody = document.querySelector(".styled-table tbody");
        if (!tableBody) return;

        tableBody.innerHTML = '';

        this.filteredData.forEach(record => {
            const row = document.createElement("tr");
            row.style.backgroundColor = record.type?.type === 'expense' ? 
                'var(--background-expense)' : 'var(--background-income)'; // Colore di sfondo per il tipo
            row.innerHTML = `
                <td>${record.title || record.name || ''}</td>
                <td>${record.amount ? `€ ${record.amount.toFixed(2)}` : '€0.00'}</td>
                <td>${record.date ? new Date(record.date).toLocaleDateString('it-IT') : ''}</td>
                <td>${record.type?.name || ''}</td>
                <td>
                    <button class="btn edit-btn" data-id="${record._id}">✏️ Modifica</button>
                    <button class="btn delete-btn" data-id="${record._id}">🗑️ Elimina</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Aggiorna anche le mobile cards
        this.updateMobileCards();
    }
    
    // Aggiorna le mobile cards
    updateMobileCards() {
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
            const typeClass = record.type === 'SpesaGenerica' ? 'spesa' : 'entrata';
            const typeIcon = record.type === 'SpesaGenerica' ? '💸' : '💰';
            
            return `
                <div class="mobile-card" data-type="${record.type}">
                    <div class="mobile-card-header">
                        <div>
                            <div class="mobile-card-title">${record.title || record.name || ''}</div>
                            <div class="type-badge ${typeClass}">
                                ${typeIcon} ${record.type || ''}
                            </div>
                        </div>
                        <div class="mobile-card-amount">€${record.amount ? record.amount.toFixed(2) : '0.00'}</div>
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
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
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
}
