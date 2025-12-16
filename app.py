"""
Yangın Risk Analizi Web Uygulaması
Flask backend + Frontend
"""
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import logging

# Logging ayarları (önce logger'ı tanımla)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# .env dosyasını yükle (local test için)
try:
    from dotenv import load_dotenv
    # .env dosyasını açıkça belirt
    import os
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(dotenv_path=env_path)
    logger.info(f"✅ .env dosyası yüklendi: {env_path}")
    # Kontrol et
    groq_key = os.getenv('GROQ_API_KEY', '').strip()
    logger.info(f"   GROQ_API_KEY: {'✅' if groq_key else '❌'} ({len(groq_key)} karakter)")
except ImportError:
    # python-dotenv yüklü değilse devam et (production'da environment variable kullanılacak)
    logger.warning("⚠️ python-dotenv yüklü değil, .env dosyası yüklenemedi")
except Exception as e:
    logger.warning(f"⚠️ .env dosyası yüklenirken hata: {e}")

from sms_notifier import create_sms_notifier

# Yangın Risk Tahmin Modeli
try:
    from fire_risk_model import fire_risk_predictor
    # Modeli yükle veya eğit
    if not fire_risk_predictor.load_model():
        logger.info("Model dosyası bulunamadı, yeni model eğitiliyor...")
        fire_risk_predictor.train()
    RISK_MODEL_AVAILABLE = True
    logger.info("✅ Yangın Risk Tahmin Modeli hazır")
except ImportError as e:
    logger.warning(f"⚠️ fire_risk_model modülü yüklenemedi: {e}")
    logger.warning("   Risk tahmin özelliği devre dışı. Yüklemek için: pip install scikit-learn pandas numpy joblib")
    RISK_MODEL_AVAILABLE = False
    fire_risk_predictor = None
except Exception as e:
    logger.error(f"❌ Risk model yükleme hatası: {e}", exc_info=True)
    RISK_MODEL_AVAILABLE = False
    fire_risk_predictor = None

# Groq AI için (OpenAI client kullanarak)
GROQ_AVAILABLE = False
try:
    from openai import OpenAI
    GROQ_AVAILABLE = True
    logger.info("✅ OpenAI paketi yüklü (Groq için kullanılacak)")
except ImportError:
    logger.warning("⚠️ openai paketi yüklü değil. Groq AI devre dışı. Yüklemek için: pip install openai")

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)  # Tüm origin'lerden isteklere izin ver

# SMS Notifier oluştur
sms_notifier = create_sms_notifier(phone_number="+905326982193")

# Groq AI yapılandırması (OpenAI client kullanarak)
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '').strip()

# Debug: API key kontrolü
logger.info(f"🔍 Groq API Key Kontrolü:")
logger.info(f"   GROQ_API_KEY var: {bool(GROQ_API_KEY)}")
if GROQ_API_KEY:
    logger.info(f"   GROQ_API_KEY uzunluk: {len(GROQ_API_KEY)}")
    logger.info(f"   GROQ_API_KEY başlangıcı: {GROQ_API_KEY[:20]}...")
else:
    logger.warning(f"   ⚠️ GROQ_API_KEY bulunamadı! .env dosyasını kontrol edin.")

# Groq AI client (OpenAI client kullanarak)
groq_client = None
groq_model = "llama-3.1-70b-versatile"  # veya "mixtral-8x7b-32768"

if GROQ_AVAILABLE and GROQ_API_KEY:
    try:
        logger.info(f"🔧 Groq AI yapılandırılıyor (OpenAI client ile)...")
        logger.info(f"   API Key uzunluğu: {len(GROQ_API_KEY)}")
        logger.info(f"   API Key başlangıcı: {GROQ_API_KEY[:20]}...")
        
        # OpenAI client kullanarak Groq'a bağlan
        groq_client = OpenAI(
            api_key=GROQ_API_KEY.strip(),  # Boşlukları temizle
            base_url="https://api.groq.com/openai/v1",
        )
        
        # Test çağrısı yap
        test_response = groq_client.chat.completions.create(
            model=groq_model,
            messages=[{"role": "user", "content": "Test"}],
            max_tokens=10
        )
        logger.info(f"✅ Groq AI yapılandırıldı (model: {groq_model})")
        logger.info(f"   🚀 Groq AI kullanılacak (ücretsiz ve hızlı)")
        logger.info(f"   Test yanıtı: {test_response.choices[0].message.content[:30]}...")
    except Exception as e:
        logger.error(f"❌ Groq AI yapılandırma hatası: {e}")
        logger.error(f"   Hata tipi: {type(e).__name__}")
        logger.error(f"   Detaylı hata:", exc_info=True)
        groq_client = None
