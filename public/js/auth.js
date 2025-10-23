// public/js/auth.js (Versi Lengkap dengan Fitur Lupa Password)

// Impor modul Auth dari file konfigurasi
import { auth } from './firebase-config.js';
// Impor fungsi-fungsi Auth yang kita butuhkan
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail // <-- PERUBAHAN BARU
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// --- Cek Status Login Saat Halaman Dimuat ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User sudah login, mengarahkan ke dashboard...");
        window.location.href = 'dashboard.html';
    } else {
        console.log("User belum login.");
    }
});

// --- Elemen DOM ---
const loginForm = document.getElementById('login-form');
const registerButton = document.getElementById('register-button');
const errorMessage = document.getElementById('error-message');
const loginButton = document.getElementById('login-button');
const loginSpinner = document.getElementById('login-spinner');
const loginText = document.getElementById('login-text');
const passwordInput = document.getElementById('password');
const togglePasswordButton = document.getElementById('toggle-password');
const toggleIcon = document.getElementById('toggle-icon');

// --- PERUBAHAN BARU: Elemen DOM untuk Fitur Baru ---
const emailInput = document.getElementById('email'); // Kita beri nama variabel
const successMessage = document.getElementById('success-message');
const forgotPasswordLink = document.getElementById('forgot-password-link');

// --- Fungsi Helper untuk Loading Button ---
function showLoading(isLoading) {
    if (isLoading) {
        loginButton.disabled = true;
        registerButton.disabled = true; // Nonaktifkan tombol daftar juga
        forgotPasswordLink.style.pointerEvents = 'none'; // Nonaktifkan link
        loginSpinner.classList.remove('d-none');
        loginText.textContent = 'Loading...';
    } else {
        loginButton.disabled = false;
        registerButton.disabled = false;
        forgotPasswordLink.style.pointerEvents = 'auto';
        loginSpinner.classList.add('d-none');
        loginText.textContent = 'Login';
    }
}

// --- PERUBAHAN BARU: Fungsi untuk Sembunyikan Pesan Saat Mengetik ---
function hideMessages() {
    errorMessage.classList.add('d-none');
    successMessage.classList.add('d-none');
}
emailInput.addEventListener('input', hideMessages);
passwordInput.addEventListener('input', hideMessages);


// --- Event Listener untuk Show/Hide Password (Tidak Berubah) ---
togglePasswordButton.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    toggleIcon.classList.toggle('fa-eye');
    toggleIcon.classList.toggle('fa-eye-slash');
});

// --- Event Listener untuk Login (DIMODIFIKASI) ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); 
    showLoading(true);
    hideMessages(); // Sembunyikan pesan lama

    const email = emailInput.value;
    const password = passwordInput.value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("Login berhasil:", userCredential.user.uid);
            // Redirect ditangani onAuthStateChanged
        })
        .catch((error) => {
            console.error("Error login:", error.message);
            errorMessage.textContent = getFriendlyErrorMessage(error.code);
            errorMessage.classList.remove('d-none');
            showLoading(false);
        });
});

// --- Event Listener untuk Registrasi (DIMODIFIKASI) ---
registerButton.addEventListener('click', (e) => {
    e.preventDefault();
    showLoading(true);
    hideMessages(); // Sembunyikan pesan lama

    const email = emailInput.value;
    const password = passwordInput.value;

    if (email.length < 4 || password.length < 6) {
        errorMessage.textContent = "Email valid dan password minimal 6 karakter diperlukan.";
        errorMessage.classList.remove('d-none');
        showLoading(false);
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("Registrasi berhasil:", userCredential.user.uid);
            // Redirect ditangani onAuthStateChanged
        })
        .catch((error) => {
            console.error("Error registrasi:", error.message);
            errorMessage.textContent = getFriendlyErrorMessage(error.code);
            errorMessage.classList.remove('d-none');
            showLoading(false);
        });
});

// --- PERUBAHAN BARU: Event Listener untuk "Lupa Password?" ---
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    hideMessages(); // Sembunyikan pesan lama

    const email = emailInput.value;
    
    // Cek apakah kolom email sudah diisi
    if (!email) {
        errorMessage.textContent = "Silakan masukkan email Anda di kolom di atas.";
        errorMessage.classList.remove('d-none');
        return;
    }

    showLoading(true); // Tampilkan loading

    sendPasswordResetEmail(auth, email)
        .then(() => {
            // Berhasil terkirim
            showLoading(false);
            successMessage.textContent = "Link reset password telah dikirim. Silakan cek inbox email Anda.";
            successMessage.classList.remove('d-none');
        })
        .catch((error) => {
            // Gagal (misal, email tidak terdaftar)
            showLoading(false);
            console.error("Error reset password:", error.message);
            // Beri pesan error spesifik untuk reset
            if (error.code === 'auth/user-not-found') {
                errorMessage.textContent = "Email tidak terdaftar.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage.textContent = "Format email tidak valid.";
            } else {
                errorMessage.textContent = "Gagal mengirim email. Coba lagi nanti.";
            }
            errorMessage.classList.remove('d-none');
        });
});

// Fungsi helper untuk pesan error (LOGIN & REGISTER)
function getFriendlyErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Format email tidak valid.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Email atau password salah.'; // Tetap gabung untuk keamanan login
        case 'auth/email-already-in-use':
            return 'Email ini sudah terdaftar.';
        case 'auth/weak-password':
            return 'Password terlalu lemah (minimal 6 karakter).';
        default:
            return 'Terjadi kesalahan. Silakan coba lagi.';
    }
}