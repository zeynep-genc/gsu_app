#!/bin/bash
# Render.com için build script
# Bu script deployment sırasında otomatik çalışır

set -e  # Hata durumunda dur

echo "🚀 Render Build Script Başlatılıyor..."

# Python bağımlılıklarını yükle
echo "📦 Python bağımlılıkları yükleniyor..."
pip install -r requirements.txt

# FastText modelini indir (opsiyonel - FASTTEXT_ENABLED=true ise)
if [ "$FASTTEXT_ENABLED" = "true" ]; then
    echo "🤖 FastText Türkçe modeli indiriliyor..."
    
    # Model dizini oluştur
    mkdir -p ml_models
    cd ml_models
    
    # Model zaten var mı kontrol et
    if [ ! -f "cc.tr.300.bin" ]; then
        echo "⬇️  Model dosyası indiriliyor (~4GB, bu birkaç dakika sürebilir)..."
        
        # Timeout ve retry ile indir
        wget --timeout=300 --tries=3 \
            https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.tr.300.bin.gz \
            || echo "⚠️  Model indirilemedi, tag-based sistem kullanılacak"
        
        # Eğer indirme başarılıysa, dosyayı aç
        if [ -f "cc.tr.300.bin.gz" ]; then
            echo "📂 Model dosyası açılıyor..."
            gunzip cc.tr.300.bin.gz
            echo "✅ Model başarıyla hazırlandı!"
        else
            echo "⚠️  Model dosyası bulunamadı. Sistem tag-based modda çalışacak."
        fi
    else
        echo "✅ Model zaten mevcut, indirme atlanıyor."
    fi
    
    cd ..
else
    echo "ℹ️  FASTTEXT_ENABLED=false, model indirme atlanıyor."
    echo "   Tag-based öneri sistemi kullanılacak."
fi

# Django migrations
echo "🔄 Database migrations çalıştırılıyor..."
python manage.py migrate --noinput

# Static dosyalar toplama
echo "📁 Static dosyalar toplanıyor..."
python manage.py collectstatic --noinput --clear

echo "✅ Build tamamlandı!"
