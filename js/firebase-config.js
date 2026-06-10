// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBB23M5eT1Dw_SPAGB-9Ua9-I8mrf3vMck",
    authDomain: "finanzaspro-saas.firebaseapp.com",
    projectId: "finanzaspro-saas",
    storageBucket: "finanzaspro-saas.firebasestorage.app",
    messagingSenderId: "671111032441",
    appId: "1:671111032441:web:e12195759b1f6dcaf9aea8",
    measurementId: "G-TFQCGD4R0R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
