export function isAuthenticated() {
    return localStorage.getItem('authToken') !== null;
}

export function redirectToLogin() {
    window.location.href = 'login.html';
}

export function getAuthToken() {
    return localStorage.getItem('authToken');
}