else:
    if not GROQ_AVAILABLE:
        logger.warning("⚠️ OpenAI paketi yüklü değil: pip install openai")
    if not GROQ_API_KEY:
        logger.warning("⚠️ GROQ_API_KEY environment variable ayarlanmamış")


@app.route('/')
def index():
    """Ana sayfa"""
    return send_from_directory('static', 'index.html')


@app.route('/manifest.json')
def manifest():
    """PWA Manifest dosyası"""
    return send_from_directory('static', 'manifest.json', mimetype='application/manifest+json')


@app.route('/service-worker.js')
def service_worker():
    """Service Worker dosyası"""
    return send_from_directory('static', 'service-worker.js', mimetype='application/javascript')


@app.route('/icon-192.png')
def icon_192():
    """192x192 icon"""
    try:
        return send_from_directory('static', 'icon-192.png', mimetype='image/png')
    except FileNotFoundError:
        logger.error("icon-192.png dosyası bulunamadı!")
        return "Icon file not found", 404


@app.route('/icon-512.png')
def icon_512():
    """512x512 icon"""
    try:
        return send_from_directory('static', 'icon-512.png', mimetype='image/png')
    except FileNotFoundError:
        logger.error("icon-512.png dosyası bulunamadı!")
        return "Icon file not found", 404


@app.route('/api/send-sms', methods=['POST'])
def send_sms():
    """
    SMS gönderme endpoint'i
    
    Request body:
    {
        "phone_number": "+905326982193",
        "risk_level": "Kritik",
        "location": "Antalya - Manavgat",
        "risk_score": 85.5,
        "latitude": 36.8969,
        "longitude": 30.7133,
        "message": "Yangın simülasyonu başlatıldı"
    }
    """
    try:
        # JSON verisini al
        if not request.is_json:
            logger.error("Request JSON formatında değil")
            return jsonify({
                'success': False,
                'message': 'Request JSON formatında olmalı'
            }), 400
        
        data = request.get_json()
        if not data:
            logger.error("Request body boş")
            return jsonify({
                'success': False,
                'message': 'Request body boş'
            }), 400
        
        # Telefon numarası
        phone_number = data.get('phone_number', '+905326982193')
        
        # SMS Notifier'ı güncelle
        try:
            global sms_notifier
            sms_notifier = create_sms_notifier(phone_number=phone_number)
        except Exception as e:
            logger.error(f"SMS Notifier oluşturma hatası: {e}", exc_info=True)
            return jsonify({
                'success': False,
                'message': f'SMS Notifier oluşturulamadı: {str(e)}',
                'error_type': type(e).__name__
            }), 500
        
        # Risk seviyesi ve konum bilgileri
        risk_level = data.get('risk_level', 'Yüksek')
        location = data.get('location', 'Bilinmeyen Konum')
        risk_score = data.get('risk_score', 75.0)
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        custom_message = data.get('message', '')
        
        # Özel mesaj varsa onu kullan, yoksa standart format
        if custom_message:
            # Özel mesaj için basit SMS gönderimi
            from datetime import datetime
            # Emoji karakterlerini kaldır (encoding sorunlarını önlemek için)
            clean_message = custom_message.replace('🔥', '[YANGIN]').replace('⚠️', '[UYARI]')
            message = f"YANGIN SIMULASYONU\n\n{clean_message}\n\nKonum: {location}"
            if latitude and longitude:
                message += f"\nKoordinatlar: {latitude:.4f}°, {longitude:.4f}°"
            message += f"\n\nTarih: {datetime.now().strftime('%d.%m.%Y %H:%M')}"
            message += "\n\nYangin Risk Analizi Sistemi"
            
            logger.info(f"SMS gönderiliyor: {phone_number}")
            logger.info(f"Twilio Client: {'Mevcut' if sms_notifier.twilio_client else 'Yok'}")
            logger.info(f"From Number: {sms_notifier.twilio_from_number}")
            
            # Twilio ile gönder
            if sms_notifier.twilio_client and sms_notifier.twilio_from_number:
                try:
                    logger.info("Twilio ile SMS gönderiliyor...")
                    result = sms_notifier.send_sms_twilio(message)
                    if result:
                        logger.info("SMS başarıyla gönderildi!")
                        return jsonify({
                            'success': True,
                            'message': 'SMS başarıyla gönderildi',
                            'phone': phone_number
                        }), 200
                    else:
                        logger.error("SMS gönderilemedi (send_sms_twilio False döndü)")
                        return jsonify({
                            'success': False,
                            'message': 'SMS gönderilemedi. Twilio hatası.'
                        }), 500
                except Exception as e:
                    logger.error(f"SMS gönderme hatası: {e}", exc_info=True)
                    return jsonify({
                        'success': False,
                        'message': f'SMS gönderilemedi: {str(e)}'
                    }), 500
            else:
                logger.warning(f"Twilio yapılandırılmamış - SMS simülasyonu")
                logger.warning(f"Alıcı: {phone_number}")
                logger.warning(f"Mesaj: {message}")
                return jsonify({
                    'success': True,
                    'message': 'SMS simülasyonu (Twilio yapılandırılmamış)',
                    'simulated': True
                }), 200
        else:
            # Standart yangın riski SMS'i
            try:
                success = sms_notifier.send_fire_alert_sms(
                    risk_level=risk_level,
                    location=location,
                    risk_score=risk_score,
                    latitude=latitude,
                    longitude=longitude
                )
                
                if success:
                    return jsonify({
                        'success': True,
                        'message': 'SMS başarıyla gönderildi'
                    }), 200
                else:
                    return jsonify({
                        'success': False,
                        'message': 'SMS gönderilemedi. Twilio yapılandırmasını kontrol edin.'
                    }), 500
            except Exception as e:
                logger.error(f"send_fire_alert_sms hatası: {e}", exc_info=True)
                return jsonify({
                    'success': False,
                    'message': f'SMS gönderilemedi: {str(e)}',
                    'error_type': type(e).__name__
                }), 500
                
    except Exception as e:
        logger.error(f"API hatası: {e}", exc_info=True)
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Hata detayları: {error_details}")
        return jsonify({
            'success': False,
            'message': f'Hata: {str(e)}',
            'error_type': type(e).__name__
        }), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Sağlık kontrolü endpoint'i"""
    twilio_sid = os.getenv('TWILIO_ACCOUNT_SID', '')
    twilio_token = os.getenv('TWILIO_AUTH_TOKEN', '')
    twilio_from = os.getenv('TWILIO_FROM_NUMBER', '')
    
    return jsonify({
        'status': 'ok',
        'service': 'SMS API',
        'twilio_configured': sms_notifier.twilio_client is not None,
        'twilio_account_sid_set': bool(twilio_sid),
        'twilio_auth_token_set': bool(twilio_token),
        'twilio_from_number_set': bool(twilio_from),
        'twilio_account_sid_preview': twilio_sid[:10] + '...' if twilio_sid else None,
        'twilio_from_number': twilio_from if twilio_from else None,
        'phone_number': sms_notifier.phone_number
    }), 200


