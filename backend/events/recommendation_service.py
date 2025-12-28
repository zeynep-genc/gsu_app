"""
FastText tabanlı Türkçe öneri sistemi.

Bu modül, Türkçe FastText modeli kullanarak etkinlik önerileri sunar.
Öğrenci ilgi alanları ve etkinlik açıklamalarının semantik benzerliğini hesaplar.
"""

import logging
from typing import List, Tuple
import numpy as np
from django.core.cache import cache

logger = logging.getLogger(__name__)


class TurkishFastTextRecommender:
    """Türkçe FastText modeli kullanarak etkinlik önerileri."""
    
    def __init__(self):
        self.model = None
        self.model_loaded = False
        
    def _load_model(self):
        """
        Türkçe FastText modelini yükler.
        
        Model yükleme seçenekleri:
        1. Pre-trained Turkish FastText model (önerilen):
           https://fasttext.cc/docs/en/crawl-vectors.html
           cc.tr.300.bin dosyasını indirip projeye eklenmeli
        
        2. Gensim ile FastText kullanımı (özel eğitim için)
        
        Render deployment için:
        - Model otomatik indirilir (build.sh)
        - FASTTEXT_ENABLED=false ise model yüklenmez
        """
        if self.model_loaded:
            return
        
        # FASTTEXT_ENABLED kontrolü (Render için)
        import os
        fasttext_enabled = os.getenv('FASTTEXT_ENABLED', 'false').lower() == 'true'
        
        if not fasttext_enabled:
            logger.info("FASTTEXT_ENABLED=false, tag-based sistem kullanılacak")
            self.model_loaded = False
            return
            
        try:
            import fasttext
            import os
            from django.conf import settings
            
            # Model dosyası yolu
            model_path = getattr(settings, 'FASTTEXT_MODEL_PATH', None)
            
            if not model_path:
                # Varsayılan model yolu
                model_path = os.path.join(
                    settings.BASE_DIR, 
                    'ml_models', 
                    'cc.tr.300.bin'
                )
            
            if os.path.exists(model_path):
                logger.info(f"FastText modeli yükleniyor: {model_path}")
                self.model = fasttext.load_model(model_path)
                self.model_loaded = True
                logger.info("FastText modeli başarıyla yüklendi")
            else:
                logger.warning(
                    f"FastText model dosyası bulunamadı: {model_path}. "
                    "Tag-based öneri sistemi kullanılacak. "
                    "Render'da FASTTEXT_ENABLED=true ayarlayıp yeniden deploy edin."
                )
                self.model_loaded = False
                
        except ImportError:
            logger.warning(
                "FastText kütüphanesi bulunamadı. "
                "pip install fasttext komutuyla yükleyebilirsiniz."
            )
            self.model_loaded = False
        except Exception as e:
            logger.error(f"FastText model yükleme hatası: {e}")
            self.model_loaded = False
    
    def _preprocess_turkish_text(self, text: str) -> str:
        """Türkçe metin ön işleme."""
        if not text:
            return ""
        
        # Küçük harfe çevir
        text = text.lower()
        
        # Fazla boşlukları temizle
        text = " ".join(text.split())
        
        return text
    
    def _get_text_embedding(self, text: str) -> np.ndarray:
        """Metni FastText ile vektöre çevirir."""
        if not self.model:
            return None
        
        text = self._preprocess_turkish_text(text)
        if not text:
            return None
        
        try:
            # FastText ile cümle embedding'i
            words = text.split()
            if not words:
                return None
            
            # Her kelime için embedding al ve ortala
            embeddings = []
            for word in words:
                try:
                    vec = self.model.get_word_vector(word)
                    embeddings.append(vec)
                except:
                    continue
            
            if not embeddings:
                return None
            
            # Ortalama embedding
            return np.mean(embeddings, axis=0)
            
        except Exception as e:
            logger.error(f"Embedding hesaplama hatası: {e}")
            return None
    
    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """İki vektör arasındaki cosine similarity hesaplar."""
        if vec1 is None or vec2 is None:
            return 0.0
        
        try:
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Similarity hesaplama hatası: {e}")
            return 0.0
    
    def get_event_score(
        self, 
        event_text: str, 
        interest_texts: List[str],
        tag_overlap_score: int = 0
    ) -> float:
        """
        Etkinlik için öneri skoru hesaplar.
        
        Args:
            event_text: Etkinlik başlığı ve açıklaması
            interest_texts: Öğrencinin ilgi alanları ve geçmiş etkinlikleri
            tag_overlap_score: Tag eşleşme skoru (ek bonus için)
            
        Returns:
            Öneri skoru (0-1 arası)
        """
        self._load_model()
        
        if not self.model_loaded or not interest_texts:
            # FastText yüklü değilse sadece tag skorunu kullan
            return float(tag_overlap_score) * 0.1
        
        try:
            # Event embedding
            event_embedding = self._get_text_embedding(event_text)
            if event_embedding is None:
                return float(tag_overlap_score) * 0.1
            
            # Her ilgi alanı için benzerlik hesapla
            max_similarity = 0.0
            
            for interest_text in interest_texts:
                interest_embedding = self._get_text_embedding(interest_text)
                if interest_embedding is None:
                    continue
                
                similarity = self._cosine_similarity(event_embedding, interest_embedding)
                max_similarity = max(max_similarity, similarity)
            
            # FastText benzerliği (0-1) + tag bonus
            # %70 semantic similarity + %30 tag overlap
            semantic_score = max_similarity * 0.7
            tag_score = min(tag_overlap_score * 0.05, 0.3)  # Tag skoru max %30
            
            total_score = semantic_score + tag_score
            
            return total_score
            
        except Exception as e:
            logger.error(f"Event score hesaplama hatası: {e}")
            return float(tag_overlap_score) * 0.1
    
    def get_recommendations(
        self,
        student_interests: List[str],
        student_past_events: List[str],
        candidate_events: List[Tuple[int, str, str, int]],
        top_k: int = 50
    ) -> List[Tuple[int, float]]:
        """
        Öğrenci için etkinlik önerileri döndürür.
        
        Args:
            student_interests: Öğrencinin ilgi alanları (tag isimleri)
            student_past_events: Geçmiş katıldığı etkinlikler (başlık + açıklama)
            candidate_events: Aday etkinlikler (id, title, description, tag_overlap)
            top_k: Kaç öneri döndürülecek
            
        Returns:
            (event_id, score) tuple'larının listesi
        """
        self._load_model()
        
        # İlgi alanlarını metin olarak hazırla
        interest_texts = []
        for interest in student_interests:
            interest_texts.append(interest)
        
        # Geçmiş etkinlikleri ekle
        interest_texts.extend(student_past_events)
        
        if not interest_texts:
            # Eğer hiç ilgi alanı yoksa, sadece tag skoruna göre sırala
            return sorted(
                [(event_id, float(tag_score) * 0.1) 
                 for event_id, _, _, tag_score in candidate_events],
                key=lambda x: x[1],
                reverse=True
            )[:top_k]
        
        # Her etkinlik için skor hesapla
        event_scores = []
        
        for event_id, title, description, tag_overlap in candidate_events:
            # Etkinlik metni: başlık + açıklama
            event_text = f"{title} {description}"
            
            # Skor hesapla
            score = self.get_event_score(
                event_text=event_text,
                interest_texts=interest_texts,
                tag_overlap_score=tag_overlap
            )
            
            event_scores.append((event_id, score))
        
        # Skora göre sırala ve top_k'yı döndür
        event_scores.sort(key=lambda x: x[1], reverse=True)
        
        return event_scores[:top_k]


# Global singleton instance
_recommender = None


def get_recommender() -> TurkishFastTextRecommender:
    """Global recommender instance'ını döndürür."""
    global _recommender
    if _recommender is None:
        _recommender = TurkishFastTextRecommender()
    return _recommender
