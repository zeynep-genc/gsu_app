# FastText Tabanlı Türkçe Öneri Sistemi - Kullanım Rehberi

## Genel Bakış

UniConnect projesinde artık **FastText tabanlı Türkçe semantik öneri sistemi** kullanılmaktadır. Bu sistem, öğrenci ilgi alanları ile etkinlik açıklamalarının **anlamsal benzerliğini** hesaplayarak kişiselleştirilmiş öneriler sunar.

## 🚀 Yeni Özellikler

### 1. Semantik Benzerlik Analizi
- Sadece tag eşleşmesi yerine **kelimelerin anlamsal benzerliği** kullanılır
- Örnek: "yapay zeka" ilgi alanı olan öğrenciye "makine öğrenmesi" etkinlikleri de önerilir
- Türkçe dil yapısına özel FastText modeli kullanılır

### 2. Dinamik Öneri Güncelleme
- İlgi alanı eklendiğinde veya çıkarıldığında öneriler **otomatik yenilenir**
- Kullanıcı profil güncellediğinde yeni önerileri anında görür
- Geçmiş katılım geçmişi de önerileri etkiler

### 3. Hibrit Skor Sistemi
```
Toplam Skor = (Semantik Benzerlik × 0.7) + (Tag Eşleşmesi × 0.3)
```
- %70: FastText ile hesaplanan anlam benzerliği
- %30: Direkt tag eşleşme bonusu

## 📦 Kurulum

### Backend Kurulumu

1. **Bağımlılıkları yükle:**
```bash
cd backend
pip install -r requirements.txt
```

Yeni eklenen paketler:
- `fasttext>=0.9.2`
- `gensim>=4.3.0`
- `numpy>=1.24.0`
- `scikit-learn>=1.3.0`

2. **FastText Türkçe modelini indir:**
```bash
# backend/ dizininde
mkdir -p ml_models
cd ml_models

# Türkçe FastText modelini indir (~7GB)
wget https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.tr.300.bin.gz
gunzip cc.tr.300.bin.gz
```

**Not:** Model indirme opsiyoneldir. Model yoksa sistem otomatik olarak klasik tag-based öneri sistemine geçer.

3. **Django settings yapılandır:**

`backend/uniconnect_backend/settings.py` dosyasına ekle:
```python
import os
FASTTEXT_MODEL_PATH = os.path.join(BASE_DIR, 'ml_models', 'cc.tr.300.bin')
```

### Frontend Kurulumu

Frontend değişiklikleri otomatik çalışır, ekstra kurulum gerektirmez.

## 🎯 Kullanım Senaryoları

### Senaryo 1: Yeni Öğrenci Kaydı

**Adımlar:**
1. Öğrenci kayıt olur
2. İlgi alanlarını seçer: "teknoloji", "yapay zeka", "müzik"
3. Anasayfada "Önerilen Etkinlikler" sekmesine tıklar

**Sonuç:**
- "Yapay Zeka Workshop" etkinliği → Yüksek skor (direkt eşleşme)
- "Makine Öğrenmesi Semineri" → Yüksek skor (semantik benzerlik)
- "Veri Bilimi Konferansı" → Orta skor (semantik benzerlik)
- "Klasik Müzik Konseri" → Yüksek skor (direkt eşleşme)

### Senaryo 2: İlgi Alanı Güncelleme

**Adımlar:**
1. Öğrenci profilini düzenler
2. "Müzik" ilgi alanını kaldırır
3. "Robotik" ilgi alanını ekler
4. "Profili Kaydet" butonuna tıklar

**Sonuç:**
- ✅ "Profil güncellendi ve önerileriniz yenilendi!" mesajı
- Müzik etkinlikleri önerilerden kaldırılır
- Robotik, otonom sistemler, drone programlama etkinlikleri eklenir
- Öneriler anında güncellenir (sayfa yenilemeye gerek yok)

### Senaryo 3: Geçmiş Davranış Bazlı Öneri

