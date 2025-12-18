// ==================== LEAFLET.JS INTEGRATION ====================

// Initialize Leaflet Map (OpenStreetMap)
function initLeafletMap() {
    console.log('🗺️ initLeafletMap çağrıldı');
    
    // Leaflet.js'in yüklendiğinden emin ol
    if (typeof L === 'undefined') {
        console.warn('⚠️ Leaflet.js henüz yüklenmedi, bekleniyor...');
        setTimeout(initLeafletMap, 500);
        return;
    }
    
    console.log('✅ Leaflet.js yüklendi');
    
    // Harita container'ının var olduğundan emin ol
    const mapContainer = document.getElementById('dashboardMap');
    if (!mapContainer) {
        console.warn('⚠️ dashboardMap container bulunamadı, bekleniyor...');
        setTimeout(initLeafletMap, 500);
        return;
    }
    
    console.log('✅ dashboardMap container bulundu');
    
    // Eğer harita zaten oluşturulmuşsa tekrar oluşturma
    if (dashboardMap) {
        console.log('✅ Harita zaten oluşturulmuş');
        return;
    }
    
    // Initialize map centered on Ankara
    const defaultLat = 39.9334;
    const defaultLon = 32.8597;
    
    console.log('🗺️ Leaflet haritası oluşturuluyor...', { lat: defaultLat, lng: defaultLon });
    
    try {
        // Container'ın görünür olduğundan emin ol
        if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
            console.warn('⚠️ Harita container görünür değil, boyutlar:', {
                width: mapContainer.offsetWidth,
                height: mapContainer.offsetHeight
            });
            // Yine de devam et, belki tab aktif olunca görünür olur
        }
        
        // Harita oluştur
        dashboardMap = L.map('dashboardMap', {
            center: [defaultLat, defaultLon],
            zoom: 12,
            zoomControl: true
        });
        
        // OpenStreetMap tile layer ekle
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(dashboardMap);
        
        // Harita yüklendiğinde kontrol et
        dashboardMap.whenReady(function() {
            console.log('✅ Leaflet haritası tamamen yüklendi');
        });
        
        console.log('✅ Leaflet haritası oluşturuldu');
        
        // Marker ekle (varsayılan konum)
        dashboardMarker = L.marker([defaultLat, defaultLon], {
            draggable: true,
            title: 'Konum seçin veya sürükleyin'
        }).addTo(dashboardMap);
        
        console.log('✅ Marker oluşturuldu');
        
        // Marker sürüklendiğinde
        dashboardMarker.on('dragend', function(e) {
            const lat = e.target.getLatLng().lat;
            const lng = e.target.getLatLng().lng;
            // updateMapLocation fonksiyonu script.js'de tanımlı
            if (typeof updateMapLocation === 'function') {
                updateMapLocation(lat, lng, null);
            } else {
                // Fallback: Sadece haritayı güncelle
                updateLeafletMapLocation(lat, lng);
            }
        });
        
        // Haritaya tıklandığında
        dashboardMap.on('click', function(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            // Marker'ı yeni konuma taşı
            dashboardMarker.setLatLng([lat, lng]);
            // updateMapLocation fonksiyonu script.js'de tanımlı
            if (typeof updateMapLocation === 'function') {
                updateMapLocation(lat, lng, null);
            } else {
                // Fallback: Sadece haritayı güncelle
                updateLeafletMapLocation(lat, lng);
            }
        });
        
        // Load initial risk for default location
        updateLocationRisk(defaultLat, defaultLon);
        
        // Initialize address search
        setTimeout(() => {
            initializeAddressSearch();
        }, 200);
        
    } catch (error) {
        console.error('❌ Leaflet haritası oluşturulamadı:', error);
        mapContainer.innerHTML = `
            <div style="padding: 20px; text-align: center; background: #ffebee; border-radius: 10px; border: 2px solid #f44336;">
                <h4 style="color: #c62828; margin-bottom: 10px;">❌ Harita Yüklenemedi</h4>
                <p style="color: #666; margin-bottom: 15px;">
                    ${error.message || 'Bilinmeyen bir hata oluştu'}
                </p>
                <button onclick="initLeafletMap()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                    🔄 Tekrar Dene
                </button>
            </div>
        `;
    }
}

