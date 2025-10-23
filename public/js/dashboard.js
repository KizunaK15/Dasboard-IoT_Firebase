// public/js/dashboard.js (LENGKAP dengan Fitur 1, 3, dan Export CSV)

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { 
    ref, onValue, limitToLast, query,
    get, orderByChild, startAt, endAt
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// --- Elemen DOM ---
const tempValue = document.getElementById('temp-value');
const tempTimestamp = document.getElementById('temp-timestamp');
const humValue = document.getElementById('hum-value'); 
const humTimestamp = document.getElementById('hum-timestamp');
const logoutButton = document.getElementById('logout-button');
const lineChartCanvas = document.getElementById('dht-chart').getContext('2d');
const gaugeChartCanvas = document.getElementById('humidity-gauge').getContext('2d');
const statusIndicator = document.getElementById('status-indicator');
const statusIcon = document.getElementById('status-icon');
const statusText = document.getElementById('status-text');
const tempCard = document.getElementById('temp-card');
const toastEl = document.getElementById('alert-toast');
const toastBody = document.getElementById('toast-body');
const datePicker = document.getElementById('date-picker');
const resetChartBtn = document.getElementById('reset-chart-btn');
const chartLoading = document.getElementById('chart-loading');

// --- PERUBAHAN BARU: Elemen DOM Fitur Export CSV ---
const exportCsvBtn = document.getElementById('export-csv-btn');

// --- Variabel Global ---
let dhtLineChart;
let humidityGaugeChart; 
let dataTimer; 
let alertToast;
let realtimeListener = null; 
const MAX_DATA_POINTS = 20;
const SUHU_MAKSIMAL = 30.0; 

// --- Inisialisasi Chart (Tidak berubah) ---
function initializeGaugeChart() { /* ... (Kode sama persis) ... */ 
    humidityGaugeChart = new Chart(gaugeChartCanvas, {
        type: 'doughnut', data: { labels: ['Kelembaban', 'Sisa'], datasets: [{ data: [0, 100], backgroundColor: ['rgba(54, 162, 235, 1)', 'rgba(230, 230, 230, 1)'], borderColor: ['rgba(54, 162, 235, 1)', 'rgba(230, 230, 230, 1)'], borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, circumference: 180, rotation: 270, cutout: '70%' }
    });
}
function initializeLineChart() { /* ... (Kode sama persis) ... */ 
    dhtLineChart = new Chart(lineChartCanvas, {
        type: 'line', data: { labels: [], datasets: [ { label: 'Suhu (°C)', data: [], borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.2)', borderWidth: 2, fill: false, yAxisID: 'y-temp' }, { label: 'Kelembaban (%)', data: [], borderColor: 'rgba(54, 162, 235, 1)', backgroundColor: 'rgba(54, 162, 235, 0.2)', borderWidth: 2, fill: false, yAxisID: 'y-hum' } ] },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { type: 'time', time: { unit: 'second', tooltipFormat: 'HH:mm:ss', displayFormats: { second: 'HH:mm:ss' } }, title: { display: true, text: 'Waktu' } }, 'y-temp': { type: 'linear', position: 'left', title: { display: true, text: 'Suhu (°C)' }, ticks: { color: 'rgba(255, 99, 132, 1)' } }, 'y-hum': { type: 'linear', position: 'right', title: { display: true, text: 'Kelembaban (%)' }, ticks: { color: 'rgba(54, 162, 235, 1)' }, grid: { drawOnChartArea: false } } }, plugins: { tooltip: { mode: 'index', intersect: false } } }
    });
}

// --- Fungsi Status & UI (Tidak berubah) ---
function setDeviceStatus(isOnline) { /* ... (Kode sama persis) ... */ 
    if (isOnline) {
        statusIndicator.classList.remove('bg-danger', 'bg-secondary'); statusIndicator.classList.add('bg-success');
        statusIcon.classList.remove('fa-spin'); statusText.textContent = 'Online';
        clearTimeout(dataTimer);
        dataTimer = setTimeout(() => { setDeviceStatus(false); }, 15000); 
    } else {
        statusIndicator.classList.remove('bg-success', 'bg-secondary'); statusIndicator.classList.add('bg-danger');
        statusText.textContent = 'Offline';
    }
}

function updateDashboardUI(data) { /* ... (Kode sama persis, termasuk fitur Notifikasi) ... */ 
    const temp = parseFloat(data.temperature);
    const hum = parseFloat(data.humidity);

    if (!isNaN(temp) && !isNaN(hum)) {
        setDeviceStatus(true); 
        const timestamp = new Date(data.timestamp || Date.now());
        const formattedDateTime = timestamp.toLocaleString('id-ID');

        tempValue.textContent = `${temp.toFixed(1)} °C`;
        tempTimestamp.textContent = `Pukul ${formattedDateTime}`;

        if (temp > SUHU_MAKSIMAL) {
            tempCard.classList.add('bg-danger', 'text-white');
            toastBody.textContent = `PERINGATAN: Suhu terdeteksi ${temp.toFixed(1)}°C!`;
            if (alertToast) alertToast.show();
        } else {
            tempCard.classList.remove('bg-danger', 'text-white');
        }

        humValue.textContent = `${hum.toFixed(1)} %`; 
        humTimestamp.textContent = `Pukul ${formattedDateTime}`;
        if (humidityGaugeChart) {
            humidityGaugeChart.data.datasets[0].data = [hum, 100 - hum];
            humidityGaugeChart.update();
        }

        if (realtimeListener && dhtLineChart) {
            dhtLineChart.data.labels.push(timestamp);
            dhtLineChart.data.datasets[0].data.push(temp);
            dhtLineChart.data.datasets[1].data.push(hum);

            if (dhtLineChart.data.labels.length > MAX_DATA_POINTS) {
                dhtLineChart.data.labels.shift();
                dhtLineChart.data.datasets[0].data.shift();
                dhtLineChart.data.datasets[1].data.shift();
            }
            dhtLineChart.update();
        }
    } else {
        console.warn("Data diterima tapi formatnya salah:", data);
    }
}

// --- Logika Firebase ---

// 1. Cek Status Autentikasi (DIMODIFIKASI)
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User terautentikasi:", user.uid);
        initializeLineChart();
        initializeGaugeChart(); 
        
        alertToast = new bootstrap.Toast(toastEl);
        
        // Tambahkan listener ke elemen UI
        datePicker.addEventListener('change', handleDateChange);
        resetChartBtn.addEventListener('click', resetToRealtime);
        
        // --- PERUBAHAN BARU: Tambahkan listener untuk tombol export ---
        exportCsvBtn.addEventListener('click', exportDataToCSV);

        startRealtimeListener();
    } else {
        console.log("User tidak terautentikasi, kembali ke login.");
        window.location.href = 'index.html';
    }
});

// 2. Fungsi Logout (Tidak Berubah)
logoutButton.addEventListener('click', () => { /* ... (Kode sama persis) ... */ 
    signOut(auth).then(() => { console.log("Logout berhasil."); })
    .catch((error) => { console.error("Error logout:", error); });
});

// 3. Fungsi Listener Real-time (Tidak Berubah)
function startRealtimeListener() { /* ... (Kode sama persis) ... */ 
    console.log("Memulai listener real-time...");
    setDeviceStatus("connecting"); 
    const dhtDataRef = ref(db, 'dht11_data');
    const recentDataQuery = query(dhtDataRef, limitToLast(1));
    realtimeListener = onValue(recentDataQuery, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const latestKey = Object.keys(data)[0];
            updateDashboardUI(data[latestKey]);
        } else {
            setDeviceStatus(false); 
        }
    }, (error) => {
        console.error("Error membaca data:", error);
        setDeviceStatus(false); 
    });
}

