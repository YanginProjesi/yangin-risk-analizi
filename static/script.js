// API base URL - Render'da otomatik, localhost'ta manuel
const API_BASE_URL = window.location.origin;

// Sensor data storage
let sensorData = {
    temperature: [],
    smoke: [],
    timestamps: []
};

// Chart instances
let tempChart, smokeChart, timeSeriesChart;
let mapInstance = null; // Plotly map instance
let currentMapStyle = 'satellite'; // Default map style
let is3DView = true; // Default 3D view

// Weather API - OpenWeatherMap (ücretsiz)
// Not: API key almak için https://openweathermap.org/api adresine kaydolun
// Alternatif olarak ücretsiz WeatherAPI kullanılabilir
const WEATHER_API_KEY = 'demo_key'; // Gerçek kullanım için API key gerekli
const USE_WEATHER_API = true; // API kullanımını aç/kapat

// City coordinates - Türkiye'nin 81 ili
const cities = {
    'turkiye': { lat: 39.0, lon: 35.0, zoom: 6, name: 'Türkiye Genel', cityId: null },
    'adana': { lat: 37.0000, lon: 35.3213, zoom: 9, name: 'Adana', cityId: 325363 },
    'adiyaman': { lat: 37.7636, lon: 38.2786, zoom: 9, name: 'Adıyaman', cityId: null },
    'afyonkarahisar': { lat: 38.7567, lon: 30.5387, zoom: 9, name: 'Afyonkarahisar', cityId: null },
    'agri': { lat: 39.7217, lon: 43.0567, zoom: 9, name: 'Ağrı', cityId: null },
    'aksaray': { lat: 38.3686, lon: 34.0294, zoom: 9, name: 'Aksaray', cityId: null },
    'amasya': { lat: 40.6533, lon: 35.8331, zoom: 9, name: 'Amasya', cityId: null },
    'ankara': { lat: 39.9334, lon: 32.8597, zoom: 9, name: 'Ankara', cityId: 323786 },
    'antalya': { lat: 36.8969, lon: 30.7133, zoom: 9, name: 'Antalya', cityId: 323776 },
    'ardahan': { lat: 41.1106, lon: 42.7022, zoom: 9, name: 'Ardahan', cityId: null },
    'artvin': { lat: 41.1828, lon: 41.8183, zoom: 9, name: 'Artvin', cityId: null },
    'aydin': { lat: 37.8444, lon: 27.8458, zoom: 9, name: 'Aydın', cityId: null },
    'balikesir': { lat: 39.6484, lon: 27.8826, zoom: 9, name: 'Balıkesir', cityId: 322165 },
    'bartin': { lat: 41.6344, lon: 32.3375, zoom: 9, name: 'Bartın', cityId: null },
    'batman': { lat: 37.8814, lon: 41.1353, zoom: 9, name: 'Batman', cityId: null },
    'bayburt': { lat: 40.2553, lon: 40.2247, zoom: 9, name: 'Bayburt', cityId: null },
    'bilecik': { lat: 40.1425, lon: 29.9792, zoom: 9, name: 'Bilecik', cityId: null },
    'bingol': { lat: 38.8847, lon: 40.4981, zoom: 9, name: 'Bingöl', cityId: null },
    'bitlis': { lat: 38.4000, lon: 42.1083, zoom: 9, name: 'Bitlis', cityId: null },
    'bolu': { lat: 40.7356, lon: 31.6061, zoom: 9, name: 'Bolu', cityId: null },
    'burdur': { lat: 37.7203, lon: 30.2908, zoom: 9, name: 'Burdur', cityId: null },
    'bursa': { lat: 40.1826, lon: 29.0665, zoom: 9, name: 'Bursa', cityId: 750269 },
    'canakkale': { lat: 40.1553, lon: 26.4142, zoom: 9, name: 'Çanakkale', cityId: 749748 },
    'cankiri': { lat: 40.6000, lon: 33.6167, zoom: 9, name: 'Çankırı', cityId: null },
    'corum': { lat: 40.5500, lon: 34.9500, zoom: 9, name: 'Çorum', cityId: null },
    'denizli': { lat: 37.7765, lon: 29.0864, zoom: 9, name: 'Denizli', cityId: 317106 },
    'diyarbakir': { lat: 37.9100, lon: 40.2300, zoom: 9, name: 'Diyarbakır', cityId: 316541 },
    'duzce': { lat: 40.8439, lon: 31.1564, zoom: 9, name: 'Düzce', cityId: null },
    'edirne': { lat: 41.6772, lon: 26.5556, zoom: 9, name: 'Edirne', cityId: null },
    'elazig': { lat: 38.6753, lon: 39.2228, zoom: 9, name: 'Elazığ', cityId: null },
    'erzincan': { lat: 39.7500, lon: 39.5000, zoom: 9, name: 'Erzincan', cityId: null },
    'erzurum': { lat: 39.9043, lon: 41.2679, zoom: 9, name: 'Erzurum', cityId: null },
    'eskisehir': { lat: 39.7767, lon: 30.5206, zoom: 9, name: 'Eskişehir', cityId: 315202 },
    'gaziantep': { lat: 37.0662, lon: 37.3833, zoom: 9, name: 'Gaziantep', cityId: 314830 },
    'giresun': { lat: 40.9128, lon: 38.3894, zoom: 9, name: 'Giresun', cityId: null },
    'gumushane': { lat: 40.4603, lon: 39.5081, zoom: 9, name: 'Gümüşhane', cityId: null },
    'hakkari': { lat: 37.5744, lon: 43.7408, zoom: 9, name: 'Hakkari', cityId: null },
    'hatay': { lat: 36.4018, lon: 36.3498, zoom: 9, name: 'Hatay', cityId: null },
    'igdir': { lat: 39.9167, lon: 44.0333, zoom: 9, name: 'Iğdır', cityId: null },
    'isparta': { lat: 37.7647, lon: 30.5567, zoom: 9, name: 'Isparta', cityId: null },
    'istanbul': { lat: 41.0082, lon: 28.9784, zoom: 9, name: 'İstanbul', cityId: 745042 },
    'izmir': { lat: 38.4237, lon: 27.1428, zoom: 9, name: 'İzmir', cityId: 311046 },
    'kahramanmaras': { lat: 37.5858, lon: 36.9371, zoom: 9, name: 'Kahramanmaraş', cityId: null },
    'karabuk': { lat: 41.2061, lon: 32.6278, zoom: 9, name: 'Karabük', cityId: null },
    'karaman': { lat: 37.1811, lon: 33.2150, zoom: 9, name: 'Karaman', cityId: null },
    'kars': { lat: 40.6083, lon: 43.0972, zoom: 9, name: 'Kars', cityId: null },
    'kastamonu': { lat: 41.3767, lon: 33.7764, zoom: 9, name: 'Kastamonu', cityId: null },
    'kayseri': { lat: 38.7312, lon: 35.4787, zoom: 9, name: 'Kayseri', cityId: 308464 },
    'kilis': { lat: 36.7167, lon: 37.1167, zoom: 9, name: 'Kilis', cityId: null },
    'kirikkale': { lat: 39.8467, lon: 33.5153, zoom: 9, name: 'Kırıkkale', cityId: null },
    'kirklareli': { lat: 41.7333, lon: 27.2167, zoom: 9, name: 'Kırklareli', cityId: null },
    'kirsehir': { lat: 39.1458, lon: 34.1639, zoom: 9, name: 'Kırşehir', cityId: null },
    'kocaeli': { lat: 40.8533, lon: 29.8815, zoom: 9, name: 'Kocaeli', cityId: null },
    'konya': { lat: 37.8746, lon: 32.4932, zoom: 9, name: 'Konya', cityId: 306571 },
    'kutahya': { lat: 39.4167, lon: 29.9833, zoom: 9, name: 'Kütahya', cityId: null },
    'malatya': { lat: 38.3552, lon: 38.3095, zoom: 9, name: 'Malatya', cityId: null },
    'manisa': { lat: 38.6140, lon: 27.4296, zoom: 9, name: 'Manisa', cityId: null },
    'mardin': { lat: 37.3122, lon: 40.7350, zoom: 9, name: 'Mardin', cityId: null },
    'mersin': { lat: 36.8000, lon: 34.6333, zoom: 9, name: 'Mersin', cityId: 304382 },
    'mugla': { lat: 37.2153, lon: 28.3636, zoom: 9, name: 'Muğla', cityId: 304184 },
    'mus': { lat: 38.7333, lon: 41.4833, zoom: 9, name: 'Muş', cityId: null },
    'nevsehir': { lat: 38.6244, lon: 34.7239, zoom: 9, name: 'Nevşehir', cityId: null },
    'nigde': { lat: 37.9667, lon: 34.6833, zoom: 9, name: 'Niğde', cityId: null },
    'ordu': { lat: 40.9839, lon: 37.8764, zoom: 9, name: 'Ordu', cityId: null },
    'osmaniye': { lat: 37.0742, lon: 36.2478, zoom: 9, name: 'Osmaniye', cityId: null },
    'rize': { lat: 41.0208, lon: 40.5219, zoom: 9, name: 'Rize', cityId: null },
    'sakarya': { lat: 40.7569, lon: 30.3781, zoom: 9, name: 'Sakarya', cityId: null },
    'samsun': { lat: 41.2867, lon: 36.3300, zoom: 9, name: 'Samsun', cityId: 740264 },
    'sanliurfa': { lat: 37.1674, lon: 38.7955, zoom: 9, name: 'Şanlıurfa', cityId: null },
    'siirt': { lat: 37.9333, lon: 41.9500, zoom: 9, name: 'Siirt', cityId: null },
    'sinop': { lat: 42.0269, lon: 35.1506, zoom: 9, name: 'Sinop', cityId: null },
    'sirnak': { lat: 37.5167, lon: 42.4500, zoom: 9, name: 'Şırnak', cityId: null },
    'sivas': { lat: 39.7477, lon: 37.0179, zoom: 9, name: 'Sivas', cityId: null },
    'tekirdag': { lat: 40.9833, lon: 27.5167, zoom: 9, name: 'Tekirdağ', cityId: null },
    'tokat': { lat: 40.3139, lon: 36.5542, zoom: 9, name: 'Tokat', cityId: null },
    'trabzon': { lat: 41.0015, lon: 39.7178, zoom: 9, name: 'Trabzon', cityId: 738648 },
    'tunceli': { lat: 39.1083, lon: 39.5472, zoom: 9, name: 'Tunceli', cityId: null },
    'usak': { lat: 38.6803, lon: 29.4081, zoom: 9, name: 'Uşak', cityId: null },
    'van': { lat: 38.4891, lon: 43.4089, zoom: 9, name: 'Van', cityId: null },
    'yalova': { lat: 40.6550, lon: 29.2769, zoom: 9, name: 'Yalova', cityId: null },
    'yozgat': { lat: 39.8208, lon: 34.8083, zoom: 9, name: 'Yozgat', cityId: null },
    'zonguldak': { lat: 41.4564, lon: 31.7986, zoom: 9, name: 'Zonguldak', cityId: null }
};

// Current weather data cache
let currentWeather = {
    temperature: null,
    humidity: null,
    windSpeed: null,
    description: null,
    icon: null,
    lastUpdate: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    initializeTabs();
    initializeCharts();
    initializeMapControls();
    initializeMap('ankara'); // Default to Ankara
    
    // Set initial location and active monitoring text
    const defaultCity = cities['ankara'];
    if (defaultCity) {
        document.getElementById('location').textContent = defaultCity.name;
        document.getElementById('activeMonitoring').textContent = `${defaultCity.name} - Aktif İzleme`;
    }
    
    // Fetch initial weather data
    if (USE_WEATHER_API) {
        await fetchWeatherDataAlternative('ankara');
    }
    
    startSensorSimulation();
    
    // Sync city selectors
    const dashboardSelect = document.getElementById('citySelect');
    const mapSelect = document.getElementById('mapCitySelect');
    
    if (dashboardSelect && mapSelect) {
        dashboardSelect.addEventListener('change', async function() {
            mapSelect.value = this.value;
            await changeCity(); // Wait for weather update
            changeMapCity();
        });
        
        mapSelect.addEventListener('change', async function() {
            dashboardSelect.value = this.value;
            await changeCity(); // Wait for weather update
        });
    }
});

// Tab navigation
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // If simulation tab is opened, check SMS service status
            if (targetTab === 'simulation') {
                setTimeout(updateSMSStatus, 500);
            }
        });
    });
}

// Open AI Chatbot tab (for floating button)
function openAIChatbot() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Remove active class from all buttons and contents
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to AI chatbot tab
    const aiChatbotTab = document.getElementById('ai-chatbot');
    if (aiChatbotTab) {
        aiChatbotTab.classList.add('active');
        
        // Focus input after a short delay
        setTimeout(() => {
            const aiInput = document.getElementById('aiChatInput');
            if (aiInput) {
                aiInput.focus();
            }
        }, 100);
    }
}

