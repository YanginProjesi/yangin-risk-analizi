// ==================== LEAFLET MAP FOR MAP TAB ====================
// Harita sekmesi için Leaflet haritası ve NASA FIRMS entegrasyonu

let mapTabLeafletMap = null; // Harita sekmesindeki Leaflet haritası
let mapTabFireMarkers = []; // Yangın marker'ları
let mapTabCurrentCity = 'ankara'; // Mevcut şehir
let mapTabAutoUpdateInterval = null; // Otomatik güncelleme interval'i

// Şiddet seviyeleri için renkler ve ikonlar
const fireIntensityColors = {
    low: '#4CAF50',
    medium: '#FFC107',
    high: '#FF9800',
    critical: '#F44336'
};

const fireIntensityLabels = {
    low: 'Düşük Şiddet',
    medium: 'Orta Şiddet',
    high: 'Yüksek Şiddet',
    critical: 'Kritik Şiddet'
};

// Yangın marker ikonu oluştur (renklere göre)
function createFireMarkerIcon(intensityLevel) {
    const color = fireIntensityColors[intensityLevel] || fireIntensityColors.medium;
    const label = fireIntensityLabels[intensityLevel] || fireIntensityLabels.medium;
    
    // Özel ikon oluştur (daire şeklinde, renkli)
    return L.divIcon({
        className: 'fire-marker-icon',
        html: `<div style="
            background-color: ${color};
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            color: white;
        ">🔥</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
    });
}

// Harita sekmesinde Leaflet haritasını başlat
function initMapTabLeafletMap(cityKey = 'ankara') {
    console.log('🗺️ Harita sekmesi Leaflet haritası başlatılıyor:', cityKey);
    
    // Leaflet.js'in yüklendiğinden emin ol
    if (typeof L === 'undefined') {
        console.warn('⚠️ Leaflet.js henüz yüklenmedi, bekleniyor...');
        setTimeout(() => initMapTabLeafletMap(cityKey), 500);
        return;
    }
    
    // Harita container'ının var olduğundan emin ol
    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) {
        console.warn('⚠️ mapContainer bulunamadı, bekleniyor...');
        setTimeout(() => initMapTabLeafletMap(cityKey), 500);
        return;
    }
    
    // Eğer harita zaten oluşturulmuşsa, sadece şehir değişikliği yap
    if (mapTabLeafletMap) {
        console.log('✅ Harita zaten oluşturulmuş, şehir değiştiriliyor');
        updateMapTabCity(cityKey);
        return;
    }
    
    // Şehir bilgilerini al
    const city = cities[cityKey] || cities['ankara'];
    mapTabCurrentCity = cityKey;
    
    console.log('🗺️ Leaflet haritası oluşturuluyor...', { lat: city.lat, lng: city.lon });
    
    try {
        // Harita oluştur
        mapTabLeafletMap = L.map('mapContainer', {
            center: [city.lat, city.lon],
            zoom: city.zoom || 8,
            zoomControl: true
        });
        
        // OpenStreetMap tile layer ekle
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(mapTabLeafletMap);
        
        // Harita yüklendiğinde
        mapTabLeafletMap.whenReady(function() {
            console.log('✅ Harita sekmesi Leaflet haritası tamamen yüklendi');
            // NASA FIRMS verilerini yükle
            loadFireDataForMapTab();
            
            // Otomatik güncellemeyi başlat (5 dakikada bir)
            startMapTabAutoUpdate();
        });
        
        console.log('✅ Harita sekmesi Leaflet haritası oluşturuldu');
        
    } catch (error) {
        console.error('❌ Harita sekmesi Leaflet haritası oluşturulamadı:', error);
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="padding: 20px; text-align: center; background: #f8f9fa; border-radius: 10px; margin: 20px;">
                    <h3>❌ Harita Yüklenemedi</h3>
                    <p>Bir hata oluştu: ${error.message}</p>
                    <button onclick="initMapTabLeafletMap('${cityKey}')" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                        🔄 Tekrar Dene
                    </button>
                </div>
            `;
        }
    }
}

