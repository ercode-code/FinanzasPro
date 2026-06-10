// =========================================
// 🧠 LÓGICA DEL TRACKER FINANCIERO PRO
// =========================================
import { db } from './firebase-config.js';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, orderBy, getDocs, writeBatch, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// --- DOM Elements ---
const balance = document.getElementById('total-balance');
const incomeEl = document.getElementById('total-income');
const expenseEl = document.getElementById('total-expense');
const list = document.getElementById('list');
const form = document.getElementById('transaction-form');
const description = document.getElementById('text');
const amount = document.getElementById('amount');
const btnIncome = document.getElementById('btn-add-income');
const btnExpense = document.getElementById('btn-add-expense');
const themeToggle = document.getElementById('theme-toggle');
const clearBtn = document.getElementById('clear-btn');
const toastContainer = document.getElementById('toast-container');

// Filtros y PDF
const filterStart = document.getElementById('filter-start');
const filterEnd = document.getElementById('filter-end');
const btnApplyFilter = document.getElementById('apply-filter');
const btnClearFilter = document.getElementById('clear-filter');
const btnExportPDF = document.getElementById('export-pdf-btn');
const currencySelector = document.getElementById('currency-selector');
const aiInsightText = document.getElementById('ai-insight-text');
const btnRefreshAI = document.getElementById('refresh-ai');

// --- Global State ---
let transactions = [];
let filteredTransactions = [];
let isFiltered = false;
let currentUser = null;
let unsubscribe = null;
let currentCurrency = 'CRC';
let currentLocale = 'es-CR';

const currencyConfig = {
    'USD': 'en-US',
    'MXN': 'es-MX',
    'COP': 'es-CO',
    'ARS': 'es-AR',
    'CRC': 'es-CR',
    'EUR': 'es-ES'
};

// Gráficos
let financeChart;
let trendChart;

// --- Funciones de Formateo ---
const formatCurrency = (num, type = null) => {
    const formatted = new Intl.NumberFormat(currentLocale, { 
        style: 'currency', 
        currency: currentCurrency,
        minimumFractionDigits: 2
    }).format(num);

    if (type === 'ingreso') return `+ ${formatted}`;
    if (type === 'gasto') return `- ${formatted}`;
    return formatted;
};

const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
};

const getShortDate = (dateString) => {
    const d = new Date(dateString);
    return `${d.getDate()}/${d.getMonth()+1}`;
};

// --- Toast Notifications ---
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.checked = true;
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.checked = false;
    }
}

themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    }
    updateChartsFromData(); // Redibujar con nuevos colores
});

// --- Core Logic ---
async function addTransaction(transactionType) {
    if (!currentUser) return;

    // 1. Capturar valores inmediatamente
    const textVal = description.value.trim();
    const amountVal = amount.value.trim();

    // 2. Validaciones básicas
    if (textVal === '' || amountVal === '') {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }

    if (+amountVal <= 0) {
        showToast('El monto debe ser mayor a 0', 'error');
        return;
    }

    // 3. ¡REINICIAR EL FORMULARIO YA! (Feedback instantáneo)
    form.reset();
    description.focus();

    // 4. Preparar objeto
    const transaction = {
        uid: currentUser.uid,
        text: textVal,
        amount: +amountVal,
        type: transactionType,
        date: new Date().toISOString()
    };

    try {
        // 5. Guardar en la nube
        await addDoc(collection(db, "transactions"), transaction);
        showToast('Transacción registrada', 'success');
        
        if(isFiltered) clearFilters();
    } catch (err) {
        console.error("Error al guardar:", err);
        showToast('Error al guardar en la nube', 'error');
    }
}

async function deleteTransaction(id) {
    try {
        await deleteDoc(doc(db, "transactions", id));
        showToast('Transacción eliminada', 'success');
    } catch (e) {
        showToast('Error al eliminar', 'error');
    }
}