// Initialize charts
function initializeCharts() {
    // Temperature chart
    const tempCtx = document.getElementById('tempChart').getContext('2d');
    tempChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Sıcaklık (°C)',
                data: [],
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 3,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 15,
                    max: 50
                }
            }
        }
    });

    // Smoke chart
    const smokeCtx = document.getElementById('smokeChart').getContext('2d');
    smokeChart = new Chart(smokeCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Duman (PPM)',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 3,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1000
                }
            }
        }
    });

    // Time series chart
    const timeCtx = document.getElementById('timeSeriesChart').getContext('2d');
    timeSeriesChart = new Chart(timeCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Sıcaklık (°C)',
                    data: [],
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    yAxisID: 'y',
                    tension: 0.4
                },
                {
                    label: 'Duman (PPM)',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    yAxisID: 'y1',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    min: 15,
                    max: 50
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0,
                    max: 1000,
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

// Initialize map with Plotly - NASA FIRMS benzeri 3D
function initializeMap(cityKey = 'ankara') {
    const city = cities[cityKey] || cities['ankara'];

    // Fire risk areas in Turkey (example locations)
    const fireRiskAreas = [
        { name: 'Antalya - Manavgat', lat: 36.8, lon: 31.4, risk: 'high', riskScore: 75 },
        { name: 'Muğla - Marmaris', lat: 36.9, lon: 28.3, risk: 'high', riskScore: 72 },
        { name: 'İzmir - Çeşme', lat: 38.3, lon: 26.3, risk: 'medium', riskScore: 45 },
        { name: 'Antalya - Kaş', lat: 36.2, lon: 29.6, risk: 'high', riskScore: 68 },
        { name: 'Muğla - Bodrum', lat: 37.0, lon: 27.4, risk: 'medium', riskScore: 50 },
        { name: 'Antalya - Alanya', lat: 36.5, lon: 32.0, risk: 'medium', riskScore: 48 },
        { name: 'Çanakkale - Kaz Dağları', lat: 39.8, lon: 26.8, risk: 'critical', riskScore: 88 },
        { name: 'Muğla - Fethiye', lat: 36.6, lon: 29.1, risk: 'high', riskScore: 70 },
        { name: 'İstanbul - Belgrad Ormanı', lat: 41.2, lon: 28.9, risk: 'medium', riskScore: 42 },
        { name: 'Bursa - Uludağ', lat: 40.1, lon: 29.2, risk: 'low', riskScore: 20 }
    ];

    const riskColors = {
        low: '#4CAF50',
        medium: '#FFC107',
        high: '#FF9800',
        critical: '#F44336'
    };

    const riskLabels = {
        low: 'Düşük Risk',
        medium: 'Orta Risk',
        high: 'Yüksek Risk',
        critical: 'Kritik Risk'
    };

    // Group areas by risk level
    const riskGroups = {
        low: fireRiskAreas.filter(a => a.risk === 'low'),
        medium: fireRiskAreas.filter(a => a.risk === 'medium'),
        high: fireRiskAreas.filter(a => a.risk === 'high'),
        critical: fireRiskAreas.filter(a => a.risk === 'critical')
    };

    // Create traces for each risk level - NASA FIRMS benzeri büyük marker'lar
    const traces = [];
    
    Object.keys(riskGroups).forEach(riskLevel => {
        const areas = riskGroups[riskLevel];
        if (areas.length > 0) {
            // Risk seviyesine göre boyut çarpanı
            const sizeMultiplier = {
                'low': 1.0,
                'medium': 1.3,
                'high': 1.8,
                'critical': 2.5
            };
            
            const baseSize = 12;
            const markerSize = baseSize * sizeMultiplier[riskLevel];
            
            traces.push({
                type: 'scattermapbox',
                mode: 'markers',
                lat: areas.map(a => a.lat),
                lon: areas.map(a => a.lon),
                marker: {
                    size: markerSize,
                    color: riskColors[riskLevel],
                    opacity: 0.85,
                    line: { 
                        width: 3, 
                        color: 'white' 
                    },
                    sizemode: 'diameter',
                    sizeref: 2
                },
                text: areas.map(a => 
                    `<b>🔥 ${a.name}</b><br>` +
                    `Risk Seviyesi: ${riskLabels[riskLevel]}<br>` +
                    `Risk Skoru: ${a.riskScore}/100<br>` +
                    `Konum: ${a.lat.toFixed(4)}°, ${a.lon.toFixed(4)}°`
                ),
                hovertemplate: '%{text}<extra></extra>',
                name: `🔥 ${riskLabels[riskLevel]}`,
                showlegend: true
            });
        }
    });

    // Add selected city marker - daha belirgin
    traces.push({
        type: 'scattermapbox',
        mode: 'markers',
        lat: [city.lat],
        lon: [city.lon],
        marker: {
            size: 20,
            color: '#2196F3',
            symbol: 'star',
            opacity: 0.95,
            line: { width: 3, color: 'white' }
        },
        text: [`📍 ${city.name}`],
        hovertemplate: '<b>%{text}</b><br>Seçili Konum<extra></extra>',
        name: '📍 Seçili Konum',
        showlegend: true
    });

    // Mapbox style seçimi
    let mapboxStyle = currentMapStyle;
    if (currentMapStyle === 'satellite') {
        // Uydu görüntüsü için custom layer
        mapboxStyle = 'white-bg';
    }

    // NASA FIRMS benzeri 3D layout
    const layout = {
        mapbox: {
            style: mapboxStyle,
            center: { lat: city.lat, lon: city.lon },
            zoom: city.zoom,
            bearing: 0,
            pitch: is3DView ? 50 : 0, // 3D açı - NASA FIRMS benzeri
            layers: currentMapStyle === 'satellite' ? [{
                'below': 'traces',
                'sourcetype': 'raster',
                'source': [
                    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                ],
                'opacity': 1.0
            }] : []
        },
        height: 700,
        margin: { l: 0, r: 0, t: 0, b: 0 },
        legend: {
            yanchor: 'top',
            y: 0.99,
            xanchor: 'left',
            x: 0.01,
            bgcolor: 'rgba(255,255,255,0.95)',
            bordercolor: 'black',
            borderwidth: 2,
            font: { size: 12 },
            itemsizing: 'constant'
        },
        hovermode: 'closest',
        paper_bgcolor: 'white',
        plot_bgcolor: 'white'
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        displaylogo: false
    };

    Plotly.newPlot('mapContainer', traces, layout, config);
    mapInstance = { city: cityKey, layout: layout, style: currentMapStyle, is3D: is3DView };
}

// Change map style
function changeMapStyle() {
    const select = document.getElementById('mapStyleSelect');
    currentMapStyle = select.value;
    const currentCity = document.getElementById('mapCitySelect')?.value || 'ankara';
    initializeMap(currentCity);
}

// Toggle 3D view
function toggle3DView() {
    const checkbox = document.getElementById('view3D');
    is3DView = checkbox.checked;
    const currentCity = document.getElementById('mapCitySelect')?.value || 'ankara';
    initializeMap(currentCity);
}

// Change city in dashboard
async function changeCity() {
    const select = document.getElementById('citySelect');
    const selectedCity = select.value;
    const city = cities[selectedCity];
    
    if (city) {
        document.getElementById('location').textContent = city.name;
        document.getElementById('activeMonitoring').textContent = `${city.name} - Aktif İzleme`;
        
        // Fetch new weather data for selected city
        if (USE_WEATHER_API) {
            const weatherData = await fetchWeatherDataAlternative(selectedCity);
            if (weatherData) {
                // Update temperature immediately
                const tempElement = document.getElementById('temperature');
                if (tempElement) {
                    tempElement.textContent = `${weatherData.temperature.toFixed(1)}°C`;
                }
                
                // Update weather info if available
                updateWeatherInfo(weatherData);
            }
        }
    }
}

// Update weather information display
function updateWeatherInfo(weather) {
    // You can add more weather info display here
    const tempStatus = document.getElementById('tempStatus');
    if (tempStatus && weather) {
        if (weather.temperature > 30) {
            tempStatus.textContent = `${weather.description || 'Sıcak'}`;
        } else if (weather.temperature < 10) {
            tempStatus.textContent = `${weather.description || 'Soğuk'}`;
        } else {
            tempStatus.textContent = `${weather.description || 'Normal'}`;
        }
    }
}

// Change city in map
function changeMapCity() {
    const select = document.getElementById('mapCitySelect');
    const selectedCity = select.value;
    
    if (selectedCity && cities[selectedCity]) {
        initializeMap(selectedCity);
    }
}

// Initialize map style selector
function initializeMapControls() {
    const styleSelect = document.getElementById('mapStyleSelect');
    if (styleSelect) {
        styleSelect.value = currentMapStyle;
    }
    
    const view3DCheckbox = document.getElementById('view3D');
    if (view3DCheckbox) {
        view3DCheckbox.checked = is3DView;
    }
}

// Fetch real-time weather data
async function fetchWeatherData(cityKey = 'istanbul') {
    const city = cities[cityKey] || cities['istanbul'];
    
    if (!city.cityId && cityKey !== 'turkiye') {
        // Use coordinates if city ID not available
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=tr`
            );
            
            if (response.ok) {
                const data = await response.json();
                currentWeather = {
                    temperature: data.main.temp,
                    humidity: data.main.humidity,
                    windSpeed: data.wind?.speed || 0,
                    description: data.weather[0].description,
                    icon: data.weather[0].icon,
                    lastUpdate: new Date()
                };
                return currentWeather;
            }
        } catch (error) {
            console.log('Weather API hatası, simüle edilmiş veri kullanılıyor:', error);
        }
    } else if (city.cityId) {
        // Use city ID
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?id=${city.cityId}&appid=${WEATHER_API_KEY}&units=metric&lang=tr`
            );
            
            if (response.ok) {
                const data = await response.json();
                currentWeather = {
                    temperature: data.main.temp,
                    humidity: data.main.humidity,
                    windSpeed: data.wind?.speed || 0,
                    description: data.weather[0].description,
                    icon: data.weather[0].icon,
                    lastUpdate: new Date()
                };
                return currentWeather;
            }
        } catch (error) {
            console.log('Weather API hatası, simüle edilmiş veri kullanılıyor:', error);
        }
    }
    
    // Fallback: Use simulated data if API fails
    return null;
}

// Alternative: Use free WeatherAPI (no key required for limited use)
async function fetchWeatherDataAlternative(cityKey = 'istanbul') {
    const city = cities[cityKey] || cities['istanbul'];
    
    try {
        // Using a free weather API that doesn't require key
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=Europe/Istanbul`
        );
        
        if (response.ok) {
            const data = await response.json();
            currentWeather = {
                temperature: data.current.temperature_2m,
                humidity: data.current.relative_humidity_2m,
                windSpeed: data.current.wind_speed_10m,
                description: 'Açık',
                icon: '01d',
                lastUpdate: new Date()
            };
            return currentWeather;
        }
    } catch (error) {
        console.log('Weather API hatası:', error);
    }
    
    return null;
}

// Sensor simulation with real weather data
function startSensorSimulation() {
    // Fetch weather data immediately
    const currentCity = document.getElementById('citySelect')?.value || 'ankara';
    fetchWeatherDataAlternative(currentCity).then(() => {
        updateSensorData();
    });
    
    // Update every 2 seconds
    setInterval(() => {
        updateSensorData();
    }, 2000);
    
    // Update weather data every 10 minutes
    setInterval(() => {
        const currentCity = document.getElementById('citySelect')?.value || 'ankara';
        fetchWeatherDataAlternative(currentCity);
    }, 600000); // 10 minutes
}

function updateSensorData() {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('tr-TR');
    
    // Use real weather temperature if available, otherwise simulate
    let temperature;
    if (currentWeather.temperature !== null && currentWeather.lastUpdate && 
        (now - currentWeather.lastUpdate) < 600000) { // Use if less than 10 minutes old
        temperature = currentWeather.temperature;
    } else {
    // Simulate normal sensor readings with some variation
    const baseTemp = 25;
    const tempVariation = (Math.random() - 0.5) * 5;
        temperature = Math.max(20, Math.min(35, baseTemp + tempVariation));
    }
    
    // Smoke simulation (not available from weather API)
    const baseSmoke = 50;
    const smokeVariation = Math.random() * 100;
    const smoke = Math.max(0, Math.min(200, baseSmoke + smokeVariation));
    
    // Store data (keep last 20 readings)
    sensorData.temperature.push(temperature);
    sensorData.smoke.push(smoke);
    sensorData.timestamps.push(timeLabel);
    
    if (sensorData.temperature.length > 20) {
        sensorData.temperature.shift();
        sensorData.smoke.shift();
        sensorData.timestamps.shift();
    }
    
    // Update displays
    updateSensorDisplays(temperature, smoke);
    updateCharts();
    calculateFireRisk(temperature, smoke);
}

function updateSensorDisplays(temperature, smoke) {
    document.getElementById('temperature').textContent = `${temperature.toFixed(1)}°C`;
    document.getElementById('smoke').textContent = `${smoke.toFixed(0)} PPM`;
    
    // Update status
    const tempStatus = document.getElementById('tempStatus');
    if (temperature > 40) {
        tempStatus.textContent = 'Tehlikeli';
        tempStatus.className = 'sensor-status danger';
    } else if (temperature > 30) {
        tempStatus.textContent = 'Uyarı';
        tempStatus.className = 'sensor-status warning';
    } else {
        tempStatus.textContent = 'Normal';
        tempStatus.className = 'sensor-status normal';
    }
    
    const smokeStatus = document.getElementById('smokeStatus');
    if (smoke > 150) {
        smokeStatus.textContent = 'Tehlikeli';
        smokeStatus.className = 'sensor-status danger';
    } else if (smoke > 100) {
        smokeStatus.textContent = 'Uyarı';
        smokeStatus.className = 'sensor-status warning';
    } else {
        smokeStatus.textContent = 'Normal';
        smokeStatus.className = 'sensor-status normal';
    }
}

// ML Model ile risk tahmini yap
async function predictFireRiskML(temperature, smoke, weatherData = null) {
    try {
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12
        const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        
        // Hava durumu verilerini kullan (varsa)
        const features = {
            temperature: temperature,
            humidity: weatherData?.humidity || 50,
            wind_speed: weatherData?.windSpeed || 10,
            wind_direction: weatherData?.windDirection || 180,
            precipitation: weatherData?.precipitation || 0,
            month: month,
            day_of_year: dayOfYear,
            historical_fires_nearby: 0, // Gerçek uygulamada veritabanından alınabilir
            vegetation_index: 0.6, // Gerçek uygulamada uydu verilerinden alınabilir
            elevation: 500 // Gerçek uygulamada coğrafi verilerden alınabilir
        };
        
        const response = await fetch(`${API_BASE_URL}/api/predict-risk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(features)
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                return {
                    riskScore: data.risk_score,
                    riskLevel: data.risk_level,
                    confidence: data.confidence,
                    usingML: true
                };
            }
        }
        
        // ML modeli başarısız olursa eski yönteme dön
        return null;
    } catch (error) {
        console.warn('ML risk tahmini başarısız, eski yöntem kullanılıyor:', error);
        return null;
    }
}

async function calculateFireRisk(temperature, smoke) {
    // Önce ML modeli ile tahmin yapmayı dene
    const mlPrediction = await predictFireRiskML(temperature, smoke, currentWeather);
    
    let risk, riskLevel, riskColor;
    let usingML = false;
    
    if (mlPrediction && mlPrediction.usingML) {
        // ML modeli başarılı
        risk = mlPrediction.riskScore;
        riskLevel = mlPrediction.riskLevel;
        usingML = true;
        
        // Risk seviyesine göre renk
        if (riskLevel === 'Kritik') {
            riskColor = '#ff6b6b';
        } else if (riskLevel === 'Yüksek') {
            riskColor = '#FF9800';
        } else if (riskLevel === 'Orta') {
            riskColor = '#FFC107';
        } else {
            riskColor = '#4CAF50';
        }
    } else {
        // ML modeli başarısız, eski yöntemi kullan
        risk = 0;
        
        // Temperature contribution (0-50 points)
        if (temperature > 40) risk += 50;
        else if (temperature > 35) risk += 35;
        else if (temperature > 30) risk += 20;
        else if (temperature > 25) risk += 10;
        
        // Smoke contribution (0-50 points)
        if (smoke > 150) risk += 50;
        else if (smoke > 100) risk += 35;
        else if (smoke > 50) risk += 20;
        else if (smoke > 25) risk += 10;
        
        // Risk seviyesi belirleme
        if (risk >= 75) {
            riskLevel = 'Kritik';
            riskColor = '#ff6b6b';
        } else if (risk >= 50) {
            riskLevel = 'Yüksek';
            riskColor = '#FF9800';
        } else if (risk >= 25) {
            riskLevel = 'Orta';
            riskColor = '#FFC107';
        } else {
            riskLevel = 'Düşük';
            riskColor = '#4CAF50';
        }
    }
    
    // Update risk display
    const riskElement = document.getElementById('fireRisk');
    const riskBar = document.getElementById('riskBar');
    const riskStatus = document.getElementById('riskStatus');
    const statusAlert = document.getElementById('statusAlert');
    
    riskBar.style.width = `${risk}%`;
    riskBar.style.backgroundColor = riskColor;
    
    if (risk >= 75) {
        riskElement.textContent = riskLevel;
        riskElement.style.color = riskColor;
        if (usingML) {
            riskElement.title = `🤖 ML Tahmini: ${risk.toFixed(1)}/100 (Güven: ${(mlPrediction.confidence * 100).toFixed(0)}%)`;
        }
        riskStatus.textContent = 'Acil Müdahale Gerekli';
        riskStatus.className = 'sensor-status danger';
        statusAlert.className = 'status-alert danger';
        statusAlert.textContent = '⚠️ KRİTİK: Yangın riski çok yüksek! Acil önlem alın!';
    } else if (risk >= 50) {
        riskElement.textContent = riskLevel;
        riskElement.style.color = riskColor;
        if (usingML) {
            riskElement.title = `🤖 ML Tahmini: ${risk.toFixed(1)}/100 (Güven: ${(mlPrediction.confidence * 100).toFixed(0)}%)`;
        }
        riskStatus.textContent = 'Dikkatli Olun';
        riskStatus.className = 'sensor-status warning';
        statusAlert.className = 'status-alert warning';
        statusAlert.textContent = '⚠️ UYARI: Yangın riski yüksek! Önlem alın!';
    } else if (risk >= 25) {
        riskElement.textContent = riskLevel;
        riskElement.style.color = riskColor;
        if (usingML) {
            riskElement.title = `🤖 ML Tahmini: ${risk.toFixed(1)}/100 (Güven: ${(mlPrediction.confidence * 100).toFixed(0)}%)`;
        }
        riskStatus.textContent = 'İzleniyor';
        riskStatus.className = 'sensor-status warning';
        statusAlert.className = 'status-alert safe';
        statusAlert.textContent = '✅ Durum: Normal seviyede izleniyor';
    } else {
        riskElement.textContent = riskLevel;
        riskElement.style.color = riskColor;
        if (usingML) {
            riskElement.title = `🤖 ML Tahmini: ${risk.toFixed(1)}/100 (Güven: ${(mlPrediction.confidence * 100).toFixed(0)}%)`;
        }
        riskStatus.textContent = 'Güvenli';
        riskStatus.className = 'sensor-status normal';
        statusAlert.className = 'status-alert safe';
        statusAlert.textContent = '✅ Durum: Güvenli';
    }
}

function updateCharts() {
    // Update temperature chart
    tempChart.data.labels = sensorData.timestamps;
    tempChart.data.datasets[0].data = sensorData.temperature;
    tempChart.update('none');
    
    // Update smoke chart
    smokeChart.data.labels = sensorData.timestamps;
    smokeChart.data.datasets[0].data = sensorData.smoke;
    smokeChart.update('none');
    
    // Update time series chart
    timeSeriesChart.data.labels = sensorData.timestamps;
    timeSeriesChart.data.datasets[0].data = sensorData.temperature;
    timeSeriesChart.data.datasets[1].data = sensorData.smoke;
    timeSeriesChart.update('none');
}

