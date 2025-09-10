import { ApiService } from './apiService.js';
class ExpensesService extends ApiService {
    #apiUrl = null;

    constructor() {
        super('activities');
        this.#apiUrl = this.endpoint;
    }

    async getListByUser(page = 1, limit = 50, getAllData = false) {
        console.log("Recupero lista spese per l'utente", { page, limit, getAllData });
        try {
            const params = new URLSearchParams();
            const userId = localStorage.getItem('user_id');
            if (userId) params.append('user_id', userId);
            
            // Se getAllData è true, recupera tutti i dati in una volta
            if (getAllData) {
                // Impostiamo un limite molto alto per ottenere tutti i dati
                params.append('page', '1');
                params.append('limit', '10000');
            } else {
                // Paginazione normale
                params.append('page', page.toString());
                params.append('limit', limit.toString());
            }
            
            const url = `${this.#apiUrl}/user?${params.toString()}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            const result = await response.json();
            
            // Restituisce la risposta completa con la nuova struttura
            return result;

        } catch (error) {
            console.error('Errore nel recupero della lista spese:', error);
            throw error;
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

            const params = new URLSearchParams();
            const userId = localStorage.getItem('user_id');
            if (userId) params.append('user_id', userId);

            const response = await fetch(`${this.#apiUrl}/${id}?${params.toString()}`, {
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

    // Metodo per ottenere tutti i dati senza paginazione (per compatibilità)
    async getAllUserExpenses() {
        return await this.getListByUser(1, 10000, true);
    }

    // Metodo per ottenere dati paginati con metadati completi
    async getPaginatedUserExpenses(page = 1, limit = 50) {
        try {
            const result = await this.getListByUser(page, limit, false);
            
            return result;
        } catch (error) {
            console.error('Errore:', error);
            throw error;
        }
    }

    // Metodo per ottenere tutti i dati concatenando le pagine (utile per grandi dataset)
    async getAllUserExpensesPaginated(limitPerPage = 100) {
        console.log("Recupero tutti i dati utilizzando la paginazione");
        try {
            let allData = [];
            let currentPage = 1;
            let hasMoreData = true;
            
            while (hasMoreData) {
                const result = await this.getPaginatedUserExpenses(currentPage, limitPerPage);
                
                if (result.success && result.data.length > 0) {
                    allData = allData.concat(result.data);
                    hasMoreData = result.pagination.hasNextPage;
                    currentPage++;
                } else {
                    hasMoreData = false;
                }
                
                // Protezione contro loop infiniti
                if (currentPage > 1000) {
                    console.warn("Limite massimo di pagine raggiunto");
                    break;
                }
            }
            
            return {
                success: true,
                data: allData,
                totalRecords: allData.length,
                message: "Tutti i dati recuperati con successo"
            };
            
        } catch (error) {
            console.error('Errore nel recupero di tutti i dati paginati:', error);
            throw error;
        }
    }
}

export default new ExpensesService();

