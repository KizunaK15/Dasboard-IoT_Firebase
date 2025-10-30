// Import konfigurasi Firebase
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
const exportCsvBtn = document.getElementById('export-csv-btn');
const chartLoading = document.getElementById('chart-loading');

// --- Variabel Global ---
let dhtLineChart;
let humidityGaugeChart; 
let dataTimer; 
let alertToast;
let realtimeListener = null; 
const MAX_DATA_POINTS = 20;
const SUHU_MAKSIMAL = 40.0; 

// --- Inisialisasi Gauge Chart ---
function initializeGaugeChart() {
    humidityGaugeChart = new Chart(gaugeChartCanvas, {
        type: 'doughnut',
        data: {
            labels: ['Kelembaban', 'Sisa'],
            datasets: [{
                data: [0, 100],
                backgroundColor: ['rgba(54, 162, 235, 1)', 'rgba(230, 230, 230, 1)'],
                borderColor: ['rgba(54, 162, 235, 1)', 'rgba(230, 230, 230, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            circumference: 180,
            rotation: 270,
            cutout: '70%'
        }
    });
}

// --- Inisialisasi Line Chart ---
function initializeLineChart() {
    dhtLineChart = new Chart(lineChartCanvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Suhu (°C)',
                    data: [],
                    borderColor: '#FF6B6B',
                    backgroundColor: '#FF6B6B',
                    borderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#FF6B6B',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    fill: false,
                    yAxisID: 'y-temp',
                    tension: 0,
                    showLine: true
                },
                {
                    label: 'Kelembaban (%)',
                    data: [],
                    borderColor: '#4ECDC4',
                    backgroundColor: '#4ECDC4',
                    borderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#4ECDC4',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    fill: false,
                    yAxisID: 'y-hum',
                    tension: 0,
                    showLine: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute',
                        tooltipFormat: 'DD MMM YYYY HH:mm:ss',
                        displayFormats: {
                            second: 'HH:mm:ss',
                            minute: 'HH:mm',
                            hour: 'HH:mm'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Waktu',
                        font: { size: 13, weight: 'bold' }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { size: 12 }
                    }
                },
                'y-temp': {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Suhu (°C)',
                        font: { size: 13, color: '#FF6B6B' }
                    },
                    ticks: {
                        color: '#FF6B6B',
                        callback: function(value) { return value + '°C'; },
                        font: { size: 12 }
                    },
                    grid: {
                        color: 'rgba(255, 107, 107, 0.1)'
                    }
                },
                'y-hum': {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Kelembaban (%)',
                        font: { size: 13, color: '#4ECDC4' }
                    },
                    ticks: {
                        color: '#4ECDC4',
                        callback: function(value) { return value + '%'; },
                        font: { size: 12 }
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'start',
                    labels: {
                        usePointStyle: true,
                        font: { size: 13 },
                        padding: 20
                    }
                },
                tooltip: {
                    enabled: false
                },
                annotation: {
                    annotations: []
                }
            }
        }
    });
}

