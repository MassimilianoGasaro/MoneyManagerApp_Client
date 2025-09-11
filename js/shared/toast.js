// Sistema di Toast globale
class ToastManager {
    constructor() {
        this.#createToastContainer();
    }

    #createToastContainer() {
        // Crea il contenitore dei toast se non esiste
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }

    #show(message, type = 'info', duration = 3000, callback = null) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Aggiungi il toast al contenitore
        const container = document.getElementById('toast-container');
        container.appendChild(toast);

        // Animazione di entrata
        setTimeout(() => toast.classList.add('toast-show'), 100);

        // Rimozione automatica
        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => {
                if (toast.parentElement) toast.remove()
                if (callback && typeof callback === "function") callback();
            }, 300);
        }, duration);

        return toast;
    }

    success(message, duration = 3000, callback = null) {
        return this.#show(message, 'success', duration, callback);
    }

    error(message, duration = 5000, callback = null) {
        return this.#show(message, 'error', duration, callback);
    }

    warning(message, duration = 4000, callback = null) {
        return this.#show(message, 'warning', duration, callback);
    }

    info(message, duration = 3000, callback = null) {
        return this.#show(message, 'info', duration, callback);
    }
}

// Crea un'istanza globale
export default new ToastManager();
