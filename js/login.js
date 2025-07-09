import { getHeaderAndFooter } from "./import.js";
import usersFunctions from "./usersFunction.js";
import toast from "./toast.js";

// Funzione per gestire il login
async function handleLogin(event) {
    console.log('handled submit', event);
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // {
    // "email": "massi@test.com",
    // "password": "Test123!!"
    // }
    
    try {
        const body = {
            email: username,
            password: password
        }
        
        const response = await usersFunctions.login(body);

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('authToken', data.token);
            toast.success('Login effettuato con successo!');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            const errorData = await response.json();
            toast.error(errorData.message || 'Credenziali non valide');
        }

    } catch (error) {
        console.error('Errore durante il login:', error);
        toast.error('Errore di connessione al server');
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