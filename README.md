# UniConnect Tam Yığın Mimarisi

Bu proje, tek bir `index.html` dosyasındaki prototipi React (frontend), Django REST (backend) ve PostgreSQL (veritabanı) katmanlarına ayrılmış gerçek bir uygulama mimarisine dönüştürür.

## Proje Yapısı

```
gsu_app/
├── backend/              # Django REST API + PostgreSQL yapılandırması
├── frontend/             # React (Vite) arayüzü
└── README.md
```

### Frontend (React)
- Kaynaklar `frontend/src` altında parçalı bileşenler olarak tutulur.
- `src/api.js` dosyası, backend REST uç noktaları ile JSON üzerinden haberleşir.
- `src/components` içerisindeki `StudentDashboard`, `ClubDashboard` vb. bileşenler eski arayüzü modüler hale getirir.

### Backend (Django + DRF)
- `backend/uniconnect_backend` projesi Django ayarlarını barındırır.
- `events` uygulaması; kulüp, öğrenci, etkinlik, katılım modelleri ve REST uç noktalarını içerir.
- `events/management/commands/seed_demo.py` komutu örnek öğrenci/kulüp/etkinlikleri PostgreSQL'e yükler.

## Backend'i Çalıştırma
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env         # Gerekli PostgreSQL bilgilerini düzenleyin
python manage.py migrate
python manage.py seed_demo   # Opsiyonel: örnek veriler
python manage.py runserver
```

> Veritabanı bağlantısı için `.env` içerisinde `POSTGRES_*` alanlarını güncelleyin. Varsayılan olarak `localhost:5432` üzerindeki `uniconnect` veritabanını bekler.

## Frontend'i Çalıştırma
```bash
cd frontend
npm install
cp .env.example .env         # Opsiyonel: VITE_API_URL tanımlayabilirsiniz
npm run dev                  # http://localhost:5173
```

Varsayılan olarak frontend, `http://localhost:8000/api` adresine istek atar. Farklı bir adres için `.env` dosyanıza `VITE_API_URL` tanımı ekleyin.

## Önemli Dosyalar
- `frontend/src/App.jsx`: Oturum yönetimi, API entegrasyonu.
- `frontend/src/components/*.jsx`: Öğrenci/kulüp panelleri ve UI bileşenleri.
- `backend/events/models.py`: Kulüp, öğrenci, etkinlik ve katılım modelleri.
- `backend/events/views.py`: REST uç noktaları (giriş, etkinlik CRUD, katılım).
- `backend/events/serializers.py`: JSON dönüştürücüler.
- `backend/events/views.py` içinde favori uç noktaları bulunur; frontend favorileri kalıcı olarak PostgreSQL’de tutar.

## Sonraki Adımlar
- Django tarafında gerçek kimlik doğrulaması (JWT, session vb.) ekleyebilirsiniz.
- PostgreSQL üzerinde migration oluşturup CI/CD sürecine dahil edin.
- Frontend için bir durum yönetim kütüphanesi (Redux, Zustand) ve otomatik testler eklenebilir.
