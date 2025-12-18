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
    
    // NASA FIRMS verilerini yeniden yükle
    loadFireDataForMapTab();
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
function onMapTabActivated() {
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

// Otomatik güncellemeyi başlat (5 dakikada bir)
function startMapTabAutoUpdate() {
    // Önceki interval'i temizle
    if (mapTabAutoUpdateInterval) {
        clearInterval(mapTabAutoUpdateInterval);
    }
    
    // Her 5 dakikada bir güncelle (300000 ms)
    mapTabAutoUpdateInterval = setInterval(async () => {
        console.log('🔄 Harita sekmesi otomatik güncelleme yapılıyor...');
        await loadFireDataForMapTab();
    }, 300000); // 5 dakika
    
    console.log('🔄 Harita sekmesi otomatik güncelleme başlatıldı (5 dakikada bir)');
}