// Fire simulation function
function simulateFire() {
    // Simulate a fire event
    const fireDuration = 10000; // 10 seconds
    const startTime = Date.now();
    
    const fireInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / fireDuration;
        
        if (progress >= 1) {
            clearInterval(fireInterval);
            // Return to normal
            return;
        }
        
        // Simulate increasing temperature and smoke
        const fireTemp = 25 + (progress * 30); // Up to 55°C
        const fireSmoke = 50 + (progress * 300); // Up to 350 PPM
        
        // Temporarily override sensor data
        const lastTemp = sensorData.temperature[sensorData.temperature.length - 1] || 25;
        const lastSmoke = sensorData.smoke[sensorData.smoke.length - 1] || 50;
        
        sensorData.temperature[sensorData.temperature.length - 1] = fireTemp;
        sensorData.smoke[sensorData.smoke.length - 1] = fireSmoke;
        
        updateSensorDisplays(fireTemp, fireSmoke);
        calculateFireRisk(fireTemp, fireSmoke);
        updateCharts();
    }, 500);
    
    // Show alert
    alert('🧪 Test Simülasyonu Başlatıldı!\n\nYangın senaryosu simüle ediliyor. Sensörler yüksek değerler gösterecek.');
}

// Fire Simulation Variables
let simulationRunning = false;
let simulationPaused = false;
let simulationInterval = null;
let simulationTime = 0; // minutes
let simulationSpeed = 1; // 1x to 5x
let simChart = null;
let simMapInstance = null;

// Simulation data
const simulationData = {
    area: 0.01, // km²
    speed: 2.5, // km/h
    direction: 135, // degrees (Güneydoğu)
    temperature: 25,
    smoke: 0,
    windSpeed: 15,
    windDirection: 135,
    alerts: []
};

// Initialize simulation
function initSimulation() {
    // Set initial date
    const now = new Date();
    document.getElementById('simDate').textContent = now.toLocaleDateString('tr-TR');
    
    // Set initial speed value display
    const speedValueElement = document.getElementById('speedValue');
    if (speedValueElement) {
        speedValueElement.textContent = simulationSpeed + 'x';
    }
    
    // Initialize simulation chart
    const simCtx = document.getElementById('simChart');
    if (simCtx) {
        simChart = new Chart(simCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Yanan Alan (km²)',
                    data: [],
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Alan (km²)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Zaman (dakika)'
                        }
                    }
                }
            }
        });
    }
    
    // Initialize simulation map
    initializeSimMap();
    
    // Reset simulation
    resetFireSimulation();
}

// Start fire simulation
function startFireSimulation() {
    if (simulationRunning && !simulationPaused) return;
    
    simulationRunning = true;
    simulationPaused = false;
    
    document.getElementById('startSimulation').disabled = true;
    document.getElementById('pauseSimulation').disabled = false;
    
    // Add initial alert
    addSimAlert('info', '🔥 Yangın tespit edildi! Simülasyon başlatıldı.');
    
    // SMS gönder
    sendSimulationSMS();
    
    // Scroll to simulation stats section to show values
    setTimeout(() => {
        const statsSection = document.querySelector('.simulation-stats');
        if (statsSection) {
            statsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 300);
    
    // Update every second (scaled by speed)
    simulationInterval = setInterval(() => {
        if (!simulationPaused) {
            updateSimulation();
        }
    }, 1000 / simulationSpeed);
}

// Check if SMS service is running
function checkSMSService() {
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 2000);
    });
    
    const fetchPromise = fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    
    return Promise.race([fetchPromise, timeoutPromise])
    .then(response => {
        if (!response.ok) {
            throw new Error('Service not responding');
        }
        return response.json();
    })
    .catch(error => {
        // Connection refused or timeout
        return null;
    });
}

// Update SMS service status indicator
function updateSMSStatus() {
    checkSMSService().then(healthData => {
        const statusElement = document.getElementById('smsServiceStatus');
        if (statusElement) {
            if (healthData && healthData.status === 'ok') {
                statusElement.innerHTML = '<span style="color: #4caf50; font-weight: bold;">✅ SMS Servisi Çalışıyor</span>';
                statusElement.style.display = 'block';
                statusElement.style.background = '#e8f5e9';
                statusElement.style.border = '2px solid #4caf50';
            } else {
                statusElement.innerHTML = '<span style="color: #f44336; font-weight: bold;">❌ SMS Servisi Çalışmıyor</span><br>' +
                    '<small style="color: #666;">Backend servisi çalışmıyor. Render\'da otomatik çalışır.</small>';
                statusElement.style.display = 'block';
                statusElement.style.background = '#ffebee';
                statusElement.style.border = '2px solid #f44336';
            }
        }
    }).catch(error => {
        const statusElement = document.getElementById('smsServiceStatus');
        if (statusElement) {
            statusElement.innerHTML = '<span style="color: #f44336; font-weight: bold;">❌ SMS Servisi Çalışmıyor</span><br>' +
                '<small style="color: #666;">Bağlantı hatası: ' + error.message + '</small>';
            statusElement.style.display = 'block';
            statusElement.style.background = '#ffebee';
            statusElement.style.border = '2px solid #f44336';
        }
    });
}

