import { ApiService } from "./apiService.js";

export class HandleTypologies extends ApiService {
  constructor() {
    super("expense-types");
  }

  async getTypologies() {
    console.log("Recupero tipologie");
        try {

            const response = await fetch(`${this.endpoint}/all`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            return await response.json();

        } catch (error) {
            console.error('Errore nel recupero delle tipologie:', error);
            throw error; // Rilancia l'errore per gestirlo nel chiamante
        }
  }

  // Metodo per ottenere solo le tipologie di spesa (uscite)
  async getExpenseTypologies() {
    console.log("Recupero tipologie di spesa");
    try {
        const response = await fetch(`${this.endpoint}?type=expense`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        return await response.json();

    } catch (error) {
        console.error('Errore nel recupero delle tipologie di spesa:', error);
        throw error;
    }
  }

  // Metodo per ottenere solo le tipologie di entrata
  async getIncomeTypologies() {
    console.log("Recupero tipologie di entrata");
    try {
        const response = await fetch(`${this.endpoint}?type=income`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        return await response.json();

    } catch (error) {
        console.error('Errore nel recupero delle tipologie di entrata:', error);
        throw error;
    }
  }

}