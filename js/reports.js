import { getHeaderAndFooter } from "./import.js";
import { HandleExpenses } from './expensesFunction.js';
import toast from "./toast.js";

// Istanza globale del servizio API
const expensesService = new HandleExpenses();

// Variabili globali
let currentChart = null;
let allExpenses = [];
let chartPopup = null;
let periodPopup = null;
let currentReportType = null;

// Configurazione dei tipi di report
const REPORT_TYPES = {
    'monthly-expenses': {
        title: 'Spese per Mese',
        type: 'bar',
        generator: generateMonthlyExpensesChart
    },
    'category-expenses': {
        title: 'Spese per Categoria',
        type: 'pie',
        generator: generateCategoryExpensesChart
    },
    'trend-analysis': {
        title: 'Andamento Temporale',
        type: 'line',
        generator: generateTrendAnalysisChart
    },
    'top-expenses': {
        title: 'Top Spese',
        type: 'bar',
        generator: generateTopExpensesChart
    },
    'yearly-comparison': {
        title: 'Confronto Annuale',
        type: 'bar',
        generator: generateYearlyComparisonChart
    },
    'budget-analysis': {
        title: 'Analisi Budget',
        type: 'doughnut',
        generator: generateBudgetAnalysisChart
    }
};

// Inizializzazione dell'applicazione
async function init() {
    try {
        // Carica header e footer
        getHeaderAndFooter();
        
        // Carica i dati delle spese
        await loadExpensesData();
        
        // Aggiorna le statistiche delle cards
        updateCardStats();
        
        // Inizializza gli event listeners
        initializeEventListeners();
        
    } catch (error) {
        console.error('Errore nell\'inizializzazione:', error);
        toast.error('Errore nel caricamento dei dati');
    }
}

// Carica i dati delle spese
async function loadExpensesData() {
    try {
        const response = await expensesService.getListByUser();
        if (response.success) {
            allExpenses = response.data || [];
            console.log('Spese caricate:', allExpenses.length);
        } else {
            console.error('Errore nel caricamento delle spese:', response.message);
            allExpenses = [];
        }
    } catch (error) {
        console.error('Errore nel caricamento delle spese:', error);
        allExpenses = [];
    }
}

// Ricarica i dati e aggiorna le statistiche
async function refreshData() {
    await loadExpensesData();
    updateCardStats();
    toast.success('Dati aggiornati');
}

// Aggiorna le statistiche delle cards
function updateCardStats() {
    if (allExpenses.length === 0) return;
    
    // Statistiche per "Spese per Mese"
    const lastMonthTotal = calculateLastMonthTotal();
    document.getElementById('last-month-total').textContent = `€ ${lastMonthTotal.toFixed(2)}`;
    
    // Statistiche per "Spese per Categoria"
    const categories = [...new Set(allExpenses.map(exp => exp.type))];
    document.getElementById('active-categories').textContent = categories.length;
    
    // Statistiche per "Andamento Temporale"
    const trend = calculateTrend();
    const trendElement = document.getElementById('trend-direction');
    trendElement.textContent = trend.direction;
    trendElement.className = `stat-value ${trend.class}`;
    
    // Statistiche per "Top Spese"
    const maxExpense = Math.max(...allExpenses.map(exp => exp.amount));
    document.getElementById('max-expense').textContent = `€ ${maxExpense.toFixed(2)}`;
    
    // Statistiche per "Confronto Annuale"
    const yearlyChange = calculateYearlyChange();
    const yearlyElement = document.getElementById('yearly-change');
    yearlyElement.textContent = `${yearlyChange.percentage}%`;
    yearlyElement.className = `stat-value ${yearlyChange.class}`;
    
    // Statistiche per "Budget Analysis"
    const budgetUsage = calculateBudgetUsage();
    const budgetElement = document.getElementById('budget-usage');
    budgetElement.textContent = `${budgetUsage}%`;
    budgetElement.className = `stat-value ${budgetUsage > 80 ? 'negative' : budgetUsage > 50 ? 'neutral' : 'positive'}`;
}

// Calcola il totale del mese scorso
function calculateLastMonthTotal() {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    return allExpenses
        .filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === lastMonth.getMonth() && 
                   expDate.getFullYear() === lastMonth.getFullYear();
        })
        .reduce((total, exp) => total + exp.amount, 0);
}

// Calcola la tendenza
function calculateTrend() {
    if (allExpenses.length < 2) return { direction: 'N/A', class: 'neutral' };
    
    const sortedExpenses = allExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));
    const recent = sortedExpenses.slice(-5);
    const older = sortedExpenses.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, exp) => sum + exp.amount, 0) / recent.length;
    const olderAvg = older.reduce((sum, exp) => sum + exp.amount, 0) / older.length;
    
    if (recentAvg > olderAvg) {
        return { direction: '↗️ In aumento', class: 'negative' };
    } else if (recentAvg < olderAvg) {
        return { direction: '↘️ In diminuzione', class: 'positive' };
    } else {
        return { direction: '➡️ Stabile', class: 'neutral' };
    }
}