// Harita sekmesi için şehir değiştir
function updateMapTabCity(cityKey = 'ankara') {
    if (!mapTabLeafletMap) {
        console.warn('⚠️ Harita henüz oluşturulmamış, başlatılıyor...');
        initMapTabLeafletMap(cityKey);
        return;
    }
    
    const city = cities[cityKey] || cities['ankara'];
    mapTabCurrentCity = cityKey;
    
    console.log('📍 Harita sekmesi şehir değiştiriliyor:', city.name);
    
    // Harita merkezini ve zoom'u güncelle
    mapTabLeafletMap.setView([city.lat, city.lon], city.zoom || 8);
    
    // Mevcut moda göre veri yükle
    const currentMode = typeof currentMapMode !== 'undefined' ? currentMapMode : 'fires';
    if (currentMode === 'fires') {
        loadFireDataForMapTab();
    } else if (currentMode === 'risk') {
        loadRiskDataForMapTab();
    }
}

// NASA FIRMS verilerini yükle ve haritada göster
async function loadFireDataForMapTab() {
    console.log('🔥 NASA FIRMS verileri harita sekmesi için yükleniyor...');
    
    try {
        // fetchFireData fonksiyonunu kullan (script.js'de tanımlı)
        if (typeof fetchFireData === 'function') {
            const fireData = await fetchFireData(false);
            if (fireData && fireData.length > 0) {
                displayFireDataOnMapTab(fireData);
            } else {
                console.log('⚠️ NASA FIRMS verisi bulunamadı');
                clearFireMarkersFromMapTab();
            }
        } else {
            console.error('❌ fetchFireData fonksiyonu bulunamadı');
        }
    } catch (error) {
        console.error('❌ NASA FIRMS veri yükleme hatası:', error);
        clearFireMarkersFromMapTab();
    }
}

