import { getHeaderAndFooter } from "./import.js";

// Funzione per gestire il login
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('http://localhost:3001/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('authToken', data.token);
            window.location.href = 'index.html';
        } else {
            document.getElementById('error-message').textContent = 'Credenziali non valide';
        }
    } catch (error) {
        console.error('Errore durante il login:', error);
        document.getElementById('error-message').textContent = 'Errore di connessione';
    }
}

// Inizializzazione della pagina login
function initLogin() {
    // Carica header e footer
    getHeaderAndFooter();
    
    // Aggiungi event listener al form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

// Avvia l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', initLogin);