async function clearAllTransactions() {
    if (transactions.length === 0 || !currentUser) return;
    
    if (confirm('¿Estás seguro de que deseas borrar absolutamente todo el historial?')) {
        try {
            const batch = writeBatch(db);
            const q = query(collection(db, "transactions"), where("uid", "==", currentUser.uid));
            const snapshot = await getDocs(q);
            snapshot.docs.forEach((docSnap) => {
                batch.delete(docSnap.ref);
            });
            await batch.commit();
            showToast('Historial borrado completamente', 'success');
        } catch (e) {
            showToast('Error al borrar el historial', 'error');
        }
    }
}

// --- Filtros ---
function applyFilters() {
    const start = filterStart.value ? new Date(filterStart.value) : null;
    let end = filterEnd.value ? new Date(filterEnd.value) : null;
    
    if (end) {
        // Asegurar que el filtro cubra hasta el final del día
        end.setHours(23, 59, 59, 999);
    }

    if (!start && !end) return;

    filteredTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        if (start && end) return tDate >= start && tDate <= end;
        if (start) return tDate >= start;
        if (end) return tDate <= end;
        return true;
    });

    isFiltered = true;
    btnClearFilter.style.display = 'inline-flex';
    updateDOM();
    showToast('Filtro aplicado', 'success');
}

function clearFilters() {
    filterStart.value = '';
    filterEnd.value = '';
    filteredTransactions = [...transactions];
    isFiltered = false;
    btnClearFilter.style.display = 'none';
    updateDOM();
}

