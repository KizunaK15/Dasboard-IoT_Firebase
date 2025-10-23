# Proyek Dashboard IoT (Suhu & Kelembaban)

Ini adalah proyek web dashboard IoT lengkap yang melacak data sensor (Suhu & Kelembaban) secara real-time menggunakan Firebase dan ESP32.

## Fitur
* Login dan Registrasi Pengguna (Firebase Auth)
* Dashboard Real-time dengan Gauge & Line Chart (Chart.js)
* Indikator Status Online/Offline Perangkat
* Fitur "Lupa Password"
* Kueri Data Historis (Pilih Tanggal)
* Ekspor Data ke CSV

## Teknologi yang Digunakan
* **Frontend:** HTML5, CSS3, JavaScript (ES6 Modules)
* **Framework/Library:** Bootstrap 5, Chart.js
* **Backend:** Firebase Authentication, Firebase Realtime Database
* **Perangkat Keras:** ESP32 (mengirim data dummy)

## Instalasi & Setup

1.  **Clone repositori ini:**
    ```bash
    git clone [https://github.com/NAMA-ANDA/NAMA-REPO-ANDA.git](https://github.com/NAMA-ANDA/NAMA-REPO-ANDA.git)
    ```

2.  **Setup Kredensial Firebase:**
    * Buka folder `public/js/`.
    * Ganti nama file `firebase-config.example.js` menjadi `firebase-config.js`.
    * Buka `firebase-config.js` dan isi semua nilai `firebaseConfig` dengan kredensial dari proyek Firebase Anda.

3.  **Setup Aturan Database:**
    * Di Firebase Realtime Database, buka tab "Rules" dan tambahkan indeks `.indexOn` untuk *timestamp* agar kueri historis berfungsi:
    ```json
    {
      "rules": {
        ".read": "auth != null",
        ".write": "auth != null",
        "dht11_data": {
          ".indexOn": "timestamp"
        }
      }
    }
    ```

4.  **Deploy ke Firebase Hosting:**
    * Jalankan `firebase deploy` untuk menghosting aplikasi web Anda.