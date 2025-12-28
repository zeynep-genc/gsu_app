# Render.com Deployment Rehberi - UniConnect

## 🚀 Hızlı Deployment

### Seçenek 1: Blueprint ile Otomatik Deployment (Önerilen)

1. **GitHub Repository'yi Hazırlayın:**
   ```bash
   git add .
   git commit -m "Render deployment yapılandırması"
   git push origin main
   ```

2. **Render Dashboard'a Gidin:**
   - https://dashboard.render.com/ 
   - "New" → "Blueprint"

3. **Repository Bağlayın:**
   - GitHub repo'nuzu seçin
   - `render.yaml` otomatik algılanacak
   - "Apply" butonuna tıklayın

4. **Environment Variables Ayarlayın:**
   - Backend serviste:
     - `SECRET_KEY`: Otomatik oluşturulur
     - `FASTTEXT_ENABLED`: `false` (hızlı deployment için)
     - Database connection otomatik bağlanır

5. **Deploy Başlasın! 🎉**
   - Backend: ~5-10 dakika
   - Frontend: ~3-5 dakika

### Seçenek 2: Manuel Deployment

#### Backend Deployment

1. **New Web Service:**
   - Build Command: `cd backend && bash build.sh`
   - Start Command: `cd backend && gunicorn uniconnect_backend.wsgi:application --bind 0.0.0.0:$PORT`

2. **Environment Variables:**
   ```
   SECRET_KEY=<otomatik-oluştur>
   DEBUG=false
   ALLOWED_HOSTS=.onrender.com
   DATABASE_URL=<postgresql-connection-string>
   FASTTEXT_ENABLED=false
   DJANGO_SETTINGS_MODULE=uniconnect_backend.settings
   ```

3. **Database Oluştur:**
   - New PostgreSQL
   - Plan: Starter (free)
   - Database'i backend service'e bağla

#### Frontend Deployment

1. **New Static Site:**
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`

2. **Environment Variables:**
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```

## 📊 FastText Model Kullanımı

### Model OLMADAN Deploy (Hızlı - Önerilen)

```yaml
# render.yaml içinde
envVars:
  - key: FASTTEXT_ENABLED
    value: false  # Tag-based sistem
```

**Avantajlar:**
- ✅ Hızlı build (~5 dakika)
- ✅ Az disk kullanımı
- ✅ Free tier'da çalışır

**Dezavantajlar:**
- ⚠️ Sadece tag eşleşmesi (basit öneri)

### Model İLE Deploy (Gelişmiş - Opsiyonel)

```yaml
envVars:
  - key: FASTTEXT_ENABLED
    value: true  # Semantik analiz
```

**Dikkat:**
- ⏱️ İlk build ~20-30 dakika sürer (model indirme)
- 💾 ~4GB disk gerekir
- 💰 Paid plan gerekebilir (disk/bandwidth)

**Build Süreci:**
```bash
# build.sh otomatik çalışır:
1. Dependencies yükle
2. FastText modelini indir (~4GB)
3. Model dosyasını aç
4. Migrations çalıştır
```

## 🔧 Render Özellikleri

### Auto-Deploy
- GitHub'a push → Otomatik deploy
- `main` branch değişince güncellenir

### Health Checks
- Endpoint: `/api/events/`
- Backend sağlık kontrolü

### Logs
- Dashboard → Service → Logs
- Real-time log görüntüleme

### Environment Grupları
- Production vs Staging
- Farklı env variables

## 📝 Settings.py Güncellemeleri

Render için settings.py'ye eklenecekler:

```python
# backend/uniconnect_backend/settings.py

import os
import dj_database_url

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Database
if 'DATABASE_URL' in os.environ:
    DATABASES = {
        'default': dj_database_url.config(
            default=os.environ['DATABASE_URL'],
            conn_max_age=600
        )
    }
else:
    # Local development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Static files (production)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# FastText Model
FASTTEXT_MODEL_PATH = os.path.join(BASE_DIR, 'ml_models', 'cc.tr.300.bin')

# CORS
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS', 
    'http://localhost:5173'
).split(',')
```

