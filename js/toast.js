// Sistema di Toast globale
class ToastManager {
    constructor() {
        this.createToastContainer();
    }

    createToastContainer() {
        // Crea il contenitore dei toast se non esiste
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }

    show(message, type = 'info', duration = 3000) {
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
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, duration);

        return toast;
    }

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
}

// Crea un'istanza globale
const toast = new ToastManager();

// Esporta per l'uso nei moduli
export default toast;