// Send SMS when simulation starts
function sendSimulationSMS() {
    const phoneNumber = '+905326982193'; // Varsayılan telefon numarası
    const location = 'Antalya - Manavgat';
    const latitude = 36.8969;
    const longitude = 30.7133;
    
    // Önce servisin çalışıp çalışmadığını kontrol et
    checkSMSService()
    .then(healthData => {
        if (!healthData) {
            throw new Error('CONNECTION_REFUSED');
        }
        
        console.log('Backend servisi çalışıyor:', healthData);
        
        // Servis çalışıyorsa SMS gönder
        const smsData = {
            phone_number: phoneNumber,
            risk_level: 'Kritik',
            location: location,
            risk_score: 85.0,
            latitude: latitude,
            longitude: longitude,
            message: '[YANGIN] YANGIN SIMULASYONU BASLATILDI!\n\nAntalya - Manavgat bolgesinde yangin simulasyonu baslatildi. Sistem yangin gelisimini izliyor.'
        };
        
        // Create timeout promise for SMS sending
        const smsTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 10000);
        });
        
        const smsFetchPromise = fetch(`${API_BASE_URL}/api/send-sms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(smsData)
        });
        
        return Promise.race([smsFetchPromise, smsTimeoutPromise]);
    })
    .then(async response => {
        if (!response) {
            throw new Error('CONNECTION_REFUSED');
        }
        
        // Response body'yi oku (hem başarılı hem hatalı durumlar için)
        const data = await response.json();
        
        if (!response.ok) {
            // HTTP 500 gibi hatalar için detaylı mesaj
            const errorMsg = data && data.message ? data.message : response.statusText;
            const errorType = data && data.error_type ? ` (${data.error_type})` : '';
            throw new Error(`HTTP ${response.status}: ${errorMsg}${errorType}`);
        }
        
        return data;
    })
    .then(data => {
        if (data && data.success) {
            addSimAlert('success', 'SMS bildirimi gonderildi: ' + phoneNumber);
            console.log('SMS basariyla gonderildi:', data);
            updateSMSStatus(); // Update status after successful send
        } else {
            addSimAlert('warning', 'SMS gonderilemedi: ' + (data ? data.message : 'Bilinmeyen hata'));
            console.error('SMS gonderme hatasi:', data);
        }
    })
    .catch(error => {
        console.error('SMS API hatası:', error);
        let errorMessage = '';
        
        if (error.name === 'AbortError' || error.message === 'CONNECTION_REFUSED' || 
            error.message === 'Timeout' || error.message.includes('Failed to fetch') || 
            error.message.includes('NetworkError') || error.message.includes('ERR_CONNECTION_REFUSED') ||
            error.message.includes('ERR_NETWORK_CHANGED') || error.message.includes('ERR_INTERNET_DISCONNECTED')) {
            
            errorMessage = '❌ SMS BAĞLANTI HATASI!\n\n';
            errorMessage += 'Backend servisi çalışmıyor veya erişilemiyor.\n\n';
            errorMessage += '🔧 ÇÖZÜM:\n\n';
            errorMessage += 'Render\'da deploy edildiyse otomatik çalışır.\n';
            errorMessage += 'Localhost\'ta test ediyorsanız backend servisini başlatın.';
        } else if (error.message.includes('HTTP 500')) {
            errorMessage = 'HATA: HTTP 500 - INTERNAL SERVER ERROR\n\n';
            errorMessage += 'Backend servisinde bir hata oluştu.\n\n';
            errorMessage += 'Hata detayi: ' + error.message;
        } else {
            errorMessage = 'SMS gonderme hatasi: ' + error.message + '\n\n';
            errorMessage += 'Lutfen backend servisinin calistigindan emin olun.';
        }
        
        addSimAlert('error', errorMessage);
        updateSMSStatus(); // Update status to show error
    });
}

// Pause simulation
function pauseFireSimulation() {
    simulationPaused = !simulationPaused;
    document.getElementById('pauseSimulation').textContent = simulationPaused ? '▶️ Devam Et' : '⏸️ Duraklat';
}

// Reset simulation
function resetFireSimulation() {
    simulationRunning = false;
    simulationPaused = false;
    simulationTime = 0;
    
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
    }
    
    // Reset data
    simulationData.area = 0.01;
    simulationData.speed = 2.5;
    simulationData.temperature = 25;
    simulationData.smoke = 0;
    simulationData.alerts = [];
    
    // Reset UI
    document.getElementById('startSimulation').disabled = false;
    document.getElementById('pauseSimulation').disabled = true;
    document.getElementById('pauseSimulation').textContent = '⏸️ Duraklat';
    document.getElementById('simAlertList').innerHTML = '';
    
    // Update displays
    updateSimulationDisplays();
    
    // Reset chart
    if (simChart) {
        simChart.data.labels = [];
        simChart.data.datasets[0].data = [];
        simChart.update();
    }
    
    // Reset map
    initializeSimMap();
}

// Update simulation
function updateSimulation() {
    simulationTime += 1; // 1 minute per update
    
    // Calculate area growth (circular spread)
    const radiusKm = simulationData.speed * (simulationTime / 60); // hours
    simulationData.area = Math.PI * Math.pow(radiusKm, 2) + 0.01; // km²
    
    // Increase temperature based on fire size
    simulationData.temperature = Math.min(25 + (simulationData.area * 10), 50);
    
    // Increase smoke based on fire size
    simulationData.smoke = Math.min(simulationData.area * 1000, 200);
    
    // Increase speed based on wind and temperature
    simulationData.speed = 2.5 + (simulationData.windSpeed * 0.1) + ((simulationData.temperature - 25) * 0.1);
    simulationData.speed = Math.min(simulationData.speed, 20);
    
    // Add alerts at specific times
    if (simulationTime === 5) {
        addSimAlert('warning', '⚠️ Yangın hızla büyüyor! Yayılma hızı: ' + simulationData.speed.toFixed(1) + ' km/h');
    }
    if (simulationTime === 15) {
        addSimAlert('warning', '⚠️ Yangın alanı 1 km²\'yi aştı! Acil müdahale gerekli.');
    }
    if (simulationTime === 30) {
        addSimAlert('danger', '🚨 KRİTİK: Yangın kontrol altına alınamıyor! Evakuasyon gerekebilir.');
    }
    if (simulationTime === 60) {
        addSimAlert('danger', '🚨 ACİL: Yangın çok büyük alana yayıldı! Tüm kaynaklar seferber edilmeli.');
    }
    
    // Update displays
    updateSimulationDisplays();
    
    // Update chart
    if (simChart) {
        const minutes = Math.floor(simulationTime);
        simChart.data.labels.push(minutes + ' dk');
        simChart.data.datasets[0].data.push(simulationData.area);
        
        // Keep only last 60 points
        if (simChart.data.labels.length > 60) {
            simChart.data.labels.shift();
            simChart.data.datasets[0].data.shift();
        }
        
        simChart.update('none');
    }
    
    // Update map
    updateSimMap();
}

// Update simulation displays
function updateSimulationDisplays() {
    // Area
    document.getElementById('simArea').textContent = simulationData.area.toFixed(3) + ' km²';
    const areaPercent = Math.min((simulationData.area / 10) * 100, 100);
    document.getElementById('simAreaBar').style.width = areaPercent + '%';
    
    // Speed
    document.getElementById('simSpeedValue').textContent = simulationData.speed.toFixed(1) + ' km/h';
    const speedPercent = (simulationData.speed / 20) * 100;
    document.getElementById('simSpeedBar').style.width = speedPercent + '%';
    
    // Direction
    const directions = ['Kuzey', 'Kuzeydoğu', 'Doğu', 'Güneydoğu', 'Güney', 'Güneybatı', 'Batı', 'Kuzeybatı'];
    const dirIndex = Math.floor((simulationData.direction + 22.5) / 45) % 8;
    document.getElementById('simDirection').textContent = directions[dirIndex];
    document.getElementById('compassNeedle').style.transform = `translate(-50%, -100%) rotate(${simulationData.direction}deg)`;
    
    // Time
    const hours = Math.floor(simulationTime / 60);
    const minutes = simulationTime % 60;
    document.getElementById('simTime').textContent = hours + ':' + (minutes < 10 ? '0' : '') + minutes;
    const timePercent = Math.min((simulationTime / 120) * 100, 100);
    document.getElementById('timelineMarker').style.width = timePercent + '%';
}

// Add simulation alert
function addSimAlert(type, message) {
    const alertList = document.getElementById('simAlertList');
    if (!alertList) {
        console.error('simAlertList elementi bulunamadı');
        return;
    }
    
    const alertItem = document.createElement('div');
    alertItem.className = 'sim-alert-item ' + type;
    
    // Çok satırlı mesajları düzgün göster
    const formattedMessage = message.replace(/\n/g, '<br>');
    alertItem.innerHTML = '<strong>' + new Date().toLocaleTimeString('tr-TR') + '</strong> - ' + formattedMessage;
    alertList.insertBefore(alertItem, alertList.firstChild);
    
    // Keep only last 10 alerts
    while (alertList.children.length > 10) {
        alertList.removeChild(alertList.lastChild);
    }
    
    // Scroll to top to show new alert
    alertList.scrollTop = 0;
}

// Update simulation speed
function updateSimSpeed() {
    const speedSlider = document.getElementById('simSpeed');
    simulationSpeed = parseInt(speedSlider.value);
    document.getElementById('speedValue').textContent = simulationSpeed + 'x';
    
    // Restart interval with new speed
    if (simulationRunning && !simulationPaused) {
        clearInterval(simulationInterval);
        simulationInterval = setInterval(() => {
            if (!simulationPaused) {
                updateSimulation();
            }
        }, 1000 / simulationSpeed);
    }
}

// Initialize simulation map
function initializeSimMap() {
    const fireLat = 36.8;
    const fireLon = 31.4;
    
    const trace = {
        type: 'scattermapbox',
        mode: 'markers',
        lat: [fireLat],
        lon: [fireLon],
        marker: {
            size: 20,
            color: '#ff6b6b',
            symbol: 'fire',
            opacity: 0.8
        },
        text: ['Yangın Başlangıç Noktası'],
        name: 'Yangın'
    };
    
    const layout = {
        mapbox: {
            style: 'open-street-map',
            center: { lat: fireLat, lon: fireLon },
            zoom: 11
        },
        height: 400,
        margin: { l: 0, r: 0, t: 0, b: 0 }
    };
    
    if (typeof Plotly !== 'undefined') {
        Plotly.newPlot('simMapContainer', [trace], layout, { responsive: true });
    }
}

// Update simulation map
function updateSimMap() {
    const fireLat = 36.8;
    const fireLon = 31.4;
    
    // Calculate fire radius in degrees (approximate)
    const radiusKm = Math.sqrt(simulationData.area / Math.PI);
    const radiusDeg = radiusKm / 111; // 1 degree ≈ 111 km
    
    // Create circle points
    const circlePoints = [];
    for (let i = 0; i <= 360; i += 10) {
        const rad = (i * Math.PI) / 180;
        circlePoints.push({
            lat: fireLat + radiusDeg * Math.cos(rad),
            lon: fireLon + radiusDeg * Math.sin(rad)
        });
    }
    
    const traces = [
        {
            type: 'scattermapbox',
            mode: 'markers',
            lat: [fireLat],
            lon: [fireLon],
            marker: {
                size: 20,
                color: '#ff6b6b',
                symbol: 'fire',
                opacity: 0.8
            },
            text: ['Yangın Merkezi'],
            name: 'Yangın Merkezi'
        },
        {
            type: 'scattermapbox',
            mode: 'lines',
            lat: circlePoints.map(p => p.lat),
            lon: circlePoints.map(p => p.lon),
            line: {
                color: '#ff6b6b',
                width: 3
            },
            fill: 'toself',
            fillcolor: 'rgba(255, 107, 107, 0.3)',
            name: 'Yanan Alan',
            text: ['Yanan Alan: ' + simulationData.area.toFixed(3) + ' km²']
        }
    ];
    
    const layout = {
        mapbox: {
            style: 'open-street-map',
            center: { lat: fireLat, lon: fireLon },
            zoom: 11
        },
        height: 400,
        margin: { l: 0, r: 0, t: 0, b: 0 }
    };
    
    if (typeof Plotly !== 'undefined') {
        Plotly.newPlot('simMapContainer', traces, layout, { responsive: true });
    }
}

// Initialize simulation when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initSimulation();
        // Check SMS service status when page loads
        setTimeout(updateSMSStatus, 1000);
        // Check every 10 seconds
        setInterval(updateSMSStatus, 10000);
    });
} else {
    initSimulation();
    // Check SMS service status when page loads
    setTimeout(updateSMSStatus, 1000);
    // Check every 10 seconds
    setInterval(updateSMSStatus, 10000);
}

// Historical Fire Data
let historicalFiresData = [];
let historyYearChart = null;
let historyMonthChart = null;

// Kapsamlı tarihsel yangın verileri (1990-2024)
const sampleHistoricalFires = [
    // 2024
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2024, month: 7, 
      fireLat: 36.8, fireLon: 31.4, areaKm2: 8.5, areaHectare: 850, 
      durationDays: 6, severity: 'Yüksek', description: 'Manavgat Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2024, month: 8,
      fireLat: 36.9, fireLon: 28.3, areaKm2: 4.2, areaHectare: 420,
      durationDays: 4, severity: 'Yüksek', description: 'Marmaris Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 2024, month: 6,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 2.8, areaHectare: 280,
      durationDays: 3, severity: 'Orta', description: 'Çeşme Orman Yangını' },
    { city: 'Balıkesir', cityLat: 39.6484, cityLon: 27.8826, year: 2024, month: 7,
      fireLat: 39.5, fireLon: 27.8, areaKm2: 3.5, areaHectare: 350,
      durationDays: 3, severity: 'Orta', description: 'Ayvalık Orman Yangını' },
    
    // 2023
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2023, month: 7, 
      fireLat: 36.8, fireLon: 31.4, areaKm2: 12.3, areaHectare: 1230, 
      durationDays: 8, severity: 'Yüksek', description: 'Manavgat Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2023, month: 7,
      fireLat: 36.9, fireLon: 28.3, areaKm2: 6.8, areaHectare: 680,
      durationDays: 6, severity: 'Yüksek', description: 'Marmaris Orman Yangını' },
    { city: 'Çanakkale', cityLat: 40.1553, cityLon: 26.4142, year: 2023, month: 8,
      fireLat: 39.8, fireLon: 26.8, areaKm2: 5.2, areaHectare: 520,
      durationDays: 5, severity: 'Yüksek', description: 'Kaz Dağları Orman Yangını' },
    { city: 'Aydın', cityLat: 37.8560, cityLon: 27.8416, year: 2023, month: 7,
      fireLat: 37.7, fireLon: 27.6, areaKm2: 3.1, areaHectare: 310,
      durationDays: 3, severity: 'Orta', description: 'Kuşadası Orman Yangını' },
    
    // 2022
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2022, month: 7,
      fireLat: 36.8, fireLon: 31.4, areaKm2: 15.3, areaHectare: 1530,
      durationDays: 10, severity: 'Yüksek', description: 'Manavgat Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2022, month: 7,
      fireLat: 36.6, fireLon: 29.1, areaKm2: 4.5, areaHectare: 450,
      durationDays: 4, severity: 'Yüksek', description: 'Fethiye Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 2022, month: 8,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 2.9, areaHectare: 290,
      durationDays: 3, severity: 'Orta', description: 'Çeşme Orman Yangını' },
    
    // 2021 - Büyük yangınlar yılı
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2021, month: 7, 
      fireLat: 36.8, fireLon: 31.4, areaKm2: 58.0, areaHectare: 5800, 
      durationDays: 15, severity: 'Kritik', description: 'Manavgat Büyük Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2021, month: 7,
      fireLat: 36.9, fireLon: 28.3, areaKm2: 12.5, areaHectare: 1250,
      durationDays: 8, severity: 'Kritik', description: 'Marmaris Büyük Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 2021, month: 8,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 8.2, areaHectare: 820,
      durationDays: 5, severity: 'Yüksek', description: 'Çeşme Orman Yangını' },
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2021, month: 8,
      fireLat: 36.2, fireLon: 29.6, areaKm2: 6.8, areaHectare: 680,
      durationDays: 5, severity: 'Yüksek', description: 'Kaş Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2021, month: 7,
      fireLat: 37.0, fireLon: 27.4, areaKm2: 4.2, areaHectare: 420,
      durationDays: 3, severity: 'Yüksek', description: 'Bodrum Orman Yangını' },
    { city: 'Aydın', cityLat: 37.8560, cityLon: 27.8416, year: 2021, month: 7,
      fireLat: 37.8, fireLon: 27.3, areaKm2: 3.5, areaHectare: 350,
      durationDays: 3, severity: 'Orta', description: 'Didim Orman Yangını' },
    
    // 2020
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2020, month: 8,
      fireLat: 36.2, fireLon: 29.6, areaKm2: 3.5, areaHectare: 350,
      durationDays: 3, severity: 'Orta', description: 'Kaş Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2020, month: 6,
      fireLat: 36.6, fireLon: 29.1, areaKm2: 2.1, areaHectare: 210,
      durationDays: 2, severity: 'Orta', description: 'Fethiye Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 2020, month: 7,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 3.2, areaHectare: 320,
      durationDays: 3, severity: 'Orta', description: 'Çeşme Orman Yangını' },
    { city: 'Çanakkale', cityLat: 40.1553, cityLon: 26.4142, year: 2020, month: 7,
      fireLat: 39.8, fireLon: 26.8, areaKm2: 2.8, areaHectare: 280,
      durationDays: 2, severity: 'Orta', description: 'Kaz Dağları Orman Yangını' },
    
    // 2019
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2019, month: 7,
      fireLat: 37.0, fireLon: 27.4, areaKm2: 2.8, areaHectare: 280,
      durationDays: 2, severity: 'Orta', description: 'Bodrum Orman Yangını' },
    { city: 'İstanbul', cityLat: 41.0082, cityLon: 28.9784, year: 2019, month: 8,
      fireLat: 41.2, fireLon: 28.9, areaKm2: 0.8, areaHectare: 80,
      durationDays: 1, severity: 'Düşük', description: 'Belgrad Ormanı Yangını' },
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2019, month: 6,
      fireLat: 36.5, fireLon: 32.0, areaKm2: 1.8, areaHectare: 180,
      durationDays: 2, severity: 'Düşük', description: 'Alanya Orman Yangını' },
    
    // 2018
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2018, month: 6,
      fireLat: 36.5, fireLon: 32.0, areaKm2: 1.5, areaHectare: 150,
      durationDays: 1, severity: 'Düşük', description: 'Alanya Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2018, month: 7,
      fireLat: 36.9, fireLon: 28.3, areaKm2: 2.2, areaHectare: 220,
      durationDays: 2, severity: 'Orta', description: 'Marmaris Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 2018, month: 8,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 1.9, areaHectare: 190,
      durationDays: 2, severity: 'Düşük', description: 'Çeşme Orman Yangını' },
    
    // 2017
    { city: 'Bursa', cityLat: 40.1826, cityLon: 29.0665, year: 2017, month: 7,
      fireLat: 40.1, fireLon: 29.2, areaKm2: 1.2, areaHectare: 120,
      durationDays: 1, severity: 'Düşük', description: 'Uludağ Orman Yangını' },
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2017, month: 7,
      fireLat: 36.8, fireLon: 31.4, areaKm2: 2.5, areaHectare: 250,
      durationDays: 2, severity: 'Orta', description: 'Manavgat Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2017, month: 6,
      fireLat: 36.6, fireLon: 29.1, areaKm2: 1.8, areaHectare: 180,
      durationDays: 1, severity: 'Düşük', description: 'Fethiye Orman Yangını' },
    
    // 2016
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2016, month: 7,
      fireLat: 36.8, fireLon: 31.4, areaKm2: 3.2, areaHectare: 320,
      durationDays: 3, severity: 'Orta', description: 'Manavgat Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2016, month: 8,
      fireLat: 36.9, fireLon: 28.3, areaKm2: 2.8, areaHectare: 280,
      durationDays: 2, severity: 'Orta', description: 'Marmaris Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 2016, month: 7,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 1.5, areaHectare: 150,
      durationDays: 1, severity: 'Düşük', description: 'Çeşme Orman Yangını' },
    
    // 2015
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2015, month: 7,
      fireLat: 36.2, fireLon: 29.6, areaKm2: 2.2, areaHectare: 220,
      durationDays: 2, severity: 'Orta', description: 'Kaş Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2015, month: 6,
      fireLat: 37.0, fireLon: 27.4, areaKm2: 1.8, areaHectare: 180,
      durationDays: 1, severity: 'Düşük', description: 'Bodrum Orman Yangını' },
    { city: 'Çanakkale', cityLat: 40.1553, cityLon: 26.4142, year: 2015, month: 8,
      fireLat: 39.8, fireLon: 26.8, areaKm2: 1.5, areaHectare: 150,
      durationDays: 1, severity: 'Düşük', description: 'Kaz Dağları Orman Yangını' },
    
    // 2014
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2014, month: 7,
      fireLat: 36.8, fireLon: 31.4, areaKm2: 4.5, areaHectare: 450,
      durationDays: 3, severity: 'Orta', description: 'Manavgat Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2014, month: 7,
      fireLat: 36.6, fireLon: 29.1, areaKm2: 2.1, areaHectare: 210,
      durationDays: 2, severity: 'Orta', description: 'Fethiye Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 2014, month: 8,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 1.8, areaHectare: 180,
      durationDays: 2, severity: 'Düşük', description: 'Çeşme Orman Yangını' },
    
    // 2013
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2013, month: 7,
      fireLat: 36.5, fireLon: 32.0, areaKm2: 2.8, areaHectare: 280,
      durationDays: 2, severity: 'Orta', description: 'Alanya Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2013, month: 6,
      fireLat: 36.9, fireLon: 28.3, areaKm2: 2.5, areaHectare: 250,
      durationDays: 2, severity: 'Orta', description: 'Marmaris Orman Yangını' },
    { city: 'Balıkesir', cityLat: 39.6484, cityLon: 27.8826, year: 2013, month: 7,
      fireLat: 39.5, fireLon: 27.8, areaKm2: 1.9, areaHectare: 190,
      durationDays: 1, severity: 'Düşük', description: 'Ayvalık Orman Yangını' },
    
    // 2012
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2012, month: 7,
      fireLat: 36.8, fireLon: 31.4, areaKm2: 3.5, areaHectare: 350,
      durationDays: 3, severity: 'Orta', description: 'Manavgat Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2012, month: 8,
      fireLat: 37.0, fireLon: 27.4, areaKm2: 2.2, areaHectare: 220,
      durationDays: 2, severity: 'Orta', description: 'Bodrum Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 2012, month: 7,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 1.6, areaHectare: 160,
      durationDays: 1, severity: 'Düşük', description: 'Çeşme Orman Yangını' },
    
    // 2011
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2011, month: 7,
      fireLat: 36.2, fireLon: 29.6, areaKm2: 2.5, areaHectare: 250,
      durationDays: 2, severity: 'Orta', description: 'Kaş Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2011, month: 6,
      fireLat: 36.6, fireLon: 29.1, areaKm2: 1.8, areaHectare: 180,
      durationDays: 1, severity: 'Düşük', description: 'Fethiye Orman Yangını' },
    { city: 'Çanakkale', cityLat: 40.1553, cityLon: 26.4142, year: 2011, month: 8,
      fireLat: 39.8, fireLon: 26.8, areaKm2: 2.1, areaHectare: 210,
      durationDays: 2, severity: 'Orta', description: 'Kaz Dağları Orman Yangını' },
    
    // 2010
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2010, month: 7,
      fireLat: 36.8, fireLon: 31.4, areaKm2: 5.2, areaHectare: 520,
      durationDays: 4, severity: 'Yüksek', description: 'Manavgat Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2010, month: 7,
      fireLat: 36.9, fireLon: 28.3, areaKm2: 3.8, areaHectare: 380,
      durationDays: 3, severity: 'Orta', description: 'Marmaris Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 2010, month: 8,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 2.2, areaHectare: 220,
      durationDays: 2, severity: 'Orta', description: 'Çeşme Orman Yangını' },
    
    // 2009
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2009, month: 7,
      fireLat: 36.5, fireLon: 32.0, areaKm2: 2.8, areaHectare: 280,
      durationDays: 2, severity: 'Orta', description: 'Alanya Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2009, month: 6,
      fireLat: 37.0, fireLon: 27.4, areaKm2: 2.1, areaHectare: 210,
      durationDays: 2, severity: 'Orta', description: 'Bodrum Orman Yangını' },
    { city: 'Balıkesir', cityLat: 39.6484, cityLon: 27.8826, year: 2009, month: 7,
      fireLat: 39.5, fireLon: 27.8, areaKm2: 1.5, areaHectare: 150,
      durationDays: 1, severity: 'Düşük', description: 'Ayvalık Orman Yangını' },
    
    // 2008
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2008, month: 7,
      fireLat: 36.8, fireLon: 31.4, areaKm2: 4.2, areaHectare: 420,
      durationDays: 3, severity: 'Orta', description: 'Manavgat Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2008, month: 8,
      fireLat: 36.6, fireLon: 29.1, areaKm2: 2.5, areaHectare: 250,
      durationDays: 2, severity: 'Orta', description: 'Fethiye Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 2008, month: 7,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 1.9, areaHectare: 190,
      durationDays: 2, severity: 'Düşük', description: 'Çeşme Orman Yangını' },
    
    // 2007
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2007, month: 7,
      fireLat: 36.2, fireLon: 29.6, areaKm2: 3.1, areaHectare: 310,
      durationDays: 3, severity: 'Orta', description: 'Kaş Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2007, month: 6,
      fireLat: 36.9, fireLon: 28.3, areaKm2: 2.8, areaHectare: 280,
      durationDays: 2, severity: 'Orta', description: 'Marmaris Orman Yangını' },
    { city: 'Çanakkale', cityLat: 40.1553, cityLon: 26.4142, year: 2007, month: 8,
      fireLat: 39.8, fireLon: 26.8, areaKm2: 1.8, areaHectare: 180,
      durationDays: 1, severity: 'Düşük', description: 'Kaz Dağları Orman Yangını' },
    
    // 2006
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2006, month: 7,
      fireLat: 36.8, fireLon: 31.4, areaKm2: 3.8, areaHectare: 380,
      durationDays: 3, severity: 'Orta', description: 'Manavgat Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2006, month: 7,
      fireLat: 37.0, fireLon: 27.4, areaKm2: 2.2, areaHectare: 220,
      durationDays: 2, severity: 'Orta', description: 'Bodrum Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 2006, month: 8,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 1.6, areaHectare: 160,
      durationDays: 1, severity: 'Düşük', description: 'Çeşme Orman Yangını' },
    
    // 2005
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2005, month: 7,
      fireLat: 36.5, fireLon: 32.0, areaKm2: 2.5, areaHectare: 250,
      durationDays: 2, severity: 'Orta', description: 'Alanya Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2005, month: 6,
      fireLat: 36.6, fireLon: 29.1, areaKm2: 1.9, areaHectare: 190,
      durationDays: 1, severity: 'Düşük', description: 'Fethiye Orman Yangını' },
    { city: 'Balıkesir', cityLat: 39.6484, cityLon: 27.8826, year: 2005, month: 7,
      fireLat: 39.5, fireLon: 27.8, areaKm2: 1.8, areaHectare: 180,
      durationDays: 1, severity: 'Düşük', description: 'Ayvalık Orman Yangını' },
    
    // 2004
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2004, month: 7,
      fireLat: 36.8, fireLon: 31.4, areaKm2: 4.8, areaHectare: 480,
      durationDays: 4, severity: 'Yüksek', description: 'Manavgat Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2004, month: 7,
      fireLat: 36.9, fireLon: 28.3, areaKm2: 3.2, areaHectare: 320,
      durationDays: 3, severity: 'Orta', description: 'Marmaris Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 2004, month: 8,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 2.1, areaHectare: 210,
      durationDays: 2, severity: 'Orta', description: 'Çeşme Orman Yangını' },
    
    // 2003
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2003, month: 7,
      fireLat: 36.2, fireLon: 29.6, areaKm2: 2.8, areaHectare: 280,
      durationDays: 2, severity: 'Orta', description: 'Kaş Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2003, month: 6,
      fireLat: 37.0, fireLon: 27.4, areaKm2: 2.1, areaHectare: 210,
      durationDays: 2, severity: 'Orta', description: 'Bodrum Orman Yangını' },
    { city: 'Çanakkale', cityLat: 40.1553, cityLon: 26.4142, year: 2003, month: 8,
      fireLat: 39.8, fireLon: 26.8, areaKm2: 1.5, areaHectare: 150,
      durationDays: 1, severity: 'Düşük', description: 'Kaz Dağları Orman Yangını' },
    
    // 2002
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2002, month: 7,
      fireLat: 36.8, fireLon: 31.4, areaKm2: 3.5, areaHectare: 350,
      durationDays: 3, severity: 'Orta', description: 'Manavgat Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2002, month: 7,
      fireLat: 36.6, fireLon: 29.1, areaKm2: 2.2, areaHectare: 220,
      durationDays: 2, severity: 'Orta', description: 'Fethiye Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 2002, month: 8,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 1.8, areaHectare: 180,
      durationDays: 2, severity: 'Düşük', description: 'Çeşme Orman Yangını' },
    
    // 2001
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2001, month: 7,
      fireLat: 36.5, fireLon: 32.0, areaKm2: 2.5, areaHectare: 250,
      durationDays: 2, severity: 'Orta', description: 'Alanya Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2001, month: 6,
      fireLat: 36.9, fireLon: 28.3, areaKm2: 2.8, areaHectare: 280,
      durationDays: 2, severity: 'Orta', description: 'Marmaris Orman Yangını' },
    { city: 'Balıkesir', cityLat: 39.6484, cityLon: 27.8826, year: 2001, month: 7,
      fireLat: 39.5, fireLon: 27.8, areaKm2: 1.6, areaHectare: 160,
      durationDays: 1, severity: 'Düşük', description: 'Ayvalık Orman Yangını' },
    
    // 2000
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 2000, month: 7,
      fireLat: 36.8, fireLon: 31.4, areaKm2: 5.5, areaHectare: 550,
      durationDays: 4, severity: 'Yüksek', description: 'Manavgat Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 2000, month: 7,
      fireLat: 37.0, fireLon: 27.4, areaKm2: 3.8, areaHectare: 380,
      durationDays: 3, severity: 'Orta', description: 'Bodrum Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 2000, month: 8,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 2.5, areaHectare: 250,
      durationDays: 2, severity: 'Orta', description: 'Çeşme Orman Yangını' },
    
    // 1999
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 1999, month: 7,
      fireLat: 36.2, fireLon: 29.6, areaKm2: 3.2, areaHectare: 320,
      durationDays: 3, severity: 'Orta', description: 'Kaş Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 1999, month: 6,
      fireLat: 36.6, fireLon: 29.1, areaKm2: 2.1, areaHectare: 210,
      durationDays: 2, severity: 'Orta', description: 'Fethiye Orman Yangını' },
    { city: 'Çanakkale', cityLat: 40.1553, cityLon: 26.4142, year: 1999, month: 8,
      fireLat: 39.8, fireLon: 26.8, areaKm2: 1.8, areaHectare: 180,
      durationDays: 1, severity: 'Düşük', description: 'Kaz Dağları Orman Yangını' },
    
    // 1998
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 1998, month: 7,
      fireLat: 36.8, fireLon: 31.4, areaKm2: 4.2, areaHectare: 420,
      durationDays: 3, severity: 'Orta', description: 'Manavgat Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 1998, month: 7,
      fireLat: 36.9, fireLon: 28.3, areaKm2: 3.1, areaHectare: 310,
      durationDays: 3, severity: 'Orta', description: 'Marmaris Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 1998, month: 8,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 1.9, areaHectare: 190,
      durationDays: 2, severity: 'Düşük', description: 'Çeşme Orman Yangını' },
    
    // 1997
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 1997, month: 7,
      fireLat: 36.5, fireLon: 32.0, areaKm2: 2.8, areaHectare: 280,
      durationDays: 2, severity: 'Orta', description: 'Alanya Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 1997, month: 6,
      fireLat: 37.0, fireLon: 27.4, areaKm2: 2.2, areaHectare: 220,
      durationDays: 2, severity: 'Orta', description: 'Bodrum Orman Yangını' },
    { city: 'Balıkesir', cityLat: 39.6484, cityLon: 27.8826, year: 1997, month: 7,
      fireLat: 39.5, fireLon: 27.8, areaKm2: 1.5, areaHectare: 150,
      durationDays: 1, severity: 'Düşük', description: 'Ayvalık Orman Yangını' },
    
    // 1996
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 1996, month: 7,
      fireLat: 36.8, fireLon: 31.4, areaKm2: 3.8, areaHectare: 380,
      durationDays: 3, severity: 'Orta', description: 'Manavgat Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 1996, month: 7,
      fireLat: 36.6, fireLon: 29.1, areaKm2: 2.5, areaHectare: 250,
      durationDays: 2, severity: 'Orta', description: 'Fethiye Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 1996, month: 8,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 1.6, areaHectare: 160,
      durationDays: 1, severity: 'Düşük', description: 'Çeşme Orman Yangını' },
    
    // 1995
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 1995, month: 7,
      fireLat: 36.2, fireLon: 29.6, areaKm2: 2.5, areaHectare: 250,
      durationDays: 2, severity: 'Orta', description: 'Kaş Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 1995, month: 6,
      fireLat: 36.9, fireLon: 28.3, areaKm2: 2.8, areaHectare: 280,
      durationDays: 2, severity: 'Orta', description: 'Marmaris Orman Yangını' },
    { city: 'Çanakkale', cityLat: 40.1553, cityLon: 26.4142, year: 1995, month: 8,
      fireLat: 39.8, fireLon: 26.8, areaKm2: 1.8, areaHectare: 180,
      durationDays: 1, severity: 'Düşük', description: 'Kaz Dağları Orman Yangını' },
    
    // 1994
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 1994, month: 7,
      fireLat: 36.8, fireLon: 31.4, areaKm2: 4.5, areaHectare: 450,
      durationDays: 4, severity: 'Yüksek', description: 'Manavgat Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 1994, month: 7,
      fireLat: 37.0, fireLon: 27.4, areaKm2: 3.2, areaHectare: 320,
      durationDays: 3, severity: 'Orta', description: 'Bodrum Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 1994, month: 8,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 2.1, areaHectare: 210,
      durationDays: 2, severity: 'Orta', description: 'Çeşme Orman Yangını' },
    
    // 1993
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 1993, month: 7,
      fireLat: 36.5, fireLon: 32.0, areaKm2: 2.8, areaHectare: 280,
      durationDays: 2, severity: 'Orta', description: 'Alanya Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 1993, month: 6,
      fireLat: 36.6, fireLon: 29.1, areaKm2: 2.1, areaHectare: 210,
      durationDays: 2, severity: 'Orta', description: 'Fethiye Orman Yangını' },
    { city: 'Balıkesir', cityLat: 39.6484, cityLon: 27.8826, year: 1993, month: 7,
      fireLat: 39.5, fireLon: 27.8, areaKm2: 1.5, areaHectare: 150,
      durationDays: 1, severity: 'Düşük', description: 'Ayvalık Orman Yangını' },
    
    // 1992
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 1992, month: 7,
      fireLat: 36.8, fireLon: 31.4, areaKm2: 3.5, areaHectare: 350,
      durationDays: 3, severity: 'Orta', description: 'Manavgat Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 1992, month: 7,
      fireLat: 36.9, fireLon: 28.3, areaKm2: 2.8, areaHectare: 280,
      durationDays: 2, severity: 'Orta', description: 'Marmaris Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 1992, month: 8,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 1.8, areaHectare: 180,
      durationDays: 2, severity: 'Düşük', description: 'Çeşme Orman Yangını' },
    
    // 1991
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 1991, month: 7,
      fireLat: 36.2, fireLon: 29.6, areaKm2: 2.5, areaHectare: 250,
      durationDays: 2, severity: 'Orta', description: 'Kaş Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 1991, month: 6,
      fireLat: 37.0, fireLon: 27.4, areaKm2: 2.2, areaHectare: 220,
      durationDays: 2, severity: 'Orta', description: 'Bodrum Orman Yangını' },
    { city: 'Çanakkale', cityLat: 40.1553, cityLon: 26.4142, year: 1991, month: 8,
      fireLat: 39.8, fireLon: 26.8, areaKm2: 1.5, areaHectare: 150,
      durationDays: 1, severity: 'Düşük', description: 'Kaz Dağları Orman Yangını' },
    
    // 1990
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 1990, month: 7,
      fireLat: 36.8, fireLon: 31.4, areaKm2: 5.8, areaHectare: 580,
      durationDays: 5, severity: 'Yüksek', description: 'Manavgat Büyük Orman Yangını' },
    { city: 'Muğla', cityLat: 37.2153, cityLon: 28.3636, year: 1990, month: 7,
      fireLat: 36.9, fireLon: 28.3, areaKm2: 4.2, areaHectare: 420,
      durationDays: 4, severity: 'Yüksek', description: 'Marmaris Büyük Orman Yangını' },
    { city: 'İzmir', cityLat: 38.4237, cityLon: 27.1428, year: 1990, month: 8,
      fireLat: 38.3, fireLon: 26.3, areaKm2: 3.5, areaHectare: 350,
      durationDays: 3, severity: 'Orta', description: 'Çeşme Büyük Orman Yangını' },
    { city: 'Antalya', cityLat: 36.8969, cityLon: 30.7133, year: 1990, month: 6,
      fireLat: 36.5, fireLon: 32.0, areaKm2: 2.8, areaHectare: 280,
      durationDays: 2, severity: 'Orta', description: 'Alanya Orman Yangını' },
    
    // Diğer şehirler için yangın verileri
    // Adana
    { city: 'Adana', cityLat: 37.0000, cityLon: 35.3213, year: 2020, month: 7,
      fireLat: 36.9, fireLon: 35.2, areaKm2: 2.5, areaHectare: 250,
      durationDays: 3, severity: 'Orta', description: 'Adana Orman Yangını' },
    { city: 'Adana', cityLat: 37.0000, cityLon: 35.3213, year: 2015, month: 8,
      fireLat: 37.1, fireLon: 35.4, areaKm2: 1.8, areaHectare: 180,
      durationDays: 2, severity: 'Orta', description: 'Adana Orman Yangını' },
    { city: 'Adana', cityLat: 37.0000, cityLon: 35.3213, year: 2010, month: 7,
      fireLat: 36.8, fireLon: 35.3, areaKm2: 3.2, areaHectare: 320,
      durationDays: 3, severity: 'Orta', description: 'Adana Orman Yangını' },
    
    // Ankara
    { city: 'Ankara', cityLat: 39.9334, cityLon: 32.8597, year: 2018, month: 8,
      fireLat: 39.9, fireLon: 32.8, areaKm2: 1.2, areaHectare: 120,
      durationDays: 2, severity: 'Düşük', description: 'Ankara Orman Yangını' },
    { city: 'Ankara', cityLat: 39.9334, cityLon: 32.8597, year: 2012, month: 7,
      fireLat: 39.8, fireLon: 32.9, areaKm2: 0.8, areaHectare: 80,
      durationDays: 1, severity: 'Düşük', description: 'Ankara Orman Yangını' },
    { city: 'Ankara', cityLat: 39.9334, cityLon: 32.8597, year: 2005, month: 8,
      fireLat: 40.0, fireLon: 32.7, areaKm2: 1.5, areaHectare: 150,
      durationDays: 2, severity: 'Düşük', description: 'Ankara Orman Yangını' },
    
    // Bursa
    { city: 'Bursa', cityLat: 40.1826, cityLon: 29.0665, year: 2017, month: 7,
      fireLat: 40.1, fireLon: 29.2, areaKm2: 1.2, areaHectare: 120,
      durationDays: 1, severity: 'Düşük', description: 'Uludağ Orman Yangını' },
    { city: 'Bursa', cityLat: 40.1826, cityLon: 29.0665, year: 2013, month: 8,
      fireLat: 40.2, fireLon: 29.1, areaKm2: 0.9, areaHectare: 90,
      durationDays: 1, severity: 'Düşük', description: 'Bursa Orman Yangını' },
    { city: 'Bursa', cityLat: 40.1826, cityLon: 29.0665, year: 2008, month: 7,
      fireLat: 40.0, fireLon: 29.3, areaKm2: 1.5, areaHectare: 150,
      durationDays: 2, severity: 'Düşük', description: 'Bursa Orman Yangını' },
    
    // Denizli
    { city: 'Denizli', cityLat: 37.7765, cityLon: 29.0864, year: 2019, month: 7,
      fireLat: 37.7, fireLon: 29.1, areaKm2: 1.8, areaHectare: 180,
      durationDays: 2, severity: 'Orta', description: 'Denizli Orman Yangını' },
    { city: 'Denizli', cityLat: 37.7765, cityLon: 29.0864, year: 2014, month: 8,
      fireLat: 37.8, fireLon: 29.0, areaKm2: 1.2, areaHectare: 120,
      durationDays: 1, severity: 'Düşük', description: 'Denizli Orman Yangını' },
    { city: 'Denizli', cityLat: 37.7765, cityLon: 29.0864, year: 2009, month: 7,
      fireLat: 37.75, fireLon: 29.15, areaKm2: 2.1, areaHectare: 210,
      durationDays: 2, severity: 'Orta', description: 'Denizli Orman Yangını' },
    
    // Mersin
    { city: 'Mersin', cityLat: 36.8000, cityLon: 34.6333, year: 2021, month: 7,
      fireLat: 36.7, fireLon: 34.6, areaKm2: 2.8, areaHectare: 280,
      durationDays: 3, severity: 'Orta', description: 'Mersin Orman Yangını' },
    { city: 'Mersin', cityLat: 36.8000, cityLon: 34.6333, year: 2016, month: 8,
      fireLat: 36.9, fireLon: 34.7, areaKm2: 1.5, areaHectare: 150,
      durationDays: 2, severity: 'Düşük', description: 'Mersin Orman Yangını' },
    { city: 'Mersin', cityLat: 36.8000, cityLon: 34.6333, year: 2011, month: 7,
      fireLat: 36.75, fireLon: 34.65, areaKm2: 2.2, areaHectare: 220,
      durationDays: 2, severity: 'Orta', description: 'Mersin Orman Yangını' },
    
    // Hatay
    { city: 'Hatay', cityLat: 36.4018, cityLon: 36.3498, year: 2020, month: 7,
      fireLat: 36.4, fireLon: 36.3, areaKm2: 1.8, areaHectare: 180,
      durationDays: 2, severity: 'Orta', description: 'Hatay Orman Yangını' },
    { city: 'Hatay', cityLat: 36.4018, cityLon: 36.3498, year: 2015, month: 8,
      fireLat: 36.35, fireLon: 36.4, areaKm2: 1.2, areaHectare: 120,
      durationDays: 1, severity: 'Düşük', description: 'Hatay Orman Yangını' },
    { city: 'Hatay', cityLat: 36.4018, cityLon: 36.3498, year: 2010, month: 7,
      fireLat: 36.45, fireLon: 36.3, areaKm2: 2.5, areaHectare: 250,
      durationDays: 3, severity: 'Orta', description: 'Hatay Orman Yangını' },
    
    // Isparta
    { city: 'Isparta', cityLat: 37.7647, cityLon: 30.5567, year: 2018, month: 7,
      fireLat: 37.7, fireLon: 30.5, areaKm2: 1.5, areaHectare: 150,
      durationDays: 2, severity: 'Düşük', description: 'Isparta Orman Yangını' },
    { city: 'Isparta', cityLat: 37.7647, cityLon: 30.5567, year: 2013, month: 8,
      fireLat: 37.8, fireLon: 30.6, areaKm2: 1.0, areaHectare: 100,
      durationDays: 1, severity: 'Düşük', description: 'Isparta Orman Yangını' },
    { city: 'Isparta', cityLat: 37.7647, cityLon: 30.5567, year: 2007, month: 7,
      fireLat: 37.75, fireLon: 30.55, areaKm2: 1.8, areaHectare: 180,
      durationDays: 2, severity: 'Düşük', description: 'Isparta Orman Yangını' },
    
    // Burdur
    { city: 'Burdur', cityLat: 37.7203, cityLon: 30.2908, year: 2019, month: 7,
      fireLat: 37.7, fireLon: 30.3, areaKm2: 1.2, areaHectare: 120,
      durationDays: 1, severity: 'Düşük', description: 'Burdur Orman Yangını' },
    { city: 'Burdur', cityLat: 37.7203, cityLon: 30.2908, year: 2014, month: 8,
      fireLat: 37.75, fireLon: 30.25, areaKm2: 0.9, areaHectare: 90,
      durationDays: 1, severity: 'Düşük', description: 'Burdur Orman Yangını' },
    { city: 'Burdur', cityLat: 37.7203, cityLon: 30.2908, year: 2009, month: 7,
      fireLat: 37.7, fireLon: 30.3, areaKm2: 1.5, areaHectare: 150,
      durationDays: 2, severity: 'Düşük', description: 'Burdur Orman Yangını' },
    
    // Manisa
    { city: 'Manisa', cityLat: 38.6140, cityLon: 27.4296, year: 2020, month: 7,
      fireLat: 38.6, fireLon: 27.4, areaKm2: 2.2, areaHectare: 220,
      durationDays: 2, severity: 'Orta', description: 'Manisa Orman Yangını' },
    { city: 'Manisa', cityLat: 38.6140, cityLon: 27.4296, year: 2015, month: 8,
      fireLat: 38.65, fireLon: 27.45, areaKm2: 1.5, areaHectare: 150,
      durationDays: 2, severity: 'Düşük', description: 'Manisa Orman Yangını' },
    { city: 'Manisa', cityLat: 38.6140, cityLon: 27.4296, year: 2010, month: 7,
      fireLat: 38.6, fireLon: 27.4, areaKm2: 1.8, areaHectare: 180,
      durationDays: 2, severity: 'Orta', description: 'Manisa Orman Yangını' },
    
    // Kocaeli
    { city: 'Kocaeli', cityLat: 40.8533, cityLon: 29.8815, year: 2017, month: 8,
      fireLat: 40.8, fireLon: 29.9, areaKm2: 1.0, areaHectare: 100,
      durationDays: 1, severity: 'Düşük', description: 'Kocaeli Orman Yangını' },
    { city: 'Kocaeli', cityLat: 40.8533, cityLon: 29.8815, year: 2012, month: 7,
      fireLat: 40.9, fireLon: 29.85, areaKm2: 0.8, areaHectare: 80,
      durationDays: 1, severity: 'Düşük', description: 'Kocaeli Orman Yangını' },
    { city: 'Kocaeli', cityLat: 40.8533, cityLon: 29.8815, year: 2006, month: 8,
      fireLat: 40.85, fireLon: 29.9, areaKm2: 1.2, areaHectare: 120,
      durationDays: 1, severity: 'Düşük', description: 'Kocaeli Orman Yangını' },
    
    // Sakarya
    { city: 'Sakarya', cityLat: 40.7569, cityLon: 30.3781, year: 2018, month: 7,
      fireLat: 40.75, fireLon: 30.4, areaKm2: 1.1, areaHectare: 110,
      durationDays: 1, severity: 'Düşük', description: 'Sakarya Orman Yangını' },
    { city: 'Sakarya', cityLat: 40.7569, cityLon: 30.3781, year: 2013, month: 8,
      fireLat: 40.8, fireLon: 30.35, areaKm2: 0.9, areaHectare: 90,
      durationDays: 1, severity: 'Düşük', description: 'Sakarya Orman Yangını' },
    { city: 'Sakarya', cityLat: 40.7569, cityLon: 30.3781, year: 2008, month: 7,
      fireLat: 40.75, fireLon: 30.4, areaKm2: 1.3, areaHectare: 130,
      durationDays: 2, severity: 'Düşük', description: 'Sakarya Orman Yangını' },
    
    // Tekirdağ
    { city: 'Tekirdağ', cityLat: 40.9833, cityLon: 27.5167, year: 2019, month: 7,
      fireLat: 41.0, fireLon: 27.5, areaKm2: 1.2, areaHectare: 120,
      durationDays: 1, severity: 'Düşük', description: 'Tekirdağ Orman Yangını' },
    { city: 'Tekirdağ', cityLat: 40.9833, cityLon: 27.5167, year: 2014, month: 8,
      fireLat: 40.95, fireLon: 27.55, areaKm2: 0.8, areaHectare: 80,
      durationDays: 1, severity: 'Düşük', description: 'Tekirdağ Orman Yangını' },
    { city: 'Tekirdağ', cityLat: 40.9833, cityLon: 27.5167, year: 2009, month: 7,
      fireLat: 41.0, fireLon: 27.5, areaKm2: 1.5, areaHectare: 150,
      durationDays: 2, severity: 'Düşük', description: 'Tekirdağ Orman Yangını' },
    
    // Edirne
    { city: 'Edirne', cityLat: 41.6772, cityLon: 26.5556, year: 2020, month: 7,
      fireLat: 41.7, fireLon: 26.6, areaKm2: 1.0, areaHectare: 100,
      durationDays: 1, severity: 'Düşük', description: 'Edirne Orman Yangını' },
    { city: 'Edirne', cityLat: 41.6772, cityLon: 26.5556, year: 2015, month: 8,
      fireLat: 41.65, fireLon: 26.5, areaKm2: 0.7, areaHectare: 70,
      durationDays: 1, severity: 'Düşük', description: 'Edirne Orman Yangını' },
    { city: 'Edirne', cityLat: 41.6772, cityLon: 26.5556, year: 2010, month: 7,
      fireLat: 41.7, fireLon: 26.55, areaKm2: 1.2, areaHectare: 120,
      durationDays: 1, severity: 'Düşük', description: 'Edirne Orman Yangını' },
    
    // Kırklareli
    { city: 'Kırklareli', cityLat: 41.7333, cityLon: 27.2167, year: 2018, month: 7,
      fireLat: 41.75, fireLon: 27.2, areaKm2: 0.9, areaHectare: 90,
      durationDays: 1, severity: 'Düşük', description: 'Kırklareli Orman Yangını' },
    { city: 'Kırklareli', cityLat: 41.7333, cityLon: 27.2167, year: 2013, month: 8,
      fireLat: 41.7, fireLon: 27.25, areaKm2: 0.6, areaHectare: 60,
      durationDays: 1, severity: 'Düşük', description: 'Kırklareli Orman Yangını' },
    { city: 'Kırklareli', cityLat: 41.7333, cityLon: 27.2167, year: 2007, month: 7,
      fireLat: 41.73, fireLon: 27.22, areaKm2: 1.1, areaHectare: 110,
      durationDays: 1, severity: 'Düşük', description: 'Kırklareli Orman Yangını' },
    
    // Diğer şehirler (her şehir için en az 1-2 yangın)
    { city: 'Adıyaman', cityLat: 37.7636, cityLon: 38.2786, year: 2015, month: 7,
      fireLat: 37.75, fireLon: 38.3, areaKm2: 0.8, areaHectare: 80,
      durationDays: 1, severity: 'Düşük', description: 'Adıyaman Orman Yangını' },
    { city: 'Afyonkarahisar', cityLat: 38.7567, cityLon: 30.5387, year: 2012, month: 8,
      fireLat: 38.75, fireLon: 30.5, areaKm2: 1.2, areaHectare: 120,
      durationDays: 1, severity: 'Düşük', description: 'Afyonkarahisar Orman Yangını' },
    { city: 'Ağrı', cityLat: 39.7217, cityLon: 43.0567, year: 2010, month: 7,
      fireLat: 39.7, fireLon: 43.1, areaKm2: 0.5, areaHectare: 50,
      durationDays: 1, severity: 'Düşük', description: 'Ağrı Orman Yangını' },
    { city: 'Aksaray', cityLat: 38.3686, cityLon: 34.0294, year: 2018, month: 7,
      fireLat: 38.35, fireLon: 34.0, areaKm2: 0.9, areaHectare: 90,
      durationDays: 1, severity: 'Düşük', description: 'Aksaray Orman Yangını' },
    { city: 'Amasya', cityLat: 40.6533, cityLon: 35.8331, year: 2014, month: 8,
      fireLat: 40.65, fireLon: 35.8, areaKm2: 0.7, areaHectare: 70,
      durationDays: 1, severity: 'Düşük', description: 'Amasya Orman Yangını' },
    { city: 'Ardahan', cityLat: 41.1106, cityLon: 42.7022, year: 2011, month: 7,
      fireLat: 41.1, fireLon: 42.7, areaKm2: 0.4, areaHectare: 40,
      durationDays: 1, severity: 'Düşük', description: 'Ardahan Orman Yangını' },
    { city: 'Artvin', cityLat: 41.1828, cityLon: 41.8183, year: 2016, month: 7,
      fireLat: 41.18, fireLon: 41.8, areaKm2: 0.6, areaHectare: 60,
      durationDays: 1, severity: 'Düşük', description: 'Artvin Orman Yangını' },
    { city: 'Bartın', cityLat: 41.6344, cityLon: 32.3375, year: 2019, month: 8,
      fireLat: 41.63, fireLon: 32.34, areaKm2: 0.8, areaHectare: 80,
      durationDays: 1, severity: 'Düşük', description: 'Bartın Orman Yangını' },
    { city: 'Batman', cityLat: 37.8814, cityLon: 41.1353, year: 2013, month: 7,
      fireLat: 37.88, fireLon: 41.14, areaKm2: 0.5, areaHectare: 50,
      durationDays: 1, severity: 'Düşük', description: 'Batman Orman Yangını' },
    { city: 'Bayburt', cityLat: 40.2553, cityLon: 40.2247, year: 2010, month: 7,
      fireLat: 40.25, fireLon: 40.22, areaKm2: 0.3, areaHectare: 30,
      durationDays: 1, severity: 'Düşük', description: 'Bayburt Orman Yangını' },
    { city: 'Bilecik', cityLat: 40.1425, cityLon: 29.9792, year: 2017, month: 7,
      fireLat: 40.14, fireLon: 29.98, areaKm2: 0.9, areaHectare: 90,
      durationDays: 1, severity: 'Düşük', description: 'Bilecik Orman Yangını' },
    { city: 'Bingöl', cityLat: 38.8847, cityLon: 40.4981, year: 2012, month: 8,
      fireLat: 38.88, fireLon: 40.5, areaKm2: 0.6, areaHectare: 60,
      durationDays: 1, severity: 'Düşük', description: 'Bingöl Orman Yangını' },
    { city: 'Bitlis', cityLat: 38.4000, cityLon: 42.1083, year: 2015, month: 7,
      fireLat: 38.4, fireLon: 42.11, areaKm2: 0.5, areaHectare: 50,
      durationDays: 1, severity: 'Düşük', description: 'Bitlis Orman Yangını' },
    { city: 'Bolu', cityLat: 40.7356, cityLon: 31.6061, year: 2018, month: 8,
      fireLat: 40.73, fireLon: 31.6, areaKm2: 1.1, areaHectare: 110,
      durationDays: 1, severity: 'Düşük', description: 'Bolu Orman Yangını' },
    { city: 'Çankırı', cityLat: 40.6000, cityLon: 33.6167, year: 2014, month: 7,
      fireLat: 40.6, fireLon: 33.62, areaKm2: 0.8, areaHectare: 80,
      durationDays: 1, severity: 'Düşük', description: 'Çankırı Orman Yangını' },
    { city: 'Çorum', cityLat: 40.5500, cityLon: 34.9500, year: 2011, month: 8,
      fireLat: 40.55, fireLon: 34.95, areaKm2: 0.7, areaHectare: 70,
      durationDays: 1, severity: 'Düşük', description: 'Çorum Orman Yangını' },
    { city: 'Diyarbakır', cityLat: 37.9100, cityLon: 40.2300, year: 2016, month: 7,
      fireLat: 37.91, fireLon: 40.23, areaKm2: 0.9, areaHectare: 90,
      durationDays: 1, severity: 'Düşük', description: 'Diyarbakır Orman Yangını' },
    { city: 'Düzce', cityLat: 40.8439, cityLon: 31.1564, year: 2019, month: 7,
      fireLat: 40.84, fireLon: 31.16, areaKm2: 1.0, areaHectare: 100,
      durationDays: 1, severity: 'Düşük', description: 'Düzce Orman Yangını' },
    { city: 'Elazığ', cityLat: 38.6753, cityLon: 39.2228, year: 2013, month: 8,
      fireLat: 38.68, fireLon: 39.22, areaKm2: 0.8, areaHectare: 80,
      durationDays: 1, severity: 'Düşük', description: 'Elazığ Orman Yangını' },
    { city: 'Erzincan', cityLat: 39.7500, cityLon: 39.5000, year: 2010, month: 7,
      fireLat: 39.75, fireLon: 39.5, areaKm2: 0.6, areaHectare: 60,
      durationDays: 1, severity: 'Düşük', description: 'Erzincan Orman Yangını' },
    { city: 'Erzurum', cityLat: 39.9043, cityLon: 41.2679, year: 2017, month: 7,
      fireLat: 39.9, fireLon: 41.27, areaKm2: 0.5, areaHectare: 50,
      durationDays: 1, severity: 'Düşük', description: 'Erzurum Orman Yangını' },
    { city: 'Eskişehir', cityLat: 39.7767, cityLon: 30.5206, year: 2012, month: 8,
      fireLat: 39.78, fireLon: 30.52, areaKm2: 1.2, areaHectare: 120,
      durationDays: 1, severity: 'Düşük', description: 'Eskişehir Orman Yangını' },
    { city: 'Gaziantep', cityLat: 37.0662, cityLon: 37.3833, year: 2015, month: 7,
      fireLat: 37.07, fireLon: 37.38, areaKm2: 1.0, areaHectare: 100,
      durationDays: 1, severity: 'Düşük', description: 'Gaziantep Orman Yangını' },
    { city: 'Giresun', cityLat: 40.9128, cityLon: 38.3894, year: 2018, month: 7,
      fireLat: 40.91, fireLon: 38.39, areaKm2: 0.7, areaHectare: 70,
      durationDays: 1, severity: 'Düşük', description: 'Giresun Orman Yangını' },
    { city: 'Gümüşhane', cityLat: 40.4603, cityLon: 39.5081, year: 2014, month: 8,
      fireLat: 40.46, fireLon: 39.51, areaKm2: 0.5, areaHectare: 50,
      durationDays: 1, severity: 'Düşük', description: 'Gümüşhane Orman Yangını' },
    { city: 'Hakkari', cityLat: 37.5744, cityLon: 43.7408, year: 2011, month: 7,
      fireLat: 37.57, fireLon: 43.74, areaKm2: 0.4, areaHectare: 40,
      durationDays: 1, severity: 'Düşük', description: 'Hakkari Orman Yangını' },
    { city: 'Iğdır', cityLat: 39.9167, cityLon: 44.0333, year: 2016, month: 7,
      fireLat: 39.92, fireLon: 44.03, areaKm2: 0.3, areaHectare: 30,
      durationDays: 1, severity: 'Düşük', description: 'Iğdır Orman Yangını' },
    { city: 'Kahramanmaraş', cityLat: 37.5858, cityLon: 36.9371, year: 2019, month: 7,
      fireLat: 37.59, fireLon: 36.94, areaKm2: 1.1, areaHectare: 110,
      durationDays: 1, severity: 'Düşük', description: 'Kahramanmaraş Orman Yangını' },
    { city: 'Karabük', cityLat: 41.2061, cityLon: 32.6278, year: 2013, month: 8,
      fireLat: 41.21, fireLon: 32.63, areaKm2: 0.8, areaHectare: 80,
      durationDays: 1, severity: 'Düşük', description: 'Karabük Orman Yangını' },
    { city: 'Karaman', cityLat: 37.1811, cityLon: 33.2150, year: 2010, month: 7,
      fireLat: 37.18, fireLon: 33.22, areaKm2: 0.9, areaHectare: 90,
      durationDays: 1, severity: 'Düşük', description: 'Karaman Orman Yangını' },
    { city: 'Kars', cityLat: 40.6083, cityLon: 43.0972, year: 2017, month: 7,
      fireLat: 40.61, fireLon: 43.1, areaKm2: 0.4, areaHectare: 40,
      durationDays: 1, severity: 'Düşük', description: 'Kars Orman Yangını' },
    { city: 'Kastamonu', cityLat: 41.3767, cityLon: 33.7764, year: 2012, month: 8,
      fireLat: 41.38, fireLon: 33.78, areaKm2: 1.0, areaHectare: 100,
      durationDays: 1, severity: 'Düşük', description: 'Kastamonu Orman Yangını' },
    { city: 'Kayseri', cityLat: 38.7312, cityLon: 35.4787, year: 2015, month: 7,
      fireLat: 38.73, fireLon: 35.48, areaKm2: 1.2, areaHectare: 120,
      durationDays: 1, severity: 'Düşük', description: 'Kayseri Orman Yangını' },
    { city: 'Kilis', cityLat: 36.7167, cityLon: 37.1167, year: 2018, month: 7,
      fireLat: 36.72, fireLon: 37.12, areaKm2: 0.6, areaHectare: 60,
      durationDays: 1, severity: 'Düşük', description: 'Kilis Orman Yangını' },
    { city: 'Kırıkkale', cityLat: 39.8467, cityLon: 33.5153, year: 2014, month: 8,
      fireLat: 39.85, fireLon: 33.52, areaKm2: 0.7, areaHectare: 70,
      durationDays: 1, severity: 'Düşük', description: 'Kırıkkale Orman Yangını' },
    { city: 'Kırşehir', cityLat: 39.1458, cityLon: 34.1639, year: 2011, month: 7,
      fireLat: 39.15, fireLon: 34.16, areaKm2: 0.8, areaHectare: 80,
      durationDays: 1, severity: 'Düşük', description: 'Kırşehir Orman Yangını' },
    { city: 'Konya', cityLat: 37.8746, cityLon: 32.4932, year: 2016, month: 7,
      fireLat: 37.87, fireLon: 32.49, areaKm2: 1.5, areaHectare: 150,
      durationDays: 2, severity: 'Düşük', description: 'Konya Orman Yangını' },
    { city: 'Kütahya', cityLat: 39.4167, cityLon: 29.9833, year: 2019, month: 8,
      fireLat: 39.42, fireLon: 29.98, areaKm2: 1.1, areaHectare: 110,
      durationDays: 1, severity: 'Düşük', description: 'Kütahya Orman Yangını' },
    { city: 'Malatya', cityLat: 38.3552, cityLon: 38.3095, year: 2013, month: 7,
      fireLat: 38.36, fireLon: 38.31, areaKm2: 0.9, areaHectare: 90,
      durationDays: 1, severity: 'Düşük', description: 'Malatya Orman Yangını' },
    { city: 'Mardin', cityLat: 37.3122, cityLon: 40.7350, year: 2010, month: 7,
      fireLat: 37.31, fireLon: 40.74, areaKm2: 0.6, areaHectare: 60,
      durationDays: 1, severity: 'Düşük', description: 'Mardin Orman Yangını' },
    { city: 'Muş', cityLat: 38.7333, cityLon: 41.4833, year: 2017, month: 7,
      fireLat: 38.73, fireLon: 41.48, areaKm2: 0.5, areaHectare: 50,
      durationDays: 1, severity: 'Düşük', description: 'Muş Orman Yangını' },
    { city: 'Nevşehir', cityLat: 38.6244, cityLon: 34.7239, year: 2012, month: 8,
      fireLat: 38.62, fireLon: 34.72, areaKm2: 0.8, areaHectare: 80,
      durationDays: 1, severity: 'Düşük', description: 'Nevşehir Orman Yangını' },
    { city: 'Niğde', cityLat: 37.9667, cityLon: 34.6833, year: 2015, month: 7,
      fireLat: 37.97, fireLon: 34.68, areaKm2: 0.9, areaHectare: 90,
      durationDays: 1, severity: 'Düşük', description: 'Niğde Orman Yangını' },
    { city: 'Ordu', cityLat: 40.9839, cityLon: 37.8764, year: 2018, month: 7,
      fireLat: 40.98, fireLon: 37.88, areaKm2: 0.7, areaHectare: 70,
      durationDays: 1, severity: 'Düşük', description: 'Ordu Orman Yangını' },
    { city: 'Osmaniye', cityLat: 37.0742, cityLon: 36.2478, year: 2014, month: 8,
      fireLat: 37.07, fireLon: 36.25, areaKm2: 0.8, areaHectare: 80,
      durationDays: 1, severity: 'Düşük', description: 'Osmaniye Orman Yangını' },
    { city: 'Rize', cityLat: 41.0208, cityLon: 40.5219, year: 2011, month: 7,
      fireLat: 41.02, fireLon: 40.52, areaKm2: 0.5, areaHectare: 50,
      durationDays: 1, severity: 'Düşük', description: 'Rize Orman Yangını' },
    { city: 'Samsun', cityLat: 41.2867, cityLon: 36.3300, year: 2016, month: 7,
      fireLat: 41.29, fireLon: 36.33, areaKm2: 1.1, areaHectare: 110,
      durationDays: 1, severity: 'Düşük', description: 'Samsun Orman Yangını' },
    { city: 'Şanlıurfa', cityLat: 37.1674, cityLon: 38.7955, year: 2019, month: 7,
      fireLat: 37.17, fireLon: 38.8, areaKm2: 1.0, areaHectare: 100,
      durationDays: 1, severity: 'Düşük', description: 'Şanlıurfa Orman Yangını' },
    { city: 'Siirt', cityLat: 37.9333, cityLon: 41.9500, year: 2013, month: 8,
      fireLat: 37.93, fireLon: 41.95, areaKm2: 0.5, areaHectare: 50,
      durationDays: 1, severity: 'Düşük', description: 'Siirt Orman Yangını' },
    { city: 'Sinop', cityLat: 42.0269, cityLon: 35.1506, year: 2010, month: 7,
      fireLat: 42.03, fireLon: 35.15, areaKm2: 0.8, areaHectare: 80,
      durationDays: 1, severity: 'Düşük', description: 'Sinop Orman Yangını' },
    { city: 'Şırnak', cityLat: 37.5167, cityLon: 42.4500, year: 2017, month: 7,
      fireLat: 37.52, fireLon: 42.45, areaKm2: 0.4, areaHectare: 40,
      durationDays: 1, severity: 'Düşük', description: 'Şırnak Orman Yangını' },
    { city: 'Sivas', cityLat: 39.7477, cityLon: 37.0179, year: 2012, month: 8,
      fireLat: 39.75, fireLon: 37.02, areaKm2: 1.0, areaHectare: 100,
      durationDays: 1, severity: 'Düşük', description: 'Sivas Orman Yangını' },
    { city: 'Tokat', cityLat: 40.3139, cityLon: 36.5542, year: 2015, month: 7,
      fireLat: 40.31, fireLon: 36.55, areaKm2: 0.9, areaHectare: 90,
      durationDays: 1, severity: 'Düşük', description: 'Tokat Orman Yangını' },
    { city: 'Trabzon', cityLat: 41.0015, cityLon: 39.7178, year: 2018, month: 7,
      fireLat: 41.0, fireLon: 39.72, areaKm2: 0.6, areaHectare: 60,
      durationDays: 1, severity: 'Düşük', description: 'Trabzon Orman Yangını' },
    { city: 'Tunceli', cityLat: 39.1083, cityLon: 39.5472, year: 2014, month: 8,
      fireLat: 39.11, fireLon: 39.55, areaKm2: 0.4, areaHectare: 40,
      durationDays: 1, severity: 'Düşük', description: 'Tunceli Orman Yangını' },
    { city: 'Uşak', cityLat: 38.6803, cityLon: 29.4081, year: 2011, month: 7,
      fireLat: 38.68, fireLon: 29.41, areaKm2: 1.0, areaHectare: 100,
      durationDays: 1, severity: 'Düşük', description: 'Uşak Orman Yangını' },
    { city: 'Van', cityLat: 38.4891, cityLon: 43.4089, year: 2016, month: 7,
      fireLat: 38.49, fireLon: 43.41, areaKm2: 0.5, areaHectare: 50,
      durationDays: 1, severity: 'Düşük', description: 'Van Orman Yangını' },
    { city: 'Yalova', cityLat: 40.6550, cityLon: 29.2769, year: 2019, month: 8,
      fireLat: 40.66, fireLon: 29.28, areaKm2: 0.7, areaHectare: 70,
      durationDays: 1, severity: 'Düşük', description: 'Yalova Orman Yangını' },
    { city: 'Yozgat', cityLat: 39.8208, cityLon: 34.8083, year: 2013, month: 7,
      fireLat: 39.82, fireLon: 34.81, areaKm2: 0.8, areaHectare: 80,
      durationDays: 1, severity: 'Düşük', description: 'Yozgat Orman Yangını' },
    { city: 'Zonguldak', cityLat: 41.4564, cityLon: 31.7987, year: 2010, month: 7,
      fireLat: 41.46, fireLon: 31.8, areaKm2: 0.9, areaHectare: 90,
      durationDays: 1, severity: 'Düşük', description: 'Zonguldak Orman Yangını' },
];

// Initialize historical fires
function initHistoricalFires() {
    historicalFiresData = sampleHistoricalFires;
    loadHistoricalFires();
}

// Load and display historical fires
function loadHistoricalFires() {
    const cityFilter = document.getElementById('historyCitySelect').value;
    const yearFilter = document.getElementById('historyYearSelect').value;
    const sortBy = document.getElementById('historySortSelect').value;
    
    // Filter data
    let filtered = historicalFiresData.filter(fire => {
        const cityMatch = cityFilter === 'all' || fire.city === cityFilter;
        const yearMatch = yearFilter === 'all' || fire.year.toString() === yearFilter;
        return cityMatch && yearMatch;
    });
    
    // Sort data
    filtered.sort((a, b) => {
        if (sortBy === 'year-desc') return b.year - a.year;
        if (sortBy === 'year-asc') return a.year - b.year;
        if (sortBy === 'area-desc') return b.areaKm2 - a.areaKm2;
        if (sortBy === 'area-asc') return a.areaKm2 - b.areaKm2;
        return 0;
    });
    
    // Update stats
    updateHistoryStats(filtered);
    
    // Update charts
    updateHistoryCharts(filtered);
    
    // Update map
    updateHistoryMap(filtered);
    
    // Update table
    updateHistoryTable(filtered);
}

// Update history statistics
function updateHistoryStats(fires) {
    const statsContainer = document.getElementById('historyStats');
    
    const totalFires = fires.length;
    const totalArea = fires.reduce((sum, f) => sum + f.areaKm2, 0);
    const avgArea = totalFires > 0 ? totalArea / totalFires : 0;
    const years = fires.map(f => f.year);
    const yearRange = years.length > 0 ? `${Math.min(...years)}-${Math.max(...years)}` : '-';
    
    statsContainer.innerHTML = `
        <div class="history-stat-card">
            <h4>🔥 Toplam Yangın</h4>
            <div class="stat-value">${totalFires}</div>
        </div>
        <div class="history-stat-card">
            <h4>📏 Toplam Yanan Alan</h4>
            <div class="stat-value">${totalArea.toFixed(2)}</div>
            <div style="font-size: 0.8em; color: #666; margin-top: 5px;">km² (${(totalArea*100).toFixed(0)} ha)</div>
        </div>
        <div class="history-stat-card">
            <h4>📊 Ortalama Alan</h4>
            <div class="stat-value">${avgArea.toFixed(2)}</div>
            <div style="font-size: 0.8em; color: #666; margin-top: 5px;">km²</div>
        </div>
        <div class="history-stat-card">
            <h4>📅 Yıl Aralığı</h4>
            <div class="stat-value" style="font-size: 1.5em;">${yearRange}</div>
        </div>
    `;
}

// Update history charts
function updateHistoryCharts(fires) {
    // Year chart
    const yearCtx = document.getElementById('historyYearChart');
    if (yearCtx) {
        const yearData = {};
        fires.forEach(fire => {
            yearData[fire.year] = (yearData[fire.year] || 0) + 1;
        });
        
        const years = Object.keys(yearData).sort();
        const counts = years.map(y => yearData[y]);
        
        if (historyYearChart) {
            historyYearChart.destroy();
        }
        
        historyYearChart = new Chart(yearCtx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [{
                    label: 'Yangın Sayısı',
                    data: counts,
                    backgroundColor: '#ff6b6b',
                    borderColor: '#ff6b6b',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    // Month chart
    const monthCtx = document.getElementById('historyMonthChart');
    if (monthCtx) {
        const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                           'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        const monthData = {};
        fires.forEach(fire => {
            monthData[fire.month] = (monthData[fire.month] || 0) + 1;
        });
        
        const months = Object.keys(monthData).sort((a, b) => a - b);
        const counts = months.map(m => monthData[m]);
        const monthLabels = months.map(m => monthNames[m - 1]);
        
        if (historyMonthChart) {
            historyMonthChart.destroy();
        }
        
        historyMonthChart = new Chart(monthCtx, {
            type: 'bar',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: 'Yangın Sayısı',
                    data: counts,
                    backgroundColor: '#ff9800',
                    borderColor: '#ff9800',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
}

// Update history map
function updateHistoryMap(fires) {
    const mapContainer = document.getElementById('historyMapContainer');
    if (!mapContainer || fires.length === 0) return;
    
    // Group by year for different colors
    const years = [...new Set(fires.map(f => f.year))].sort();
    const colors = ['#ff6b6b', '#ff9800', '#ffc107', '#4caf50', '#2196f3', '#9c27b0', '#e91e63'];
    const yearColorMap = {};
    years.forEach((year, idx) => {
        yearColorMap[year] = colors[idx % colors.length];
    });
    
    const traces = [];
    
    // Add fires by year
    years.forEach(year => {
        const yearFires = fires.filter(f => f.year === year);
        traces.push({
            type: 'scattermapbox',
            mode: 'markers',
            lat: yearFires.map(f => f.fireLat),
            lon: yearFires.map(f => f.fireLon),
            marker: {
                size: yearFires.map(f => Math.max(10, f.areaKm2 * 3)),
                color: yearColorMap[year],
                opacity: 0.7,
                line: { width: 2, color: 'white' }
            },
            text: yearFires.map(f => 
                `<b>${f.description}</b><br>` +
                `Yıl: ${f.year}<br>` +
                `Alan: ${f.areaKm2.toFixed(2)} km² (${f.areaHectare.toFixed(0)} ha)<br>` +
                `Süre: ${f.durationDays} gün<br>` +
                `Şiddet: ${f.severity}`
            ),
            hovertemplate: '%{text}<extra></extra>',
            name: `${year} Yılı`
        });
    });
    
    // Calculate center
    const avgLat = fires.reduce((sum, f) => sum + f.fireLat, 0) / fires.length;
    const avgLon = fires.reduce((sum, f) => sum + f.fireLon, 0) / fires.length;
    
    const layout = {
        mapbox: {
            style: 'open-street-map',
            center: { lat: avgLat, lon: avgLon },
            zoom: 7
        },
        height: 500,
        margin: { l: 0, r: 0, t: 0, b: 0 },
        legend: {
            orientation: "h",
            yanchor: "bottom",
            y: 1.02,
            xanchor: "right",
            x: 1
        }
    };
    
    if (typeof Plotly !== 'undefined') {
        Plotly.newPlot('historyMapContainer', traces, layout, { responsive: true });
    }
}

// Update history table
function updateHistoryTable(fires) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                       'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    tbody.innerHTML = fires.map(fire => `
        <tr>
            <td>${fire.year}</td>
            <td>${monthNames[fire.month - 1] || fire.month}</td>
            <td>${fire.city}</td>
            <td>${fire.description}</td>
            <td>${fire.areaKm2.toFixed(2)}</td>
            <td>${fire.areaHectare.toFixed(0)}</td>
            <td>${fire.durationDays}</td>
            <td><span class="severity-badge severity-${fire.severity.toLowerCase()}">${fire.severity}</span></td>
        </tr>
    `).join('');
}

// Initialize historical fires when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHistoricalFires);
} else {
    initHistoricalFires();
}

// ============================================
// PWA Service Worker Registration
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('✅ Service Worker kaydedildi:', registration.scope);
                
                // Update check
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Yeni versiyon mevcut - kullanıcıya bildir
                            console.log('🔄 Yeni versiyon mevcut! Sayfayı yenileyin.');
                            if (confirm('Yeni versiyon mevcut! Sayfayı yenilemek ister misiniz?')) {
                                window.location.reload();
                            }
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('❌ Service Worker kayıt hatası:', error);
            });
    });
    
    // PWA Install Prompt (Mobil için)
    let deferredPrompt;
    let pwaInstallBannerShown = false;
    
    // Mobil cihaz tespiti
    function isMobileDevice() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               (window.innerWidth <= 768);
        console.log('isMobileDevice:', isMobile, 'UserAgent:', navigator.userAgent, 'Width:', window.innerWidth);
        return isMobile;
    }
    
    // Standalone modda mı kontrol et (zaten yüklü mü)
    function isStandalone() {
        const standalone = window.matchMedia('(display-mode: standalone)').matches || 
               window.navigator.standalone || 
               document.referrer.includes('android-app://');
        console.log('isStandalone:', standalone);
        return standalone;
    }
    
    // PWA Install Banner göster (mobilde)
    function showPWAInstallBanner() {
        const banner = document.getElementById('pwa-install-banner');
        if (!banner) {
            console.error('PWA Banner: Banner elementi bulunamadı!');
            return false;
        }
        
        // Desktop'ta gösterme
        if (!isMobileDevice()) {
            banner.style.display = 'none';
            return false;
        }
        
        // Standalone modda gösterme (zaten yüklü)
        if (isStandalone()) {
            banner.style.display = 'none';
            return false;
        }
        
        // PWA zaten yüklü mü kontrol et
        const pwaInstalled = localStorage.getItem('pwa-installed');
        if (pwaInstalled === 'true') {
            banner.style.display = 'none';
            return false;
        }
        
        // Banner'ı göster - zorla ve kesinlikle (her zaman)
        banner.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            z-index: 99999 !important;
        `;
        
        // Banner'ın görünür olduğunu doğrula
        setTimeout(() => {
            const computedStyle = window.getComputedStyle(banner);
            if (computedStyle.display === 'none' || banner.offsetHeight === 0) {
                console.warn('PWA Banner: Hala görünmüyor, tekrar deniyor...');
                banner.style.cssText = `
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    position: relative !important;
                    z-index: 99999 !important;
                    height: auto !important;
                    width: 100% !important;
                `;
            }
        }, 200);
        
        console.log('✅ PWA Banner gösterildi');
        return true;
    }
    
    // PWA Install Banner gizle
    function hidePWAInstallBanner() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.style.display = 'none';
        }
    }
    
    // beforeinstallprompt event'i (Chrome, Edge, Samsung Internet)
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('beforeinstallprompt event tetiklendi');
        // Varsayılan prompt'u engelle
        e.preventDefault();
        deferredPrompt = e;
        
        // Mobilde banner göster
        if (isMobileDevice() && !isStandalone()) {
            console.log('beforeinstallprompt: Banner gösteriliyor');
            showPWAInstallBanner();
        }
    });
    
    // PWA yüklendiğinde banner'ı gizle
    window.addEventListener('appinstalled', () => {
        console.log('✅ PWA yüklendi!');
        hidePWAInstallBanner();
        deferredPrompt = null;
        localStorage.setItem('pwa-installed', 'true');
    });
    
    // Banner yükleme butonu event listener'ı (DOM yüklendikten sonra ekle)
    function setupInstallButton() {
        const installBannerBtn = document.getElementById('pwa-install-banner-btn');
        if (!installBannerBtn) {
            console.warn('PWA Install Banner butonu bulunamadı');
            return;
        }
        
        // iOS Safari kontrolü
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/i.test(navigator.userAgent);
        
        if (isIOS && isSafari) {
            // iOS Safari için özel davranış (ayrı handler var)
            return;
        }
        
        // Mevcut event listener'ları kaldır (tekrar eklenmemesi için)
        const newBtn = installBannerBtn.cloneNode(true);
        installBannerBtn.parentNode.replaceChild(newBtn, installBannerBtn);
        
        // Yeni butona event listener ekle
        const freshBtn = document.getElementById('pwa-install-banner-btn');
        freshBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('PWA Install butonu tıklandı');
            
            if (deferredPrompt) {
                try {
                    // Prompt'u göster
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    
                    console.log(`Kullanıcı seçimi: ${outcome}`);
                    if (outcome === 'accepted') {
                        console.log('✅ Kullanıcı PWA yüklemeyi kabul etti');
                    }
                    deferredPrompt = null;
                    hidePWAInstallBanner();
                } catch (error) {
                    console.error('PWA install prompt hatası:', error);
                    alert('Yükleme işlemi başlatılamadı. Lütfen tarayıcınızın menüsünden "Ana ekrana ekle" seçeneğini kullanın.');
                }
            } else {
                // Fallback: Diğer tarayıcılar için
                alert('Tarayıcınızın menüsünden "Ana ekrana ekle" veya "Yükle" seçeneğini kullanın.\n\nChrome: Menü (⋮) → "Ana ekrana ekle"\nSafari: Paylaş (⬆️) → "Ana Ekrana Ekle"');
            }
        });
        
        console.log('✅ PWA Install butonu event listener eklendi');
    }
    
    // Banner kapatma butonu (sadece geçici olarak gizle, tekrar göster)
    const installBannerClose = document.getElementById('pwa-install-banner-close');
    if (installBannerClose) {
        installBannerClose.addEventListener('click', () => {
            // Banner'ı geçici olarak gizle (sayfa yenilendiğinde tekrar görünecek)
            hidePWAInstallBanner();
            // localStorage'a kaydetme - her zaman gösterilecek
        });
    }
    
    // Buton event listener'larını ayarla (DOM yüklendikten sonra)
    function setupBannerButtons() {
        setupInstallButton(); // Android/Chrome için
        setupIOSInstallButton(); // iOS Safari için
    }
    
    // Sayfa yüklendiğinde mobilde banner göster
    function initPWAInstallBanner() {
        // Mobil kontrolü
        if (isMobileDevice() && !isStandalone()) {
            // Banner'ı göster (hemen)
            showPWAInstallBanner();
            
            // Butonları ayarla
            setTimeout(() => {
                setupBannerButtons();
            }, 100);
            
            // Tekrar dene (gecikme ile)
            setTimeout(() => {
                showPWAInstallBanner();
                setupBannerButtons();
            }, 500);
            
            // Bir daha dene (daha uzun gecikme ile)
            setTimeout(() => {
                showPWAInstallBanner();
                setupBannerButtons();
            }, 2000);
        }
    }
    
    // DOM yüklendiğinde çalıştır
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPWAInstallBanner);
    } else {
        initPWAInstallBanner();
    }
    
    // window.load ile de kontrol et
    window.addEventListener('load', function() {
        if (isMobileDevice() && !isStandalone()) {
            setTimeout(() => {
                showPWAInstallBanner();
                setupBannerButtons();
            }, 1000);
        }
    });
    
    // beforeinstallprompt event'i geldiğinde de göster
    window.addEventListener('beforeinstallprompt', function(e) {
        if (isMobileDevice() && !isStandalone()) {
            setTimeout(() => {
                showPWAInstallBanner();
                setupBannerButtons();
            }, 100);
        }
    });
    
    // iOS Safari için özel yükleme butonu davranışı
    function setupIOSInstallButton() {
        const installBannerBtn = document.getElementById('pwa-install-banner-btn');
        if (!installBannerBtn) {
            return;
        }
        
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/i.test(navigator.userAgent);
        
        if (isIOS && isSafari) {
            // iOS Safari için buton metnini güncelle
            installBannerBtn.textContent = 'Nasıl Yüklenir?';
            
            // Mevcut event listener'ları kaldır
            const newBtn = installBannerBtn.cloneNode(true);
            installBannerBtn.parentNode.replaceChild(newBtn, installBannerBtn);
            
            // Yeni event listener ekle
            const freshBtn = document.getElementById('pwa-install-banner-btn');
            freshBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                alert('iOS\'ta yüklemek için:\n\n1. Safari\'nin alt kısmındaki paylaş butonuna (⬆️) tıklayın\n2. "Ana Ekrana Ekle" seçeneğini seçin\n3. "Ekle" butonuna tıklayın\n\nUygulama ana ekranınıza eklenecektir.');
            });
            
            console.log('✅ iOS Safari install butonu ayarlandı');
        }
    }
    
}