// --- Update Annotation (Label Nilai di Titik) ---
function updateChartAnnotations() {
    if (!dhtLineChart) return;

    const datasets = dhtLineChart.data.datasets;
    const labels = dhtLineChart.data.labels;

    const annotations = [];

    datasets.forEach((dataset, dsIndex) => {
        dataset.data.forEach((value, index) => {
            if (value == null || value === undefined) return;

            const x = labels[index];
            const y = parseFloat(value);

            // Tentukan warna dan teks label berdasarkan dataset
            const labelColor = dsIndex === 0 ? '#FF6B6B' : '#4ECDC4';
            const labelText = dsIndex === 0 
                ? `${y.toFixed(1)}°C` 
                : `${y.toFixed(1)}%`;

            // Hitung penyesuaian vertikal (yAdjust) secara dinamis
            // Untuk suhu (dsIndex 0), letakkan label di atas titik
            // Untuk kelembaban (dsIndex 1), letakkan label di bawah titik
            // Ini akan mencegah tumpang tindih jika kedua nilai hampir sama
            let yAdjust = -12; // default: di atas titik

            if (dsIndex === 1) { // Kelembaban
                yAdjust = 15;   // di bawah titik
            }

            // Jika nilai sangat tinggi/rendah, sesuaikan juga agar tidak keluar dari canvas
            // Ini opsional, tapi membantu di skenario ekstrem
            // if (y > 80 && dsIndex === 0) yAdjust = -20; // Suhu tinggi, tarik lebih ke atas
            // if (y < 10 && dsIndex === 1) yAdjust = 10;  // Kelembaban rendah, tarik lebih ke bawah

            annotations.push({
                type: 'label',
                xValue: x,
                yValue: y,
                content: labelText,
                color: labelColor,
                font: {
                    size: 12,
                    weight: 'bold'
                },
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                borderColor: labelColor,
                borderWidth: 1,
                borderRadius: 4,
                padding: 4,
                position: 'top', // Tetap gunakan 'top' sebagai basis, kita atur dengan yAdjust
                yAdjust: yAdjust // Penyesuaian vertikal
            });
        });
    });

    dhtLineChart.options.plugins.annotation.annotations = annotations;
    dhtLineChart.update();
}

// --- Fungsi Status Perangkat ---
function setDeviceStatus(isOnline) {
    if (isOnline === "connecting") {
        statusIndicator.classList.remove('bg-success', 'bg-danger');
        statusIndicator.classList.add('bg-secondary');
        statusIcon.className = 'fas fa-circle fa-spin';
        statusText.textContent = 'Menghubungkan...';
        return;
    }

    if (isOnline) {
        statusIndicator.classList.remove('bg-danger', 'bg-secondary');
        statusIndicator.classList.add('bg-success');
        statusIcon.className = 'fas fa-circle';
        statusText.textContent = 'Online';
        clearTimeout(dataTimer);
        dataTimer = setTimeout(() => setDeviceStatus(false), 15000);
    } else {
        statusIndicator.classList.remove('bg-success', 'bg-secondary');
        statusIndicator.classList.add('bg-danger');
        statusText.textContent = 'Offline';
    }
}

// --- Update UI Dashboard ---
function updateDashboardUI(data) {
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
            updateChartAnnotations();
        }
    } else {
        console.warn("Data tidak valid:", data);
    }
}

// --- Listener Autentikasi ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User terautentikasi:", user.uid);
        initializeLineChart();
        initializeGaugeChart();
        alertToast = new bootstrap.Toast(toastEl);

        datePicker.addEventListener('change', handleDateChange);
        resetChartBtn.addEventListener('click', resetToRealtime);
        exportCsvBtn.addEventListener('click', exportDataToCSV);

        startRealtimeListener();
    } else {
        window.location.href = 'index.html';
    }
});

// --- Logout ---
logoutButton.addEventListener('click', () => {
    signOut(auth).catch(console.error);
});

// --- Real-time Listener ---
function startRealtimeListener() {
    console.log("Memulai listener real-time dari 'dht11_data'...");
    setDeviceStatus("connecting");

    const dhtRealtimeRef = query(ref(db, 'dht11_data'), limitToLast(1));
    realtimeListener = onValue(dhtRealtimeRef, (snapshot) => {
        if (snapshot.exists()) {
            const entries = snapshot.val();
            const lastKey = Object.keys(entries).pop();
            const data = entries[lastKey];

            if (data?.temperature !== undefined && data?.humidity !== undefined) {
                updateDashboardUI(data);
            } else {
                console.warn("Data format salah:", data);
                setDeviceStatus(false);
            }
        } else {
            console.warn("Tidak ada data.");
            setDeviceStatus(false);
        }
    }, (error) => {
        console.error("Error real-time:", error);
        setDeviceStatus(false);
    });
}

