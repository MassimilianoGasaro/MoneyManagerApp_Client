import { getHeaderAndFooter } from "./import.js";
import usersFunctions from "./usersFunction.js";
import toast from "./toast.js";

// Funzione per gestire il login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const body = {
            email: email,
            password: password
        }
        
        const response = await usersFunctions.login(body);

        if (response.success) {
            toast.success('Login effettuato con successo!');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            toast.error(errorData.message || 'Credenziali non valide');
        }

    } catch (error) {
        console.error('Errore durante il login:', error);
        toast.error('Errore di connessione al server');
    }
}

// Funzione per gestire la registrazione
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const surname = document.getElementById('register-surname').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const body = {
            email: email,
            password: password,
            name: name,
            surname: surname
        }

        // {
        //     email: "massi@test.com",
        //     password: "Test123!!",
        //     name: "max",
        //     surname: "gasaro"
        // }
        
        const response = await usersFunctions.register(body);

        if (response.success) {
            toast.success('Registrazione completata con successo!');
            // Cambia automaticamente al tab di login
            switchTab('login');
        } else {
            toast.error(response.message || 'Errore durante la registrazione');
        }

    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        toast.error('Errore di connessione al server');
    }
}

// Funzione per cambiare tab
function switchTab(tabName) {
    // Rimuovi classe active da tutti i tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Rimuovi classe active da tutti i tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Aggiungi classe active al tab selezionato
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Inizializzazione della pagina login
function initLogin() {
    // Carica header e footer
    getHeaderAndFooter();
    
    // Aggiungi event listener ai form
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) 
        loginForm.addEventListener('submit', handleLogin);
    
    if (registerForm) 
        registerForm.addEventListener('submit', handleRegister);
    
    // Aggiungi event listener ai tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchTab(tabName);
        });
    });
}

// Avvia l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', initLogin);