**Adımlar:**
1. Öğrenci daha önce "Hackathon 2024" etkinliğine katılmış
2. Bu etkinliğin açıklaması: "48 saatlik yazılım geliştirme maratonu"
3. Sistem bu metni analiz eder

**Sonuç:**
- Gelecekteki hackathon etkinlikleri öncelik alır
- "Coding Competition", "Game Jam" gibi benzer etkinlikler önerilir
- İlgi alanlarında "yazılım" olmasa bile bu etkinlikler görünür

## 🔧 API Kullanımı

### 1. Öneri Alma

```http
GET /api/recommendations/?student_id=123
```

**Yanıt:**
```json
{
  "recommendations": [
    {
      "id": 45,
      "title": "Yapay Zeka Workshop",
      "description": "Makine öğrenmesi temelleri...",
      "category": "Teknoloji",
      ...
    },
    ...
  ],
  "method": "fasttext_semantic"  // veya "tag_based"
}
```

- `method: "fasttext_semantic"` → FastText modeli aktif
- `method: "tag_based"` → Model yok, sadece tag eşleşmesi

### 2. İlgi Alanı Güncelleme + Otomatik Öneri Yenileme

**Frontend'de:**
```javascript
// Profil güncelleme - ilgi alanları değiştiyse önerileri de yenile
const updated = await api.updateStudent(studentId, payload, true);

if (updated.interests_changed && updated.updated_recommendations) {
  // Yeni öneriler geldi
  console.log(updated.updated_recommendations);
}
```

**Backend'de:**
```http
PATCH /api/students/123/?include_recommendations=true
Content-Type: application/json

{
  "tag_names": ["teknoloji", "robotik", "yapay zeka"]
}
```

**Yanıt:**
```json
{
  "message": "Profil güncellendi.",
  "student": { ... },
  "interests_changed": true,
  "updated_recommendations": [ ... ]
}
```

## 📊 Skor Hesaplama Detayları

### FastText Semantik Benzerlik

```python
# Her etkinlik için:
event_text = f"{event.title} {event.description}"
interest_texts = student_interests + past_event_texts

# 1. Her metin vektöre çevrilir (300 boyutlu)
event_vector = model.get_sentence_vector(event_text)
interest_vectors = [model.get_sentence_vector(t) for t in interest_texts]

# 2. Cosine similarity hesaplanır
similarities = [cosine_sim(event_vector, iv) for iv in interest_vectors]
max_similarity = max(similarities)  # En yüksek benzerlik

# 3. Final skor
semantic_score = max_similarity * 0.7
tag_bonus = min(tag_overlap_count * 0.05, 0.3)
total_score = semantic_score + tag_bonus
```

### Fallback: Tag-Based Skor

FastText modeli yoksa:
```python
total_score = tag_overlap_count * 0.1
```

## 🎨 UI/UX Değişiklikleri

### Öğrenci Dashboard

1. **"Önerilen Etkinlikler" Sekmesi:**
   - FastText aktifse: "Akıllı Öneriler (Semantik Analiz)"
   - Model yoksa: "Öneriler (Tag Bazlı)"

2. **Profil Düzenleme:**
   - İlgi alanı ekle/çıkar
   - Kaydet butonuna tıkla
   - İlgi alanı değiştiyse → "Önerileriniz yenilendi!" mesajı
   - Öneriler sekmesi otomatik güncellenir

3. **Bilgilendirme Mesajları:**
   - İlgi alanı yoksa: "Lütfen profilinizden ilgi alanlarınızı ekleyin"
   - Model aktifse: Response'da `method: "fasttext_semantic"` görünür

## 🧪 Test Etme

### Manuel Test

1. **FastText ile test:**
```bash
cd backend
python manage.py shell
```