@app.route('/api/test-sms', methods=['POST'])
def test_sms():
    """Test SMS gönderme endpoint'i"""
    try:
        phone_number = request.json.get('phone_number', '+905326982193')
        test_message = request.json.get('message', 'Test mesajı - Yangın Risk Analizi Sistemi')
        
        global sms_notifier
        sms_notifier = create_sms_notifier(phone_number=phone_number)
        
        from datetime import datetime
        message = f"🧪 TEST SMS\n\n{test_message}\n\nTarih: {datetime.now().strftime('%d.%m.%Y %H:%M')}"
        
        if sms_notifier.twilio_client and sms_notifier.twilio_from_number:
            success = sms_notifier.send_sms_twilio(message)
            if success:
                return jsonify({
                    'success': True,
                    'message': 'Test SMS başarıyla gönderildi',
                    'phone': phone_number
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'message': 'Test SMS gönderilemedi'
                }), 500
        else:
            return jsonify({
                'success': False,
                'message': 'Twilio yapılandırılmamış',
                'twilio_client': sms_notifier.twilio_client is not None,
                'twilio_from_number': sms_notifier.twilio_from_number
            }), 400
    except Exception as e:
        logger.error(f"Test SMS hatası: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'Hata: {str(e)}'
        }), 500


@app.route('/api/sensor-data', methods=['GET'])
def get_sensor_data():
    """Mevcut sensör verilerini döndür"""
    try:
        # Frontend'den gelen verileri al (eğer gönderilirse)
        # Şimdilik örnek veri döndürüyoruz, gerçek uygulamada veritabanından alınabilir
        return jsonify({
            'success': True,
            'data': {
                'message': 'Sensör verileri frontend\'den alınmalı. Bu endpoint mevcut sensör verilerini döndürür.'
            }
        }), 200
    except Exception as e:
        logger.error(f"Sensor data hatası: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'Hata: {str(e)}'
        }), 500


