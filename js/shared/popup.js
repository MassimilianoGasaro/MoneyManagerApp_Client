export class DraggablePopup {
    // Private - dettagli implementativi
    #popup;
    #container;
    #header;
    #isDragging = false;
    #currentX = 0;
    #currentY = 0;
    #saveHandler = null;
    
    // Public - configurazioni esterne
    closeOnBackdropClick = true;
    animationDuration = 300;
    closeBtn = null;
    saveBtn = null;
    title = '';
    saveBtnText = 'Salva';
    closeBtnText = '×';
    onSave = null;
    onClose = null;
    onError = null;

    constructor(popupId, config = {}) {
        this.#popup = document.getElementById(popupId);
        this.#container = this.#popup.querySelector('.popup-container');
        this.#header = this.#popup.querySelector('.popup-header');
        this.closeBtn = this.#popup.querySelector('.close-btn');
        this.saveBtn = this.#popup.querySelector('.confirm-btn');
        
        // Applica configurazione iniziale
        this.configure(config);
        
        this.#isDragging = false;
        this.#currentX = 0;
        this.#currentY = 0;
        this.initialX = 0;
        this.initialY = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        
        this.#init();
    }
    
    #init() {
        // Event listeners per il dragging
        this.#header.addEventListener('mousedown', this.#dragStart.bind(this));
        document.addEventListener('mousemove', this.#drag.bind(this));
        document.addEventListener('mouseup', this.#dragEnd.bind(this));
        
        // Event listener per chiudere
        this.closeBtn.addEventListener('click', this.close.bind(this));
        this.#popup.addEventListener('click', (e) => {
            if (e.target === this.#popup) {
                this.close();
            }
        });
        
        // Supporto touch per dispositivi mobili
        this.#header.addEventListener('touchstart', this.#dragStart.bind(this));
        document.addEventListener('touchmove', this.#drag.bind(this));
        document.addEventListener('touchend', this.#dragEnd.bind(this));
    }
    
    #dragStart(e) {
        if (e.target === this.closeBtn) return;
        
        if (e.type === "touchstart") {
            this.initialX = e.touches[0].clientX - this.xOffset;
            this.initialY = e.touches[0].clientY - this.yOffset;
        } else {
            this.initialX = e.clientX - this.xOffset;
            this.initialY = e.clientY - this.yOffset;
        }
        
        if (e.target === this.#header || this.#header.contains(e.target)) {
            this.isDragging = true;
            this.#header.style.cursor = 'grabbing';
        }
    }
    
    #drag(e) {
        if (this.isDragging) {
            e.preventDefault();
            
            if (e.type === "touchmove") {
                this.currentX = e.touches[0].clientX - this.initialX;
                this.currentY = e.touches[0].clientY - this.initialY;
            } else {
                this.currentX = e.clientX - this.initialX;
                this.currentY = e.clientY - this.initialY;
            }
            
            this.xOffset = this.currentX;
            this.yOffset = this.currentY;
            
            this.setTranslate(this.currentX, this.currentY);
        }
    }
    
    #dragEnd() {
        this.initialX = this.currentX;
        this.initialY = this.currentY;
        this.isDragging = false;
        this.#header.style.cursor = 'grab';
    }
    
    setTranslate(xPos, yPos) {
        this.#container.style.transform = `translate(calc(-50% + ${xPos}px), calc(-50% + ${yPos}px))`;
    }
    
    open() {
        this.#popup.style.display = 'block';
        // Reset position
        this.currentX = 0;
        this.currentY = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        this.setTranslate(0, 0);
    }
    
    close() {
        this.#popup.style.display = 'none';
        
        // Chiama callback se definito
        if (this.onClose && typeof this.onClose === 'function') {
            this.onClose();
        }
    }

    // Metodo per configurare il popup
    configure(config = {}) {
        // Aggiorna le proprietà dalla configurazione
        if (config.title !== undefined) {
            this.title = config.title;
            this.#updateTitle();
        }
        
        if (config.saveBtnText !== undefined) {
            this.saveBtnText = config.saveBtnText;
            this.#updateSaveButton();
        }
        
        if (config.closeBtnText !== undefined) {
            this.closeBtnText = config.closeBtnText;
            this.#updateCloseButton();
        }
        
        if (config.closeOnBackdropClick !== undefined) {
            this.closeOnBackdropClick = config.closeOnBackdropClick;
        }
        
        if (config.animationDuration !== undefined) {
            this.animationDuration = config.animationDuration;
        }
        
        // Callback personalizzati
        if (config.onSave && typeof config.onSave === 'function') {
            this.onSave = config.onSave;
            this.#attachSaveCallback();
        }
        
        if (config.onClose && typeof config.onClose === 'function') {
            this.onClose = config.onClose;
        }
        
        if (config.onError && typeof config.onError === 'function') {
            this.onError = config.onError;
        }
    }

    // Metodi privati per aggiornare l'UI
    #updateTitle() {
        const titleElement = this.#header.querySelector('h3') || this.#header.querySelector('.popup-title');
        if (titleElement) {
            titleElement.textContent = this.title;
        } else if (this.title) {
            // Crea elemento titolo se non esiste
            const titleEl = document.createElement('h3');
            titleEl.className = 'popup-title';
            titleEl.textContent = this.title;
            this.#header.insertBefore(titleEl, this.closeBtn);
        }
    }

    #updateSaveButton() {
        if (this.saveBtn) {
            this.saveBtn.textContent = this.saveBtnText;
        }
    }

    #updateCloseButton() {
        if (this.closeBtn) {
            this.closeBtn.textContent = this.closeBtnText;
        }
    }

    #attachSaveCallback() {
        if (this.saveBtn && this.onSave) {
            // Rimuovi listener precedente se esiste
            if (this.#saveHandler) {
                this.saveBtn.removeEventListener('click', this.#saveHandler);
            }
            
            // Crea nuovo handler che supporta async/sync
            this.#saveHandler = async (e) => {
                e.preventDefault();
                
                try {
                    // Disabilita il bottone durante l'operazione
                    this.saveBtn.disabled = true;
                    this.saveBtn.textContent = 'Salvando...';
                    
                    // Esegui il callback (può essere sync o async)
                    const result = this.onSave(e);
                    
                    // Se è una Promise, aspetta il risultato
                    if (result instanceof Promise) {
                        await result;
                    }
                    
                    this.close();
                    
                } catch (error) {
                    
                    // Puoi gestire l'errore qui o rilanciarlo
                    if (this.onError && typeof this.onError === 'function') {
                        this.onError(error);
                    }
                    
                } finally {
                    // Riabilita il bottone
                    this.saveBtn.disabled = false;
                    this.saveBtn.textContent = this.saveBtnText;
                }
            };
            
            this.saveBtn.addEventListener('click', this.#saveHandler);
        }
    }

    // Metodi di utilità
    setContent(content) {
        const contentArea = this.#popup.querySelector('.popup-content');
        if (contentArea) {
            if (typeof content === 'string') {
                contentArea.innerHTML = content;
            } else {
                contentArea.innerHTML = '';
                contentArea.appendChild(content);
            }
        }
    }

    show(config = {}) {
        if (Object.keys(config).length > 0) {
            this.configure(config);
        }
        this.open();
    }

    // Metodo per pulire completamente l'istanza
    destroy() {
        // Rimuovi tutti gli event listeners
        this.#header.removeEventListener('mousedown', this.#dragStart.bind(this));
        document.removeEventListener('mousemove', this.#drag.bind(this));
        document.removeEventListener('mouseup', this.#dragEnd.bind(this));
        
        this.closeBtn.removeEventListener('click', this.close.bind(this));
        
        this.#header.removeEventListener('touchstart', this.#dragStart.bind(this));
        document.removeEventListener('touchmove', this.#drag.bind(this));
        document.removeEventListener('touchend', this.#dragEnd.bind(this));
        
        if (this.#saveHandler) {
            this.saveBtn.removeEventListener('click', this.#saveHandler);
            this.#saveHandler = null;
        }
        
        // Reset delle proprietà
        this.#isDragging = false;
        this.#currentX = 0;
        this.#currentY = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        this.onSave = null;
        this.onClose = null;
        this.onError = null;
    }

    // Metodo per resettare il form (se presente)
    resetForm() {
        const form = this.#popup.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

