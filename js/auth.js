// Sistema di autenticazione per proteggere le rotte
class AuthManager {
    constructor() {
        this.publicRoutes = [
            'login.html',
            'index.html',
            '' // per la root
        ];
    }

    // Verifica se l'utente è autenticato
    isAuthenticated() {
        const token = localStorage.getItem('authToken');
        return token !== null && token !== undefined && token !== '';
    }

    // Ottieni il token
    getToken() {
        return localStorage.getItem('authToken');
    }

    // Verifica se la rotta corrente è pubblica
    isPublicRoute() {
        const currentPath = window.location.pathname;
        const fileName = currentPath.split('/').pop() || '';
        
        return this.publicRoutes.includes(fileName);
    }

    // Reindirizza al login
    redirectToLogin() {
        window.location.href = 'login.html';
    }

    // Reindirizza alla dashboard
    redirectToDashboard() {
        window.location.href = 'dashboard.html';
    }

    // Logout
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user_id');
        this.redirectToLogin();
    }

    // Controlla l'autenticazione per la rotta corrente
    checkAuth() {
        const isAuth = this.isAuthenticated();
        const isPublic = this.isPublicRoute();
        
        // Se non è autenticato e sta cercando di accedere a una rotta protetta
        if (!isAuth && !isPublic) {
            console.log('Accesso negato: token non valido');
            this.redirectToLogin();
            return false;
        }
        
        // Se è autenticato ma è sulla pagina di login, reindirizza alla dashboard
        if (isAuth && window.location.pathname.includes('login.html')) {
            this.redirectToDashboard();
            return false;
        }
        
        return true;
    }

    // Aggiungi header di autorizzazione alle richieste
    getAuthHeaders() {
        const token = this.getToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    // Wrapper per fetch con autenticazione
    async authenticatedFetch(url, options = {}) {
        const headers = {
            ...this.getAuthHeaders(),
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        // Se il token è scaduto o non valido
        if (response.status === 401 || response.status === 403) {
            this.logout();
            throw new Error('Token non valido o scaduto');
        }

        return response;
    }
}

// Crea un'istanza globale
const authManager = new AuthManager();

// Controlla l'autenticazione quando la pagina si carica
document.addEventListener('DOMContentLoaded', () => {
    authManager.checkAuth();
});

// Esporta per l'uso nei moduli
export default authManager;