@app.route('/api/predict-risk', methods=['POST'])
def predict_risk():
    """
    Yangın riski tahmin endpoint'i
    
    Request body:
    {
        "temperature": 35.5,          # Sıcaklık (°C)
        "humidity": 30,               # Nem (%)
        "wind_speed": 15,             # Rüzgar hızı (km/h)
        "wind_direction": 180,        # Rüzgar yönü (derece)
        "precipitation": 0,           # Yağış (mm)
        "month": 7,                   # Ay (1-12)
        "day_of_year": 200,           # Yılın günü (1-365)
        "historical_fires_nearby": 2, # Yakındaki geçmiş yangın sayısı
        "vegetation_index": 0.7,      # Bitki örtüsü indeksi (0-1)
        "elevation": 500              # Yükseklik (m)
    }
    
    Response:
    {
        "success": true,
        "risk_score": 65.5,
        "risk_level": "Yüksek",
        "confidence": 0.85
    }
    """
    try:
        if not RISK_MODEL_AVAILABLE or fire_risk_predictor is None:
            return jsonify({
                'success': False,
                'message': 'Risk tahmin modeli kullanılamıyor'
            }), 503
        
        if not request.is_json:
            return jsonify({
                'success': False,
                'message': 'Request JSON formatında olmalı'
            }), 400
        
        data = request.get_json()
        
        # Varsayılan değerler
        features = {
            'temperature': data.get('temperature', 25),
            'humidity': data.get('humidity', 50),
            'wind_speed': data.get('wind_speed', 10),
            'wind_direction': data.get('wind_direction', 180),
            'precipitation': data.get('precipitation', 0),
            'month': data.get('month', 7),
            'day_of_year': data.get('day_of_year', 200),
            'historical_fires_nearby': data.get('historical_fires_nearby', 0),
            'vegetation_index': data.get('vegetation_index', 0.5),
            'elevation': data.get('elevation', 500)
        }
        
        logger.info(f"Risk tahmini isteği: {features}")
        
        # Tahmin yap
        prediction = fire_risk_predictor.predict(features)
        
        logger.info(f"Risk tahmini sonucu: {prediction}")
        
        return jsonify({
            'success': True,
            'risk_score': prediction['risk_score'],
            'risk_level': prediction['risk_level'],
            'confidence': prediction['confidence']
        }), 200
        
    except Exception as e:
        logger.error(f"Risk tahmin hatası: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'Hata: {str(e)}'
        }), 500


@app.route('/api/train-risk-model', methods=['POST'])
def train_risk_model():
    """
    Risk tahmin modelini yeniden eğit
    
    Response:
    {
        "success": true,
        "train_score": 0.95,
        "test_score": 0.92,
        "feature_importance": {...}
    }
    """
    try:
        if not RISK_MODEL_AVAILABLE or fire_risk_predictor is None:
            return jsonify({
                'success': False,
                'message': 'Risk tahmin modeli kullanılamıyor'
            }), 503
        
        logger.info("Model eğitimi başlatılıyor...")
        results = fire_risk_predictor.train()
        
        return jsonify({
            'success': True,
            'train_score': results['train_score'],
            'test_score': results['test_score'],
            'feature_importance': results['feature_importance']
        }), 200
        
    except Exception as e:
        logger.error(f"Model eğitimi hatası: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'Hata: {str(e)}'
        }), 500


