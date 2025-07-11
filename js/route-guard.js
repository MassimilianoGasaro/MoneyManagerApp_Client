// Route Guard per proteggere le pagine
import authManager from './auth.js';

// Lista delle pagine protette
const protectedPages = [
    'dashboard.html',
    'reports.html',
    'expenses.html'
];

// Controlla se la pagina corrente è protetta
function isProtectedPage() {
    const currentPath = window.location.pathname;
    const fileName = currentPath.split('/').pop() || '';
    return protectedPages.includes(fileName);
}

// Inizializza il route guard
function initRouteGuard() {
    // Controlla l'autenticazione solo se siamo su una pagina protetta
    if (isProtectedPage()) {
        if (!authManager.checkAuth()) {
            return false; // Accesso negato
        }
    }
    
    return true; // Accesso consentito
}

// Esporta per l'uso nei moduli
export { initRouteGuard, isProtectedPage };
