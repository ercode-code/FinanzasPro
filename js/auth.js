import { auth } from './firebase-config.js';
import { 
    GoogleAuthProvider, 
    signInWithPopup,
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Elementos del DOM
const authWrapper = document.getElementById('auth-wrapper');
const dashboardWrapper = document.getElementById('dashboard-wrapper');
const googleLoginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('logout-btn');

// --- Iniciar Sesión con Google ---
auth.languageCode = 'es';

googleLoginBtn.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        showToast('¡Bienvenido!', 'success');
    } catch (error) {
        console.error("Error Firebase Auth:", error.code, error.message);
        let msg = 'Error al conectar con Google';
        if (error.code === 'auth/popup-blocked') msg = 'El navegador bloqueó la ventana emergente.';
        if (error.code === 'auth/cancelled-popup-request') msg = 'Operación cancelada.';
        if (error.code === 'auth/unauthorized-domain') msg = 'Dominio no autorizado en Firebase.';
        
        showToast(`${msg} (${error.code})`, 'error');
    }
});

// --- Escuchar cambios en estado de autenticación ---
// Almacenamos la info del usuario para que main.js pueda consultarla
// sin depender de la temporalidad de un evento de window.
window.__finanzasAuth = { user: null, ready: false, listeners: [] };

onAuthStateChanged(auth, (user) => {
    const authState = window.__finanzasAuth;

    if (user) {
        // Usuario logueado
        authWrapper.style.display = 'none';
        dashboardWrapper.style.display = 'block';

        authState.user = { uid: user.uid, email: user.email };
        authState.ready = true;

        // Notificar a listeners ya registrados (si main.js ya cargó)
        authState.listeners.forEach(fn => fn(authState.user));
        
        // También despachar el evento para compatibilidad (si main.js carga después)
        window.dispatchEvent(new CustomEvent('user-logged-in', { 
            detail: { uid: user.uid, email: user.email } 
        }));
    } else {
        // Usuario no logueado
        authWrapper.style.display = 'flex';
        dashboardWrapper.style.display = 'none';

        authState.user = null;
        authState.ready = true;

        // Notificar a listeners ya registrados
        authState.listeners.forEach(fn => fn(null));
        
        window.dispatchEvent(new CustomEvent('user-logged-out'));
    }
});

// --- Logout via ID-based listener (no más window.logout) ---
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showToast('Sesión cerrada', 'success');
    } catch (error) {
        showToast('Error al cerrar sesión', 'error');
    }
});

// --- Utilidad Toast (Simple) ---
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-circle-xmark';
    
    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animación
    void toast.offsetWidth;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
