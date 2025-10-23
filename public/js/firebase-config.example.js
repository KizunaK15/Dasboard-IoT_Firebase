// js/firebase-config.example.js
// INI ADALAH TEMPLATE
// 1. Ganti nama file ini menjadi 'firebase-config.js'
// 2. Isi semua nilai di bawah ini dengan kredensial Firebase Anda

const firebaseConfig = {
    apiKey: "MASUKKAN_API_KEY_ANDA_DI_SINI",
    authDomain: "PROYEK-ANDA.firebaseapp.com",
    databaseURL: "https://PROYEK-ANDA.firebaseio.com",
    projectId: "PROYEK-ANDA",
    storageBucket: "PROYEK-ANDA.appspot.com",
    messagingSenderId: "NOMOR_SENDER_ID_ANDA",
    appId: "APP_ID_ANDA"
};

// Impor fungsi-fungsi yang Anda butuhkan
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Dapatkan service Auth dan Database
const auth = getAuth(app);
const db = getDatabase(app);

// Ekspor service agar bisa diimpor di file lain
export { auth, db };