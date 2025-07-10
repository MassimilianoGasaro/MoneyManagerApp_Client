async function login(body) {
    // logica di login
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        // Leggi il JSON una sola volta
        const res = await response.json();
        
        if (response.ok) {
            localStorage.setItem('authToken', res.data.token);
            localStorage.setItem('user_id', res.data.user.id);
        }
        
        return res;
    } catch (error) {
        console.error('Errore durante il login:', error);
        throw error; // Rilancia l'errore per gestirlo nel chiamante
    }
}

async function register(body) {
    // logica di register
    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        return response;
    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        throw error; // Rilancia l'errore per gestirlo nel chiamante
    }
}

async function logout() {
    // logica di logout
    try {
        localStorage.removeItem('authToken');
        // Se hai bisogno di chiamare un endpoint di logout sul server:
        // const response = await fetch('http://localhost:3001/auth/logout', {
        //     method: 'POST',
        //     headers: {
        //         'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        //     }
        // });
        return true;
    } catch (error) {
        console.error('Errore durante il logout:', error);
        throw error;
    }
}

export default {
    login,
    register,
    logout
};