// ==================== AI Chatbot Functions ====================

// AI Chat conversation history
let aiConversationHistory = [];

// Get current sensor data
function getCurrentSensorData() {
    const tempElement = document.getElementById('temperature');
    const smokeElement = document.getElementById('smoke');
    const riskElement = document.getElementById('fireRisk');
    const locationElement = document.getElementById('location');
    
    let temperature = null;
    let smoke = null;
    let fireRisk = null;
    let location = null;
    
    if (tempElement) {
        const tempText = tempElement.textContent;
        temperature = parseFloat(tempText.replace('°C', '').trim());
    }
    
    if (smokeElement) {
        const smokeText = smokeElement.textContent;
        smoke = parseFloat(smokeText.replace('PPM', '').trim());
    }
    
    if (riskElement) {
        const riskText = riskElement.textContent.trim();
        // Risk skorunu hesapla (Düşük: 0-25, Orta: 25-50, Yüksek: 50-75, Kritik: 75-100)
        if (riskText.includes('Kritik') || riskText.includes('Critical')) {
            fireRisk = 85;
        } else if (riskText.includes('Yüksek') || riskText.includes('High')) {
            fireRisk = 65;
        } else if (riskText.includes('Orta') || riskText.includes('Medium')) {
            fireRisk = 40;
        } else {
            fireRisk = 15;
        }
    }
    
    if (locationElement) {
        location = locationElement.textContent.trim();
    }
    
    return {
        temperature: temperature,
        smoke: smoke,
        fire_risk: fireRisk,
        location: location
    };
}

