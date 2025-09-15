import { ApiService } from './apiService.js';
import httpInterceptor from '../interceptors/httpInterceptor.js';

class AuthService extends ApiService {
    #apiUrl = null;

    constructor() {
        super('auth');
        this.#apiUrl = this.endpoint;
    }

    async login(body) {
        // logica di login
        try {
            const response = await httpInterceptor.post(`${this.#apiUrl}/login`, body, {
                showLoading: true,
                showToast: true,
                loadingText: 'Login in corso...',
                timeout: 15000
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
            throw error; 
        }
    }

    async register(body) {
        // logica di register
        try {
            const response = await httpInterceptor.post(`${this.#apiUrl}/register`, body, {
                showLoading: true,
                showToast: true,
                loadingText: 'Registrazione in corso...',
                timeout: 15000
            });
            
            const res = await response.json();

            return res;
        } catch (error) {
            console.error('Errore durante la registrazione:', error);
            throw error; 
        }
    }

    async logout() {
        // logica di logout
        try {
            const response = await httpInterceptor.post(`${this.#apiUrl}/logout`, {
                showLoading: true,
                showToast: true,
                loadingText: 'Logout in corso...',
                timeout: 15000
            });
            
            return response.json();

        } catch (error) {
            console.error('Errore durante il logout:', error.message);
            throw error;
        }
    }
}

// Esporta un'istanza della classe
export default new AuthService();

