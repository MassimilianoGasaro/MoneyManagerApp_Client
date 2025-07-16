import { ApiService } from './apiService.js';
class HandleExpenses extends ApiService {
    #apiUrl = null;

    constructor() {
        super('activities');
        this.#apiUrl = this.endpoint;
    }

    async getListByUser() {
        console.log("Recupero lista spese per l'utente");
        try {

            const params = new URLSearchParams();
            const userId = localStorage.getItem('user_id');
            if (userId) params.append('user_id', userId);
            
            const url = `${this.#apiUrl}/user?${params.toString()}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            return await response.json();

        } catch (error) {
            console.error('Errore nel recupero della lista spese:', error);
            throw error; // Rilancia l'errore per gestirlo nel chiamante
        }
    }

    async addExpense(expense) {
        // { 
        //     "name": "seconda spesa", 
        //     "amount": 10, 
        //     "description": "test", 
        //     "date": "2025-07-10T16:20:22.222", 
        //     "type": "spesa",
        //     "user_id": "65f4791f5194a6187a44619d"
        // }
        try {
            console.log("Aggiungi spesa:", expense);
            const response = await fetch(`${this.#apiUrl}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(expense)
            });
    
            return await response.json();
        } catch (error) {
            console.error('Errore nell\'inserimento del dato:', error);
            throw error; // Rilancia l'errore per gestirlo nel chiamante
        }
    }

    async getExpenseById(id) {
        // { 
        //     "id": "65f4791f5194a6187a44619d" 
        // }
        try {
            console.log("Recupero spesa per ID:", id);

            const params = new URLSearchParams();
            const userId = localStorage.getItem('user_id');
            if (userId) params.append('user_id', userId);
            
            const response = await fetch(`${this.#apiUrl}/${id}?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
            });

            return await response.json();
        } catch (error) {
            console.error('Errore nel recupero del dato:', error);
            throw error; // Rilancia l'errore per gestirlo nel chiamante
        }
    }

    async updateExpenseById(id, expense) {
        // { 
        //     "name": "seconda spesa", 
        //     "amount": 10, 
        //     "description": "prova modifica", 
        //     "date": "2025-07-10T16:20:22.222", 
        //     "type": "spesa",
        // }

        try {
            console.log("Aggiorna spesa con ID:", id, expense);
            const response = await fetch(`${this.#apiUrl}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(expense)
            });
    
            return await response.json();
        } catch (error) {
            console.error('Errore nell\'aggiornamento del dato:', error);
            throw error; // Rilancia l'errore per gestirlo nel chiamante
        }
    }

    async deleteExpenseById(id) {
        try {
            console.log("Elimina spesa con ID:", id);
            const params = new URLSearchParams();
            const userId = localStorage.getItem('user_id');
            if (userId) params.append('user_id', userId);
            
            const response = await fetch(`${this.#apiUrl}/${id}?${params.toString()}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
    
            return await response.json();
        } catch (error) {
            console.error('Errore nell\'eliminazione del dato:', error);
            throw error; // Rilancia l'errore per gestirlo nel chiamante
        }
    }
}

export { HandleExpenses };

