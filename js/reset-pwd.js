import authService from "./services/authService.js";
import authManager from "./shared/auth.js";
import { getHeaderAndFooter } from "./shared/header.js";

// Reset Password Manager
class ResetPasswordManager {
    constructor() {
        this.token = null;
        this.isTokenValid = false;
        this.elements = {};
        
        this.initializeElements();
        this.extractTokenFromURL();
        this.validateResetToken(); 
    }

    initializeElements() {
        this.elements = {
            mainContent: document.getElementById('main-content'),
            tokenError: document.getElementById('token-error'),
            resetContainer: document.getElementById('reset-container'),
            successContainer: document.getElementById('success-container'),
            form: document.getElementById('reset-form'),
            newPassword: document.getElementById('reset-password'),
            confirmPassword: document.getElementById('reset-confirm-password'),
            passwordMatch: document.getElementById('password-match'),
            submitBtn: document.getElementById('submit-btn'),
            errorMessage: document.getElementById('error-message'),
        };
    }

    extractTokenFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.token = urlParams.get('token');
        
        if (!this.token) {
            this.showError('Token mancante nell\'URL. Il link potrebbe essere incompleto.');
            return;
        }
    }

    async validateResetToken() {
        if (!this.token) {
            this.showError('Nessun token fornito');
            return;
        }

        try {

            const response = await authService.checkValidityTokenForReset(this.token);

            if (response.success) {
                this.isTokenValid = true;
                this.showResetForm();
                this.initializeFormEvents();
            } else {
                this.showError(response.message || 'Token non valido o scaduto');
            }

        } catch (error) {
            this.showError('Errore di connessione al server. Riprova più tardi.');
        }
    }

    showError(message) {
        this.elements.mainContent.classList.remove('hidden');
        this.elements.resetContainer.classList.add('hidden');
        this.elements.successContainer.classList.add('hidden');
        
        this.elements.errorMessage.textContent = message;
        this.elements.tokenError.classList.remove('hidden');
    }

    showResetForm() {
        this.elements.mainContent.classList.remove('hidden');
        this.elements.tokenError.classList.add('hidden');
        this.elements.successContainer.classList.add('hidden');
        this.elements.resetContainer.classList.remove('hidden');
        
        // Focus sul primo input
        setTimeout(() => {
            this.elements.newPassword.focus();
        }, 100);
    }

    showSuccess() {
        this.elements.resetContainer.classList.add('hidden');
        this.elements.tokenError.classList.add('hidden');
        this.elements.successContainer.classList.remove('hidden');
    }

    initializeFormEvents() {
        // Password toggle
        const toggleButtons = document.querySelectorAll('.password-toggle');
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.togglePasswordVisibility(button);
            });
        });

        // Form validation
        this.elements.newPassword.addEventListener('input', () => this.validateForm());
        this.elements.confirmPassword.addEventListener('input', () => this.validateForm());

        // Form submission
        this.elements.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    togglePasswordVisibility(button) {
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    validateForm() {
        const newPassword = this.elements.newPassword.value;
        const confirmPassword = this.elements.confirmPassword.value;
        
        // Valida match password
        if (confirmPassword === '') {
            this.elements.passwordMatch.textContent = '';
            this.elements.passwordMatch.className = 'password-match';
        } else if (newPassword === confirmPassword) {
            this.elements.passwordMatch.textContent = '✓ Le password corrispondono';
            this.elements.passwordMatch.className = 'password-match match';
        } else {
            this.elements.passwordMatch.textContent = '✗ Le password non corrispondono';
            this.elements.passwordMatch.className = 'password-match no-match';
        }

        // Abilita/disabilita submit
        const isValid = newPassword.length >= 8 && 
                       newPassword === confirmPassword && 
                       this.isTokenValid;
        
        this.elements.submitBtn.disabled = !isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const newPassword = this.elements.newPassword.value;
        const confirmPassword = this.elements.confirmPassword.value;

        if (newPassword !== confirmPassword) {
            alert('Le password non corrispondono');
            return;
        }

        if (newPassword.length < 8) {
            alert('La password deve essere di almeno 8 caratteri');
            return;
        }

        try {
            this.elements.submitBtn.disabled = true;
            this.elements.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Aggiornamento...';

            const response = await fetch('http://localhost:3000/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: this.token,
                    newPassword: newPassword
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess();
            } else {
                throw new Error(result.message || 'Errore durante il reset');
            }

        } catch (error) {
            alert('Errore durante il reset della password. Riprova.');
            
            this.elements.submitBtn.disabled = false;
            this.elements.submitBtn.innerHTML = 'Conferma Reset';
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // header & footer
    getHeaderAndFooter();

    // redirect to login
    const redirectBtn = document.getElementById('back-btn');

    if (redirectBtn) 
        redirectBtn.addEventListener('click', () => {
            authManager.redirectToLogin();
        });

    new ResetPasswordManager();
});