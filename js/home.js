import { getHeaderAndFooter } from './import.js';

function initHome() {
    // Carica header e footer
    getHeaderAndFooter();
    
}

// Avvia l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', initHome);