export class ApiService {
    #baseUrl = "http://localhost:3000/api";

    endpoint = null;

    constructor(endpoint) {
        this.endpoint = this.#createUrl(endpoint);
    }

    #createUrl = (endpoint) => {
        // Rimuovi gli slash iniziali dall'endpoint se presenti
        const cleanEndpoint = endpoint.replace(/^\/+/, '');
        
        // Assicurati che baseUrl non finisca con slash
        const cleanBaseUrl = this.#baseUrl.replace(/\/+$/, '');
        
        // Combina baseUrl e endpoint con un solo slash
        return `${cleanBaseUrl}/${cleanEndpoint}`;
    }
}