### Gerekli Paket Eklemeleri

```bash
# requirements.txt'e ekle:
dj-database-url>=2.1.0
```

## 🎯 Deployment Stratejisi

### Aşama 1: Temel Sistem (Hemen)
```
FASTTEXT_ENABLED=false
→ Tag-based öneriler
→ Hızlı deploy
→ Free tier
```

### Aşama 2: Model Ekleme (İsteğe Bağlı)
```
FASTTEXT_ENABLED=true
→ Semantik öneriler
→ Yavaş build (ilk kez)
→ Daha fazla kaynak
```

### Aşama 3: Optimizasyon (İlerleyen Aşamalar)
```
→ Redis cache ekle
→ Model preload
→ CDN entegrasyonu
```

## ⚡ Performance İpuçları

### 1. Gunicorn Workers
```python
# Render'ın CPU'suna göre
WEB_CONCURRENCY=2  # Starter plan için
```

### 2. Database Connection Pooling
```python
DATABASES['default']['CONN_MAX_AGE'] = 600  # 10 dakika
```

### 3. Static File Caching
```python
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

## 🐛 Troubleshooting

### Build Başarısız
```bash
# Render logs kontrol et:
1. Dependencies yüklenemedi mi?
   → requirements.txt'i kontrol et

2. Model indirilemedi mi?
   → FASTTEXT_ENABLED=false yap
   → Yeniden deploy et

3. Migrations hatası?
   → DATABASE_URL doğru mu kontrol et
```

### Runtime Hatası
```bash
# Service logs'u incele:
1. Import error?
   → Paket eksik, requirements.txt'e ekle

2. Database connection error?
   → DATABASE_URL env variable kontrol et

3. Model yüklenemiyor?
   → Normal, FASTTEXT_ENABLED=false ise tag-based çalışır
```

### CORS Hatası
```python
# Backend settings.py:
CORS_ALLOWED_ORIGINS = [
    'https://your-frontend.onrender.com',
]
```

## 📱 Frontend Konfigürasyonu

### .env.production (Opsiyonel)
```bash
VITE_API_URL=https://your-backend.onrender.com/api
```

### Vite Config
```javascript
// vite.config.js
export default {
  build: {
    outDir: 'dist',
    sourcemap: false,  // Production'da source map istemiyorsanız
  }
}
```

## 🔐 Güvenlik

### Environment Secrets
- Render Dashboard'dan ekleyin
- Kodda hardcode etmeyin
- `.env` dosyası git'e gitmesin

### HTTPS
- Render otomatik SSL sertifikası verir
- Tüm istekler HTTPS olur

### Database
- PostgreSQL bağlantısı otomatik şifreli
- Backup otomatik alınır (paid plan)

## 💰 Maliyet

### Free Tier (Başlangıç)
- ✅ Backend web service (750 saat/ay)
- ✅ Static site (bedava, limitsiz)
- ✅ PostgreSQL (90 gün sonra uyur)
- ❌ FastText modeli (disk sınırı)

### Starter Plan ($7/ay)
- ✅ 24/7 uptime
- ✅ Daha fazla disk (model için)
- ✅ Database 90 günden fazla
- ✅ Daha hızlı build

## 🚀 İlk Deployment Checklist

- [ ] GitHub repo güncel
- [ ] `.gitignore` güncellendi (ml_models/ eklendi)
- [ ] `render.yaml` repository'de
- [ ] `build.sh` çalıştırılabilir (`chmod +x`)
- [ ] `requirements.txt` güncel
- [ ] Settings.py Render uyumlu
- [ ] FASTTEXT_ENABLED seçimi yapıldı
- [ ] Render Blueprint oluşturuldu
- [ ] Environment variables ayarlandı
- [ ] Deploy başlatıldı
- [ ] Health check geçti
- [ ] Frontend API'ye bağlanıyor

## 📚 Kaynaklar

- [Render Docs](https://render.com/docs)
- [Render Blueprint Spec](https://render.com/docs/blueprint-spec)
- [Django on Render](https://render.com/docs/deploy-django)
- [Static Sites on Render](https://render.com/docs/static-sites)