// --- Hentikan Real-time ---
function stopRealtimeListener() {
    if (realtimeListener) {
        realtimeListener();
        realtimeListener = null;
        setDeviceStatus(false);
    }
}

// --- Ambil Data Historis ---
function handleDateChange() {
    const dateValue = datePicker.value;
    if (!dateValue) return;

    stopRealtimeListener();
    chartLoading.classList.remove('d-none');
    dhtLineChart.canvas.style.display = 'none';

    const startOfDay = new Date(dateValue + 'T00:00:00.000Z').getTime();
    const endOfDay = new Date(dateValue + 'T23:59:59.999Z').getTime();

    const historicalQuery = query(
        ref(db, 'dht11_data'),
        orderByChild('timestamp'),
        startAt(startOfDay),
        endAt(endOfDay)
    );

    get(historicalQuery).then((snapshot) => {
        dhtLineChart.data.labels = [];
        dhtLineChart.data.datasets[0].data = [];
        dhtLineChart.data.datasets[1].data = [];

        if (snapshot.exists()) {
            const INTERVAL_MENIT = 15;
            const INTERVAL_MS = INTERVAL_MENIT * 60 * 1000;
            const groupedData = {};

            snapshot.forEach((child) => {
                const d = child.val();
                if (d.timestamp && d.temperature && d.humidity) {
                    const key = Math.floor(d.timestamp / INTERVAL_MS) * INTERVAL_MS;
                    if (!groupedData[key]) {
                        groupedData[key] = { temps: [], hums: [], count: 0 };
                    }
                    groupedData[key].temps.push(parseFloat(d.temperature));
                    groupedData[key].hums.push(parseFloat(d.humidity));
                    groupedData[key].count++;
                }
            });

            const sortedKeys = Object.keys(groupedData).sort((a, b) => a - b);
            sortedKeys.forEach(k => {
                const g = groupedData[k];
                const ts = new Date(parseInt(k));
                const avgT = g.temps.reduce((a, b) => a + b, 0) / g.count;
                const avgH = g.hums.reduce((a, b) => a + b, 0) / g.count;

                dhtLineChart.data.labels.push(ts);
                dhtLineChart.data.datasets[0].data.push(avgT);
                dhtLineChart.data.datasets[1].data.push(avgH);
            });
        }

        chartLoading.classList.add('d-none');
        dhtLineChart.canvas.style.display = 'block';
        dhtLineChart.options.scales.x.time.unit = 'hour';
        dhtLineChart.update();
        updateChartAnnotations();
    }).catch((error) => {
        console.error("Error historis:", error);
        chartLoading.classList.add('d-none');
    });
}

// --- Reset ke Real-time ---
function resetToRealtime() {
    if (realtimeListener) return;

    datePicker.value = '';
    dhtLineChart.data.labels = [];
    dhtLineChart.data.datasets[0].data = [];
    dhtLineChart.data.datasets[1].data = [];
    dhtLineChart.options.scales.x.time.unit = 'second';
    dhtLineChart.update();
    startRealtimeListener();
}

// --- Export ke CSV ---
function exportDataToCSV() {
    const labels = dhtLineChart.data.labels;
    const temps = dhtLineChart.data.datasets[0].data;
    const hums = dhtLineChart.data.datasets[1].data;

    if (labels.length === 0) {
        alert("Tidak ada data untuk diekspor.");
        return;
    }

    let csv = "Timestamp,Suhu (°C),Kelembaban (%)\n";
    for (let i = 0; i < labels.length; i++) {
        const ts = new Date(labels[i]).toLocaleString('id-ID');
        csv += `"${ts}",${temps[i]},${hums[i]}\n`;
    }

    const fileName = datePicker.value 
        ? `dht11_${datePicker.value}.csv`
        : `dht11_realtime_${new Date().toISOString().split('T')[0]}.csv`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}