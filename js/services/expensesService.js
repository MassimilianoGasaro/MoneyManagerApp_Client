import { ApiService } from './apiService.js';
import httpInterceptor from '../interceptors/httpInterceptor.js';
class ExpensesService extends ApiService {
    #apiUrl = null;

    constructor() {
        super('activities');
        this.#apiUrl = this.endpoint;
    }

    async getListByUser(page = 1, limit = 50) {
        try {
            const params = {
                user_id: localStorage.getItem('user_id'),
                limit: limit,
                page: page
            }
            
            const url = `${this.#apiUrl}/user`;
            
            const response = await httpInterceptor.get(url, params, {
                showLoading: true,
                showToast: true,
                loadingText: 'Caricamento spese...',
                timeout: 15000
            });

            return await response.json();

        } catch (error) {
            throw error;
        }
    }

    async addExpense(expense) {
        try {
            const response = await httpInterceptor.post(`${this.#apiUrl}`, expense, {
                showLoading: true,
                showToast: true,
                loadingText: 'Aggiunta spesa...',
                timeout: 15000
            });
    
            return await response.json();

        } catch (error) {
            throw error;
        }
    }

    async getExpenseById(id) {
        try {
            const params = {
                user_id: localStorage.getItem('user_id'),
                limit: limit,
                page: page
            }
            
            const response = await httpInterceptor.get(`${this.#apiUrl}/${id}`, params, {
                showLoading: true,
                showToast: true,
                loadingText: 'Caricamento spesa...',
                timeout: 15000
            });

            return await response.json();
        } catch (error) {
            throw error; 
        }
    }

    async updateExpenseById(id, expense) {
        try {
            const params = new URLSearchParams();
            const userId = localStorage.getItem('user_id');
            if (userId) params.append('user_id', userId);

            const response = await httpInterceptor.put(`${this.#apiUrl}/${id}?${params.toString()}`, expense, {
                showLoading: true,
                showToast: true,
                loadingText: 'Aggiornamento spesa...',
                timeout: 15000
            });
    
            return await response.json();
        } catch (error) {
            throw error; 
        }
    }

    async deleteExpenseById(id) {
        try {
            const params = new URLSearchParams();
            const userId = localStorage.getItem('user_id');
            if (userId) params.append('user_id', userId);
            
            const response = await httpInterceptor.delete(`${this.#apiUrl}/${id}?${params.toString()}`, {
                showLoading: true,
                showToast: true,
                loadingText: 'Eliminazione spesa...',
                timeout: 15000
            });
    
            return await response.json();
        } catch (error) {
            throw error;
        }
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