// Get current risk areas from map
function getCurrentRiskAreas() {
    // Haritadaki risk alanlarını al (initializeMap fonksiyonundaki fireRiskAreas)
    const fireRiskAreas = [
        { name: 'Antalya - Manavgat', lat: 36.8, lon: 31.4, risk: 'high', riskScore: 75 },
        { name: 'Muğla - Marmaris', lat: 36.9, lon: 28.3, risk: 'high', riskScore: 72 },
        { name: 'İzmir - Çeşme', lat: 38.3, lon: 26.3, risk: 'medium', riskScore: 45 },
        { name: 'Antalya - Kaş', lat: 36.2, lon: 29.6, risk: 'high', riskScore: 68 },
        { name: 'Muğla - Bodrum', lat: 37.0, lon: 27.4, risk: 'medium', riskScore: 50 },
        { name: 'Antalya - Alanya', lat: 36.5, lon: 32.0, risk: 'medium', riskScore: 48 },
        { name: 'Çanakkale - Kaz Dağları', lat: 39.8, lon: 26.8, risk: 'critical', riskScore: 88 },
        { name: 'Muğla - Fethiye', lat: 36.6, lon: 29.1, risk: 'high', riskScore: 70 },
        { name: 'İstanbul - Belgrad Ormanı', lat: 41.2, lon: 28.9, risk: 'medium', riskScore: 42 },
        { name: 'Bursa - Uludağ', lat: 40.1, lon: 29.2, risk: 'low', riskScore: 20 }
    ];
    
    return fireRiskAreas.map(area => ({
        name: area.name,
        risk_score: area.riskScore,
        lat: area.lat,
        lon: area.lon
    }));
}

