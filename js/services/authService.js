import { ApiService } from './apiService.js';

class AuthService extends ApiService {
    #apiUrl = null;

    constructor() {
        super('auth');
        this.#apiUrl = this.endpoint;
    }

    async login(body) {
        // logica di login
        try {
            const response = await fetch(`${this.#apiUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            // Leggi il JSON una sola volta
            const res = await response.json();
            
            if (response.ok) {
                localStorage.setItem('authToken', res.data.token);
                localStorage.setItem('user_id', res.data.user.id);
            }
            
            return res;
        } catch (error) {
            console.error('Errore durante il login:', error);
            throw error; // Rilancia l'errore per gestirlo nel chiamante
        }
    }

    async register(body) {
        // logica di register
        try {
            const response = await fetch(`${this.#apiUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            const res = await response.json();
            return res;
        } catch (error) {
            console.error('Errore durante la registrazione:', error);
            throw error; // Rilancia l'errore per gestirlo nel chiamante
        }
    }

    async logout() {
        // logica di logout
        try {
            // Opzionale: chiamata al server per logout
            const response = await fetch(`${this.#apiUrl}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            return response.json();

        } catch (error) {
            console.error('Errore durante il logout:', error);
            throw error;
        }
    }
}

// Esporta un'istanza della classe
export default new AuthService();