// Calcola il cambiamento annuale
function calculateYearlyChange() {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    const currentYearExpenses = allExpenses
        .filter(exp => new Date(exp.date).getFullYear() === currentYear)
        .reduce((total, exp) => total + exp.amount, 0);
    
    const lastYearExpenses = allExpenses
        .filter(exp => new Date(exp.date).getFullYear() === lastYear)
        .reduce((total, exp) => total + exp.amount, 0);
    
    if (lastYearExpenses === 0) return { percentage: 0, class: 'neutral' };
    
    const change = ((currentYearExpenses - lastYearExpenses) / lastYearExpenses) * 100;
    
    return {
        percentage: change.toFixed(1),
        class: change > 0 ? 'negative' : change < 0 ? 'positive' : 'neutral'
    };
}

// Calcola l'utilizzo del budget (mockup)
function calculateBudgetUsage() {
    const monthlyBudget = 1000; // Budget fisso per esempio
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthExpenses = allExpenses
        .filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === currentMonth && 
                   expDate.getFullYear() === currentYear;
        })
        .reduce((total, exp) => total + exp.amount, 0);
    
    return Math.min(Math.round((currentMonthExpenses / monthlyBudget) * 100), 100);
}

// Inizializza gli event listeners
function initializeEventListeners() {
    // Event listener per le cards
    document.querySelectorAll('.report-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const reportType = e.currentTarget.dataset.report;
            openReportPopup(reportType);
        });
    });
    
    // Event listener per il refresh dati
    document.getElementById('refresh-data').addEventListener('click', refreshData);
    
    // Event listener per i popup
    chartPopup = document.getElementById('chart-popup');
    periodPopup = document.getElementById('period-popup');
    
    // Chiusura popup
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            chartPopup.style.display = 'none';
            periodPopup.style.display = 'none';
            if (currentChart) {
                currentChart.destroy();
                currentChart = null;
            }
        });
    });
    
    // Click fuori dal popup per chiudere
    chartPopup.addEventListener('click', (e) => {
        if (e.target === chartPopup) {
            chartPopup.style.display = 'none';
            if (currentChart) {
                currentChart.destroy();
                currentChart = null;
            }
        }
    });
    
    // Export chart
    document.getElementById('export-chart').addEventListener('click', exportChart);
    
    // Change period
    document.getElementById('change-period').addEventListener('click', () => {
        periodPopup.style.display = 'block';
    });
    
    // Period form
    document.getElementById('period-form').addEventListener('submit', (e) => {
        e.preventDefault();
        applyPeriodFilter();
    });
    
    document.querySelector('.cancel-btn').addEventListener('click', () => {
        periodPopup.style.display = 'none';
    });
}

// Apre il popup per un report specifico
function openReportPopup(reportType) {
    const reportConfig = REPORT_TYPES[reportType];
    if (!reportConfig) {
        toast.error('Tipo di report non riconosciuto');
        return;
    }
    
    // Memorizza il tipo di report corrente
    currentReportType = reportType;
    
    // Aggiorna il titolo
    document.getElementById('chart-title').textContent = reportConfig.title;
    
    // Mostra il popup
    chartPopup.style.display = 'block';
    
    // Mostra loading
    showChartLoading();
    
    // Genera il grafico
    setTimeout(() => {
        generateChart(reportType, reportConfig);
    }, 500);
}

// Mostra il loading nel grafico
function showChartLoading() {
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.innerHTML = `
        <div class="chart-loading">
            <div class="spinner"></div>
            <p>Generazione grafico...</p>
        </div>
    `;
}

// Genera il grafico
function generateChart(reportType, config, expenses = null) {
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.innerHTML = '<canvas id="report-chart"></canvas>';
    
    const ctx = document.getElementById('report-chart').getContext('2d');
    
    // Usa le spese filtrate se fornite, altrimenti usa tutte le spese
    const expensesToUse = expenses || allExpenses;
    
    try {
        const chartData = config.generator(expensesToUse);
        
        currentChart = new Chart(ctx, {
            type: config.type,
            data: chartData,
            options: getChartOptions(config.type)
        });
        
    } catch (error) {
        console.error('Errore nella generazione del grafico:', error);
        chartContainer.innerHTML = `
            <div class="chart-loading">
                <p>❌ Errore nella generazione del grafico</p>
            </div>
        `;
        toast.error('Errore nella generazione del grafico');
    }
}