// Send AI message
async function sendAIMessage() {
    const input = document.getElementById('aiChatInput');
    const sendBtn = document.getElementById('aiChatSendBtn');
    const status = document.getElementById('aiChatStatus');
    const messagesContainer = document.getElementById('aiChatMessages');
    
    const message = input.value.trim();
    
    if (!message) {
        return;
    }
    
    // Disable input and button
    input.disabled = true;
    sendBtn.disabled = true;
    
    // Add user message to chat
    addAIMessage(message, 'user');
    
    // Clear input
    input.value = '';
    
    // Show typing status
    status.textContent = '🤖 AI düşünüyor...';
    status.className = 'ai-chat-status typing';
    
    try {
        // Get current sensor data and risk areas
        const sensorData = getCurrentSensorData();
        const riskAreas = getCurrentRiskAreas();
        
        // Debug: Risk alanlarını kontrol et
        console.log('AI Chat: Mesaj gönderiliyor:', message);
        console.log('AI Chat: Sensör verileri:', sensorData);
        console.log('AI Chat: Risk alanları sayısı:', riskAreas ? riskAreas.length : 0);
        console.log('AI Chat: Risk alanları:', JSON.stringify(riskAreas, null, 2));
        
        // Send request to backend
        const apiUrl = `${API_BASE_URL}/api/ai-chat`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                sensor_data: sensorData,
                risk_areas: riskAreas,
                conversation_history: aiConversationHistory
            })
        });
        
        console.log('AI Chat: Response status:', response.status);
        
        // Check if response is ok before parsing JSON
        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI Chat: Response error:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('AI Chat: Response data:', data);
        
        if (data.success) {
            // Add AI response to chat
            let responseText = data.message;
            
            // Model bilgisini ekle
            if (data.model && data.model.includes('web-search')) {
                responseText += '\n\n🌐 *Web\'den güncel bilgiler kullanıldı*';
            } else if (data.model && data.model.includes('groq')) {
                responseText += '\n\n⚡️ *Groq AI ile yanıtlandı*';
            } else if (data.model && data.model.includes('gemini')) {
                responseText += '\n\n🤖 *Google Gemini AI ile yanıtlandı*';
            } else if (data.model && data.model.includes('rule-based')) {
                responseText += '\n\n📋 *Kural tabanlı yanıt*';
            }
            
            addAIMessage(responseText, 'bot');
            
            // Update conversation history
            aiConversationHistory.push({
                role: 'user',
                content: message
            });
            aiConversationHistory.push({
                role: 'assistant',
                content: data.message
            });
            
            // Clear status
            status.textContent = '';
            status.className = 'ai-chat-status';
        } else {
            // Show error
            status.textContent = `❌ Hata: ${data.message}`;
            status.className = 'ai-chat-status error';
            
            // Add error message to chat
            addAIMessage(`Üzgünüm, bir hata oluştu: ${data.message}`, 'bot');
        }
    } catch (error) {
        console.error('AI Chat error:', error);
        
        // More detailed error message
        let errorMessage = 'Bağlantı hatası oluştu.';
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Sunucuya bağlanılamıyor. İnternet bağlantınızı ve Render servisinin çalıştığını kontrol edin.';
        } else if (error.message.includes('HTTP')) {
            errorMessage = `Sunucu hatası: ${error.message}`;
        } else {
            errorMessage = `Hata: ${error.message}`;
        }
        
        status.textContent = `❌ ${errorMessage}`;
        status.className = 'ai-chat-status error';
        
        addAIMessage(`Üzgünüm, ${errorMessage}\n\nLütfen:\n1. İnternet bağlantınızı kontrol edin\n2. Render servisinin çalıştığını kontrol edin\n3. Sayfayı yenileyin (Ctrl+F5)`, 'bot');
    } finally {
        // Re-enable input and button
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
    }
}

