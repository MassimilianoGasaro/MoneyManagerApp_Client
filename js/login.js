import { getHeaderAndFooter } from "./shared/header.js";
import usersFunctions from "./services/authService.js";
import toast from "./shared/toast.js";
import authManager from "./shared/auth.js";

// Funzione per il toggle della visibilità della pwd
function initializePasswordToggles() {
    // Trova tutti i bottoni per toggle password
    const toggleButtons = document.querySelectorAll('.password-toggle');
    
    toggleButtons.forEach(button => {
        // Inizializza stato
        button.setAttribute('data-visible', 'false');
        
        // Aggiungi event listener
        button.addEventListener('click', (e) => {
            e.preventDefault();
            togglePasswordVisibility(button);
        });
        
        // Gestisci accessibilità
        button.setAttribute('aria-label', 'Mostra password');
        button.setAttribute('tabindex', '0');
        
        // Keyboard support
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePasswordVisibility(button);
            }
        });
    });
}

function togglePasswordVisibility(toggleButton) {
    const targetId = toggleButton.getAttribute('data-target');
    const passwordInput = document.getElementById(targetId);
    const isCurrentlyVisible = toggleButton.getAttribute('data-visible') === 'true';
    
    if (!passwordInput) {
        console.error(`Password input with id "${targetId}" not found`);
        return;
    }

    if (isCurrentlyVisible) {
        // Nascondi password
        passwordInput.type = 'password';
        toggleButton.setAttribute('data-visible', 'false');
        toggleButton.setAttribute('aria-label', 'Mostra password');
        toggleButton.title = 'Mostra password';
    } else {
        // Mostra password
        passwordInput.type = 'text';
        toggleButton.setAttribute('data-visible', 'true');
        toggleButton.setAttribute('aria-label', 'Nascondi password');
        toggleButton.title = 'Nascondi password';
    }

    // Mantieni il focus sull'input se era attivo
    if (document.activeElement === passwordInput) {
        passwordInput.focus();
    }
}

// Metodo per resettare tutti i toggle (utile per tab switching)
function resetAllToggles() {
    const toggleButtons = document.querySelectorAll('.password-toggle');
    toggleButtons.forEach(button => {
        const targetId = button.getAttribute('data-target');
        const passwordInput = document.getElementById(targetId);
        
        if (passwordInput) {
            passwordInput.type = 'password';
            button.setAttribute('data-visible', 'false');
            button.setAttribute('aria-label', 'Mostra password');
        }
    });
}

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

// Funzione per reset pwd
async function handleResetPwd(event) {
    event.preventDefault();
    
    try {

        const email = document.getElementById('reset-email').value;
    
        if (!email) {
            toast.error("Email non inserita correttamente");
            return;
        } 

        const body = {
            email: email,
        }

        const response = await usersFunctions.resetPwd(body);

        if (response.success) {
            toast.success('Reset avviato con successo! Controlla la casella di posta');
            authManager.redirectToLogin();
        } else {
            toast.error(response.message || 'Errore durante la registrazione');
        }

    } catch (error) {

    }

}

// Inizializzazione della pagina login
function initLogin() {
    // Carica header e footer
    getHeaderAndFooter();
    
    // Aggiungi event listener ai form
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const resetForm = document.getElementById('reset-form');

    // container
    const loginContainer = document.getElementById('login-container');
    const resetContainer = document.getElementById('reset-container');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        const forgetPwd = document.getElementById('forget-pwd');
        if (forgetPwd) forgetPwd.addEventListener('click', () => {
            loginContainer.style.display = "none";
            resetContainer.style.display = "block";
        });
    }
    
    if (registerForm) 
        registerForm.addEventListener('submit', handleRegister);

    if (resetForm)
        resetForm.addEventListener('submit', handleResetPwd);
    
    // Aggiungi event listener ai tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchTab(tabName);
        });
    });

    initializePasswordToggles();
    resetAllToggles();
}

// Avvia l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', initLogin);