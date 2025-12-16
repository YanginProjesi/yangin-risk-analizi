"""
SMS Bildirim Modülü - Çoklu Servis Desteği
Türkiye'de çalışan SMS servisleri: SendSMSGate, MessageBird, Netgsm, Twilio
"""
import os
import logging
import requests
from datetime import datetime
from typing import Optional

# Twilio için import (opsiyonel)
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False

# MessageBird için import (opsiyonel)
try:
    import messagebird
    MESSAGEBIRD_AVAILABLE = True
except ImportError:
    MESSAGEBIRD_AVAILABLE = False

# Logging ayarları
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SMSNotifier:
    """SMS bildirim gönderme sınıfı"""
    
    def __init__(self, phone_number: str = "+905326982193"):
        """
        SMS Notifier başlatıcı
        
        Args:
            phone_number: SMS gönderilecek telefon numarası (E.164 formatında)
        """
        self.phone_number = phone_number
        self.last_sent_time = {}  # Son gönderilen SMS zamanlarını takip et
        self.sms_cooldown = 300  # 5 dakika cooldown (aynı risk için tekrar göndermeyi önler)
        
        # SMS Servisi Seçimi (öncelik sırasına göre)
        self.sms_provider = os.getenv('SMS_PROVIDER', 'anadolusms').lower()
        
        # Anadolu SMS ayarları
        self.anadolusms_api_key = os.getenv('ANADOLUSMS_API_KEY', '')
        self.anadolusms_sender = os.getenv('ANADOLUSMS_SENDER', 'YANGIN')
        
        # VatanSMS ayarları
        self.vatansms_username = os.getenv('VATANSMS_USERNAME', '')
        self.vatansms_password = os.getenv('VATANSMS_PASSWORD', '')
        self.vatansms_sender = os.getenv('VATANSMS_SENDER', 'YANGIN')
        
        # Rozper ayarları
        self.rozper_api_key = os.getenv('ROZPER_API_KEY', '')
        self.rozper_sender = os.getenv('ROZPER_SENDER', 'YANGIN')
        
        # Ayyıldız ayarları
        self.ayyildiz_username = os.getenv('AYYILDIZ_USERNAME', '')
        self.ayyildiz_password = os.getenv('AYYILDIZ_PASSWORD', '')
        self.ayyildiz_sender = os.getenv('AYYILDIZ_SENDER', 'YANGIN')
        
        # SendSMSGate ayarları
        self.sendsmsgate_api_key = os.getenv('SENDSMSGATE_API_KEY', '')
        self.sendsmsgate_sender = os.getenv('SENDSMSGATE_SENDER', 'YANGIN')
        
        # MessageBird ayarları
        self.messagebird_api_key = os.getenv('MESSAGEBIRD_API_KEY', '')
        self.messagebird_sender = os.getenv('MESSAGEBIRD_SENDER', 'YANGIN')
        
        # Netgsm ayarları
        self.netgsm_usercode = os.getenv('NETGSM_USERCODE', '')
        self.netgsm_password = os.getenv('NETGSM_PASSWORD', '')
        self.netgsm_header = os.getenv('NETGSM_HEADER', 'YANGIN')
        
        # Twilio ayarları (eski kod uyumluluğu için)
        self.twilio_account_sid = os.getenv('TWILIO_ACCOUNT_SID', '')
        self.twilio_auth_token = os.getenv('TWILIO_AUTH_TOKEN', '')
        self.twilio_from_number = os.getenv('TWILIO_FROM_NUMBER', '')
        
        # Servisleri başlat
        self._initialize_services()
    
    def _initialize_services(self):
        """SMS servislerini başlat"""
        # MessageBird client
        self.messagebird_client = None
        if MESSAGEBIRD_AVAILABLE and self.messagebird_api_key:
            try:
                self.messagebird_client = messagebird.Client(self.messagebird_api_key)
                logger.info("MessageBird SMS servisi başarıyla başlatıldı")
            except Exception as e:
                logger.warning(f"MessageBird başlatılamadı: {e}")
        
        # Twilio client (eski kod uyumluluğu için)
        self.twilio_client = None
        if TWILIO_AVAILABLE and self.twilio_account_sid and self.twilio_auth_token:
            try:
                self.twilio_client = Client(self.twilio_account_sid, self.twilio_auth_token)
                logger.info("Twilio SMS servisi başarıyla başlatıldı")
            except Exception as e:
                logger.warning(f"Twilio başlatılamadı: {e}")
    
    def send_sms_anadolusms(self, message: str) -> bool:
        """
        Anadolu SMS ile SMS gönderir
        
        Args:
            message: Gönderilecek mesaj
            
        Returns:
            bool: Başarılı ise True
        """
        if not self.anadolusms_api_key:
            logger.warning("Anadolu SMS API key ayarlanmamış")
            return False
        
        try:
            # Telefon numarasını formatla
            phone = self.phone_number.replace('+', '').replace(' ', '')
            if phone.startswith('90'):
                phone = phone[2:]  # 5326982193 formatı
            
            # Anadolu SMS API endpoint (dokümantasyona göre güncellenebilir)
            url = 'https://api.anadolusms.com/api/send'
            
            data = {
                'api_key': self.anadolusms_api_key,
                'sender': self.anadolusms_sender,
                'gsm': phone,
                'message': message
            }
            
            logger.info(f"Anadolu SMS ile SMS gönderiliyor...")
            logger.info(f"To: {phone}")
            
            response = requests.post(url, data=data, timeout=10)
            
            if response.status_code == 200:
                logger.info("Anadolu SMS: SMS başarıyla gönderildi!")
                logger.info(f"Response: {response.text}")
                return True
            else:
                logger.error(f"Anadolu SMS hatası: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Anadolu SMS gönderme hatası: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    def send_sms_vatansms(self, message: str) -> bool:
        """
        VatanSMS ile SMS gönderir
        
        Args:
            message: Gönderilecek mesaj
            
        Returns:
            bool: Başarılı ise True
        """
        if not self.vatansms_username or not self.vatansms_password:
            logger.warning("VatanSMS bilgileri ayarlanmamış")
            return False
        
        try:
            # Telefon numarasını formatla
            phone = self.phone_number.replace('+', '').replace(' ', '')
            if phone.startswith('90'):
                phone = phone[2:]  # 5326982193 formatı
            
            # VatanSMS API endpoint
            url = 'https://www.vatansms.com/api/v1/send'
            
            data = {
                'username': self.vatansms_username,
                'password': self.vatansms_password,
                'sender': self.vatansms_sender,
                'gsm': phone,
                'message': message
            }
            
            logger.info(f"VatanSMS ile SMS gönderiliyor...")
            logger.info(f"To: {phone}")
            
            response = requests.post(url, data=data, timeout=10)
            
            if response.status_code == 200:
                result = response.json() if response.text else {}
                if result.get('status') == 'success' or 'success' in response.text.lower():
                    logger.info("VatanSMS: SMS başarıyla gönderildi!")
                    return True
                else:
                    logger.error(f"VatanSMS hatası: {response.text}")
                    return False
            else:
                logger.error(f"VatanSMS hatası: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"VatanSMS gönderme hatası: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    def send_sms_rozper(self, message: str) -> bool:
        """
        Rozper ile SMS gönderir
        
        Args:
            message: Gönderilecek mesaj
            
        Returns:
            bool: Başarılı ise True
        """
        if not self.rozper_api_key:
            logger.warning("Rozper API key ayarlanmamış")
            return False
        
        try:
            # Telefon numarasını formatla
            phone = self.phone_number.replace('+', '').replace(' ', '')
            
            # Rozper API endpoint
            url = 'https://api.rozper.com/v1/sms/send'
            
            headers = {
                'Authorization': f'Bearer {self.rozper_api_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'to': phone,
                'from': self.rozper_sender,
                'message': message
            }
            
            logger.info(f"Rozper ile SMS gönderiliyor...")
            logger.info(f"To: {phone}")
            
            response = requests.post(url, json=data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                logger.info("Rozper: SMS başarıyla gönderildi!")
                logger.info(f"Response: {response.text}")
                return True
            else:
                logger.error(f"Rozper hatası: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Rozper gönderme hatası: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    def send_sms_ayyildiz(self, message: str) -> bool:
        """
        Ayyıldız ile SMS gönderir
        
        Args:
            message: Gönderilecek mesaj
            
        Returns:
            bool: Başarılı ise True
        """
        if not self.ayyildiz_username or not self.ayyildiz_password:
            logger.warning("Ayyıldız bilgileri ayarlanmamış")
            return False
        
        try:
            # Telefon numarasını formatla
            phone = self.phone_number.replace('+', '').replace(' ', '')
            if phone.startswith('90'):
                phone = phone[2:]  # 5326982193 formatı
            
            # Ayyıldız API endpoint
            url = 'https://api.ayyildiz.net/api/send'
            
            data = {
                'username': self.ayyildiz_username,
                'password': self.ayyildiz_password,
                'sender': self.ayyildiz_sender,
                'gsm': phone,
                'message': message
            }
            
            logger.info(f"Ayyıldız ile SMS gönderiliyor...")
            logger.info(f"To: {phone}")
            
            response = requests.post(url, data=data, timeout=10)
            
            if response.status_code == 200:
                logger.info("Ayyıldız: SMS başarıyla gönderildi!")
                logger.info(f"Response: {response.text}")
                return True
            else:
                logger.error(f"Ayyıldız hatası: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Ayyıldız gönderme hatası: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    def send_sms_sendsmsgate(self, message: str) -> bool:
        """
        SendSMSGate ile SMS gönderir
        
        Args:
            message: Gönderilecek mesaj
            
        Returns:
            bool: Başarılı ise True
        """
        if not self.sendsmsgate_api_key:
            logger.warning("SendSMSGate API key ayarlanmamış")
            return False
        
        try:
            # Telefon numarasını formatla (başındaki + işaretini kaldır)
            phone = self.phone_number.replace('+', '').replace(' ', '')
            if phone.startswith('90'):
                phone = phone[2:]  # 90'ı kaldır, sadece numara
            
            url = 'https://www.sendsmsgate.com/api/send'
            
            data = {
                'api_key': self.sendsmsgate_api_key,
                'sender': self.sendsmsgate_sender,
                'recipient': phone,
                'message': message
            }
            
            logger.info(f"SendSMSGate ile SMS gönderiliyor...")
            logger.info(f"To: {phone}")
            logger.info(f"Message: {message[:50]}...")
            
            response = requests.post(url, data=data, timeout=10)
            
            if response.status_code == 200:
                logger.info("SendSMSGate: SMS başarıyla gönderildi!")
                logger.info(f"Response: {response.text}")
                return True
            else:
                logger.error(f"SendSMSGate hatası: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"SendSMSGate SMS gönderme hatası: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    def send_sms_messagebird(self, message: str) -> bool:
        """
        MessageBird ile SMS gönderir
        
        Args:
            message: Gönderilecek mesaj
            
        Returns:
            bool: Başarılı ise True
        """
        if not self.messagebird_client:
            logger.warning("MessageBird client mevcut değil")
            return False
        
        try:
            logger.info(f"MessageBird ile SMS gönderiliyor...")
            logger.info(f"To: {self.phone_number}")
            logger.info(f"Message: {message[:50]}...")
            
            msg = self.messagebird_client.message_create(
                self.messagebird_sender,
                self.phone_number,
                message
            )
            
            logger.info("MessageBird: SMS başarıyla gönderildi!")
            logger.info(f"ID: {msg.id}")
            return True
            
        except Exception as e:
            logger.error(f"MessageBird SMS gönderme hatası: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    def send_sms_netgsm(self, message: str) -> bool:
        """
        Netgsm ile SMS gönderir
        
        Args:
            message: Gönderilecek mesaj
            
        Returns:
            bool: Başarılı ise True
        """
        if not self.netgsm_usercode or not self.netgsm_password:
            logger.warning("Netgsm bilgileri ayarlanmamış")
            return False
        
        try:
            # Telefon numarasını formatla (başındaki + ve 90'ı kaldır)
            phone = self.phone_number.replace('+', '').replace(' ', '')
            if phone.startswith('90'):
                phone = phone[2:]  # 5326982193 formatı
            
            url = "https://api.netgsm.com.tr/sms/send/get"
            
            params = {
                'usercode': self.netgsm_usercode,
                'password': self.netgsm_password,
                'gsmno': phone,
                'message': message,
                'msgheader': self.netgsm_header
            }
            
            logger.info(f"Netgsm ile SMS gönderiliyor...")
            logger.info(f"To: {phone}")
            logger.info(f"Message: {message[:50]}...")
            
            response = requests.get(url, params=params, timeout=10)
            
            # Netgsm başarılı yanıt: "00" ile başlar
            if response.text.startswith('00'):
                logger.info("Netgsm: SMS başarıyla gönderildi!")
                logger.info(f"Response: {response.text}")
                return True
            else:
                logger.error(f"Netgsm hatası: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Netgsm SMS gönderme hatası: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    def send_sms_twilio(self, message: str) -> bool:
        """
        Twilio kullanarak SMS gönderir
        
        Args:
            message: Gönderilecek mesaj
            
        Returns:
            bool: Başarılı ise True
        """
        if not self.twilio_client:
            logger.warning("Twilio client mevcut değil. SMS gönderilemedi.")
            logger.warning(f"Account SID: {self.twilio_account_sid[:10]}..." if self.twilio_account_sid else "Account SID: Yok")
            logger.warning(f"Auth Token: {'Var' if self.twilio_auth_token else 'Yok'}")
            return False
        
        if not self.twilio_from_number:
            logger.warning("Twilio gönderen numarası ayarlanmamış. SMS gönderilemedi.")
            logger.warning(f"TWILIO_FROM_NUMBER environment variable ayarlanmamış.")
            return False
        
        try:
            logger.info(f"SMS gönderiliyor...")
            logger.info(f"From: {self.twilio_from_number}")
            logger.info(f"To: {self.phone_number}")
            logger.info(f"Message length: {len(message)} karakter")
            
            message_obj = self.twilio_client.messages.create(
                body=message,
                from_=self.twilio_from_number,
                to=self.phone_number
            )
            logger.info(f"SMS basariyla gonderildi!")
            logger.info(f"SID: {message_obj.sid}")
            logger.info(f"Status: {message_obj.status}")
            return True
        except Exception as e:
            logger.error(f"SMS gonderme hatasi: {e}")
            logger.error(f"Hata tipi: {type(e).__name__}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    def send_fire_alert_sms(self, risk_level: str, location: str, risk_score: float, 
                           latitude: float = None, longitude: float = None) -> bool:
        """
        Yangın riski için SMS gönderir
        
        Args:
            risk_level: Risk seviyesi (Düşük, Orta, Yüksek, Kritik)
            location: Konum bilgisi
            risk_score: Risk skoru (0-100)
            latitude: Enlem (opsiyonel)
            longitude: Boylam (opsiyonel)
            
        Returns:
            bool: Başarılı ise True
        """
        # Sadece Yüksek ve Kritik risk için SMS gönder
        if risk_level not in ['Yüksek', 'Kritik']:
            return False
        
        # Cooldown kontrolü - aynı konum için 5 dakika içinde tekrar gönderme
        location_key = f"{location}_{risk_level}"
        current_time = datetime.now().timestamp()
        
        if location_key in self.last_sent_time:
            time_diff = current_time - self.last_sent_time[location_key]
            if time_diff < self.sms_cooldown:
                logger.info(f"Cooldown aktif. SMS gönderilmedi. Kalan süre: {int(self.sms_cooldown - time_diff)} saniye")
                return False
        
        # Mesaj oluştur
        emoji = "[KRITIK]" if risk_level == "Kritik" else "[UYARI]"
        message = f"""{emoji} YANGIN RISKI UYARISI {emoji}

Risk Seviyesi: {risk_level}
Risk Skoru: {risk_score:.1f}/100
Konum: {location}"""
        
        if latitude and longitude:
            message += f"\nKoordinatlar: {latitude:.4f}°, {longitude:.4f}°"
        
        message += f"\n\nTarih: {datetime.now().strftime('%d.%m.%Y %H:%M')}"
        message += "\n\nYangin Risk Analizi Sistemi"
        
        # SMS gönder - Otomatik servis seçimi
        success = self.send_sms(message)
        
        # Başarılıysa zamanı kaydet
        if success:
            self.last_sent_time[location_key] = current_time
        
        return success
    
    def send_critical_alert_sms(self, fires: list) -> bool:
        """
        Kritik yangın riskleri için toplu SMS gönderir
        
        Args:
            fires: Yangın bilgileri listesi (dict formatında)
            
        Returns:
            bool: Başarılı ise True
        """
        critical_fires = [f for f in fires if f.get('risk_level') == 'Kritik']
        
        if not critical_fires:
            return False
        
        if len(critical_fires) == 1:
            fire = critical_fires[0]
            return self.send_fire_alert_sms(
                risk_level=fire.get('risk_level', 'Kritik'),
                location=fire.get('location', 'Bilinmeyen Konum'),
                risk_score=fire.get('risk_score', 0),
                latitude=fire.get('latitude'),
                longitude=fire.get('longitude')
            )
        else:
            # Birden fazla kritik yangın varsa özet mesaj
            message = f"[KRITIK] KRITIK YANGIN RISKI - {len(critical_fires)} BOLGE\n\n"
            for idx, fire in enumerate(critical_fires[:5], 1):  # İlk 5'ini göster
                message += f"{idx}. {fire.get('location', 'Bilinmeyen')} - Skor: {fire.get('risk_score', 0):.1f}\n"
            
            if len(critical_fires) > 5:
                message += f"\n... ve {len(critical_fires) - 5} bölge daha"
            
            message += f"\n\nTarih: {datetime.now().strftime('%d.%m.%Y %H:%M')}"
            message += "\n\nYangın Risk Analizi Sistemi"
            
            return self.send_sms(message)
    
    def send_sms(self, message: str) -> bool:
        """
        SMS gönderir - Otomatik servis seçimi
        
        Args:
            message: Gönderilecek mesaj
            
        Returns:
            bool: Başarılı ise True
        """
        # Servis önceliğine göre dene
        if self.sms_provider == 'anadolusms' and self.anadolusms_api_key:
            return self.send_sms_anadolusms(message)
        elif self.sms_provider == 'vatansms' and self.vatansms_username:
            return self.send_sms_vatansms(message)
        elif self.sms_provider == 'rozper' and self.rozper_api_key:
            return self.send_sms_rozper(message)
        elif self.sms_provider == 'ayyildiz' and self.ayyildiz_username:
            return self.send_sms_ayyildiz(message)
        elif self.sms_provider == 'sendsmsgate' and self.sendsmsgate_api_key:
            return self.send_sms_sendsmsgate(message)
        elif self.sms_provider == 'messagebird' and self.messagebird_client:
            return self.send_sms_messagebird(message)
        elif self.sms_provider == 'netgsm' and self.netgsm_usercode:
            return self.send_sms_netgsm(message)
        elif self.twilio_client:
            return self.send_sms_twilio(message)
        else:
            # Hiçbir servis yoksa simülasyon
            logger.warning("SMS servisi yapılandırılmamış. SMS simülasyonu:")
            logger.warning(f"Alıcı: {self.phone_number}")
            logger.warning(f"Mesaj: {message}")
            return True  # Simülasyon için True


def create_sms_notifier(phone_number: str = "+905326982193") -> SMSNotifier:
    """
    SMS Notifier oluşturur
    
    Args:
        phone_number: SMS gönderilecek telefon numarası
        
    Returns:
        SMSNotifier: SMS notifier instance
    """
    return SMSNotifier(phone_number=phone_number)


