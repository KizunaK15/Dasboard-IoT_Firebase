# 📊 Dashboard IoT Pemantau Suhu & Kelembaban (Real-time)

Selamat datang di proyek Dashboard IoT saya! Ini adalah aplikasi web lengkap yang dibuat dari awal untuk memantau data sensor (suhu dan kelembaban) secara langsung dari mana saja di dunia.

### [➡️ Coba Versi Live Di Sini! ⬅️](https://trial-data-f9065.web.app)
*(Jangan lupa ganti `trial-data-f9065.web.app` dengan URL Firebase Anda yang sebenarnya)*

---

## ✨ Fitur Unggulan

Proyek ini bukan hanya sekadar "tampilan" data, tapi sebuah aplikasi yang fungsional penuh:

* 🔐 **Sistem Autentikasi Lengkap:** Pengguna dapat **Daftar**, **Login**, **Logout**, dan bahkan **Reset Password** jika lupa.
* 📈 **Dashboard Interaktif:** Menampilkan data *real-time* dengan *gauge chart* yang cantik dan *line chart* untuk riwayat data.
* 🟢 **Status Perangkat:** Indikator "Online / Offline" yang cerdas memberi tahu Anda jika perangkat sensor tiba-tiba berhenti mengirim data.
* 🔔 **Sistem Peringatan (Alert):** Dashboard akan secara proaktif memberi tahu Anda dengan notifikasi *pop-up* (toast) jika suhu melebihi ambang batas aman.
* 📅 **Analisis Data Historis:** Pengguna dapat memilih tanggal di masa lalu untuk memuat dan menganalisis data historis di dalam grafik.
* 📄 **Ekspor ke CSV:** Unduh data historis apa pun yang ada di grafik Anda ke dalam format `.csv` untuk dianalisis lebih lanjut di Excel atau Google Sheets.

---

## 📸 Tampilan Aplikasi

Berikut adalah tampilan dari aplikasi yang sedang berjalan.

| Halaman Login | Halaman Dashboard |
| :---: | :---: |
| ![Tampilan Halaman Login](https://github.com/user-attachments/assets/eeb6c95b-b3fc-4aba-9746-36217dd0e87c) | ![Tampilan Halaman Dashboard](https://github.com/user-attachments/assets/98dc0dcf-95e1-4c5a-ad2e-654a3a43d27b) |
| *Fitur: Login, Daftar, Lupa Password & Validasi* | *Fitur: Real-time, Gauge, Grafik, Peringatan & Kueri Historis* |

**Tips:** Untuk membuatnya lebih menarik, ganti gambar di atas dengan *screenshot* proyek Anda sendiri! (Unggah *screenshot* Anda ke tab "Issues" di GitHub untuk mendapatkan URL gambar).

---

## 🔧 Bagaimana Cara Kerjanya? (Arsitektur)

Proyek ini terbagi menjadi tiga bagian utama yang saling berkomunikasi:

1.  🧠 **Perangkat Keras (Si Pengirim):**
    * Sebuah mikrokontroler **ESP32** (di-program dengan C++/Arduino).
    * Bertugas mengirimkan data (dalam contoh ini, data *dummy* acak) ke Firebase setiap 5 detik.

2.  ☁️ **Backend (Si Penyimpan & Pengatur):**
    * **Firebase Realtime Database:** Menerima dan menyimpan data sensor.
    * **Firebase Authentication:** Mengelola semua data login pengguna dengan aman.
    * **Firebase Hosting:** Menjalankan aplikasi web kita agar bisa diakses di seluruh dunia.

3.  🖥️ **Frontend (Si Penampil):**
    * Sebuah aplikasi web statis yang dibuat dengan **HTML**, **CSS**, dan **JavaScript (ES6 Modules)**.
    * Menggunakan **Bootstrap 5** untuk tampilan yang bersih dan responsif.
    * Menggunakan **Chart.js** untuk membuat semua grafik yang interaktif.



---

## 💻 Untuk Rekan Developer (Cara Instalasi)

Ingin menjalankan proyek ini di komputer Anda? Ikuti langkah-langkah ini:

### 1. Dapatkan Kodenya (Clone)
```bash
git clone [https://github.com/NAMA-ANDA/NAMA-REPO-ANDA.git](https://github.com/NAMA-ANDA/NAMA-REPO-ANDA.git)
cd NAMA-REPO-ANDA