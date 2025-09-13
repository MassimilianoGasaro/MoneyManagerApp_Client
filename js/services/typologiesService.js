import { ApiService } from "./apiService.js";
import httpInterceptor from "../interceptors/httpInterceptor.js";

class TypologiesService extends ApiService {
  constructor() {
    super("expense-types");
  }

  async getTypologies() {
    console.log("Recupero tipologie");
        try {

            const response = await httpInterceptor.get(`${this.endpoint}/all`, {
                showLoading: true,
                showToast: true,
                loadingText: 'Caricamento tipologie...',
                timeout: 15000
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
        const response = await httpInterceptor.get(`${this.endpoint}?type=expense`, {
            showLoading: true,
            showToast: true,
            loadingText: 'Caricamento tipologie...',
            timeout: 15000
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
        const response = await httpInterceptor.get(`${this.endpoint}?type=income`, {
            showLoading: true,
            showToast: true,
            loadingText: 'Caricamento tipologie...',
            timeout: 15000
        });

        return await response.json();

    } catch (error) {
        console.error('Errore nel recupero delle tipologie di entrata:', error);
        throw error;
    }
  }

}

export default new TypologiesService();