// 4. Fungsi Stop Listener (Tidak Berubah)
function stopRealtimeListener() { /* ... (Kode sama persis) ... */ 
    if (realtimeListener) {
        console.log("Menghentikan listener real-time.");
        realtimeListener(); 
        realtimeListener = null;
        setDeviceStatus(false); 
    }
}

// 5. Fungsi Ambil Data Historis (Tidak Berubah)
function handleDateChange() { /* ... (Kode sama persis) ... */ 
    const dateValue = datePicker.value;
    if (!dateValue) return; 

    console.log(`Meminta data historis untuk: ${dateValue}`);
    stopRealtimeListener(); 

    chartLoading.classList.remove('d-none');
    dhtLineChart.canvas.style.display = 'none';

    const startOfDay = new Date(dateValue).setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateValue).setHours(23, 59, 59, 999);

    const dhtDataRef = ref(db, 'dht11_data');
    const historicalQuery = query(
        dhtDataRef,
        orderByChild('timestamp'), 
        startAt(startOfDay),
        endAt(endOfDay)
    );

    get(historicalQuery).then((snapshot) => {
        dhtLineChart.data.labels = [];
        dhtLineChart.data.datasets[0].data = [];
        dhtLineChart.data.datasets[1].data = [];

        if (snapshot.exists()) {
            console.log(`Ditemukan ${snapshot.size} data historis.`);
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                if (data.timestamp && data.temperature && data.humidity) {
                    dhtLineChart.data.labels.push(new Date(data.timestamp));
                    dhtLineChart.data.datasets[0].data.push(parseFloat(data.temperature));
                    dhtLineChart.data.datasets[1].data.push(parseFloat(data.humidity));
                }
            });
        } else {
            console.log("Tidak ada data historis untuk tanggal ini.");
        }
        
        chartLoading.classList.add('d-none');
        dhtLineChart.canvas.style.display = 'block';
        
        dhtLineChart.options.scales.x.time.unit = 'hour';
        dhtLineChart.options.scales.x.time.displayFormats.hour = 'HH:mm';
        
        dhtLineChart.update();
    }).catch((error) => {
        console.error("Error mengambil data historis:", error);
        chartLoading.classList.add('d-none');
    });
}