// Initialize address search (Nominatim API)
function initializeAddressSearch() {
    const addressInput = document.getElementById('addressSearch');
    if (!addressInput) {
        console.warn('⚠️ addressSearch input bulunamadı, tekrar denenecek...');
        // Retry after a delay
        setTimeout(initializeAddressSearch, 500);
        return;
    }
    
    console.log('✅ Address search başlatılıyor');
    
    // Eğer zaten event listener eklenmişse, tekrar ekleme
    if (addressInput.hasAttribute('data-leaflet-initialized')) {
        console.log('✅ Address search zaten başlatılmış');
        return;
    }
    
    // Mark as initialized
    addressInput.setAttribute('data-leaflet-initialized', 'true');
    
    // Debounce için timeout
    addressInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        // Önceki timeout'u iptal et
        if (addressSearchTimeout) {
            clearTimeout(addressSearchTimeout);
        }
        
        // Eğer query kısa ise dropdown'ı gizle
        if (query.length < 3) {
            hideAddressResults();
            return;
        }
        
        // 500ms bekle (kullanıcı yazmayı bitirene kadar)
        addressSearchTimeout = setTimeout(() => {
            searchAddress(query, true); // Dropdown göster
        }, 500);
    });
    
    // Input dışına tıklandığında dropdown'ı gizle
    document.addEventListener('click', function(e) {
        if (addressInput && !addressInput.contains(e.target) && 
            addressResultsContainer && !addressResultsContainer.contains(e.target)) {
            hideAddressResults();
        }
    });
    
    // Enter tuşu ile arama (dropdown kapalı, direkt arama)
    addressInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = addressInput.value.trim();
            if (query.length >= 3) {
                searchAddress(query, false); // Dropdown gösterme, direkt sonucu seç
            } else {
                alert('Lütfen en az 3 karakter girin (örn: "Ankara Kızılay", "İstanbul Kadıköy").');
            }
        }
    });
    
    // Escape tuşu ile dropdown'ı kapat
    addressInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAddressResults();
        }
    });
    
    console.log('✅ Address search event listener\'ları eklendi');
}

// Adres arama sonuçları dropdown'ı
let addressResultsContainer = null;

