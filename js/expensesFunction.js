export async function getListByUser() {
    console.log("Recupero lista spese per l'utente");
    try {

        const params = new URLSearchParams();
        const userId = localStorage.getItem('user_id');
        if (userId) params.append('user_id', userId);
        
        const url = `http://localhost:3000/api/dashboard/user?${params.toString()}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        const res = await response.json();
        
        return res;

    } catch (error) {
        console.error('Errore nel recupero della lista spese:', error);
        throw error; // Rilancia l'errore per gestirlo nel chiamante
    }

}

export async function addExpense(expense) {
    console.log("Aggiungi spesa:", expense);
    const response = await fetch('http://localhost:3001/api/expenses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(expense)
    });

    return response.json();
}
