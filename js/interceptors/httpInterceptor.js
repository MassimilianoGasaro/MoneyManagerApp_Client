import toast from "../shared/toast.js";
import authManager from "../shared/auth.js";

class HttpInterceptor {
    constructor() {
        this.activeRequests = new Set();
        this.loadingElement = null;
        this.isGlobalLoadingEnabled = true;
        this.#createLoadingOverlay();
    }

    // Crea overlay di loading globale
    #createLoadingOverlay() {
        this.loadingElement = document.createElement('div');
        this.loadingElement.id = 'global-loading';
        this.loadingElement.className = 'global-loading hidden';
        this.loadingElement.innerHTML = `
            <div class="loading-backdrop">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <span class="loading-text">Caricamento...</span>
                </div>
            </div>
        `;
        document.body.appendChild(this.loadingElement);
    }

    // Mostra loading globale
    #showLoading(requestId) {
        this.activeRequests.add(requestId);
        if (this.isGlobalLoadingEnabled && this.activeRequests.size === 1) {
            this.loadingElement.classList.remove('hidden');
        }
    }

    // Nascondi loading globale
    #hideLoading(requestId) {
        this.activeRequests.delete(requestId);
        if (this.activeRequests.size === 0) {
            this.loadingElement.classList.add('hidden');
        }
    }

    // Gestione errori centralizzata
    #handleError(error, url, options = {}) {
        console.error(`HTTP Error on ${url}:`, error);
        
        const { showToast = true, customErrorHandler } = options;

        // Se c'è un handler personalizzato, usalo
        if (customErrorHandler && typeof customErrorHandler === 'function') {
            return customErrorHandler(error);
        }

        // Gestione errori standard
        if (error.name === 'TypeError' && !navigator.onLine) {
            if (showToast) {
                toast.error('❌ Connessione internet assente');
            }
            return { success: false, error: 'NETWORK_ERROR', message: 'Connessione internet assente' };
        }

        if (error.status) {
            switch (error.status) {
                case 400:
                    if (showToast) toast.error('❌ Richiesta non valida');
                    return { success: false, error: 'BAD_REQUEST', message: 'Richiesta non valida' };
                
                case 401:
                    if (showToast) toast.error('❌ Sessione scaduta');
                    authManager.logout();
                    return { success: false, error: 'UNAUTHORIZED', message: 'Sessione scaduta' };
                
                case 403:
                    if (showToast) toast.error('❌ Accesso negato');
                    return { success: false, error: 'FORBIDDEN', message: 'Accesso negato' };
                
                case 404:
                    if (showToast) toast.error('❌ Risorsa non trovata');
                    return { success: false, error: 'NOT_FOUND', message: 'Risorsa non trovata' };
                
                case 429:
                    if (showToast) toast.error('❌ Troppe richieste, riprova più tardi');
                    return { success: false, error: 'RATE_LIMIT', message: 'Troppe richieste' };
                
                case 500:
                    if (showToast) toast.error('❌ Errore del server');
                    return { success: false, error: 'SERVER_ERROR', message: 'Errore del server' };
                
                default:
                    if (showToast) toast.error(`❌ Errore HTTP ${error.status}`);
                    return { success: false, error: 'HTTP_ERROR', message: `Errore HTTP ${error.status}` };
            }
        }

        // Errore generico
        if (showToast) toast.error('❌ Errore di connessione');
        return { success: false, error: 'UNKNOWN_ERROR', message: 'Errore di connessione' };
    }

    // Metodo principale per le chiamate HTTP
    async request(url, options = {}) {
        const requestId = Date.now() + Math.random();
        const {
            showLoading = true,
            showToast = true,
            loadingText = 'Caricamento...',
            customErrorHandler,
            timeout = 30000,
            retries = 0,
            ...fetchOptions
        } = options;

        // Aggiorna il testo di loading
        if (showLoading && loadingText !== 'Caricamento...') {
            const loadingTextElement = this.loadingElement.querySelector('.loading-text');
            if (loadingTextElement) {
                loadingTextElement.textContent = loadingText;
            }
        }

        try {
            // Mostra loading
            if (showLoading) {
                this.#showLoading(requestId);
            }

            // Setup timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            // Headers di default con autorizzazione
            const defaultHeaders = {
                'Content-Type': 'application/json',
                ...authManager.getAuthHeaders(),
                ...fetchOptions.headers
            };

            // Configurazione fetch
            const config = {
                ...fetchOptions,
                headers: defaultHeaders,
                signal: controller.signal
            };

            // Esegui la richiesta
            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            // Controlla se la risposta è ok
            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}`);
                error.status = response.status;
                error.statusText = response.statusText;
                throw error;
            }

            // Parse della risposta
            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            return {
                success: true,
                data,
                status: response.status,
                headers: response.headers
            };

        } catch (error) {
            // Gestione retry
            if (retries > 0 && error.name !== 'AbortError') {
                console.log(`Retry ${retries} for ${url}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.request(url, { ...options, retries: retries - 1 });
            }

            // Gestione errore
            return this.#handleError(error, url, { showToast, customErrorHandler });

        } finally {
            // Nascondi loading
            if (showLoading) {
                this.#hideLoading(requestId);
            }
        }
    }

    // Metodi di convenienza
    async get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }

    async post(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }

    async patch(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    // Utility methods
    enableGlobalLoading() {
        this.isGlobalLoadingEnabled = true;
    }

    disableGlobalLoading() {
        this.isGlobalLoadingEnabled = false;
    }

    setLoadingText(text) {
        const loadingTextElement = this.loadingElement.querySelector('.loading-text');
        if (loadingTextElement) {
            loadingTextElement.textContent = text;
        }
    }
}

// Crea istanza globale
const httpInterceptor = new HttpInterceptor();

export default httpInterceptor;