// Search address using Nominatim API (OpenStreetMap)
function searchAddress(query, showDropdown = true) {
    console.log('🔍 Adres aranıyor:', query);
    
    // Eğer query çok kısa ise dropdown'ı gizle
    if (query.length < 3) {
        hideAddressResults();
        return;
    }
    
    // Türkiye bounding box: güney, batı, kuzey, doğu
    // Türkiye sınırları: yaklaşık 35.8, 25.7, 42.1, 44.8
    const bbox = '25.7,35.8,44.8,42.1'; // batı, güney, doğu, kuzey (Nominatim formatı)
    const viewbox = '25.7,42.1,44.8,35.8'; // minlon, maxlat, maxlon, minlat (viewbox formatı)
    
    // Nominatim API - Türkiye'ye sınırla, bounding box ekle
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&countrycodes=tr&bounded=1&viewbox=${viewbox}&bounded=1&addressdetails=1&extratags=1`;
    
    fetch(url, {
        headers: {
            'User-Agent': 'YanginTespitSistemi/1.0' // Nominatim için önerilir
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Adres arama başarısız');
            }
            return response.json();
        })
        .then(data => {
            // Sonuçları Türkiye içinde olduğundan emin olmak için filtrele
            const filteredResults = (data || []).filter(result => {
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                // Türkiye sınırları içinde mi kontrol et
                return lat >= 35.8 && lat <= 42.1 && lon >= 25.7 && lon <= 44.8;
            });
            
            if (filteredResults.length > 0) {
                if (showDropdown && filteredResults.length > 1) {
                    // Birden fazla sonuç varsa dropdown göster
                    showAddressResults(filteredResults);
                } else {
                    // Tek sonuç varsa veya dropdown istenmiyorsa direkt kullan
                    selectAddress(filteredResults[0]);
                }
            } else {
                hideAddressResults();
                alert('Türkiye sınırları içinde adres bulunamadı. Lütfen daha detaylı bir adres girin (örn: "Ankara Kızılay", "İstanbul Kadıköy", "İzmir Konak").');
            }
        })
        .catch(error => {
            console.error('❌ Adres arama hatası:', error);
            hideAddressResults();
            alert('Adres arama sırasında bir hata oluştu. Lütfen tekrar deneyin.');
        });
}

// Adres sonuçlarını dropdown olarak göster
function showAddressResults(results) {
    const addressInput = document.getElementById('addressSearch');
    if (!addressInput) return;
    
    // Container oluştur veya bul
    if (!addressResultsContainer) {
        addressResultsContainer = document.createElement('div');
        addressResultsContainer.id = 'addressResults';
        addressResultsContainer.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-top: 2px;
        `;
        
        // Input'un parent'ına ekle
        const container = addressInput.parentElement;
        if (container) {
            container.style.position = 'relative';
            container.appendChild(addressResultsContainer);
        }
    }
    
    // Sonuçları göster
    addressResultsContainer.innerHTML = '';
    results.forEach((result, index) => {
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 10px;
            cursor: pointer;
            border-bottom: 1px solid #eee;
            transition: background-color 0.2s;
        `;
        item.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f9f9f9';
        
        // Adres bilgisi
        const addressText = result.display_name;
        const city = result.address?.city || result.address?.town || result.address?.village || result.address?.state || '';
        const district = result.address?.suburb || result.address?.neighbourhood || result.address?.quarter || '';
        
        item.innerHTML = `
            <div style="font-weight: bold; color: #333;">${city || addressText.split(',')[0]}</div>
            ${district ? `<div style="font-size: 0.9em; color: #666;">${district}</div>` : ''}
            <div style="font-size: 0.85em; color: #999; margin-top: 4px;">${addressText}</div>
        `;
        
        // Tıklama eventi
        item.addEventListener('click', () => {
            selectAddress(result);
            hideAddressResults();
        });
        
        // Hover efekti
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = '#e3f2fd';
        });
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f9f9f9';
        });
        
        addressResultsContainer.appendChild(item);
    });
    
    addressResultsContainer.style.display = 'block';
}

// Adres sonuçlarını gizle
function hideAddressResults() {
    if (addressResultsContainer) {
        addressResultsContainer.style.display = 'none';
    }
}

// Adres seçildiğinde
function selectAddress(result) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const address = result.display_name;
    
    // Input'a adresi yaz
    const addressInput = document.getElementById('addressSearch');
    if (addressInput) {
        addressInput.value = address;
    }
    
    console.log('✅ Adres seçildi:', address, 'Koordinat:', lat, lng);
    
    // Haritayı güncelle
    if (dashboardMap && dashboardMarker) {
        dashboardMap.setView([lat, lng], 15);
        dashboardMarker.setLatLng([lat, lng]);
        // updateMapLocation fonksiyonu script.js'de tanımlı
        if (typeof updateMapLocation === 'function') {
            updateMapLocation(lat, lng, address);
        } else {
            // Fallback: Sadece haritayı güncelle
            updateLeafletMapLocation(lat, lng);
        }
    }
    
    hideAddressResults();
}

// Reverse geocoding (Koordinattan adres)
async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'YanginTespitSistemi/1.0'
            }
        });
        
        if (!response.ok) {
            throw new Error('Reverse geocoding başarısız');
        }
        
        const data = await response.json();
        if (data && data.display_name) {
            return data.display_name;
        }
        return null;
    } catch (error) {
        console.error('❌ Reverse geocoding hatası:', error);
        return null;
    }
}

// Update map location helper (Leaflet.js specific)
// Note: updateMapLocation fonksiyonu script.js'de tanımlı, burada sadece Leaflet.js'e özel güncellemeler yapıyoruz
function updateLeafletMapLocation(lat, lng) {
    // Update marker position (Leaflet.js)
    if (dashboardMarker && dashboardMarker.setLatLng) {
        dashboardMarker.setLatLng([lat, lng]);
    }
    
    // Center map (Leaflet.js)
    if (dashboardMap && dashboardMap.setView) {
        dashboardMap.setView([lat, lng], dashboardMap.getZoom() || 15);
    }
}

// Get current location using GPS
function getCurrentLocationGPS() {
    if (!navigator.geolocation) {
        alert('Tarayıcınız GPS konumunu desteklemiyor.');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            // updateMapLocation fonksiyonu script.js'de tanımlı
            if (typeof updateMapLocation === 'function') {
                updateMapLocation(lat, lng, null);
            } else {
                // Fallback: Sadece haritayı güncelle
                updateLeafletMapLocation(lat, lng);
            }
        },
        (error) => {
            console.error('GPS hatası:', error);
            alert('GPS konumu alınamadı: ' + error.message);
        }
    );
}

// Get current location for directions (placeholder - directions Leaflet için farklı bir plugin gerektirir)
// NOT: getCurrentLocationForDirections fonksiyonu script.js'de tanımlı
// Bu dosyada aynı isimde fonksiyon olmamalı (çakışmayı önlemek için)
// Eğer sadece GPS konumu almak istiyorsanız getCurrentLocationGPS() kullanın

