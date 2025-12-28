# FastText Türkçe Öneri Sistemi Kurulum Rehberi

## Genel Bakış

Bu proje, etkinlik önerileri için FastText tabanlı Türkçe semantik benzerlik analizi kullanır. Sistem, öğrenci ilgi alanları ile etkinlik açıklamalarının semantik benzerliğini hesaplayarak kişiselleştirilmiş öneriler sunar.

## FastText Türkçe Model İndirme

### Seçenek 1: Facebook'un Pre-trained Modeli (Önerilen)

1. **Model İndirme:**
   ```bash
   # Proje ana dizinine git
   cd backend
   
   # ml_models klasörü oluştur
   mkdir -p ml_models
   cd ml_models
   
   # Türkçe FastText modelini indir (300 boyutlu)
   wget https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.tr.300.bin.gz
   
   # Dosyayı çıkart
   gunzip cc.tr.300.bin.gz
   ```

2. **Alternatif İndirme (curl ile):**
   ```bash
   curl -o cc.tr.300.bin.gz https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.tr.300.bin.gz
   gunzip cc.tr.300.bin.gz
   ```

### Seçenek 2: Daha Küçük Model (Hızlı Test için)

Disk alanı kısıtlıysa veya hızlı test için text formatındaki modeli kullanabilirsiniz:

```bash
wget https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.tr.300.vec.gz
gunzip cc.tr.300.vec.gz
```

## Django Settings Yapılandırması

`backend/uniconnect_backend/settings.py` dosyasına şunu ekleyin:

```python
# FastText Model Ayarları
import os
FASTTEXT_MODEL_PATH = os.path.join(BASE_DIR, 'ml_models', 'cc.tr.300.bin')
```

## Gerekli Paketlerin Kurulumu

```bash
cd backend
pip install -r requirements.txt
```

Yeni eklenen paketler:
- `fasttext>=0.9.2` - FastText kütüphanesi
- `gensim>=4.3.0` - NLP araçları
- `numpy>=1.24.0` - Sayısal hesaplamalar
- `scikit-learn>=1.3.0` - Makine öğrenmesi araçları

## Sistem Nasıl Çalışır?

### 1. Semantik Benzerlik Analizi

- **Öğrenci Profili:** İlgi alanları (taglar) ve geçmiş katıldığı etkinlikler
- **Etkinlik Analizi:** Başlık ve açıklama metinleri
- **Benzerlik Hesaplama:** FastText ile her metin vektöre çevrilir, cosine similarity hesaplanır

### 2. Skor Hesaplama

```
Total Score = (Semantic Similarity × 0.7) + (Tag Overlap × 0.3)
```

- **%70:** Semantik benzerlik (FastText)
- **%30:** Tag eşleşme bonusu

### 3. API Kullanımı

#### Öneri Alma

```http
GET /api/recommendations/?student_id=123
```

Yanıt:
```json
{
  "recommendations": [...],
  "method": "fasttext_semantic"  // veya "tag_based"
}
```

#### İlgi Alanı Güncelleme + Öneri

```http
PATCH /api/students/123/?include_recommendations=true
Content-Type: application/json

{
  "tag_names": ["teknoloji", "yapay zeka", "müzik"]
}
```

Yanıt:
```json
{
  "message": "Profil güncellendi.",
  "student": {...},
  "interests_changed": true,
  "updated_recommendations": [...]
}
```

## Fallback Mekanizması

FastText modeli yüklü değilse sistem otomatik olarak tag-based öneri sistemine geçer:
- Model dosyası bulunamazsa
- FastText kütüphanesi kurulu değilse
- Model yüklenirken hata oluşursa

Bu durumda sadece tag eşleşme skorları kullanılır.

## Performans Optimizasyonu

### 1. Model Caching
Model ilk kullanımda yüklenir ve bellekte tutulur.

### 2. Lazy Loading
Model sadece ilk öneri isteğinde yüklenir.

### 3. Batch Processing
Tüm aday etkinlikler tek seferde skorlanır.

## Dosya Yapısı

```
backend/
├── ml_models/
│   └── cc.tr.300.bin          # FastText Türkçe modeli (indirmeli)
├── events/
│   ├── recommendation_service.py  # Öneri sistemi
│   └── views.py                    # API endpoints
├── uniconnect_backend/
│   └── settings.py                 # Model path ayarı
└── requirements.txt                # Bağımlılıklar
```

## Örnek Kullanım Senaryoları

### Senaryo 1: Yeni Öğrenci Kaydı
1. Öğrenci ilgi alanlarını seçer: "yapay zeka", "robotik"
2. Sistem bu terimlerle semantik olarak benzer etkinlikleri önerir
3. "makine öğrenmesi", "otonom sistemler" gibi etkinlikler yüksek skor alır

### Senaryo 2: İlgi Alanı Değişimi
1. Öğrenci "müzik" ilgi alanını çıkarır
2. `include_recommendations=true` ile PATCH isteği
3. Müzik etkinlikleri önerilerden kaldırılır
4. Güncel ilgi alanlarına göre yeni öneriler anında döner

### Senaryo 3: Geçmiş Davranış Analizi
1. Öğrenci "hackathon" etkinliklerine katılmış
2. Sistem bu etkinliklerin içeriğini analiz eder
3. Benzer içerikte gelecek etkinlikleri önerir

## Test Etme

```bash
# Django shell ile test
python manage.py shell

>>> from events.recommendation_service import get_recommender
>>> recommender = get_recommender()
>>> recommender._load_model()
>>> print(f"Model yüklendi: {recommender.model_loaded}")
```

## Sorun Giderme

### Model Yüklenemiyor
- Model dosyası yolunu kontrol edin: `settings.FASTTEXT_MODEL_PATH`
- Dosya izinlerini kontrol edin: `chmod 644 cc.tr.300.bin`

### Memory Hatası
- Model ~7GB RAM kullanır
- Daha küçük model kullanın veya swap alanını artırın

### Yavaş Çalışıyor
- İlk yükleme 10-30 saniye sürebilir
- Sonraki istekler cache'den hızlıdır
- Production'da gunicorn preload kullanın

## Production Önerileri

1. **Model Preloading:**
   ```python
   # wsgi.py veya asgi.py'de
   from events.recommendation_service import get_recommender
   get_recommender()._load_model()
   ```

2. **Redis Caching:**
   Öneri sonuçlarını 5-10 dakika cache'leyin

3. **Async Processing:**
   Büyük öneri setleri için Celery kullanın

4. **Model Versioning:**
   Modeli Git LFS ile versiyonlayın veya S3'te saklayın

## Kaynaklar

- [FastText Pretrained Models](https://fasttext.cc/docs/en/crawl-vectors.html)
- [FastText Python Docs](https://fasttext.cc/docs/en/python-module.html)
- [Türkçe NLP Resources](https://github.com/topics/turkish-nlp)