```python
from events.recommendation_service import get_recommender
recommender = get_recommender()
recommender._load_model()
print(f"Model yüklü: {recommender.model_loaded}")

# Basit benzerlik testi
score = recommender.get_event_score(
    event_text="Yapay zeka ve makine öğrenmesi workshop",
    interest_texts=["robotik", "otomasyon"],
    tag_overlap_score=0
)
print(f"Skor: {score}")  # Yüksek çıkmalı (semantik benzerlik)
```

2. **API ile test:**
```bash
# Öneri al
curl "http://localhost:8000/api/recommendations/?student_id=1"

# İlgi alanı güncelle
curl -X PATCH "http://localhost:8000/api/students/1/?include_recommendations=true" \
  -H "Content-Type: application/json" \
  -d '{"tag_names": ["teknoloji", "sanat"]}'
```

### Frontend Test

1. Öğrenci olarak giriş yap
2. Profile git → İlgi alanlarını düzenle
3. "Müzik" ekle → Kaydet
4. Öneriler sekmesine git → Müzik etkinlikleri görmeli
5. Profile dön → "Müzik" çıkar, "Teknoloji" ekle → Kaydet
6. **Alert görmelisin:** "Profil güncellendi ve önerileriniz yenilendi!"
7. Öneriler sekmesi → Teknoloji etkinlikleri görmeli

## ⚡ Performans

### İlk Yükleme
- Model ilk istekte yüklenir: ~10-30 saniye
- Sonraki istekler çok hızlı (model bellekte)

### Production Optimizasyonu

**1. Model Preload (wsgi.py):**
```python
from events.recommendation_service import get_recommender
get_recommender()._load_model()  # Uygulama başlarken yükle
```

**2. Gunicorn Preload:**
```bash
gunicorn --preload uniconnect_backend.wsgi:application
```

**3. Redis Caching:**
```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

## 🔍 Troubleshooting

### Problem: Model yüklenemiyor
```
WARNING: FastText model dosyası bulunamadı
```
**Çözüm:**
- Model dosyasını doğru yere indirdin mi? `backend/ml_models/cc.tr.300.bin`
- Settings'de path doğru mu? `FASTTEXT_MODEL_PATH`

### Problem: Memory hatası
```
MemoryError: Cannot allocate memory
```
**Çözüm:**
- Model ~7GB RAM kullanır
- Daha küçük model kullan veya swap alanını artır
- Fallback sisteme geç (model olmadan çalış)

### Problem: Öneriler güncellenmiyor
**Kontrol:**
1. API yanıtında `interests_changed: true` var mı?
2. Frontend'de `onRecommendationsUpdate` fonksiyonu çağrılıyor mu?
3. Console'da hata var mı?

## 📚 Daha Fazla Bilgi

- [FASTTEXT_SETUP.md](./FASTTEXT_SETUP.md) - Detaylı kurulum rehberi
- [FastText Documentation](https://fasttext.cc/docs/en/python-module.html)
- [Recommendation Service Code](./backend/events/recommendation_service.py)

## 🎓 Örnek Vaka Çalışması

**Öğrenci Profili:**
- İlgi Alanları: "yapay zeka", "müzik"
- Geçmiş: "AI Hackathon 2024" etkinliğine katıldı

**Etkinlik 1:** "Makine Öğrenmesi Workshop"
- Tag Overlap: 0 (yapay zeka ≠ makine öğrenmesi tagları farklı)
- Semantik Benzerlik: 0.85 (çok benzer)
- **Final Skor:** 0.85 × 0.7 = 0.595 → **Yüksek**

**Etkinlik 2:** "Jazz Konseri"
- Tag Overlap: 1 (müzik eşleşiyor)
- Semantik Benzerlik: 0.45
- **Final Skor:** 0.45 × 0.7 + 0.05 = 0.365 → **Orta**

**Etkinlik 3:** "Edebiyat Sohbetleri"
- Tag Overlap: 0
- Semantik Benzerlik: 0.15
- **Final Skor:** 0.15 × 0.7 = 0.105 → **Düşük**

**Sıralama:** Etkinlik 1 > Etkinlik 2 > Etkinlik 3