// --- DOM Rendering ---
function renderTransaction(transaction) {
    const item = document.createElement('div');
    const isIncome = transaction.type === 'ingreso';
    const sign = isIncome ? '+' : '-';
    const iconClass = isIncome ? 'fa-arrow-down' : 'fa-arrow-up';

    item.classList.add('transaction-item', transaction.type);

    item.innerHTML = `
        <div class="item-info">
            <div class="item-icon">
                <i class="fa-solid ${iconClass}"></i>
            </div>
            <div class="item-details">
                <h4>${transaction.text}</h4>
                <small>${formatDate(transaction.date)}</small>
            </div>
        </div>
        <div class="item-amount">
            ${formatCurrency(transaction.amount, transaction.type)}
        </div>
        <button class="delete-btn" data-id="${transaction.id}" title="Eliminar">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;

    list.appendChild(item);
}

function updateDOM() {
    list.innerHTML = '';
    
    if (filteredTransactions.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:20px;">No hay transacciones en este periodo.</p>';
    } else {
        filteredTransactions.forEach(renderTransaction);
    }

    const income = filteredTransactions
        .filter(t => t.type === 'ingreso')
        .reduce((acc, t) => acc + t.amount, 0);

    const expense = filteredTransactions
        .filter(t => t.type === 'gasto')
        .reduce((acc, t) => acc + t.amount, 0);

    const total = income - expense;

    balance.innerText = formatCurrency(total);
    incomeEl.innerText = `+${formatCurrency(income)}`;
    expenseEl.innerText = `-${formatCurrency(expense)}`;

    updateChartsFromData(income, expense);
    updateAIAdvice(income, expense);
}

// --- Chart.js Integration ---
function updateChartsFromData(totalIncome = null, totalExpense = null) {
    
    // Si no se pasaron, calcularlos
    if (totalIncome === null) {
        totalIncome = filteredTransactions.filter(t => t.type === 'ingreso').reduce((acc, t) => acc + t.amount, 0);
        totalExpense = filteredTransactions.filter(t => t.type === 'gasto').reduce((acc, t) => acc + t.amount, 0);
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const colorIncome = '#10b981'; // Emerald
    const colorExpense = '#ef4444'; // Red
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    // 1. DOUGHNUT CHART (Proporción Mensual)
    const ctxFinance = document.getElementById('financeChart');
    if (ctxFinance) {
        if (financeChart) financeChart.destroy();
        
        if (totalIncome === 0 && totalExpense === 0) {
            financeChart = new Chart(ctxFinance, {
                type: 'doughnut',
                data: { labels: ['Sin datos'], datasets: [{ data: [1], backgroundColor: [gridColor], borderWidth: 0 }] },
                options: { cutout: '75%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
            });
        } else {
            financeChart = new Chart(ctxFinance, {
                type: 'doughnut',
                data: {
                    labels: ['Ingresos', 'Gastos'],
                    datasets: [{
                        data: [totalIncome, totalExpense],
                        backgroundColor: [colorIncome, colorExpense],
                        borderWidth: 2,
                        borderColor: isDark ? '#1e293b' : '#ffffff',
                    }]
                },
                options: { cutout: '75%', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor } } } }
            });
        }
    }

    // 2. BAR CHART (Tendencias Diarias)
    const ctxTrend = document.getElementById('trendChart');
    if (ctxTrend) {
        if (trendChart) trendChart.destroy();

        // Agrupar datos por fecha (tomar los últimos 7 días con actividad si hay muchos, o agrupar general)
        // Para simplicidad, agruparemos por "DD/MM" de los datos filtrados, ordenados cronológicamente
        
        const grouped = {};
        // Ordenamos cronológicamente (más viejo a más nuevo)
        const sortedTrans = [...filteredTransactions].sort((a,b) => new Date(a.date) - new Date(b.date));
        
        sortedTrans.forEach(t => {
            const d = getShortDate(t.date);
            if(!grouped[d]) grouped[d] = { i:0, e:0 };
            if(t.type === 'ingreso') grouped[d].i += t.amount;
            else grouped[d].e += t.amount;
        });

        const labels = Object.keys(grouped);
        const dataIncome = labels.map(l => grouped[l].i);
        const dataExpense = labels.map(l => grouped[l].e);

        if (labels.length === 0) {
             trendChart = new Chart(ctxTrend, {
                type: 'bar',
                data: { labels: ['Sin datos'], datasets: [{ data: [0] }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { y:{display:false}, x:{display:false} }, plugins:{legend:{display:false}} }
            });
        } else {
            trendChart = new Chart(ctxTrend, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Ingresos', data: dataIncome, backgroundColor: colorIncome, borderRadius: 4 },
                        { label: 'Gastos', data: dataExpense, backgroundColor: colorExpense, borderRadius: 4 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { ticks: { color: textColor }, grid: { color: gridColor } },
                        x: { ticks: { color: textColor }, grid: { display: false } }
                    },
                    plugins: { legend: { display: false } } // Oculto porque la dona ya lo muestra
                }
            });
        }
    }
}

// --- AI Insights Logic ---
function updateAIAdvice(income, expense) {
    if (!aiInsightText) return;

    let advice = "";
    const currentBalance = income - expense;
    const ratio = income > 0 ? (expense / income) : (expense > 0 ? 1 : 0);

    if (income === 0 && expense === 0) {
        advice = "Empieza a registrar tus movimientos para recibir consejos personalizados de ahorro.";
    } else if (ratio > 0.9) {
        advice = "⚠️ Tus gastos están muy cerca de tus ingresos. Te recomiendo revisar los gastos no esenciales y aplicar la regla del 50/30/20.";
    } else if (ratio < 0.5 && income > 0) {
        advice = "✨ ¡Excelente gestión! Estás ahorrando más del 50% de tus ingresos. Podrías considerar invertir una parte de este capital.";
    } else if (expense > income) {
        advice = "❗ Alerta: Estás gastando más de lo que ganas. Es vital identificar 'gastos hormiga' para estabilizar tu balance este mes.";
    } else {
        advice = "Buen trabajo manteniendo el balance. Para maximizar tu ahorro, intenta automatizar una transferencia a tu cuenta de ahorros apenas recibas ingresos.";
    }

    aiInsightText.innerHTML = `<p>"${advice}"</p>`;
}
function exportToPDF() {
    showToast('Generando reporte PDF...', 'success');
    
    const element = document.getElementById('pdf-content');
    
    // Configuración optimizada para el PDF
    const opt = {
      margin:       [10, 10], // Márgenes [vertical, horizontal]
      filename:     isFiltered ? `Reporte_Financiero_Filtrado.pdf` : `Reporte_Financiero_Completo.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          scrollX: 0,
          scrollY: 0
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Agregar clase para modo impresión (por si html2pdf necesita forzar estilos)
    document.body.classList.add('pdf-mode');
    
    // Generar PDF
    html2pdf().set(opt).from(element).save().then(() => {
        document.body.classList.remove('pdf-mode');
        showToast('PDF descargado con éxito', 'success');
    });
}

