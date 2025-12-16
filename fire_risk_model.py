"""
Yangın Riski Tahmin Modeli
Makine Öğrenmesi ile yangın riski tahmini
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import os
import logging

logger = logging.getLogger(__name__)

class FireRiskPredictor:
    """Yangın riski tahmin modeli"""
    
    def __init__(self, model_path='fire_risk_model.pkl'):
        self.model_path = model_path
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def create_sample_data(self):
        """
        Örnek eğitim verisi oluştur
        Gerçek uygulamada bu veriler sensörlerden ve veritabanından gelecek
        """
        np.random.seed(42)
        n_samples = 1000
        
        # Özellikler
        data = {
            'temperature': np.random.uniform(15, 50, n_samples),  # Sıcaklık (°C)
            'humidity': np.random.uniform(10, 90, n_samples),     # Nem (%)
            'wind_speed': np.random.uniform(0, 30, n_samples),    # Rüzgar hızı (km/h)
            'wind_direction': np.random.uniform(0, 360, n_samples), # Rüzgar yönü (derece)
            'precipitation': np.random.uniform(0, 50, n_samples),  # Yağış (mm)
            'month': np.random.randint(1, 13, n_samples),          # Ay (1-12)
            'day_of_year': np.random.randint(1, 366, n_samples),   # Yılın günü
            'historical_fires_nearby': np.random.randint(0, 10, n_samples), # Yakındaki geçmiş yangınlar
            'vegetation_index': np.random.uniform(0.2, 0.9, n_samples),    # Bitki örtüsü indeksi
            'elevation': np.random.uniform(0, 2000, n_samples),            # Yükseklik (m)
        }
        
        df = pd.DataFrame(data)
        
        # Risk skoru hesaplama (gerçekçi bir formül)
        # Yüksek sıcaklık, düşük nem, yüksek rüzgar = yüksek risk
        risk_score = (
            (df['temperature'] - 20) * 1.5 +           # Sıcaklık etkisi
            (100 - df['humidity']) * 0.3 +              # Nem etkisi (düşük nem = yüksek risk)
            df['wind_speed'] * 0.8 +                    # Rüzgar etkisi
            df['historical_fires_nearby'] * 5 +        # Geçmiş yangınlar
            (df['month'].isin([6, 7, 8, 9]) * 10) +    # Yaz ayları
            (df['vegetation_index'] > 0.6) * 8 +       # Yüksek bitki örtüsü
            (df['precipitation'] < 5) * 5 -             # Düşük yağış
            (df['precipitation'] > 20) * 10            # Yüksek yağış (risk azaltır)
        )
        
        # Risk skorunu 0-100 aralığına normalize et
        risk_score = np.clip(risk_score, 0, 100)
        
        df['risk_score'] = risk_score
        
        return df
    
    def train(self, data=None):
        """Modeli eğit"""
        try:
            if data is None:
                logger.info("Örnek veri oluşturuluyor...")
                data = self.create_sample_data()
            
            # Özellikler ve hedef
            feature_columns = [
                'temperature', 'humidity', 'wind_speed', 'wind_direction',
                'precipitation', 'month', 'day_of_year', 'historical_fires_nearby',
                'vegetation_index', 'elevation'
            ]
            
            X = data[feature_columns]
            y = data['risk_score']
            
            # Veriyi böl
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Ölçeklendirme
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Model oluştur ve eğit
            logger.info("Model eğitiliyor...")
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                random_state=42,
                n_jobs=-1
            )
            
            self.model.fit(X_train_scaled, y_train)
            
            # Test skoru
            train_score = self.model.score(X_train_scaled, y_train)
            test_score = self.model.score(X_test_scaled, y_test)
            
            logger.info(f"✅ Model eğitildi!")
            logger.info(f"   Eğitim skoru (R²): {train_score:.4f}")
            logger.info(f"   Test skoru (R²): {test_score:.4f}")
            
            self.is_trained = True
            
            # Modeli kaydet
            self.save_model()
            
            return {
                'train_score': float(train_score),
                'test_score': float(test_score),
                'feature_importance': dict(zip(feature_columns, self.model.feature_importances_.tolist()))
            }
            
        except Exception as e:
            logger.error(f"❌ Model eğitimi hatası: {e}", exc_info=True)
            raise
    
    def predict(self, features):
        """
        Yangın riski tahmini yap
        
        Args:
            features: Dict veya DataFrame
                - temperature: Sıcaklık (°C)
                - humidity: Nem (%)
                - wind_speed: Rüzgar hızı (km/h)
                - wind_direction: Rüzgar yönü (derece)
                - precipitation: Yağış (mm)
                - month: Ay (1-12)
                - day_of_year: Yılın günü (1-365)
                - historical_fires_nearby: Yakındaki geçmiş yangın sayısı
                - vegetation_index: Bitki örtüsü indeksi (0-1)
                - elevation: Yükseklik (m)
        
        Returns:
            dict: {
                'risk_score': float (0-100),
                'risk_level': str ('Düşük', 'Orta', 'Yüksek', 'Kritik'),
                'confidence': float (0-1)
            }
        """
        if not self.is_trained and self.model is None:
            # Model yoksa, önce eğit
            logger.warning("Model eğitili değil, otomatik eğitiliyor...")
            self.train()
        
        try:
            # Özellik sırası
            feature_columns = [
                'temperature', 'humidity', 'wind_speed', 'wind_direction',
                'precipitation', 'month', 'day_of_year', 'historical_fires_nearby',
                'vegetation_index', 'elevation'
            ]
            
            # Dict'ten DataFrame'e çevir
            if isinstance(features, dict):
                # Eksik özellikleri varsayılan değerlerle doldur
                default_values = {
                    'temperature': 25,
                    'humidity': 50,
                    'wind_speed': 10,
                    'wind_direction': 180,
                    'precipitation': 0,
                    'month': 7,
                    'day_of_year': 200,
                    'historical_fires_nearby': 0,
                    'vegetation_index': 0.5,
                    'elevation': 500
                }
                
                for key in feature_columns:
                    if key not in features:
                        features[key] = default_values.get(key, 0)
                        logger.warning(f"Eksik özellik: {key}, varsayılan değer kullanılıyor: {features[key]}")
                
                # Sıraya göre düzenle
                feature_array = np.array([[features[key] for key in feature_columns]])
            else:
                feature_array = features.values if hasattr(features, 'values') else features
            
            # Ölçeklendir
            feature_scaled = self.scaler.transform(feature_array)
            
            # Tahmin
            risk_score = self.model.predict(feature_scaled)[0]
            risk_score = np.clip(risk_score, 0, 100)
            
            # Risk seviyesi belirle
            if risk_score < 25:
                risk_level = 'Düşük'
            elif risk_score < 50:
                risk_level = 'Orta'
            elif risk_score < 75:
                risk_level = 'Yüksek'
            else:
                risk_level = 'Kritik'
            
            # Güven skoru (modelin tahmin güveni - basit bir yaklaşım)
            # Gerçek uygulamada prediction interval kullanılabilir
            confidence = 0.85  # Varsayılan güven skoru
            
            return {
                'risk_score': float(risk_score),
                'risk_level': risk_level,
                'confidence': float(confidence)
            }
            
        except Exception as e:
            logger.error(f"❌ Tahmin hatası: {e}", exc_info=True)
            raise
    
    def save_model(self):
        """Modeli kaydet"""
        try:
            model_data = {
                'model': self.model,
                'scaler': self.scaler,
                'is_trained': self.is_trained
            }
            joblib.dump(model_data, self.model_path)
            logger.info(f"✅ Model kaydedildi: {self.model_path}")
        except Exception as e:
            logger.error(f"❌ Model kaydetme hatası: {e}")
    
    def load_model(self):
        """Modeli yükle"""
        try:
            if os.path.exists(self.model_path):
                model_data = joblib.load(self.model_path)
                self.model = model_data['model']
                self.scaler = model_data['scaler']
                self.is_trained = model_data.get('is_trained', True)
                logger.info(f"✅ Model yüklendi: {self.model_path}")
                return True
            else:
                logger.warning(f"⚠️ Model dosyası bulunamadı: {self.model_path}")
                return False
        except Exception as e:
            logger.error(f"❌ Model yükleme hatası: {e}")
            return False


# Global model instance
fire_risk_predictor = FireRiskPredictor()
