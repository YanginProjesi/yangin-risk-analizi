"""
Ana Streamlit uygulaması
Yangın Risk Analizi ve Yönetim Sistemi
"""
import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import time

from data_loader import DataLoader
from risk_analyzer import RiskAnalyzer
from spread_predictor import SpreadPredictor
from resource_calculator import ResourceCalculator
from alert_system import AlertSystem
from weather_api import WeatherAPI
from sms_notifier import SMSNotifier, create_sms_notifier

# Sayfa yapılandırması
st.set_page_config(
    page_title="Yangın Risk Analizi Sistemi",
    page_icon="🔥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Başlık
st.title("🔥 Yangın Risk Analizi ve Yönetim Sistemi")
st.markdown("### TÜBİTAK 2204-B Projesi - Ortaokul Öğrencileri İçin")

# Sidebar
st.sidebar.title("📊 Kontrol Paneli")
st.sidebar.markdown("---")

# SMS Bildirim Ayarları
st.sidebar.subheader("📱 SMS Bildirimleri")
sms_enabled = st.sidebar.checkbox("SMS Bildirimlerini Aktif Et", value=True, 
                                   help="Kritik yangın riski durumunda SMS gönderilir")
phone_number = st.sidebar.text_input("Telefon Numarası", value="+905326982193",
                                     help="E.164 formatında (örn: +905326982193)")
st.sidebar.markdown("---")

# Şehir seçimi
st.sidebar.subheader("📍 Konum Seçimi")
# Türkiye'nin 81 ili ve koordinatları
cities = {
    "Türkiye Genel": {"lat": 39.0, "lon": 35.0, "zoom": 6},
    "Adana": {"lat": 37.0000, "lon": 35.3213, "zoom": 9},
    "Adıyaman": {"lat": 37.7636, "lon": 38.2786, "zoom": 9},
    "Afyonkarahisar": {"lat": 38.7567, "lon": 30.5387, "zoom": 9},
    "Ağrı": {"lat": 39.7217, "lon": 43.0567, "zoom": 9},
    "Aksaray": {"lat": 38.3686, "lon": 34.0294, "zoom": 9},
    "Amasya": {"lat": 40.6533, "lon": 35.8331, "zoom": 9},
    "Ankara": {"lat": 39.9334, "lon": 32.8597, "zoom": 9},
    "Antalya": {"lat": 36.8969, "lon": 30.7133, "zoom": 9},
    "Ardahan": {"lat": 41.1106, "lon": 42.7022, "zoom": 9},
    "Artvin": {"lat": 41.1828, "lon": 41.8183, "zoom": 9},
    "Aydın": {"lat": 37.8444, "lon": 27.8458, "zoom": 9},
    "Balıkesir": {"lat": 39.6484, "lon": 27.8826, "zoom": 9},
    "Bartın": {"lat": 41.6344, "lon": 32.3375, "zoom": 9},
    "Batman": {"lat": 37.8814, "lon": 41.1353, "zoom": 9},
    "Bayburt": {"lat": 40.2553, "lon": 40.2247, "zoom": 9},
    "Bilecik": {"lat": 40.1425, "lon": 29.9792, "zoom": 9},
    "Bingöl": {"lat": 38.8847, "lon": 40.4981, "zoom": 9},
    "Bitlis": {"lat": 38.4000, "lon": 42.1083, "zoom": 9},
    "Bolu": {"lat": 40.7356, "lon": 31.6061, "zoom": 9},
    "Burdur": {"lat": 37.7203, "lon": 30.2908, "zoom": 9},
    "Bursa": {"lat": 40.1826, "lon": 29.0665, "zoom": 9},
    "Çanakkale": {"lat": 40.1553, "lon": 26.4142, "zoom": 9},
    "Çankırı": {"lat": 40.6000, "lon": 33.6167, "zoom": 9},
    "Çorum": {"lat": 40.5500, "lon": 34.9500, "zoom": 9},
    "Denizli": {"lat": 37.7765, "lon": 29.0864, "zoom": 9},
    "Diyarbakır": {"lat": 37.9100, "lon": 40.2300, "zoom": 9},
    "Düzce": {"lat": 40.8439, "lon": 31.1564, "zoom": 9},
    "Edirne": {"lat": 41.6772, "lon": 26.5556, "zoom": 9},
    "Elazığ": {"lat": 38.6753, "lon": 39.2228, "zoom": 9},
    "Erzincan": {"lat": 39.7500, "lon": 39.5000, "zoom": 9},
    "Erzurum": {"lat": 39.9043, "lon": 41.2679, "zoom": 9},
    "Eskişehir": {"lat": 39.7767, "lon": 30.5206, "zoom": 9},
    "Gaziantep": {"lat": 37.0662, "lon": 37.3833, "zoom": 9},
    "Giresun": {"lat": 40.9128, "lon": 38.3894, "zoom": 9},
    "Gümüşhane": {"lat": 40.4603, "lon": 39.5081, "zoom": 9},
    "Hakkari": {"lat": 37.5744, "lon": 43.7408, "zoom": 9},
    "Hatay": {"lat": 36.4018, "lon": 36.3498, "zoom": 9},
    "Iğdır": {"lat": 39.9167, "lon": 44.0333, "zoom": 9},
    "Isparta": {"lat": 37.7647, "lon": 30.5567, "zoom": 9},
    "İstanbul": {"lat": 41.0082, "lon": 28.9784, "zoom": 9},
    "İzmir": {"lat": 38.4237, "lon": 27.1428, "zoom": 9},
    "Kahramanmaraş": {"lat": 37.5858, "lon": 36.9371, "zoom": 9},
    "Karabük": {"lat": 41.2061, "lon": 32.6278, "zoom": 9},
    "Karaman": {"lat": 37.1811, "lon": 33.2150, "zoom": 9},
    "Kars": {"lat": 40.6083, "lon": 43.0972, "zoom": 9},
    "Kastamonu": {"lat": 41.3767, "lon": 33.7764, "zoom": 9},
    "Kayseri": {"lat": 38.7312, "lon": 35.4787, "zoom": 9},
    "Kilis": {"lat": 36.7167, "lon": 37.1167, "zoom": 9},
    "Kırıkkale": {"lat": 39.8467, "lon": 33.5153, "zoom": 9},
    "Kırklareli": {"lat": 41.7333, "lon": 27.2167, "zoom": 9},
    "Kırşehir": {"lat": 39.1458, "lon": 34.1639, "zoom": 9},
    "Kocaeli": {"lat": 40.8533, "lon": 29.8815, "zoom": 9},
    "Konya": {"lat": 37.8746, "lon": 32.4932, "zoom": 9},
    "Kütahya": {"lat": 39.4167, "lon": 29.9833, "zoom": 9},
    "Malatya": {"lat": 38.3552, "lon": 38.3095, "zoom": 9},
    "Manisa": {"lat": 38.6140, "lon": 27.4296, "zoom": 9},
    "Mardin": {"lat": 37.3122, "lon": 40.7350, "zoom": 9},
    "Mersin": {"lat": 36.8000, "lon": 34.6333, "zoom": 9},
    "Muğla": {"lat": 37.2153, "lon": 28.3636, "zoom": 9},
    "Muş": {"lat": 38.7333, "lon": 41.4833, "zoom": 9},
    "Nevşehir": {"lat": 38.6244, "lon": 34.7239, "zoom": 9},
    "Niğde": {"lat": 37.9667, "lon": 34.6833, "zoom": 9},
    "Ordu": {"lat": 40.9839, "lon": 37.8764, "zoom": 9},
    "Osmaniye": {"lat": 37.0742, "lon": 36.2478, "zoom": 9},
    "Rize": {"lat": 41.0208, "lon": 40.5219, "zoom": 9},
    "Sakarya": {"lat": 40.7569, "lon": 30.3781, "zoom": 9},
    "Samsun": {"lat": 41.2867, "lon": 36.3300, "zoom": 9},
    "Şanlıurfa": {"lat": 37.1674, "lon": 38.7955, "zoom": 9},
    "Siirt": {"lat": 37.9333, "lon": 41.9500, "zoom": 9},
    "Sinop": {"lat": 42.0269, "lon": 35.1506, "zoom": 9},
    "Şırnak": {"lat": 37.5167, "lon": 42.4500, "zoom": 9},
    "Sivas": {"lat": 39.7477, "lon": 37.0179, "zoom": 9},
    "Tekirdağ": {"lat": 40.9833, "lon": 27.5167, "zoom": 9},
    "Tokat": {"lat": 40.3139, "lon": 36.5542, "zoom": 9},
    "Trabzon": {"lat": 41.0015, "lon": 39.7178, "zoom": 9},
    "Tunceli": {"lat": 39.1083, "lon": 39.5472, "zoom": 9},
    "Uşak": {"lat": 38.6803, "lon": 29.4081, "zoom": 9},
    "Van": {"lat": 38.4891, "lon": 43.4089, "zoom": 9},
    "Yalova": {"lat": 40.6550, "lon": 29.2769, "zoom": 9},
    "Yozgat": {"lat": 39.8208, "lon": 34.8083, "zoom": 9},
    "Zonguldak": {"lat": 41.4564, "lon": 31.7986, "zoom": 9}
}

# Şehir seçici
selected_city = st.sidebar.selectbox(
    "Şehir Seçin:",
    options=list(cities.keys()),
    index=0,
    help="Haritanın merkezini seçtiğiniz şehre göre ayarlar"
)

# Seçilen şehrin koordinatlarını al
selected_location = cities[selected_city]

# Gerçek zamanlı hava durumu
st.sidebar.markdown("---")
st.sidebar.subheader("🌤️ Hava Durumu")
weather_api = WeatherAPI()
weather_data = weather_api.get_weather(
    selected_location["lat"], 
    selected_location["lon"],
    selected_city
)

if weather_data and weather_data.get('temperature') is not None:
    st.sidebar.metric("🌡️ Sıcaklık", f"{weather_data['temperature']:.1f}°C")
    if weather_data.get('humidity'):
        st.sidebar.metric("💧 Nem", f"%{weather_data['humidity']:.0f}")
    if weather_data.get('wind_speed'):
        st.sidebar.metric("💨 Rüzgar", f"{weather_data['wind_speed']:.1f} km/h")
    if weather_data.get('description'):
        st.sidebar.info(f"☁️ {weather_data['description']}")
else:
    st.sidebar.warning("⚠️ Hava durumu verisi yüklenemedi")

st.sidebar.markdown("---")

# Gerçek zamanlı güncelleme
st.sidebar.subheader("🔄 Gerçek Zamanlı Güncelleme")
auto_refresh = st.sidebar.checkbox("Otomatik Yenileme", value=True, help="Veriler otomatik olarak güncellenir")
refresh_interval = st.sidebar.slider("Yenileme Aralığı (saniye)", 10, 300, 60, help="Daha sık güncelleme için değeri azaltın")

# Manuel yenileme butonu
if st.sidebar.button("🔄 Şimdi Yenile", use_container_width=True):
    st.cache_data.clear()
    st.rerun()

st.sidebar.markdown("---")
st.sidebar.markdown("### 📡 Veri Durumu")
st.sidebar.info(f"Son güncelleme: {datetime.now().strftime('%H:%M:%S')}")
st.sidebar.info(f"📍 Seçili Konum: {selected_city}")

# Veri yükleme - Gerçek zamanlı için cache süresini kısalt
@st.cache_data(ttl=60)  # 1 dakika cache (gerçek zamanlı)
def load_all_data():
    loader = DataLoader()
    return loader.get_all_data()

# Ana içerik
tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs(["🗺️ Risk Haritası", "📈 Yayılma Tahmini", "🚒 Kaynak İhtiyacı", "⚠️ Uyarı Sistemi", "🎮 Yangın Simülasyonu", "📊 Yangın Tarihçesi"])

# Verileri yükle
with st.spinner("Veriler yükleniyor..."):
    all_data = load_all_data()

# Risk analizi - Tüm veri kaynaklarını dahil et (tarihsel veriler dahil)
analyzer = RiskAnalyzer()
risk_results = analyzer.analyze_risk(
    all_data['firms'], 
    all_data['prediction'],
    kaggle_data=all_data.get('kaggle'),
    ieee_data=all_data.get('ieee'),
    historical_data=all_data.get('historical')
)

# TAB 1: Risk Haritası - 3D Görselleştirme
with tab1:
    st.header(f"🗺️ 3D Yangın Risk Haritası - {selected_city}")
    st.markdown(f"**{selected_city} bölgesi - Gerçek zamanlı 3 boyutlu harita ile yüksek riskli bölgeler net bir şekilde gösterilmektedir.**")
    
    # Kontroller
    col_controls = st.columns([2, 1, 1, 1])
    with col_controls[0]:
        map_style = st.selectbox(
            "🗺️ Harita Stili:",
            ["Uydu Görüntüsü", "Açık Harita", "Koyu Harita", "Topografik"],
            index=0,
            help="NASA FIRMS benzeri uydu görüntüleri"
        )
    with col_controls[1]:
        view_3d = st.checkbox("3D Görünüm", value=True, help="3 boyutlu görünümü aç/kapat")
    with col_controls[2]:
        height_scale = st.slider("Yükseklik Ölçeği", 0.1, 5.0, 1.0, 0.1, help="Risk yüksekliği çarpanı")
    with col_controls[3]:
        point_size = st.slider("Nokta Boyutu", 3, 20, 8, help="İşaretleyici boyutu")
    
    st.markdown("---")
    
    # Harita oluştur - Plotly 3D
    col1, col2 = st.columns([2.5, 1])
    
    with col1:
        # Risk seviyelerine göre renkler
        color_map = {
            'Düşük': '#4CAF50',
            'Orta': '#FFC107',
            'Yüksek': '#FF9800',
            'Kritik': '#F44336'
        }
        
        # Mapbox tile seçimi
        # Uydu görüntüleri için Esri World Imagery kullanılacak (custom layer)
        use_custom_tiles = map_style == "Uydu Görüntüsü"
        
        mapbox_styles = {
            "Açık Harita": "open-street-map",
            "Koyu Harita": "carto-darkmatter",
            "Topografik": "stamen-terrain"
        }
        
        if map_style in mapbox_styles:
            mapbox_style = mapbox_styles[map_style]
        else:
            mapbox_style = "open-street-map"  # Varsayılan
        
        # Veri hazırlama
        if 'firms_risk' in risk_results and not risk_results['firms_risk'].empty:
            df_map = risk_results['firms_risk'].copy()
            
            # 3D için yükseklik hesapla (risk skoruna göre)
            if 'risk_score' in df_map.columns:
                df_map['height'] = df_map['risk_score'] * height_scale
            else:
                df_map['height'] = 10
            
            # Renk sütunu ekle
            df_map['color'] = df_map['risk_level'].map(color_map).fillna('#9E9E9E')
            
            # 3D Scatter Mapbox oluştur - NASA FIRMS benzeri
            fig = go.Figure()
            
            # Her risk seviyesi için ayrı trace - daha belirgin
            for risk_level in ['Düşük', 'Orta', 'Yüksek', 'Kritik']:
                df_level = df_map[df_map['risk_level'] == risk_level]
                if not df_level.empty:
                    # Risk seviyesine göre boyut
                    size_multiplier = {'Düşük': 0.8, 'Orta': 1.0, 'Yüksek': 1.5, 'Kritik': 2.0}
                    marker_size = point_size * size_multiplier.get(risk_level, 1.0)
                    
                    fig.add_trace(go.Scattermapbox(
                        lat=df_level['latitude'],
                        lon=df_level['longitude'],
                        mode='markers',
                        marker=dict(
                            size=marker_size,
                            color=color_map[risk_level],
                            opacity=0.85,
                            symbol='circle',
                            line=dict(width=2, color='white'),
                            sizemode='diameter',
                            sizeref=2.*max(df_level.get('risk_score', [50])) / (marker_size**2),
                            sizemin=4
                        ),
                        text=df_level.apply(
                            lambda row: f"<b>🔥 {risk_level} Risk</b><br>" +
                                       f"Risk Skoru: {row.get('risk_score', 0):.1f}/100<br>" +
                                       f"Enlem: {row['latitude']:.4f}°<br>" +
                                       f"Boylam: {row['longitude']:.4f}°<br>" +
                                       f"Tarih: {row.get('acq_date', 'Bilinmiyor')}<br>" +
                                       f"Parlaklık: {row.get('brightness', 'N/A')}",
                            axis=1
                        ),
                        hovertemplate='%{text}<extra></extra>',
                        name=f"🔥 {risk_level} Risk",
                        showlegend=True
                    ))
            
            # Seçilen şehri haritada işaretle
            fig.add_trace(go.Scattermapbox(
                lat=[selected_location["lat"]],
                lon=[selected_location["lon"]],
                mode='markers',
                marker=dict(
                    size=15,
                    color='#2196F3',
                    opacity=0.8,
                    symbol='star',
                    line=dict(width=2, color='white')
                ),
                text=[f"📍 {selected_city}"],
                hovertemplate=f'<b>📍 {selected_city}</b><br>Enlem: {selected_location["lat"]:.4f}°<br>Boylam: {selected_location["lon"]:.4f}°<extra></extra>',
                name="📍 Seçili Konum",
                showlegend=True
            ))
            
            # 2. IEEE FLAME-3 termal görüntü verilerini ekle
            if 'ieee_risk' in risk_results and not risk_results['ieee_risk'].empty:
                df_ieee = risk_results['ieee_risk'].copy()
                fig.add_trace(go.Scattermapbox(
                    lat=df_ieee['latitude'],
                    lon=df_ieee['longitude'],
                    mode='markers',
                    marker=dict(
                        size=point_size * 1.2,
                        color='#9C27B0',  # Mor renk - IEEE verisi için
                        opacity=0.85,
                        symbol='square',
                        line=dict(width=2, color='white')
                    ),
                    text=df_ieee.apply(
                        lambda row: f"<b>📡 IEEE FLAME-3 Termal Görüntü</b><br>" +
                                   f"Risk Seviyesi: {row.get('risk_level', 'Orta')}<br>" +
                                   f"Risk Skoru: {row.get('risk_score', 0):.1f}/100<br>" +
                                   f"Konum: {row['latitude']:.4f}°, {row['longitude']:.4f}°<br>" +
                                   f"<small>Termal İHA Görüntüsü</small>",
                        axis=1
                    ),
                    hovertemplate='%{text}<extra></extra>',
                    name="📡 IEEE FLAME-3",
                    showlegend=True
                ))
            
            # Yüksek riskli bölgeleri özel olarak vurgula
            if 'high_risk_areas' in risk_results and not risk_results['high_risk_areas'].empty:
                df_high = risk_results['high_risk_areas'].copy()
                hover_text = df_high.apply(
                    lambda row: f"<b>⚠️ YÜKSEK RİSK BÖLGESİ</b><br>" +
                               f"Risk Seviyesi: {row.get('risk_level', 'Yüksek')}<br>" +
                               f"Ortalama Skor: {row.get('risk_score', 0):.1f}/100<br>" +
                               f"Konum: {row['latitude']:.4f}°, {row['longitude']:.4f}°<br>" +
                               f"<span style='color:red; font-weight:bold;'>ACİL MÜDAHALE GEREKLİ!</span>",
                    axis=1
                )
                fig.add_trace(go.Scattermapbox(
                    lat=df_high['latitude'],
                    lon=df_high['longitude'],
                    mode='markers',
                    marker=dict(
                        size=point_size * 3,
                        color='#FF0000',
                        opacity=0.95,
                        symbol='triangle',
                        line=dict(width=4, color='white'),
                        sizemin=10
                    ),
                    text=hover_text,
                    hovertemplate='%{text}<extra></extra>',
                    name="⚠️ Yüksek Risk Bölgesi",
                    showlegend=True
                ))
            
            # Layout ayarları - NASA FIRMS benzeri 3D görünüm
            # Seçilen şehre göre merkez ayarla
            mapbox_config = dict(
                center=dict(lat=selected_location["lat"], lon=selected_location["lon"]),
                zoom=selected_location["zoom"],
                bearing=0,
                pitch=50 if view_3d else 0,  # 3D açı - NASA FIRMS benzeri
            )
            
            # Uydu görüntüleri için custom tile layer
            if use_custom_tiles:
                mapbox_config['style'] = "white-bg"  # Arka plan
                mapbox_config['layers'] = [{
                    'below': 'traces',
                    'sourcetype': 'raster',
                    'source': [
                        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                    ],
                    'opacity': 1.0
                }]
            else:
                mapbox_config['style'] = mapbox_style
                mapbox_config['layers'] = []
            
            fig.update_layout(
                mapbox=mapbox_config,
                height=750,
                margin=dict(l=0, r=0, t=0, b=0),
                legend=dict(
                    yanchor="top",
                    y=0.99,
                    xanchor="left",
                    x=0.01,
                    bgcolor="rgba(255,255,255,0.95)",
                    bordercolor="black",
                    borderwidth=2,
                    font=dict(size=12),
                    itemsizing='constant'
                ),
                hovermode='closest',
                paper_bgcolor='white',
                plot_bgcolor='white'
            )
            # 2D görünüm için aynı fig'ü kullan ama pitch=0
            if not view_3d:
                fig.update_layout(
                    mapbox=dict(pitch=0)  # 2D görünüm
                )
            
            # Haritayı göster
            st.plotly_chart(fig, use_container_width=True, use_container_height=True)
            
            # Veri kaynakları bilgisi
            data_sources = []
            if 'firms_risk' in risk_results and not risk_results['firms_risk'].empty:
                data_sources.append(f"NASA FIRMS: {len(risk_results['firms_risk'])}")
            if 'prediction_risk' in risk_results and not risk_results['prediction_risk'].empty:
                data_sources.append(f"Kaggle Tahmin: {len(risk_results['prediction_risk'])}")
            if 'ieee_risk' in risk_results and not risk_results['ieee_risk'].empty:
                data_sources.append(f"IEEE FLAME-3: {len(risk_results['ieee_risk'])}")
            
            # Son güncelleme zamanı
            last_update = datetime.now().strftime("%H:%M:%S")
            sources_text = " | ".join(data_sources) if data_sources else "Veri yükleniyor..."
            st.caption(f"🔄 Son güncelleme: {last_update} | Veriler her {refresh_interval} saniyede bir otomatik yenilenir | {sources_text} | Toplam {len(df_map)} nokta")
        else:
            st.warning("⚠️ Henüz harita verisi yok. Veriler yükleniyor...")
            # Boş harita göster - seçilen şehre göre
            fig = go.Figure()
            fig.update_layout(
                mapbox=dict(
                    style=mapbox_style,
                    center=dict(lat=selected_location["lat"], lon=selected_location["lon"]),
                    zoom=selected_location["zoom"]
                ),
                height=700,
                margin=dict(l=0, r=0, t=0, b=0)
            )
            st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        st.subheader("📊 Risk İstatistikleri")
        
        # Gerçek zamanlı veri göstergesi
        st.markdown("---")
        st.markdown("### 📈 Canlı Veriler")
        
        # Risk dağılımı
        if 'firms_risk' in risk_results and not risk_results['firms_risk'].empty and 'risk_level' in risk_results['firms_risk'].columns:
            risk_counts = risk_results['firms_risk']['risk_level'].value_counts()
            
            if len(risk_counts) > 0:
                # Pasta grafiği
                fig_pie = px.pie(
                    values=risk_counts.values,
                    names=risk_counts.index,
                    title="Risk Seviyesi Dağılımı",
                    color_discrete_map=color_map,
                    hole=0.4
                )
                fig_pie.update_traces(textposition='inside', textinfo='percent+label')
                fig_pie.update_layout(height=300, showlegend=True)
                st.plotly_chart(fig_pie, use_container_width=True)
            
            st.markdown("---")
            st.markdown("### 📉 Metrikler")
            
            # İstatistikler - daha görsel
            col_met1, col_met2 = st.columns(2)
            
            with col_met1:
                st.metric(
                    "🔥 Toplam Nokta", 
                    len(risk_results['firms_risk']),
                    delta=None
                )
                
                if 'risk_score' in risk_results['firms_risk'].columns:
                    avg_risk = risk_results['firms_risk']['risk_score'].mean()
                    delta_color = "normal" if avg_risk < 50 else "inverse"
                    st.metric(
                        "📊 Ortalama Risk", 
                        f"{avg_risk:.1f}",
                        delta=f"{'Yüksek' if avg_risk >= 50 else 'Normal'}"
                    )
            
            with col_met2:
                if 'high_risk_areas' in risk_results:
                    high_risk_count = len(risk_results['high_risk_areas']) if not risk_results['high_risk_areas'].empty else 0
                    st.metric(
                        "⚠️ Yüksek Risk", 
                        high_risk_count,
                        delta="Bölge" if high_risk_count > 0 else None
                    )
                else:
                    st.metric("⚠️ Yüksek Risk", 0)
                
                # Kritik risk sayısı
                if 'risk_level' in risk_results['firms_risk'].columns:
                    critical_count = len(risk_results['firms_risk'][risk_results['firms_risk']['risk_level'] == 'Kritik'])
                    st.metric(
                        "🚨 Kritik Risk", 
                        critical_count,
                        delta="Acil!" if critical_count > 0 else None,
                        delta_color="inverse"
                    )
            
            # Risk seviyesi dağılımı tablosu
            st.markdown("---")
            st.markdown("### 📋 Detaylı Dağılım")
            if len(risk_counts) > 0:
                risk_df = pd.DataFrame({
                    'Risk Seviyesi': risk_counts.index,
                    'Nokta Sayısı': risk_counts.values,
                    'Yüzde': (risk_counts.values / risk_counts.sum() * 100).round(1)
                })
                st.dataframe(risk_df, use_container_width=True, hide_index=True)
        else:
            st.info("📭 Henüz risk verisi yok. Veriler yükleniyor...")
            st.spinner("Veriler yükleniyor...")

# TAB 2: Yayılma Tahmini
with tab2:
    st.header("Yangın Yayılma Tahmini")
    
    # Yayılma tahmin modelini eğit
    predictor = SpreadPredictor()
    predictor.train_model(all_data['spread'])
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Mevcut Yangınlar")
        
        # Aktif yangınları göster
        if 'firms_risk' in risk_results and not risk_results['firms_risk'].empty and 'risk_score' in risk_results['firms_risk'].columns:
            active_fires = risk_results['firms_risk'][risk_results['firms_risk']['risk_score'] >= 50]
            
            if not active_fires.empty:
                for idx, fire in active_fires.head(5).iterrows():
                    with st.expander(f"🔥 Yangın #{idx+1} - {fire.get('risk_level', 'Yüksek')} Risk", expanded=True):
                        # Yangın anındaki bilgiler
                        st.markdown("### 📍 Yangın Anındaki Durum")
                        
                        col_info1, col_info2 = st.columns(2)
                        with col_info1:
                            st.write(f"**🌍 Konum:**")
                            st.write(f"Enlem: {fire['latitude']:.4f}°")
                            st.write(f"Boylam: {fire['longitude']:.4f}°")
                            
                            # Tarih bilgisi
                            if 'acq_date' in fire:
                                st.write(f"**📅 Tarih:** {fire['acq_date']}")
                            if 'acq_time' in fire:
                                st.write(f"**⏰ Saat:** {fire['acq_time']}")
                        
                        with col_info2:
                            st.write(f"**📊 Risk Bilgileri:**")
                            st.write(f"Risk Skoru: **{fire.get('risk_score', 0):.1f}/100**")
                            st.write(f"Risk Seviyesi: **{fire.get('risk_level', 'Yüksek')}**")
                            
                            # FRP bilgisi
                            if 'frp' in fire:
                                st.write(f"**🔥 FRP:** {fire['frp']:.2f} MW")
                            if 'confidence' in fire:
                                st.write(f"**✓ Güven:** %{fire['confidence']:.0f}")
                        
                        # Yayılma tahmini
                        weather_data = all_data['prediction'] if not all_data['prediction'].empty else None
                        spread_pred = predictor.predict_spread(pd.DataFrame([fire]), weather_data)
                        
                        st.markdown("---")
                        st.markdown("### 🔥 Yangın Anındaki Yanan Alan")
                        
                        col_area1, col_area2, col_area3 = st.columns(3)
                        with col_area1:
                            st.metric("Yanan Alan (km²)", f"{spread_pred.get('current_area_km2', 0.1):.3f}")
                        with col_area2:
                            st.metric("Yanan Alan (hektar)", f"{spread_pred.get('current_area_ha', 10):.1f}")
                        with col_area3:
                            st.metric("Yanan Alan (m²)", f"{spread_pred.get('current_area_m2', 100000):,.0f}")
                        
                        st.markdown("---")
                        st.markdown("### 📈 Yayılma Tahmini")
                        
                        col_spread1, col_spread2 = st.columns(2)
                        with col_spread1:
                            st.metric("⚡ Yayılma Hızı", f"{spread_pred['speed_kmh']:.2f} km/saat")
                            st.metric("🧭 Yayılma Yönü", spread_pred['direction_name'])
                            st.metric("📐 Yön (Derece)", f"{spread_pred['direction_degrees']:.1f}°")
                        
                        with col_spread2:
                            # 1 saatlik yayılma
                            spread_1h = predictor.calculate_spread_area(
                                spread_pred.get('current_area_km2', 0.1), 
                                spread_pred['speed_kmh'], 
                                1
                            )
                            st.metric("⏱️ 1 Saat Sonra", f"{spread_1h['total_area_km2']:.3f} km²")
                            
                            # 6 saatlik yayılma
                            spread_6h = predictor.calculate_spread_area(
                                spread_pred.get('current_area_km2', 0.1), 
                                spread_pred['speed_kmh'], 
                                6
                            )
                            st.metric("⏱️ 6 Saat Sonra", f"{spread_6h['total_area_km2']:.3f} km²")
                            
                            # 24 saatlik yayılma
                            spread_24h = predictor.calculate_spread_area(
                                spread_pred.get('current_area_km2', 0.1), 
                                spread_pred['speed_kmh'], 
                                24
                            )
                            st.metric("⏱️ 24 Saat Sonra", f"{spread_24h['total_area_km2']:.3f} km²")
                        
                        # Yayılma grafiği
                        st.markdown("---")
                        st.markdown("### 📊 Yayılma Zaman Çizelgesi")
                        
                        hours = [0, 1, 3, 6, 12, 24]
                        areas = []
                        current = spread_pred.get('current_area_km2', 0.1)
                        
                        for h in hours:
                            if h == 0:
                                areas.append(current)
                            else:
                                spread = predictor.calculate_spread_area(current, spread_pred['speed_kmh'], h)
                                areas.append(spread['total_area_km2'])
                        
                        fig_timeline = go.Figure()
                        fig_timeline.add_trace(go.Scatter(
                            x=hours,
                            y=areas,
                            mode='lines+markers',
                            name='Yanan Alan',
                            line=dict(color='red', width=3),
                            marker=dict(size=10, color='red'),
                            fill='tozeroy',
                            fillcolor='rgba(255,0,0,0.2)'
                        ))
                        fig_timeline.update_layout(
                            title="Yangın Yayılma Zaman Çizelgesi",
                            xaxis_title="Süre (saat)",
                            yaxis_title="Yanan Alan (km²)",
                            height=300,
                            hovermode='x unified'
                        )
                        st.plotly_chart(fig_timeline, use_container_width=True)
            else:
                st.info("Şu anda aktif yangın tespit edilmedi.")
    
    with col2:
        st.subheader("Yayılma Görselleştirme")
        
        # Örnek yayılma simülasyonu
        if 'firms_risk' in risk_results and not risk_results['firms_risk'].empty:
            sample_fire = risk_results['firms_risk'].iloc[0]
            weather_data = all_data['prediction'] if not all_data['prediction'].empty else None
            spread_pred = predictor.predict_spread(pd.DataFrame([sample_fire]), weather_data)
            
            # Yayılma yönü görselleştirme
            fig = go.Figure()
            
            # Merkez nokta
            fig.add_trace(go.Scatterpolar(
                r=[0, spread_pred['speed_kmh']],
                theta=[0, spread_pred['direction_degrees']],
                mode='lines+markers',
                name='Yayılma Yönü',
                line=dict(color='red', width=3),
                marker=dict(size=10)
            ))
            
            fig.update_layout(
                polar=dict(
                    radialaxis=dict(range=[0, 20], title="Hız (km/h)"),
                    angularaxis=dict(
                        tickmode='array',
                        tickvals=[0, 45, 90, 135, 180, 225, 270, 315],
                        ticktext=['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB']
                    )
                ),
                title="Yayılma Yönü ve Hızı",
                height=400
            )
            
            st.plotly_chart(fig, use_container_width=True)

# TAB 3: Kaynak İhtiyacı
with tab3:
    st.header("Söndürme Kaynak İhtiyacı")
    
    calculator = ResourceCalculator()
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Yangın Bilgileri")
        
        # Kullanıcı girişi
        fire_area = st.number_input("Yangın Alanı (km²)", min_value=0.1, max_value=1000.0, value=5.0, step=0.1)
        fire_intensity = st.selectbox("Yangın Yoğunluğu", ['Düşük', 'Orta', 'Yüksek', 'Kritik'], index=2)
        terrain_type = st.selectbox("Arazi Tipi", ['Orman', 'Çalılık', 'Otlak', 'Tarım'], index=0)
        
        if st.button("Kaynak İhtiyacını Hesapla"):
            resources = calculator.calculate_resources(fire_area, fire_intensity, terrain_type)
            
            st.session_state['resources'] = resources
    
    with col2:
        st.subheader("Gerekli Kaynaklar")
        
        if 'resources' in st.session_state:
            res = st.session_state['resources']
            
            # Metrikler
            col_a, col_b = st.columns(2)
            with col_a:
                st.metric("İtfaiye Aracı", f"{res['trucks_needed']} adet")
                st.metric("Ekip", f"{res['teams_needed']} adet")
                st.metric("Helikopter", f"{res['helicopters_needed']} adet")
            
            with col_b:
                st.metric("Tahmini Süre", f"{res['estimated_hours']} saat")
                st.metric("Su İhtiyacı", f"{res['water_needed_liters']:,} litre")
                st.metric("Tahmini Maliyet", f"{res['estimated_cost_tl']:,} TL")
            
            # Öneriler
            st.subheader("Öneriler")
            recommendations = calculator.get_resource_recommendations(res)
            for rec in recommendations:
                st.info(rec)
            
            # Görselleştirme
            fig = go.Figure(data=[
                go.Bar(name='İhtiyaç', x=['Araç', 'Ekip', 'Helikopter'], 
                      y=[res['trucks_needed'], res['teams_needed'], res['helicopters_needed']],
                      marker_color=['#FF6B6B', '#4ECDC4', '#45B7D1'])
            ])
            fig.update_layout(title="Kaynak İhtiyacı", yaxis_title="Adet", height=300)
            st.plotly_chart(fig, use_container_width=True)

# TAB 4: Uyarı Sistemi
with tab4:
    st.header("Uyarı Sistemi")
    
    alert_system = AlertSystem()
    
    # SMS Notifier oluştur
    sms_notifier = create_sms_notifier(phone_number=phone_number)
    
    # En yüksek riskli yangını bul
    if 'firms_risk' in risk_results and not risk_results['firms_risk'].empty and 'risk_score' in risk_results['firms_risk'].columns:
        max_risk_fire = risk_results['firms_risk'].loc[risk_results['firms_risk']['risk_score'].idxmax()]
        max_risk_level = max_risk_fire.get('risk_level', 'Orta')
        max_risk_score = max_risk_fire.get('risk_score', 0)
        
        # Uyarı mesajı
        if max_risk_level == 'Kritik':
            message = "KRİTİK YANGIN RİSKİ TESPİT EDİLDİ!"
        elif max_risk_level == 'Yüksek':
            message = "Yüksek Yangın Riski Tespit Edildi"
        elif max_risk_level == 'Orta':
            message = "Orta Seviye Yangın Riski"
        else:
            message = "Düşük Seviye Yangın Riski"
        
        # SMS gönder (eğer aktifse ve yüksek/kritik risk varsa)
        if sms_enabled and max_risk_level in ['Yüksek', 'Kritik']:
            location_str = f"{max_risk_fire['latitude']:.4f}°, {max_risk_fire['longitude']:.4f}°"
            sms_sent = sms_notifier.send_fire_alert_sms(
                risk_level=max_risk_level,
                location=location_str,
                risk_score=max_risk_score,
                latitude=max_risk_fire['latitude'],
                longitude=max_risk_fire['longitude']
            )
            
            if sms_sent:
                st.success(f"✅ SMS bildirimi gönderildi: {phone_number}")
            else:
                st.info("ℹ️ SMS gönderilemedi. Twilio yapılandırmasını kontrol edin. (SMS_KURULUM.md dosyasına bakın)")
        
        # Uyarı göster
        alert_html = alert_system.create_alert_banner(max_risk_level, message)
        st.markdown(alert_html, unsafe_allow_html=True)
        
        # Detaylar
        st.subheader("Uyarı Detayları")
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Risk Seviyesi", max_risk_level)
        with col2:
            st.metric("Risk Skoru", f"{max_risk_score:.1f}")
        with col3:
            st.metric("Konum", f"{max_risk_fire['latitude']:.2f}, {max_risk_fire['longitude']:.2f}")
        
        # Tüm risk seviyeleri
        st.subheader("Tüm Risk Seviyeleri")
        
        risk_levels = ['Düşük', 'Orta', 'Yüksek', 'Kritik']
        for level in risk_levels:
            color = alert_system.get_alert_color(level)
            if 'risk_level' in risk_results['firms_risk'].columns:
                count = len(risk_results['firms_risk'][risk_results['firms_risk']['risk_level'] == level])
            else:
                count = 0
            
            st.markdown(f"""
            <div style="
                background-color: {color};
                color: white;
                padding: 10px;
                border-radius: 5px;
                margin: 5px 0;
            ">
                <strong>{level} Risk:</strong> {count} nokta
            </div>
            """, unsafe_allow_html=True)
    else:
        st.info("Şu anda risk tespit edilmedi.")

# Footer
st.markdown("---")
st.markdown("""
<div style="background-color: #f0f2f6; padding: 15px; border-radius: 10px; margin-top: 20px;">
    <h4>📌 Önemli Notlar</h4>
    <p><strong>⚠️ Bu sistem eğitim amaçlıdır!</strong> Gerçek yangın durumunda hemen <strong>112</strong>'yi arayın!</p>
    <p><strong>🛰️ Uydu Görüntüleri:</strong> Esri World Imagery - Gerçek zamanlı uydu fotoğrafları</p>
    <p><strong>📡 Veri Kaynakları:</strong> NASA FIRMS, Kaggle, IEEE</p>
    <p><strong>🔄 Gerçek Zamanlı:</strong> Veriler otomatik olarak güncellenir (ayarlanabilir)</p>
</div>
""", unsafe_allow_html=True)

# Otomatik yenileme - gerçek zamanlı
if auto_refresh:
    # Streamlit'in otomatik yenileme için meta refresh kullan
    refresh_meta = f'<meta http-equiv="refresh" content="{refresh_interval}">'
    st.markdown(refresh_meta, unsafe_allow_html=True)
    
    # Geri sayım göstergesi
    if 'last_refresh' not in st.session_state:
        st.session_state.last_refresh = datetime.now()
    
    elapsed = (datetime.now() - st.session_state.last_refresh).seconds
    remaining = max(0, refresh_interval - elapsed)
    
    if remaining > 0:
        progress = 1 - (remaining / refresh_interval)
        st.sidebar.progress(progress)
        st.sidebar.caption(f"⏱️ {remaining} saniye sonra otomatik yenilenecek")
    
    # Cache'i temizle (her yenilemede yeni veri çekmek için)
    if elapsed >= refresh_interval:
        st.cache_data.clear()
        st.session_state.last_refresh = datetime.now()

# TAB 5: Yangın Simülasyonu
with tab5:
    st.header("🎮 Yangın Simülasyonu - Örnek Senaryo")
    st.markdown("Bu simülasyon, sistemin yangın anında nasıl çalıştığını gösterir.")
    
    # Simulation controls
    col_control1, col_control2, col_control3 = st.columns(3)
    
    with col_control1:
        start_sim = st.button("▶️ Simülasyonu Başlat", use_container_width=True, type="primary")
    with col_control2:
        pause_sim = st.button("⏸️ Duraklat / Devam Et", use_container_width=True)
    with col_control3:
        reset_sim = st.button("🔄 Sıfırla", use_container_width=True)
    
    sim_speed = st.slider("Simülasyon Hızı", 1, 5, 2, help="1x = Gerçek zamanlı, 5x = 5 kat hızlı")
    
    # Initialize simulation state
    if 'sim_running' not in st.session_state:
        st.session_state.sim_running = False
    if 'sim_paused' not in st.session_state:
        st.session_state.sim_paused = False
    if 'sim_time' not in st.session_state:
        st.session_state.sim_time = 0
    if 'sim_area' not in st.session_state:
        st.session_state.sim_area = 0.01
    if 'sim_speed' not in st.session_state:
        st.session_state.sim_speed = 2.5
    if 'sim_direction' not in st.session_state:
        st.session_state.sim_direction = 135
    if 'sim_alerts' not in st.session_state:
        st.session_state.sim_alerts = []
    
    # Simulation scenario
    st.markdown("---")
    st.markdown("### 📋 Senaryo: Antalya - Manavgat Orman Yangını")
    col_scen1, col_scen2 = st.columns(2)
    with col_scen1:
        st.info("**Başlangıç:** Küçük bir çalı yangını\n\n**Konum:** 36.8°K, 31.4°D\n\n**Tarih:** " + datetime.now().strftime("%d.%m.%Y"))
    with col_scen2:
        st.info("**Hava Durumu:** Sıcak, kuru, rüzgarlı\n\n**Rüzgar:** 15 km/h, Güneydoğu\n\n**Sıcaklık:** 35°C")
    
    # Simulation stats
    st.markdown("---")
    st.markdown("### 📊 Yangın Durumu")
    
    col_stat1, col_stat2, col_stat3, col_stat4 = st.columns(4)
    
    with col_stat1:
        st.metric("🔥 Yanan Alan", f"{st.session_state.sim_area:.3f} km²", 
                 delta=f"{(st.session_state.sim_area * 100):.1f} hektar")
        area_progress = min((st.session_state.sim_area / 10) * 100, 100)
        st.progress(area_progress / 100)
    
    with col_stat2:
        st.metric("⚡ Yayılma Hızı", f"{st.session_state.sim_speed:.1f} km/h")
        speed_progress = (st.session_state.sim_speed / 20) * 100
        st.progress(speed_progress / 100)
    
    with col_stat3:
        directions = ['Kuzey', 'Kuzeydoğu', 'Doğu', 'Güneydoğu', 'Güney', 'Güneybatı', 'Batı', 'Kuzeybatı']
        dir_index = int((st.session_state.sim_direction + 22.5) / 45) % 8
        st.metric("🧭 Yayılma Yönü", directions[dir_index], 
                 delta=f"{st.session_state.sim_direction:.0f}°")
    
    with col_stat4:
        hours = st.session_state.sim_time // 60
        minutes = st.session_state.sim_time % 60
        st.metric("⏱️ Geçen Süre", f"{hours}:{minutes:02d}")
        time_progress = min((st.session_state.sim_time / 120) * 100, 100)
        st.progress(time_progress / 100)
    
    # Update simulation
    if start_sim:
        st.session_state.sim_running = True
        st.session_state.sim_paused = False
        st.session_state.sim_alerts.append({
            'time': datetime.now().strftime("%H:%M:%S"),
            'type': 'info',
            'message': '🔥 Yangın tespit edildi! Simülasyon başlatıldı.'
        })
        st.rerun()
    
    if pause_sim and st.session_state.sim_running:
        st.session_state.sim_paused = not st.session_state.sim_paused
        st.rerun()
    
    if reset_sim:
        st.session_state.sim_running = False
        st.session_state.sim_paused = False
        st.session_state.sim_time = 0
        st.session_state.sim_area = 0.01
        st.session_state.sim_speed = 2.5
        st.session_state.sim_alerts = []
        if 'sim_chart_data' in st.session_state:
            st.session_state.sim_chart_data = {'time': [], 'area': []}
        st.rerun()
    
    # Auto-update if running
    if st.session_state.sim_running and not st.session_state.sim_paused:
        # Update simulation
        st.session_state.sim_time += 1
        
        # Calculate area growth
        radius_km = st.session_state.sim_speed * (st.session_state.sim_time / 60)
        st.session_state.sim_area = np.pi * (radius_km ** 2) + 0.01
        
        # Increase speed
        st.session_state.sim_speed = min(2.5 + (15 * 0.1) + ((35 - 25) * 0.1), 20)
        
        # Add alerts
        if st.session_state.sim_time == 5:
            st.session_state.sim_alerts.append({
                'time': datetime.now().strftime("%H:%M:%S"),
                'type': 'warning',
                'message': f'⚠️ Yangın hızla büyüyor! Yayılma hızı: {st.session_state.sim_speed:.1f} km/h'
            })
        if st.session_state.sim_time == 15:
            st.session_state.sim_alerts.append({
                'time': datetime.now().strftime("%H:%M:%S"),
                'type': 'warning',
                'message': '⚠️ Yangın alanı 1 km²\'yi aştı! Acil müdahale gerekli.'
            })
        if st.session_state.sim_time == 30:
            st.session_state.sim_alerts.append({
                'time': datetime.now().strftime("%H:%M:%S"),
                'type': 'danger',
                'message': '🚨 KRİTİK: Yangın kontrol altına alınamıyor! Evakuasyon gerekebilir.'
            })
        
        # Initialize chart data if needed
        if 'sim_chart_data' not in st.session_state:
            st.session_state.sim_chart_data = {'time': [], 'area': []}
        
        # Update chart data
        st.session_state.sim_chart_data['time'].append(st.session_state.sim_time)
        st.session_state.sim_chart_data['area'].append(st.session_state.sim_area)
        
        # Keep only last 60 points
        if len(st.session_state.sim_chart_data['time']) > 60:
            st.session_state.sim_chart_data['time'].pop(0)
            st.session_state.sim_chart_data['area'].pop(0)
        
        # Auto-refresh
        time.sleep(1.0 / sim_speed)
        st.rerun()
    
    # Display chart
    st.markdown("---")
    st.markdown("### 📈 Yangın Gelişimi")
    
    if 'sim_chart_data' in st.session_state and len(st.session_state.sim_chart_data.get('time', [])) > 0:
        fig_sim = go.Figure()
        fig_sim.add_trace(go.Scatter(
            x=st.session_state.sim_chart_data['time'],
            y=st.session_state.sim_chart_data['area'],
            mode='lines+markers',
            name='Yanan Alan',
            line=dict(color='red', width=3),
            marker=dict(size=8, color='red'),
            fill='tozeroy',
            fillcolor='rgba(255,0,0,0.2)'
        ))
        fig_sim.update_layout(
            title="Yangın Yayılma Zaman Çizelgesi",
            xaxis_title="Zaman (dakika)",
            yaxis_title="Yanan Alan (km²)",
            height=400,
            hovermode='x unified'
        )
        st.plotly_chart(fig_sim, use_container_width=True)
    else:
        st.info("Simülasyonu başlattığınızda grafik burada görünecek.")
    
    # Alerts
    st.markdown("---")
    st.markdown("### ⚠️ Uyarılar ve Bildirimler")
    
    if st.session_state.sim_alerts:
        for alert in reversed(st.session_state.sim_alerts[-10:]):  # Show last 10
            if alert['type'] == 'info':
                st.info(f"**{alert['time']}** - {alert['message']}")
            elif alert['type'] == 'warning':
                st.warning(f"**{alert['time']}** - {alert['message']}")
            elif alert['type'] == 'danger':
                st.error(f"**{alert['time']}** - {alert['message']}")
    else:
        st.info("Henüz uyarı yok. Simülasyonu başlatın.")
    
    # Simulation map
    st.markdown("---")
    st.markdown("### 🗺️ Yangın Haritası")
    
    fire_lat = 36.8
    fire_lon = 31.4
    
    # Calculate fire radius
    radius_km = np.sqrt(st.session_state.sim_area / np.pi)
    radius_deg = radius_km / 111
    
    # Create circle points
    circle_points = []
    for i in range(0, 361, 10):
        rad = np.radians(i)
        circle_points.append({
            'lat': fire_lat + radius_deg * np.cos(rad),
            'lon': fire_lon + radius_deg * np.sin(rad)
        })
    
    fig_sim_map = go.Figure()
    
    # Fire center
    fig_sim_map.add_trace(go.Scattermapbox(
        lat=[fire_lat],
        lon=[fire_lon],
        mode='markers',
        marker=dict(size=20, color='red', symbol='fire'),
        text=['Yangın Merkezi'],
        name='Yangın Merkezi'
    ))
    
    # Fire area
    if len(circle_points) > 0:
        fig_sim_map.add_trace(go.Scattermapbox(
            lat=[p['lat'] for p in circle_points],
            lon=[p['lon'] for p in circle_points],
            mode='lines',
            line=dict(color='red', width=3),
            fill='toself',
            fillcolor='rgba(255,0,0,0.3)',
            text=[f'Yanan Alan: {st.session_state.sim_area:.3f} km²'],
            name='Yanan Alan'
        ))
    
    fig_sim_map.update_layout(
        mapbox=dict(
            style='open-street-map',
            center=dict(lat=fire_lat, lon=fire_lon),
            zoom=11
        ),
        height=500,
        margin=dict(l=0, r=0, t=0, b=0)
    )
    
    st.plotly_chart(fig_sim_map, use_container_width=True)

# TAB 6: Yangın Tarihçesi
with tab6:
    st.header("📊 Şehirlere Göre Yangın Tarihçesi")
    st.markdown("Türkiye'deki şehirlerin yıllara göre yangın geçmişi ve yanan alanlar")
    
    # Şehir seçimi
    historical_data = all_data.get('historical', pd.DataFrame())
    
    if not historical_data.empty:
        # Şehir listesi
        cities_list = sorted(historical_data['city'].unique().tolist())
        selected_hist_city = st.selectbox("Şehir Seçin:", cities_list, key="hist_city_select")
        
        # Seçili şehir için verileri filtrele
        city_data = historical_data[historical_data['city'] == selected_hist_city].copy()
        
        if not city_data.empty:
            # İstatistikler
            col_stat1, col_stat2, col_stat3, col_stat4 = st.columns(4)
            
            with col_stat1:
                total_fires = len(city_data)
                st.metric("🔥 Toplam Yangın", total_fires)
            
            with col_stat2:
                total_area = city_data['area_km2'].sum()
                st.metric("📏 Toplam Yanan Alan", f"{total_area:.2f} km²", 
                         delta=f"{total_area*100:.0f} hektar")
            
            with col_stat3:
                avg_area = city_data['area_km2'].mean()
                st.metric("📊 Ortalama Alan", f"{avg_area:.2f} km²")
            
            with col_stat4:
                max_year = city_data['year'].max()
                min_year = city_data['year'].min()
                st.metric("📅 Yıl Aralığı", f"{min_year}-{max_year}")
            
            st.markdown("---")
            
            # Yıllara göre yangın sayısı ve alan grafiği
            st.subheader("📈 Yıllara Göre Yangın İstatistikleri")
            
            yearly_stats = city_data.groupby('year').agg({
                'area_km2': ['sum', 'mean', 'count']
            }).reset_index()
            yearly_stats.columns = ['year', 'total_area', 'avg_area', 'fire_count']
            
            col_chart1, col_chart2 = st.columns(2)
            
            with col_chart1:
                fig_yearly_count = go.Figure()
                fig_yearly_count.add_trace(go.Bar(
                    x=yearly_stats['year'],
                    y=yearly_stats['fire_count'],
                    name='Yangın Sayısı',
                    marker_color='#ff6b6b'
                ))
                fig_yearly_count.update_layout(
                    title="Yıllara Göre Yangın Sayısı",
                    xaxis_title="Yıl",
                    yaxis_title="Yangın Sayısı",
                    height=400
                )
                st.plotly_chart(fig_yearly_count, use_container_width=True)
            
            with col_chart2:
                fig_yearly_area = go.Figure()
                fig_yearly_area.add_trace(go.Bar(
                    x=yearly_stats['year'],
                    y=yearly_stats['total_area'],
                    name='Toplam Yanan Alan',
                    marker_color='#ff9800'
                ))
                fig_yearly_area.update_layout(
                    title="Yıllara Göre Toplam Yanan Alan",
                    xaxis_title="Yıl",
                    yaxis_title="Alan (km²)",
                    height=400
                )
                st.plotly_chart(fig_yearly_area, use_container_width=True)
            
            # Aylara göre dağılım
            st.markdown("---")
            st.subheader("📅 Aylara Göre Yangın Dağılımı")
            
            monthly_stats = city_data.groupby('month').agg({
                'area_km2': 'sum',
                'fire_lat': 'count'
            }).reset_index()
            monthly_stats.columns = ['month', 'total_area', 'fire_count']
            month_names = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                          'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
            monthly_stats['month_name'] = monthly_stats['month'].apply(lambda x: month_names[x-1] if 1 <= x <= 12 else 'Bilinmiyor')
            
            fig_monthly = go.Figure()
            fig_monthly.add_trace(go.Bar(
                x=monthly_stats['month_name'],
                y=monthly_stats['fire_count'],
                name='Yangın Sayısı',
                marker_color='#f44336'
            ))
            fig_monthly.update_layout(
                title="Aylara Göre Yangın Sayısı",
                xaxis_title="Ay",
                yaxis_title="Yangın Sayısı",
                height=400
            )
            st.plotly_chart(fig_monthly, use_container_width=True)
            
            # Tarihsel yangınlar haritası
            st.markdown("---")
            st.subheader("🗺️ Tarihsel Yangınlar Haritası")
            
            # Şehir merkezi
            city_coords = city_data.iloc[0]
            city_lat = city_coords['city_lat']
            city_lon = city_coords['city_lon']
            
            fig_hist_map = go.Figure()
            
            # Her yangını farklı renkte göster (yıla göre)
            years = sorted(city_data['year'].unique())
            colors = px.colors.qualitative.Set3[:len(years)]
            year_color_map = dict(zip(years, colors))
            
            for year in years:
                year_fires = city_data[city_data['year'] == year]
                fig_hist_map.add_trace(go.Scattermapbox(
                    lat=year_fires['fire_lat'],
                    lon=year_fires['fire_lon'],
                    mode='markers',
                    marker=dict(
                        size=year_fires['area_km2'] * 5 + 10,  # Alan büyüklüğüne göre
                        color=year_color_map[year],
                        opacity=0.7,
                        line=dict(width=2, color='white')
                    ),
                    text=year_fires.apply(
                        lambda row: f"<b>{row['description']}</b><br>" +
                                   f"Yıl: {row['year']}<br>" +
                                   f"Alan: {row['area_km2']:.2f} km² ({row['area_hectare']:.0f} ha)<br>" +
                                   f"Süre: {row['duration_days']} gün<br>" +
                                   f"Şiddet: {row['severity']}",
                        axis=1
                    ),
                    hovertemplate='%{text}<extra></extra>',
                    name=f'{year} Yılı'
                ))
            
            # Şehir merkezi
            fig_hist_map.add_trace(go.Scattermapbox(
                lat=[city_lat],
                lon=[city_lon],
                mode='markers',
                marker=dict(
                    size=20,
                    color='blue',
                    symbol='star',
                    opacity=0.9
                ),
                text=[f"📍 {selected_hist_city} Merkez"],
                hovertemplate='%{text}<extra></extra>',
                name='Şehir Merkezi',
                showlegend=True
            ))
            
            fig_hist_map.update_layout(
                mapbox=dict(
                    style='open-street-map',
                    center=dict(lat=city_lat, lon=city_lon),
                    zoom=9
                ),
                height=600,
                margin=dict(l=0, r=0, t=0, b=0),
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
            )
            
            st.plotly_chart(fig_hist_map, use_container_width=True)
            
            # Detaylı tablo
            st.markdown("---")
            st.subheader("📋 Detaylı Yangın Listesi")
            
            # Sıralama seçenekleri
            col_sort1, col_sort2 = st.columns(2)
            with col_sort1:
                sort_by = st.selectbox("Sıralama:", ["Yıl (Azalan)", "Yıl (Artan)", "Alan (Büyükten Küçüğe)", "Alan (Küçükten Büyüğe)"])
            with col_sort2:
                show_years = st.multiselect("Yılları Filtrele:", sorted(city_data['year'].unique()), default=sorted(city_data['year'].unique()))
            
            # Filtrele ve sırala
            filtered_data = city_data[city_data['year'].isin(show_years)].copy()
            
            if sort_by == "Yıl (Azalan)":
                filtered_data = filtered_data.sort_values('year', ascending=False)
            elif sort_by == "Yıl (Artan)":
                filtered_data = filtered_data.sort_values('year', ascending=True)
            elif sort_by == "Alan (Büyükten Küçüğe)":
                filtered_data = filtered_data.sort_values('area_km2', ascending=False)
            else:
                filtered_data = filtered_data.sort_values('area_km2', ascending=True)
            
            # Tablo gösterimi
            display_cols = ['year', 'month', 'description', 'area_km2', 'area_hectare', 'duration_days', 'severity']
            display_data = filtered_data[display_cols].copy()
            display_data.columns = ['Yıl', 'Ay', 'Açıklama', 'Alan (km²)', 'Alan (hektar)', 'Süre (gün)', 'Şiddet']
            display_data['Ay'] = display_data['Ay'].apply(lambda x: month_names[x-1] if 1 <= x <= 12 else 'Bilinmiyor')
            
            st.dataframe(
                display_data,
                use_container_width=True,
                hide_index=True
            )
            
            # İndirme butonu
            csv = filtered_data.to_csv(index=False).encode('utf-8-sig')
            st.download_button(
                label="📥 Verileri CSV Olarak İndir",
                data=csv,
                file_name=f"{selected_hist_city}_yangin_tarihcesi.csv",
                mime="text/csv"
            )
        else:
            st.info(f"{selected_hist_city} için tarihsel yangın verisi bulunamadı.")
    else:
        st.warning("Tarihsel yangın verisi yüklenemedi. Veriler oluşturuluyor...")
        st.info("İlk çalıştırmada örnek tarihsel veriler oluşturulacaktır.")