// --- Persistence ---
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// --- Session and Database Subscription ---
// Safe auth subscription: handles both cases —
// 1) auth resolved BEFORE main.js loaded (reads cached state)
// 2) auth resolves AFTER main.js loaded (listener callback)
function handleAuthChange(userDetail) {
    if (userDetail) {
        onUserLoggedIn(userDetail);
    } else {
        onUserLoggedOut();
    }
}

// Register with the shared auth state from auth.js
const authState = window.__finanzasAuth;
if (authState) {
    // Register listener for future changes
    authState.listeners.push(handleAuthChange);
    // If auth already resolved before we loaded, handle it now
    if (authState.ready && authState.user) {
        handleAuthChange(authState.user);
    }
} else {
    // Fallback: listen for window events (should not happen normally)
    window.addEventListener('user-logged-in', (e) => handleAuthChange(e.detail));
    window.addEventListener('user-logged-out', () => handleAuthChange(null));
}

async function onUserLoggedIn(detail) {
    currentUser = detail;
    document.getElementById('user-email-display').textContent = currentUser.email;
    
    // Load user preferences
    try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists() && userDoc.data().currency) {
            currentCurrency = userDoc.data().currency;
            currentLocale = currencyConfig[currentCurrency] || 'es-CR';
            currencySelector.value = currentCurrency;
        }
    } catch (err) {
        console.error("Error cargando preferencias", err);
    }

    // Subscribirse a las transacciones del usuario
    const q = query(
        collection(db, "transactions"), 
        where("uid", "==", currentUser.uid)
    );
    
    unsubscribe = onSnapshot(q, (snapshot) => {
        // Mapear y ordenar manualmente por fecha (descendente) para evitar problemas de índices en Firestore
        transactions = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (isFiltered) {
            applyFilters(); 
        } else {
            filteredTransactions = [...transactions];
            updateDOM();
        }
    });
}

function onUserLoggedOut() {
    currentUser = null;
    transactions = [];
    filteredTransactions = [];
    if (unsubscribe) unsubscribe();
    updateDOM();
}

// --- Initialization ---
function init() {
    initTheme();
}

// --- Event Delegation for Delete Buttons (replaces inline onclick) ---
list.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        if (id) deleteTransaction(id);
    }
});

// --- Event Listeners ---
btnIncome.addEventListener('click', () => addTransaction('ingreso'));
btnExpense.addEventListener('click', () => addTransaction('gasto'));
clearBtn.addEventListener('click', clearAllTransactions);
btnApplyFilter.addEventListener('click', applyFilters);
btnClearFilter.addEventListener('click', clearFilters);
btnExportPDF.addEventListener('click', exportToPDF);
btnRefreshAI.addEventListener('click', () => {
    const income = filteredTransactions.filter(t => t.type === 'ingreso').reduce((acc, t) => acc + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'gasto').reduce((acc, t) => acc + t.amount, 0);
    updateAIAdvice(income, expense);
    showToast('Consejos actualizados', 'success');
});

currencySelector.addEventListener('change', async (e) => {
    currentCurrency = e.target.value;
    currentLocale = currencyConfig[currentCurrency] || 'es-CR';
    
    if (currentUser) {
        try {
            await setDoc(doc(db, "users", currentUser.uid), { currency: currentCurrency }, { merge: true });
            showToast('Moneda actualizada', 'success');
        } catch (err) {
            showToast('Error guardando configuración', 'error');
        }
    }
    updateDOM(); // Re-render with new currency
});

// Start
init();
