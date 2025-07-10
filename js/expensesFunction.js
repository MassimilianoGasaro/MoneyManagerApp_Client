export function getList() {
    
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