// 6. Fungsi Reset Chart (Tidak Berubah)
function resetToRealtime() { /* ... (Kode sama persis) ... */ 
    console.log("Reset ke mode real-time.");
    if (realtimeListener) return; 

    datePicker.value = '';
    
    dhtLineChart.data.labels = [];
    dhtLineChart.data.datasets[0].data = [];
    dhtLineChart.data.datasets[1].data = [];
    
    dhtLineChart.options.scales.x.time.unit = 'second';
    dhtLineChart.options.scales.x.time.displayFormats.second = 'HH:mm:ss';
    
    dhtLineChart.update();

    startRealtimeListener();
}

// 7. --- FUNGSI BARU: Export Data ke CSV ---
function exportDataToCSV() {
    console.log("Mengekspor data ke CSV...");

    const labels = dhtLineChart.data.labels;
    const tempData = dhtLineChart.data.datasets[0].data;
    const humData = dhtLineChart.data.datasets[1].data;

    if (labels.length === 0) {
        alert("Tidak ada data di chart untuk diekspor.");
        return;
    }

    // Buat Header CSV
    let csvContent = "Timestamp,Suhu (°C),Kelembaban (%)\n";

    // Loop data untuk membuat baris
    for (let i = 0; i < labels.length; i++) {
        // Format timestamp agar bisa dibaca Excel (misal: "24/10/2025 00:51:58")
        const timestamp = new Date(labels[i]).toLocaleString('id-ID');
        const temp = tempData[i];
        const hum = humData[i];
        
        csvContent += `"${timestamp}",${temp},${hum}\n`;
    }

    // Tentukan nama file
    // Jika mode historis, gunakan tanggal. Jika real-time, gunakan "realtime"
    let fileName;
    if (datePicker.value) {
        fileName = `export_dht11_${datePicker.value}.csv`;
    } else {
        const today = new Date().toISOString().split('T')[0];
        fileName = `export_dht11_realtime_${today}.csv`;
    }

    // Panggil fungsi download
    downloadCSV(csvContent, fileName);
}

// 8. --- FUNGSI BARU: Helper untuk Memicu Download ---
function downloadCSV(csvContent, fileName) {
    // Buat 'Blob' (objek data) dari string CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Buat link <a> virtual
    const link = document.createElement("a");
    
    // Buat URL untuk blob
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    
    // Sembunyikan link dan tambahkan ke body
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    
    // "Klik" link secara otomatis untuk memulai download
    link.click();
    
    // Hapus link dari body
    document.body.removeChild(link);
}