@app.route('/api/ai-chat', methods=['POST'])
def ai_chat():
    """
    AI Chatbot endpoint'i - Sensör verilerini ve yangın riski verilerini analiz edebilir
    
    Request body:
    {
        "message": "Kullanıcı mesajı",
        "sensor_data": {  # Opsiyonel: mevcut sensör verileri
            "temperature": 35.5,
            "smoke": 120,
            "fire_risk": 65,
            "location": "İstanbul"
        },
        "risk_areas": [  # Opsiyonel: risk alanları
            {"name": "Antalya", "risk_score": 85, "lat": 36.8969, "lon": 30.7133},
            {"name": "Muğla", "risk_score": 75, "lat": 37.2153, "lon": 28.3636}
        ]
    }
    """
    try:
        logger.info("AI Chat endpoint'e istek geldi")
        
        if not request.is_json:
            return jsonify({
                'success': False,
                'message': 'Request JSON formatında olmalı'
            }), 400
        
        data = request.get_json()
        user_message = data.get('message', '').strip()
        sensor_data = data.get('sensor_data', {})
        risk_areas = data.get('risk_areas', [])
        
        logger.info(f"AI Chat: Kullanıcı mesajı: {user_message[:50]}...")
        logger.info(f"AI Chat: Risk alanları sayısı: {len(risk_areas) if risk_areas else 0}")
        logger.info(f"AI Chat: Sensör verileri: {sensor_data}")
        
        if not user_message:
            return jsonify({
                'success': False,
                'message': 'Mesaj boş olamaz'
            }), 400
        
        # Context oluştur (sensör verileri ve risk alanları)
        context = ""
        
        if sensor_data:
            context += f"\n\nMevcut Sensör Verileri:\n"
            if 'temperature' in sensor_data:
                context += f"- Sıcaklık: {sensor_data['temperature']}°C\n"
            if 'smoke' in sensor_data:
                context += f"- Duman: {sensor_data['smoke']} PPM\n"
            if 'fire_risk' in sensor_data:
                context += f"- Yangın Riski: {sensor_data['fire_risk']}/100\n"
            if 'location' in sensor_data:
                context += f"- Konum: {sensor_data['location']}\n"
        
        if risk_areas and len(risk_areas) > 0:
            # Risk alanlarını skora göre sırala (yüksekten düşüğe)
            sorted_areas = sorted(risk_areas, key=lambda x: x.get('risk_score', 0), reverse=True)
            context += f"\n\nYangın Risk Alanları (En Riskli → En Az Riskli):\n"
            for i, area in enumerate(sorted_areas[:10], 1):  # İlk 10 alan
                name = area.get('name', 'Bilinmeyen')
                score = area.get('risk_score', 0)
                lat = area.get('lat', 0)
                lon = area.get('lon', 0)
                context += f"{i}. {name}: Risk Skoru {score}/100 (Koordinat: {lat:.4f}°, {lon:.4f}°)\n"
        
        # Sistem prompt'u
        system_prompt = """Sen bir yangın güvenliği ve risk analizi uzmanısın. Türkçe yanıt ver.

Görevlerin:
1. Kullanıcılara yangın önlemleri, yangın türleri, acil durum prosedürleri hakkında bilgi ver
2. Mevcut sensör verilerini analiz et ve yorumla
3. Yangın risk alanlarını analiz et ve en riskliden en aza doğru sırala
4. Genel sorulara da cevap ver (web, teknoloji, güncel konular vb.)
5. Yangın ile ilgili güncel bilgiler için web'den araştırma yap ve güncel verileri kullan

Önemli:
- Kısa, net ve anlaşılır yanıtlar ver
- Sensör verileri varsa, bunları analiz et ve öneriler sun
- Risk alanları sorulduğunda, en riskliden en aza doğru sıralama yap
- Acil durumlarda net talimatlar ver
- Yangın ile ilgili sorularda güncel web verilerini kullan
- Emoji kullan (🔥, ⚠️, 🚨, 🌡️ vb.)
- Web'den aldığın bilgileri kaynak göster"""
        
        # Full prompt oluştur
        full_prompt = system_prompt + context + "\n\nKullanıcı: " + user_message
        
        # Web araması gerekip gerekmediğini kontrol et
        message_lower = user_message.lower()
        use_web_search = any(keyword in message_lower for keyword in [
            'yangın', 'fire', 'yangın tespit', 'fire detection', 'yangın önlem', 
            'fire prevention', 'yangın risk', 'fire risk', 'orman yangını', 
            'wildfire', 'güncel', 'son', 'yeni', '2024', '2025', 'haber', 'news',
            'türkiye', 'turkey', 'antalya', 'muğla', 'izmir', 'çanakkale'
        ])
        
        # Debug: Groq durumunu kontrol et
        logger.info(f"🔍 Groq AI Durum Kontrolü:")
        logger.info(f"   Groq: {GROQ_AVAILABLE}, Key: {bool(GROQ_API_KEY)}, Client: {groq_client is not None}")
        logger.info(f"   Web araması gerekli: {use_web_search}")
        
        # Groq AI'yi dene, yoksa kural tabanlı chatbot kullan
        ai_response = None
        model_used = 'rule-based'
        
        # Groq AI'yi dene
        logger.info(f"🔍 Groq kontrolü: AVAILABLE={GROQ_AVAILABLE}, KEY={bool(GROQ_API_KEY)}, CLIENT={groq_client is not None}, MODEL={groq_model}")
        if GROQ_AVAILABLE and GROQ_API_KEY and groq_client:
            try:
                logger.info(f"🤖 Groq AI kullanılıyor (model: {groq_model})")
                
                # Web araması gerekiyorsa prompt'a ekle
                if use_web_search:
                    enhanced_prompt = full_prompt + "\n\nNot: Lütfen güncel web bilgilerini kullanarak yanıt ver. Eğer güncel bilgiye ihtiyaç varsa, bunu belirt."
                    logger.info("🔍 Web araması için gelişmiş prompt kullanılıyor")
                else:
                    enhanced_prompt = full_prompt
                
                # OpenAI client kullanarak Groq'a istek gönder
                response = groq_client.chat.completions.create(
                    model=groq_model,
                    messages=[
                        {"role": "system", "content": "Sen bir yangın güvenliği ve risk analizi uzmanısın. Türkçe yanıt ver. Kısa, net ve anlaşılır yanıtlar ver. Emoji kullan (🔥, ⚠️, 🚨, 🌡️ vb.)."},
                        {"role": "user", "content": enhanced_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1000
                )
                ai_response = response.choices[0].message.content.strip()
                model_used = f'groq-{groq_model}'
                logger.info(f"✅ Groq AI yanıt üretti (uzunluk: {len(ai_response)} karakter)")
            except Exception as groq_error:
                error_msg = str(groq_error)
                logger.error(f"❌ Groq AI hatası: {error_msg}")
                logger.error(f"   Hata tipi: {type(groq_error).__name__}")
                logger.error(f"   Detaylı hata:", exc_info=True)
                ai_response = None
        
        # Kural tabanlı chatbot (fallback)
        if not ai_response:
            logger.warning("⚠️ Groq AI kullanılamıyor, kural tabanlı chatbot'a geçiliyor")
            logger.warning(f"   Groq: AVAILABLE={GROQ_AVAILABLE}, KEY={bool(GROQ_API_KEY)}, CLIENT={groq_client is not None}")
            ai_response = get_rule_based_response(user_message, sensor_data, risk_areas)
            model_used = 'rule-based-chatbot'
        
        return jsonify({
            'success': True,
            'message': ai_response,
            'model': model_used
        }), 200
            
    except Exception as e:
        logger.error(f"AI Chat API hatası: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'Hata: {str(e)}'
        }), 500


@app.route('/api/predict-risk', methods=['POST'])
def predict_risk():
    """
    Yangın riski tahmin endpoint'i
    
    Request body:
    {
        "temperature": 35.5,          # Sıcaklık (°C)
        "humidity": 30,               # Nem (%)
        "wind_speed": 15,             # Rüzgar hızı (km/h)
        "wind_direction": 180,        # Rüzgar yönü (derece)
        "precipitation": 0,           # Yağış (mm)
        "month": 7,                   # Ay (1-12)
        "day_of_year": 200,           # Yılın günü (1-365)
        "historical_fires_nearby": 2, # Yakındaki geçmiş yangın sayısı
        "vegetation_index": 0.7,      # Bitki örtüsü indeksi (0-1)
        "elevation": 500              # Yükseklik (m)
    }
    
    Response:
    {
        "success": true,
        "risk_score": 65.5,
        "risk_level": "Yüksek",
        "confidence": 0.85
    }
    """
    try:
        if not RISK_MODEL_AVAILABLE or fire_risk_predictor is None:
            return jsonify({
                'success': False,
                'message': 'Risk tahmin modeli kullanılamıyor'
            }), 503
        
        if not request.is_json:
            return jsonify({
                'success': False,
                'message': 'Request JSON formatında olmalı'
            }), 400
        
        data = request.get_json()
        
        # Varsayılan değerler
        features = {
            'temperature': data.get('temperature', 25),
            'humidity': data.get('humidity', 50),
            'wind_speed': data.get('wind_speed', 10),
            'wind_direction': data.get('wind_direction', 180),
            'precipitation': data.get('precipitation', 0),
            'month': data.get('month', 7),
            'day_of_year': data.get('day_of_year', 200),
            'historical_fires_nearby': data.get('historical_fires_nearby', 0),
            'vegetation_index': data.get('vegetation_index', 0.5),
            'elevation': data.get('elevation', 500)
        }
        
        logger.info(f"Risk tahmini isteği: {features}")
        
        # Tahmin yap
        prediction = fire_risk_predictor.predict(features)
        
        logger.info(f"Risk tahmini sonucu: {prediction}")
        
        return jsonify({
            'success': True,
            'risk_score': prediction['risk_score'],
            'risk_level': prediction['risk_level'],
            'confidence': prediction['confidence']
        }), 200
        
    except Exception as e:
        logger.error(f"Risk tahmin hatası: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'Hata: {str(e)}'
        }), 500