// Yangın verilerini harita sekmesinde göster
function displayFireDataOnMapTab(fireData) {
    if (!mapTabLeafletMap) {
        console.error('❌ Harita henüz oluşturulmamış');
        return;
    }
    
    console.log(`🔥 ${fireData.length} yangın noktası harita sekmesine ekleniyor`);
    
    // Önce mevcut marker'ları temizle
    clearFireMarkersFromMapTab();
    
    // Her yangın için marker oluştur
    fireData.forEach(fire => {
        const intensityLevel = fire.intensity_level || fire.risk_level || 'medium';
        const intensityScore = fire.intensity_score || fire.risk_score || 'N/A';
        
        // Marker ikonu oluştur
        const icon = createFireMarkerIcon(intensityLevel);
        
        // Marker oluştur
        const marker = L.marker([fire.latitude, fire.longitude], { icon: icon })
            .addTo(mapTabLeafletMap);
        
        // Popup içeriği
        const popupContent = `
            <div style="min-width: 250px;">
                <h3 style="margin: 0 0 10px 0; color: ${fireIntensityColors[intensityLevel]}">🔥 NASA FIRMS - Aktif Yangın Tespiti</h3>
                <p style="margin: 5px 0; font-weight: bold; color: #d32f2f;">⚠️ Bu nokta uydu tarafından tespit edilmiş gerçek bir yangındır!</p>
                <hr style="margin: 10px 0;">
                <p style="margin: 5px 0;"><strong>Yangın Şiddeti:</strong> ${fireIntensityLabels[intensityLevel]}</p>
                <p style="margin: 5px 0;"><strong>Şiddet Skoru:</strong> ${intensityScore}/100</p>
                <p style="margin: 5px 0;"><strong>Parlaklık:</strong> ${fire.brightness || 'N/A'} ${fire.brightness ? '(yüksek = büyük yangın)' : ''}</p>
                <p style="margin: 5px 0;"><strong>Tespit Güveni:</strong> ${fire.confidence || 'N/A'}%</p>
                <p style="margin: 5px 0;"><strong>Tespit Tarihi:</strong> ${fire.acq_date || 'N/A'} ${fire.acq_time || ''}</p>
                <p style="margin: 5px 0;"><strong>Uydu:</strong> ${fire.satellite || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Konum:</strong> ${fire.latitude?.toFixed(4) || 'N/A'}°, ${fire.longitude?.toFixed(4) || 'N/A'}°</p>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Marker'ı listeye ekle
        mapTabFireMarkers.push(marker);
    });
    
    console.log(`✅ ${mapTabFireMarkers.length} yangın marker'ı harita sekmesine eklendi`);
    
    // Güncelleme bilgisini göster
    const updateInfo = document.getElementById('fireDataUpdateInfo');
    if (updateInfo) {
        const updateTime = new Date().toLocaleTimeString('tr-TR');
        updateInfo.textContent = `🔄 Son güncelleme: ${updateTime} | ${fireData.length} aktif yangın noktası`;
    }
}

// Harita sekmesindeki yangın marker'larını temizle
function clearFireMarkersFromMapTab() {
    mapTabFireMarkers.forEach(marker => {
        if (mapTabLeafletMap) {
            mapTabLeafletMap.removeLayer(marker);
        }
    });
    mapTabFireMarkers = [];
    console.log('🗑️ Harita sekmesi yangın marker\'ları temizlendi');
}

// Harita sekmesi aktif olduğunda çağrılır
async function onMapTabActivated() {
    console.log('📍 Harita sekmesi aktif edildi');
    
    // Leaflet haritasını başlat (eğer henüz başlatılmamışsa)
    if (!mapTabLeafletMap) {
        const currentCity = document.getElementById('mapCitySelect')?.value || 'ankara';
        initMapTabLeafletMap(currentCity);
    } else {
        // Harita zaten var, sadece boyutunu güncelle (tab değiştiğinde gerekebilir)
        setTimeout(() => {
            if (mapTabLeafletMap) {
                mapTabLeafletMap.invalidateSize();
            }
        }, 100);
        
        // Mod kontrolü yap ve uygun verileri yükle
        const currentMode = typeof currentMapMode !== 'undefined' ? currentMapMode : 'fires';
        console.log('📍 Mevcut harita modu:', currentMode);
        
        if (currentMode === 'fires') {
            // Yangın verilerini yükle
            loadFireDataForMapTab();
        } else if (currentMode === 'risk') {
            // Risk verilerini yükle
            loadRiskDataForMapTab();
        }
    }
}

// Harita sekmesi şehir değişikliği için
function changeMapTabCity() {
    const citySelect = document.getElementById('mapCitySelect');
    if (!citySelect) {
        console.error('❌ mapCitySelect bulunamadı');
        return;
    }
    
    const cityKey = citySelect.value;
    console.log('📍 Harita sekmesi şehir değiştiriliyor:', cityKey);
    
    updateMapTabCity(cityKey);
}

// Risk verilerini harita sekmesinde yükle ve göster
async function loadRiskDataForMapTab() {
    console.log('⚠️ Yangın riski verileri harita sekmesi için yükleniyor...');
    
    if (!mapTabLeafletMap) {
        console.error('❌ Harita henüz oluşturulmamış');
        return;
    }
    
    try {
        // updateMapWithRiskPrediction fonksiyonunu kullan (script.js'de tanımlı)
        if (typeof updateMapWithRiskPrediction === 'function') {
            const currentCity = document.getElementById('mapCitySelect')?.value || 'ankara';
            await updateMapWithRiskPredictionForLeaflet(currentCity);
        } else {
            console.error('❌ updateMapWithRiskPrediction fonksiyonu bulunamadı');
        }
    } catch (error) {
        console.error('❌ Risk veri yükleme hatası:', error);
        clearRiskMarkersFromMapTab();
    }
}

// Risk marker'ları için liste
let mapTabRiskMarkers = [];

// Risk verilerini Leaflet haritasında göster
function displayRiskDataOnMapTab(riskData) {
    if (!mapTabLeafletMap) {
        console.error('❌ Harita henüz oluşturulmamış');
        return;
    }
    
    console.log(`⚠️ ${riskData.length} risk noktası harita sekmesine ekleniyor`);
    
    // Önce mevcut risk marker'larını temizle
    clearRiskMarkersFromMapTab();
    
    // Her risk noktası için marker oluştur
    riskData.forEach(risk => {
        const riskLevel = risk.risk_level || 'medium';
        const riskScore = risk.risk_score || 0;
        const lat = risk.latitude || risk.lat;
        const lng = risk.longitude || risk.lon;
        
        if (!lat || !lng) return;
        
        // Risk seviyesine göre renk ve ikon
        const riskColors = {
            'Düşük': '#4CAF50',
            'Orta': '#FFC107',
            'Yüksek': '#FF9800',
            'Kritik': '#F44336'
        };
        
        const color = riskColors[riskLevel] || riskColors['Orta'];
        
        // Marker ikonu oluştur (risk için farklı stil)
        const icon = L.divIcon({
            className: 'risk-marker-icon',
            html: `<div style="
                background-color: ${color};
                width: 24px;
                height: 24px;
                border-radius: 50% 50% 50% 0;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
            "><div style="transform: rotate(45deg); font-weight: bold; color: white; font-size: 12px;">⚠️</div></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
        });
        
        // Marker oluştur
        const marker = L.marker([lat, lng], { icon: icon })
            .addTo(mapTabLeafletMap);
        
        // Popup içeriği
        const popupContent = `
            <div style="min-width: 250px;">
                <h3 style="margin: 0 0 10px 0; color: ${color}">⚠️ Yangın Riski Tahmini</h3>
                <p style="margin: 5px 0; font-weight: bold; color: #666;">Bu bölge için yangın çıkma riski yüksektir (ML model tahmini)</p>
                <hr style="margin: 10px 0;">
                <p style="margin: 5px 0;"><strong>Risk Seviyesi:</strong> ${riskLevel}</p>
                <p style="margin: 5px 0;"><strong>Risk Skoru:</strong> ${riskScore.toFixed(1)}/100</p>
                ${risk.city_name ? `<p style="margin: 5px 0;"><strong>Şehir:</strong> ${risk.city_name}</p>` : ''}
                ${risk.temperature ? `<p style="margin: 5px 0;"><strong>Sıcaklık:</strong> ${risk.temperature}°C</p>` : ''}
                ${risk.humidity ? `<p style="margin: 5px 0;"><strong>Nem:</strong> ${risk.humidity}%</p>` : ''}
                ${risk.wind_speed ? `<p style="margin: 5px 0;"><strong>Rüzgar Hızı:</strong> ${risk.wind_speed} km/h</p>` : ''}
                <p style="margin: 5px 0;"><strong>Konum:</strong> ${lat.toFixed(4)}°, ${lng.toFixed(4)}°</p>
                <p style="margin: 10px 0 0 0; font-size: 0.85em; color: #666; font-style: italic;">💡 Bu bir tahmindir, gerçek yangın değildir.</p>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Marker'ı listeye ekle
        mapTabRiskMarkers.push(marker);
    });
    
    console.log(`✅ ${mapTabRiskMarkers.length} risk marker'ı harita sekmesine eklendi`);
    
    // Güncelleme bilgisini göster
    const updateInfo = document.getElementById('fireDataUpdateInfo');
    if (updateInfo) {
        const updateTime = new Date().toLocaleTimeString('tr-TR');
        updateInfo.textContent = `🔄 Son güncelleme: ${updateTime} | ${riskData.length} risk noktası`;
    }
}

// Risk marker'larını temizle
function clearRiskMarkersFromMapTab() {
    mapTabRiskMarkers.forEach(marker => {
        if (mapTabLeafletMap) {
            mapTabLeafletMap.removeLayer(marker);
        }
    });
    mapTabRiskMarkers = [];
    console.log('🗑️ Harita sekmesi risk marker\'ları temizlendi');
}

// updateMapWithRiskPrediction için Leaflet uyarlaması
async function updateMapWithRiskPredictionForLeaflet(cityKey = 'ankara') {
    console.log('🔄 Yangın riski tahmini Leaflet haritası için başlatılıyor...');
    
    // Loading indicator göster
    const updateInfo = document.getElementById('fireDataUpdateInfo');
    if (updateInfo) {
        updateInfo.textContent = '🔄 Yangın riski hesaplanıyor... (Bu işlem 10-30 saniye sürebilir)';
    }
    
    // script.js'deki updateMapWithRiskPrediction fonksiyonundaki mantığı kullan
    try {
        // Önce risk verilerini hesapla
        const importantCities = [
            'adana', 'antalya', 'muğla', 'izmir', 'bursa', 'istanbul', 'ankara',
            'mersin', 'aydın', 'denizli', 'balıkesir', 'çanakkale', 'manisa',
            'afyonkarahisar', 'kütahya', 'eskişehir', 'kocaeli', 'sakarya'
        ];
        
        const riskData = [];
        
        // Her şehir için risk hesapla (script.js'deki mantığı kullan)
        for (const cityKeyLoop of importantCities) {
            // cities objesi script.js'de tanımlı, global olarak erişilebilir olmalı
            const cityData = typeof cities !== 'undefined' ? cities[cityKeyLoop] : null;
            if (!cityData) continue;
            
            try {
                // Cache kontrolü (script.js'deki riskDataCache kullan)
                if (typeof riskDataCache !== 'undefined' && riskDataCache[cityKeyLoop] && 
                    (Date.now() - riskDataCache[cityKeyLoop].timestamp) < 300000) {
                    const cached = riskDataCache[cityKeyLoop].data;
                    riskData.push({
                        latitude: cached.lat,
                        longitude: cached.lon,
                        risk_score: cached.risk_score,
                        risk_level: cached.risk_level,
                        city_name: cached.name,
                        temperature: cached.temperature,
                        humidity: cached.humidity,
                        wind_speed: cached.wind_speed
                    });
                    continue;
                }
                
                // Hava durumu verilerini al (fetchWeatherDataAlternative script.js'de)
                let weatherData = null;
                if (typeof fetchWeatherDataAlternative === 'function') {
                    weatherData = await fetchWeatherDataAlternative(cityKeyLoop);
                }
                
                // API'den risk tahmini al
                const now = new Date();
                const month = now.getMonth() + 1;
                const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
                
                const features = {
                    temperature: weatherData?.temperature || 30,
                    humidity: weatherData?.humidity || 40,
                    wind_speed: weatherData?.windSpeed ? (weatherData.windSpeed * 3.6) : 15,
                    wind_direction: weatherData?.windDirection || 180,
                    precipitation: weatherData?.precipitation || 0,
                    month: month,
                    day_of_year: dayOfYear,
                    historical_fires_nearby: 1,
                    vegetation_index: 0.6,
                    elevation: cityData.elevation || 500
                };
                
                // API base URL - script.js'de tanımlı const API_BASE_URL = window.location.origin
                // Global scope'ta olduğu için doğrudan erişilemez, window.location.origin kullan
                const apiBase = typeof window !== 'undefined' ? window.location.origin : '';
                const response = await fetch(`${apiBase}/api/predict-risk`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(features)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        // Risk seviyesini normalize et
                        let riskLevel = result.risk_level || 'Orta';
                        if (typeof riskLevel === 'string') {
                            riskLevel = riskLevel.toLowerCase();
                            if (riskLevel.includes('düşük') || riskLevel === 'low' || riskLevel === 'dusuk') {
                                riskLevel = 'Düşük';
                            } else if (riskLevel.includes('orta') || riskLevel === 'medium') {
                                riskLevel = 'Orta';
                            } else if (riskLevel.includes('yüksek') || riskLevel === 'high' || riskLevel === 'yuksek') {
                                riskLevel = 'Yüksek';
                            } else if (riskLevel.includes('kritik') || riskLevel === 'critical') {
                                riskLevel = 'Kritik';
                            } else {
                                riskLevel = 'Orta';
                            }
                        }
                        
                        const riskItem = {
                            latitude: cityData.lat,
                            longitude: cityData.lon,
                            risk_score: result.risk_score,
                            risk_level: riskLevel,
                            city_name: cityData.name,
                            temperature: features.temperature,
                            humidity: features.humidity,
                            wind_speed: features.wind_speed
                        };
                        
                        riskData.push(riskItem);
                        
                        // Cache'e kaydet (script.js'deki riskDataCache'e)
                        if (typeof riskDataCache !== 'undefined') {
                            riskDataCache[cityKeyLoop] = {
                                data: {
                                    name: cityData.name,
                                    lat: cityData.lat,
                                    lon: cityData.lon,
                                    risk_score: result.risk_score,
                                    risk_level: riskLevel,
                                    temperature: features.temperature,
                                    humidity: features.humidity,
                                    wind_speed: features.wind_speed
                                },
                                timestamp: Date.now()
                            };
                        }
                    }
                }
            } catch (error) {
                console.error(`Risk hesaplama hatası (${cityKeyLoop}):`, error);
            }
        }
        
        // Risk verilerini haritada göster
        if (riskData.length > 0) {
            displayRiskDataOnMapTab(riskData);
        } else {
            if (updateInfo) {
                updateInfo.textContent = '⚠️ Risk verisi hesaplanamadı';
            }
        }
    } catch (error) {
        console.error('❌ Risk verisi yükleme hatası:', error);
        if (updateInfo) {
            updateInfo.textContent = '❌ Risk verisi yüklenirken hata oluştu';
        }
    }
}

// Otomatik güncellemeyi başlat (5 dakikada bir)
function startMapTabAutoUpdate() {
    // Önceki interval'i temizle
    if (mapTabAutoUpdateInterval) {
        clearInterval(mapTabAutoUpdateInterval);
    }
    
    // Her 5 dakikada bir güncelle (300000 ms)
    mapTabAutoUpdateInterval = setInterval(async () => {
        console.log('🔄 Harita sekmesi otomatik güncelleme yapılıyor...');
        
        // Mevcut moda göre veri yükle
        const currentMode = typeof currentMapMode !== 'undefined' ? currentMapMode : 'fires';
        if (currentMode === 'fires') {
            await loadFireDataForMapTab();
        } else if (currentMode === 'risk') {
            await loadRiskDataForMapTab();
        }
    }, 300000); // 5 dakika
    
    console.log('🔄 Harita sekmesi otomatik güncelleme başlatıldı (5 dakikada bir)');
}

