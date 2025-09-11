import toast from "../shared/toast.js";
// Classe avanzata per gestire la paginazione completa
class PaginationService {
    constructor(expensesService, tableManager) {
        this.expensesService = expensesService;
        this.tableManager = tableManager;
        this.currentPage = 1;
        this.limit = 10; 
        this.totalPages = 1;
        this.totalRecords = 0;
        this.isLoading = false;
        
        // Elementi UI
        this.paginationContainer = null;
        this.pageInfo = null;
        this.prevBtn = null;
        this.nextBtn = null;
        this.firstBtn = null;
        this.lastBtn = null;
        this.pageSizeSelect = null;
        
        this.#initializeUI();
    }

    // Inizializza l'interfaccia utente della paginazione
    #initializeUI() {
        // Cerca il container esistente o lo crea
        this.paginationContainer = document.getElementById('pagination-container');
        if (!this.paginationContainer) {
            this.#createPaginationUI();
        }
        
        this.#bindEvents();
    }

    // Crea l'interfaccia utente della paginazione
    #createPaginationUI() {
        const container = document.createElement('div');
        container.id = 'pagination-container';
        container.className = 'pagination-container';
        
        container.innerHTML = `
            <div class="pagination-info">
                <span id="pagination-info-text">Caricamento...</span>
                <div class="pagination-controls">
                    <button id="first-page-btn" class="btn pagination-btn" title="Prima pagina">⏮️</button>
                    <button id="prev-page-btn" class="btn pagination-btn" title="Pagina precedente">⬅️</button>
                    <div class="pagination-pages" id="pagination-pages">
                        <!-- Numeri di pagina dinamici -->
                    </div>
                    <button id="next-page-btn" class="btn pagination-btn" title="Pagina successiva">➡️</button>
                    <button id="last-page-btn" class="btn pagination-btn" title="Ultima pagina">⏭️</button>
                </div>
                <div class="pagination-goto">
                    <label for="goto-page-input">Vai alla pagina:</label>
                    <input type="number" id="goto-page-input" min="1" max="1" value="1">
                    <button id="goto-page-btn" class="btn">Vai</button>
                </div>
                <div class="pagination-size">
                    <label for="page-size-select">Record per pagina:</label>
                    <select id="page-size-select">
                        <option value="10" selected>10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                </div>
            </div>
        `;
        
        // Inserisce dopo la tabella
        const table = document.querySelector('.styled-table');
        if (table && table.parentNode) {
            table.parentNode.insertBefore(container, table.nextSibling);
        }
        
        this.paginationContainer = container;
    }

    // Collega gli eventi
    #bindEvents() {
        this.pageInfo = document.getElementById('pagination-info-text');
        this.prevBtn = document.getElementById('prev-page-btn');
        this.nextBtn = document.getElementById('next-page-btn');
        this.firstBtn = document.getElementById('first-page-btn');
        this.lastBtn = document.getElementById('last-page-btn');
        this.pageSizeSelect = document.getElementById('page-size-select');
        const gotoInput = document.getElementById('goto-page-input');
        const gotoBtn = document.getElementById('goto-page-btn');

        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prevPage());
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextPage());
        }
        
        if (this.firstBtn) {
            this.firstBtn.addEventListener('click', () => this.firstPage());
        }
        
        if (this.lastBtn) {
            this.lastBtn.addEventListener('click', () => this.lastPage());
        }

        if (this.pageSizeSelect) {
            this.pageSizeSelect.addEventListener('change', (e) => {
                this.changePageSize(parseInt(e.target.value));
            });
        }

        if (gotoBtn && gotoInput) {
            gotoBtn.addEventListener('click', () => {
                const page = parseInt(gotoInput.value);
                if (page >= 1 && page <= this.totalPages) {
                    this.loadPage(page);
                }
            });
            
            gotoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    gotoBtn.click();
                }
            });
        }
    }

    // Carica una pagina specifica
    async loadPage(page = 1) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.#updateLoadingState(true);
        
        try {
            const result = await this.#fetchRecordsPaginated(page, this.limit);
            
            this.currentPage = result.pagination.page;
            this.totalPages = result.pagination.totalPages;
            this.totalRecords = result.pagination.total;

            // Aggiorna la tabella con i nuovi dati
            this.tableManager.setData(result.data);
            
            // Aggiorna i controlli di paginazione
            this.updatePaginationControls();
            
            return result;
        } catch (error) {
            console.error('Errore nel caricamento della pagina:', error);
            toast.error('Errore nel caricamento dei dati');
        } finally {
            this.isLoading = false;
            this.#updateLoadingState(false);
        }
    }

    async #fetchRecordsPaginated(page = 1, limit = 50) {
        try {
            const response = await this.expensesService.getPaginatedUserExpenses(page, limit);
            if (!response.success) {
                toast.error("Errore nel recupero dei dati: " + response.message);
                throw new Error(`HTTP error! status: ${response.success}`);
            }
            return response;
        } catch (error) {
            console.error('Errore nel fetch paginato dei record:', error);
            throw new Error(`${error}`);
        }
    }

    // Naviga alla pagina successiva
    async nextPage() {
        if (this.currentPage < this.totalPages) {
            return await this.loadPage(this.currentPage + 1);
        }
    }

    // Naviga alla pagina precedente
    async prevPage() {
        if (this.currentPage > 1) {
            return await this.loadPage(this.currentPage - 1);
        }
    }

    // Naviga alla prima pagina
    async firstPage() {
        return await this.loadPage(1);
    }

    // Naviga all'ultima pagina
    async lastPage() {
        return await this.loadPage(this.totalPages);
    }

    // Cambia il numero di record per pagina
    async changePageSize(newSize) {
        this.limit = newSize;
        // Calcola la nuova pagina per mantenere circa la stessa posizione
        const currentRecord = (this.currentPage - 1) * this.limit + 1;
        const newPage = Math.ceil(currentRecord / newSize);
        return await this.loadPage(newPage);
    }

    // Aggiorna i controlli di paginazione
    updatePaginationControls() {
        // Aggiorna le informazioni sulla pagina
        if (this.pageInfo) {
            const start = (this.currentPage - 1) * this.limit + 1;
            const end = Math.min(this.currentPage * this.limit, this.totalRecords);
            this.pageInfo.textContent = `${start}-${end} di ${this.totalRecords} record (Pagina ${this.currentPage} di ${this.totalPages})`;
        }
        
        // Aggiorna lo stato dei bottoni
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (this.nextBtn) {
            this.nextBtn.disabled = this.currentPage >= this.totalPages;
        }
        
        if (this.firstBtn) {
            this.firstBtn.disabled = this.currentPage <= 1;
        }
        
        if (this.lastBtn) {
            this.lastBtn.disabled = this.currentPage >= this.totalPages;
        }

        // Aggiorna l'input "Vai alla pagina"
        const gotoInput = document.getElementById('goto-page-input');
        if (gotoInput) {
            gotoInput.max = this.totalPages;
            gotoInput.value = this.currentPage;
        }

        // Aggiorna i numeri di pagina
        this.updatePageNumbers();
    }

    // Aggiorna i numeri di pagina clickable
    updatePageNumbers() {
        const pagesContainer = document.getElementById('pagination-pages');
        if (!pagesContainer) return;

        pagesContainer.innerHTML = '';

        // Calcola quali pagine mostrare
        const showPages = this.calculatePageRange();
        
        showPages.forEach(pageNum => {
            if (pageNum === '...') {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '...';
                pagesContainer.appendChild(ellipsis);
            } else {
                const pageBtn = document.createElement('button');
                pageBtn.className = `btn pagination-page ${pageNum === this.currentPage ? 'active' : ''}`;
                pageBtn.textContent = pageNum;
                pageBtn.addEventListener('click', () => this.loadPage(pageNum));
                pagesContainer.appendChild(pageBtn);
            }
        });
    }

    // Calcola quali numeri di pagina mostrare
    calculatePageRange() {
        const totalPages = this.totalPages;
        const currentPage = this.currentPage;
        const maxVisible = 7; // Numero massimo di pagine visibili
        
        if (totalPages <= maxVisible) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        
        const pages = [];
        
        // Sempre mostra la prima pagina
        pages.push(1);
        
        let start = Math.max(2, currentPage - 2);
        let end = Math.min(totalPages - 1, currentPage + 2);
        
        // Aggiungi ellipsis se necessario
        if (start > 2) {
            pages.push('...');
        }
        
        // Aggiungi le pagine centrali
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        
        // Aggiungi ellipsis se necessario
        if (end < totalPages - 1) {
            pages.push('...');
        }
        
        // Sempre mostra l'ultima pagina (se non è la prima)
        if (totalPages > 1) {
            pages.push(totalPages);
        }
        
        return pages;
    }

    // Aggiorna lo stato di caricamento
    #updateLoadingState(isLoading) {
        const container = this.paginationContainer;
        if (container) {
            if (isLoading) {
                container.classList.add('loading');
            } else {
                container.classList.remove('loading');
            }
        }
        
        // Disabilita/abilita tutti i controlli durante il caricamento
        const controls = container?.querySelectorAll('button, select, input');
        controls?.forEach(control => {
            control.disabled = isLoading;
        });
    }

    // Ottiene informazioni sulla paginazione
    getInfo() {
        return {
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            totalRecords: this.totalRecords,
            limit: this.limit,
            hasNextPage: this.currentPage < this.totalPages,
            hasPrevPage: this.currentPage > 1,
            recordsStart: (this.currentPage - 1) * this.limit + 1,
            recordsEnd: Math.min(this.currentPage * this.limit, this.totalRecords)
        };
    }

    // Nasconde i controlli di paginazione
    #hide() {
        if (this.paginationContainer) {
            this.paginationContainer.style.display = 'none';
        }
    }

    // Mostra i controlli di paginazione
    #show() {
        if (this.paginationContainer) {
            this.paginationContainer.style.display = 'block';
        }
    }

    // Abilita/disabilita la paginazione
    setEnabled(enabled) {
        if (enabled) {
            this.#show();
        } else {
            this.#hide();
        }
    }
}

// Esporta classe, non istanza
export { PaginationService };

// Factory function per istanza singleton
export function createPaginationService(expensesService, tableManager) {
    return new PaginationService(expensesService, tableManager);
}

// Getter per istanza esistente
export function getPaginationService() {
    return PaginationService.instance;
}