@app.route('/api/train-risk-model', methods=['POST'])
def train_risk_model():
    """
    Risk tahmin modelini yeniden eğit
    
    Response:
    {
        "success": true,
        "train_score": 0.95,
        "test_score": 0.92,
        "feature_importance": {...}
    }
    """
    try:
        if not RISK_MODEL_AVAILABLE or fire_risk_predictor is None:
            return jsonify({
                'success': False,
                'message': 'Risk tahmin modeli kullanılamıyor'
            }), 503
        
        logger.info("Model eğitimi başlatılıyor...")
        results = fire_risk_predictor.train()
        
        return jsonify({
            'success': True,
            'train_score': results['train_score'],
            'test_score': results['test_score'],
            'feature_importance': results['feature_importance']
        }), 200
        
    except Exception as e:
        logger.error(f"Model eğitimi hatası: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'Hata: {str(e)}'
        }), 500


def get_rule_based_response(user_message, sensor_data=None, risk_areas=None):
    """Kural tabanlı chatbot - API key gerektirmez"""
    message_lower = user_message.lower()
    
    # Yangın riski alanları sorusu
    if any(word in message_lower for word in ['yangın riski', 'risk alanları', 'riskli yerler', 'en riskli', 'hangi yerler', 'gördüğün yerler', 'neresi']):
        logger.info(f"Risk alanları sorusu tespit edildi. Risk areas count: {len(risk_areas) if risk_areas else 0}")
        if risk_areas and len(risk_areas) > 0:
            # Risk alanlarını sırala
            sorted_areas = sorted(risk_areas, key=lambda x: x.get('risk_score', 0), reverse=True)
            response = "🔥 **Yangın Risk Alanları (En Riskli → En Az Riskli):**\n\n"
            for i, area in enumerate(sorted_areas[:10], 1):
                name = area.get('name', 'Bilinmeyen')
                score = area.get('risk_score', 0)
                lat = area.get('lat', 0)
                lon = area.get('lon', 0)
                
                # Risk seviyesi belirle
                if score >= 75:
                    risk_level = "🔴 Kritik"
                elif score >= 50:
                    risk_level = "🟠 Yüksek"
                elif score >= 25:
                    risk_level = "🟡 Orta"
                else:
                    risk_level = "🟢 Düşük"
                
                response += f"{i}. **{name}** - {risk_level} (Skor: {score}/100)\n"
                response += f"   📍 Koordinat: {lat:.4f}°, {lon:.4f}°\n\n"
            
            response += "\n⚠️ **Öneriler:**\n"
            response += "- Yüksek riskli bölgelerde dikkatli olun\n"
            response += "- Yangın önlemlerini artırın\n"
            response += "- Acil durum planınızı hazır tutun"
            
            return response
        else:
            return "⚠️ Şu anda risk alanı verisi bulunmuyor. Lütfen harita sekmesinden risk alanlarını görüntüleyin."
    
    # Sensör verileri sorusu
    if any(word in message_lower for word in ['sensör', 'sensor', 'sıcaklık', 'sicaklik', 'duman', 'mevcut veri']):
        if sensor_data:
            response = "🌡️ **Mevcut Sensör Verileri:**\n\n"
            
            if 'temperature' in sensor_data:
                temp = sensor_data['temperature']
                response += f"**Sıcaklık:** {temp}°C\n"
                if temp > 40:
                    response += "   ⚠️ Tehlikeli seviye! Hemen önlem alın.\n"
                elif temp > 30:
                    response += "   ⚠️ Uyarı seviyesi. Dikkatli olun.\n"
                else:
                    response += "   ✅ Normal seviye.\n"
                response += "\n"
            
            if 'smoke' in sensor_data:
                smoke = sensor_data['smoke']
                response += f"**Duman:** {smoke} PPM\n"
                if smoke > 150:
                    response += "   ⚠️ Tehlikeli seviye! Hemen önlem alın.\n"
                elif smoke > 100:
                    response += "   ⚠️ Uyarı seviyesi. Dikkatli olun.\n"
                else:
                    response += "   ✅ Normal seviye.\n"
                response += "\n"
            
            if 'fire_risk' in sensor_data:
                risk = sensor_data['fire_risk']
                response += f"**Yangın Riski:** {risk}/100\n"
                if risk >= 75:
                    response += "   🔴 Kritik risk! Acil önlem gerekli.\n"
                elif risk >= 50:
                    response += "   🟠 Yüksek risk. Dikkatli olun.\n"
                elif risk >= 25:
                    response += "   🟡 Orta risk. Önlem alın.\n"
                else:
                    response += "   🟢 Düşük risk. Güvenli.\n"
            
            if 'location' in sensor_data:
                response += f"\n**Konum:** {sensor_data['location']}\n"
            
            return response
        else:
            return "⚠️ Şu anda sensör verisi bulunmuyor. Lütfen izleme panosu sekmesinden sensör verilerini görüntüleyin."
    
    # Yangın nedir?
    if any(word in message_lower for word in ['yangın nedir', 'yangin nedir', 'yangın ne', 'fire nedir']):
        return """🔥 **Yangın Nedir?**

Yangın, yanıcı madde, oksijen ve ısının bir araya gelmesiyle oluşan kontrolsüz yanma olayıdır.

**Yangın Üçgeni:**
1. **Yanıcı Madde**: Odun, kağıt, benzin, gaz vb.
2. **Oksijen**: Havadaki oksijen (%21)
3. **Isı**: Ateş, kıvılcım, sürtünme

Bu üçünden biri olmazsa yangın çıkmaz veya söner."""
    
    # Yangın türleri
    elif any(word in message_lower for word in ['yangın türleri', 'yangin turleri', 'yangın sınıfları', 'fire types']):
        return """🔥 **Yangın Türleri (Sınıfları)**

**A Sınıfı Yangınlar:**
- Katı maddeler (odun, kağıt, kumaş)
- Söndürme: Su, köpük

**B Sınıfı Yangınlar:**
- Yanıcı sıvılar (benzin, mazot, boya)
- Söndürme: Köpük, kuru kimyevi toz

**C Sınıfı Yangınlar:**
- Yanıcı gazlar (LPG, doğalgaz)
- Söndürme: Kuru kimyevi toz (önce gazı kesin!)

**D Sınıfı Yangınlar:**
- Yanıcı metaller (magnezyum, alüminyum)
- Söndürme: Özel kuru toz"""
    
    # Önlemler
    elif any(word in message_lower for word in ['önlem', 'onlem', 'nasıl önlenir', 'nasil onlenir', 'prevention']):
        return """⚠️ **Yangın Önlemleri**

**Evde:**
- Sigara içmeyin, içiyorsanız söndürün
- Elektrikli cihazları kapatın
- Mutfakta yemek yaparken dikkatli olun
- Yanıcı maddeleri güvenli yerde saklayın
- Duman dedektörü takın

**Orman:**
- Ateş yakmayın
- Sigara izmariti atmayın
- Cam şişe bırakmayın (güneş ışığı yangın çıkarabilir)
- Çöpleri toplayın"""
    
    # Acil durum
    elif any(word in message_lower for word in ['acil', 'ne yapmalı', 'ne yapmali', 'emergency', 'yangın çıktı']):
        return """🚨 **Yangın Çıktığında Yapılacaklar**

1. **Sakin olun**, panik yapmayın
2. **110'u arayın** (İtfaiye)
3. **Yangını söndürmeye çalışın** (küçükse)
4. **Büyükse kaçın**, kapıları kapatın
5. **Asansör kullanmayın**, merdiven kullanın
6. **Duman varsa eğilin**, ıslak bezle ağzınızı kapatın
7. **Pencere açmayın** (oksijen yangını büyütür)

**Acil Telefonlar:**
- İtfaiye: 110
- Ambulans: 112
- Polis: 155"""
    
    # Merhaba / Selam
    elif any(word in message_lower for word in ['merhaba', 'selam', 'hello', 'hi', 'naber']):
        return """Merhaba! 👋

Ben yangın güvenliği ve risk analizi asistanıyım. Size şu konularda yardımcı olabilirim:

🔥 Yangın nedir?
🔥 Yangın türleri
⚠️ Yangın önlemleri
🚨 Acil durum prosedürleri
🌡️ Sensör verileri analizi
📍 Yangın risk alanları (en riskliden en aza sıralama)
🔍 Yangın tespit yöntemleri
💻 Genel sorular (web, teknoloji vb.)

Ne hakkında bilgi almak istersiniz?"""
    
    # Teşekkür
    elif any(word in message_lower for word in ['teşekkür', 'tesekkur', 'sağol', 'sagol', 'thanks', 'thank you']):
        return """Rica ederim! 😊

Başka bir sorunuz varsa çekinmeyin. Yangın güvenliği konusunda size yardımcı olmaktan mutluluk duyarım.

Unutmayın: Yangın güvenliği herkesin sorumluluğudur! 🔥"""
    
    # Varsayılan yanıt
    else:
        return """Üzgünüm, bu konuda detaylı bilgim yok. 😔

Size şu konularda yardımcı olabilirim:

🔥 Yangın nedir?
🔥 Yangın türleri (A, B, C, D sınıfları)
⚠️ Yangın önlemleri
🚨 Acil durum prosedürleri
🌡️ Sensör bilgileri
📍 Yangın risk alanları
🔍 Yangın tespit yöntemleri
💻 Genel sorular

Lütfen sorunuzu bu konulardan biriyle ilgili olarak sorun."""


if __name__ == '__main__':
    # Windows konsol encoding sorununu çöz
    import sys
    import io
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print("=" * 50)
    print("Yangın Risk Analizi Web Uygulaması Başlatılıyor...")
    print("=" * 50)
    print(f"Port: {port}")
    print(f"Debug: {debug}")
    print("=" * 50)
    
    app.run(debug=debug, port=port, host='0.0.0.0')