// Add message to chat
function addAIMessage(message, type) {
    const messagesContainer = document.getElementById('aiChatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ai-${type}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'ai-message-avatar';
    avatar.textContent = type === 'user' ? '👤' : '🤖';
    
    const content = document.createElement('div');
    content.className = 'ai-message-content';
    
    // Format message (preserve line breaks and markdown-like formatting)
    const paragraphs = message.split('\n').filter(p => p.trim());
    paragraphs.forEach(para => {
        const p = document.createElement('p');
        
        // Basic markdown formatting
        let formattedText = para;
        
        // Bold text (**text**)
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Emoji support
        p.innerHTML = formattedText;
        
        content.appendChild(p);
    });
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Handle Enter key in AI chat input
document.addEventListener('DOMContentLoaded', function() {
    const aiInput = document.getElementById('aiChatInput');
    if (aiInput) {
        aiInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAIMessage();
            }
        });
        
        // Focus input when AI tab is opened (for floating button)
        // This will be handled by openAIChatbot() function
    }
    
    // Make suggestion items clickable
    const suggestionItems = document.querySelectorAll('.ai-suggestion-list li');
    suggestionItems.forEach(item => {
        item.addEventListener('click', function() {
            const aiInput = document.getElementById('aiChatInput');
            if (aiInput) {
                aiInput.value = this.textContent.replace(/[""]/g, '"');
                aiInput.focus();
            }
        });
    });
});