// Genera dati per il grafico delle spese mensili
function generateMonthlyExpensesChart(expenses) {
    if (!expenses || expenses.length === 0) {
        return {
            labels: ['Nessun dato'],
            datasets: [{
                label: 'Spese Mensili',
                data: [0],
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        };
    }
    
    const monthlyData = {};
    
    expenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey] += expense.amount;
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    
    return {
        labels: sortedMonths.map(month => {
            const [year, monthNum] = month.split('-');
            const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
            return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
        }),
        datasets: [{
            label: 'Spese Mensili',
            data: sortedMonths.map(month => monthlyData[month]),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };
}

// Genera dati per il grafico delle categorie
function generateCategoryExpensesChart(expenses) {
    if (!expenses || expenses.length === 0) {
        return {
            labels: ['Nessun dato'],
            datasets: [{
                data: [1],
                backgroundColor: ['#cccccc'],
                borderWidth: 1
            }]
        };
    }
    
    const categoryData = {};
    
    expenses.forEach(expense => {
        const category = expense.type || 'Senza Categoria';
        if (!categoryData[category]) {
            categoryData[category] = 0;
        }
        categoryData[category] += expense.amount;
    });
    
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];
    
    return {
        labels: Object.keys(categoryData),
        datasets: [{
            data: Object.values(categoryData),
            backgroundColor: colors.slice(0, Object.keys(categoryData).length),
            borderWidth: 1
        }]
    };
}

// Genera dati per l'andamento temporale
function generateTrendAnalysisChart(expenses) {
    const dailyData = {};
    
    expenses.forEach(expense => {
        const date = new Date(expense.date).toISOString().split('T')[0];
        if (!dailyData[date]) {
            dailyData[date] = 0;
        }
        dailyData[date] += expense.amount;
    });
    
    const sortedDates = Object.keys(dailyData).sort();
    
    return {
        labels: sortedDates.map(date => new Date(date).toLocaleDateString('it-IT')),
        datasets: [{
            label: 'Spese Giornaliere',
            data: sortedDates.map(date => dailyData[date]),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            tension: 0.4
        }]
    };
}

// Genera dati per le top spese
function generateTopExpensesChart(expenses) {
    const topExpenses = expenses
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);
    
    return {
        labels: topExpenses.map(exp => exp.title || exp.name || 'Senza nome'),
        datasets: [{
            label: 'Importo',
            data: topExpenses.map(exp => exp.amount),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
        }]
    };
}

// Genera dati per il confronto annuale
function generateYearlyComparisonChart(expenses) {
    const yearlyData = {};
    
    expenses.forEach(expense => {
        const year = new Date(expense.date).getFullYear();
        if (!yearlyData[year]) {
            yearlyData[year] = 0;
        }
        yearlyData[year] += expense.amount;
    });
    
    const sortedYears = Object.keys(yearlyData).sort();
    
    return {
        labels: sortedYears,
        datasets: [{
            label: 'Spese Annuali',
            data: sortedYears.map(year => yearlyData[year]),
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
        }]
    };
}

// Genera dati per l'analisi budget
function generateBudgetAnalysisChart(expenses) {
    const monthlyBudget = 1000;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthExpenses = expenses
        .filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === currentMonth && 
                   expDate.getFullYear() === currentYear;
        })
        .reduce((total, exp) => total + exp.amount, 0);
    
    const remaining = Math.max(0, monthlyBudget - currentMonthExpenses);
    
    return {
        labels: ['Speso', 'Rimanente'],
        datasets: [{
            data: [currentMonthExpenses, remaining],
            backgroundColor: [
                currentMonthExpenses > monthlyBudget ? '#FF6384' : '#36A2EB',
                '#4BC0C0'
            ],
            borderWidth: 1
        }]
    };
}

// Ottieni le opzioni del grafico
function getChartOptions(type) {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        if (type === 'pie' || type === 'doughnut') {
                            return context.label + ': €' + context.parsed.toFixed(2);
                        }
                        return context.dataset.label + ': €' + context.parsed.toFixed(2);
                    }
                }
            }
        }
    };
    
    if (type === 'bar' || type === 'line') {
        commonOptions.scales = {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return '€' + value.toFixed(2);
                    }
                }
            }
        };
    }
    
    return commonOptions;
}

// Esporta il grafico
function exportChart() {
    if (!currentChart) {
        toast.error('Nessun grafico da esportare');
        return;
    }
    
    try {
        const canvas = document.getElementById('report-chart');
        const link = document.createElement('a');
        link.download = 'report-chart.png';
        link.href = canvas.toDataURL();
        link.click();
        
        toast.success('Grafico esportato con successo!');
    } catch (error) {
        console.error('Errore nell\'esportazione del grafico:', error);
        toast.error('Errore nell\'esportazione del grafico');
    }
}

// Applica il filtro per periodo
function applyPeriodFilter() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
        toast.error('Inserisci entrambe le date');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        toast.error('La data di inizio deve essere precedente alla data di fine');
        return;
    }
    
    // Filtra le spese per il periodo selezionato
    const filteredExpenses = allExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
    });
    
    // Rigenera il grafico con i dati filtrati
    if (currentChart) {
        const reportType = getCurrentReportType();
        const config = REPORT_TYPES[reportType];
        
        currentChart.destroy();
        
        setTimeout(() => {
            generateChart(reportType, config, filteredExpenses);
        }, 100);
    }
    
    periodPopup.style.display = 'none';
    toast.success('Filtro periodo applicato');
}

// Ottieni il tipo di report corrente
function getCurrentReportType() {
    return currentReportType || Object.keys(REPORT_TYPES)[0];
}

// Avvia l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', init);
