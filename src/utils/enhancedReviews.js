/**
 * Enhanced Review System - Firebase'teki mevcut yorumları daha açıklayıcı hale getirir
 * 
 * Bu sistem:
 * - Mevcut basit yorumları AI ile detaylandırır
 * - Gerçekçi kullanıcı deneyimleri ekler
 * - Ürün spesifik avantaj/dezavantajlar yaratır
 * - Emotional intelligence ile daha insan benzeri yorumlar oluşturur
 */

import { db } from '../config/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { getGeminiService } from '../services/geminiAPI';

class EnhancedReviewSystem {
  constructor() {
    this.geminiService = getGeminiService();
    this.processedCount = 0;
    this.totalCount = 0;
  }

  /**
   * Ana yükseltme fonksiyonu - tüm basit yorumları geliştirir
   */
  async upgradeAllReviews(apiKey) {
    if (!apiKey) {
      throw new Error('Gemini API key gerekli');
    }

    this.geminiService.setApiKey(apiKey);
    console.log('🚀 Yorum yükseltme sistemi başlatılıyor...');

    try {
      // Tüm yorumları getir
      const reviewsCollection = collection(db, 'reviews');
      const reviewsSnapshot = await getDocs(reviewsCollection);
      
      this.totalCount = reviewsSnapshot.size;
      console.log(`📊 Toplam ${this.totalCount} yorum bulundu`);

      if (this.totalCount === 0) {
        return { success: false, message: 'Yorum bulunamadı' };
      }

      // Her yorumu işle
      const results = [];
      for (const reviewDoc of reviewsSnapshot.docs) {
        const reviewData = reviewDoc.data();
        
        // Zaten enhanced edilmiş yorumları atla
        if (reviewData.enhanced || reviewData.comment.length > 200) {
          console.log(`⏭️ Yorum zaten enhanced edilmiş: ${reviewDoc.id}`);
          continue;
        }

        try {
          const enhancedReview = await this.enhanceReview(reviewData, reviewDoc.id);
          results.push({ id: reviewDoc.id, success: true, enhancedReview });
          this.processedCount++;
          
          // Progress göster
          console.log(`✅ İlerleme: ${this.processedCount}/${this.totalCount} - ${reviewDoc.id}`);
          
          // Rate limiting için kısa bekleme
          await this.delay(1000);
          
        } catch (error) {
          console.error(`❌ Yorum geliştirme hatası ${reviewDoc.id}:`, error);
          results.push({ id: reviewDoc.id, success: false, error: error.message });
        }
      }

      console.log('🎉 Yorum yükseltme tamamlandı!');
      return { 
        success: true, 
        processedCount: this.processedCount,
        totalCount: this.totalCount,
        results 
      };

    } catch (error) {
      console.error('❌ Yorum yükseltme sistemi hatası:', error);
      throw error;
    }
  }

  /**
   * Tek bir yorumu AI ile geliştirir
   */
  async enhanceReview(reviewData, reviewId) {
    const { productId, rating, comment, userName } = reviewData;
    
    console.log(`🧠 Yorum geliştiriliyor: ${reviewId} - Product: ${productId}`);

    // Ürün kategorisini belirle
    const productCategory = this.determineProductCategory(productId);
    
    // AI prompt oluştur
    const enhancementPrompt = this.buildEnhancementPrompt(
      comment, 
      rating, 
      productCategory, 
      userName
    );

    try {
      // AI ile yorumu geliştir
      const response = await this.geminiService.generateContent(enhancementPrompt, {
        temperature: 0.8,
        maxOutputTokens: 600
      });

      const enhancedContent = this.parseEnhancedReview(response.text);
      
      // Firebase'de güncelle
      const reviewRef = doc(db, 'reviews', reviewId);
      const updateData = {
        comment: enhancedContent.comment,
        pros: enhancedContent.props,
        cons: enhancedContent.cons,
        usageContext: enhancedContent.usageContext,
        recommendation: enhancedContent.recommendation,
        enhanced: true,
        enhancedAt: serverTimestamp(),
        originalComment: comment,
        detailLevel: 'comprehensive'
      };

      await updateDoc(reviewRef, updateData);
      
      console.log(`✅ Yorum başarıyla güncellendi: ${reviewId}`);
      return updateData;

    } catch (error) {
      console.error(`❌ AI geliştirme hatası ${reviewId}:`, error);
      throw error;
    }
  }

  /**
   * AI için enhancement prompt oluşturur
   */
  buildEnhancementPrompt(originalComment, rating, category, userName) {
    const categorySpecs = this.getCategorySpecifications(category);
    
    return `Sen deneyimli bir ürün değerlendirmecisisin. Kısa bir ürün yorumunu detaylı ve açıklayıcı hale getir.

MEVCUT YORUM:
- Kullanıcı: ${userName}
- Rating: ${rating}/5
- Yorum: "${originalComment}"
- Kategori: ${category}

KATEGORI ÖZELLİKLERİ:
${categorySpecs}

GÖREV:
Bu kısa yorumu gerçekçi, detaylı ve faydalı bir değerlendirmeye dönüştür. Kullanıcının gerçek deneyimini yansıtan spesifik detaylar ekle.

YORUM GELIŞTİRME KURALLARI:
1. Orijinal rating'i koru (${rating}/5)
2. Kullanıcının sesini ve tarzını koru
3. Spesifik avantaj ve dezavantajlar ekle
4. Kullanım senaryoları ve deneyimler ekle
5. Karşılaştırmalar ve alternatif öneriler ekle
6. Gerçekçi detaylar ekle (fiyat, dayanıklılık, kullanım süresi vb.)
7. Türkçe olarak yaz, doğal konuşma dili kullan

YANIT FORMATI (JSON):
{
  "comment": "Detaylı ve açıklayıcı yorum (300-500 karakter)",
  "pros": ["Avantaj 1", "Avantaj 2", "Avantaj 3"],
  "cons": ["Dezavantaj 1", "Dezavantaj 2"],
  "usageContext": "Hangi durumda/nasıl kullandığı",
  "recommendation": "Kime önerir, hangi koşullarda"
}

ÖRNEKLER:
"Güzel ürün" → "3 aydır kullanıyorum, günlük işlerimi çok kolaylaştırdı. Kalitesi beklentimin üstünde, özellikle dayanıklılığı etkileyici. Kurulumu kolay, 10 dakikada hallettim. Tek eksi yanı enerji tüketiminin biraz yüksek olması. Benzer fiyat aralığındaki alternatiflere göre çok daha iyi performans veriyor."

Sadece JSON formatında yanıt ver, başka açıklama ekleme.`;
  }

  /**
   * Kategori spesifikasyonlarını döndürür
   */
  getCategorySpecifications(category) {
    const specs = {
      electronics: `
Elektronik ürünler için değerlendirme kriterleri:
- Performans ve hız
- Batarya ömrü
- Build quality ve tasarım
- Kullanım kolaylığı
- Garanti ve servis
- Fiyat/performans oranı
- Enerji tüketimi
- Compatibility ve entegrasyon`,

      clothing: `
Giyim ürünleri için değerlendirme kriterleri:
- Kumaş kalitesi ve rahatlık
- Kesim ve beden uyumu
- Renk haslığı ve dayanıklılık
- Yıkama ve bakım kolaylığı
- Tasarım ve stil
- Mevsimlik uygunluk
- Combinlenebilirlik
- Fiyat değer dengesi`,

      shoes: `
Ayakkabı ürünleri için değerlendirme kriterleri:
- Konfor ve ergonomi
- Malzeme kalitesi
- Dayanıklılık ve aşınma
- Nefes alabilirlik
- Taban kalitesi ve grip
- Beden uyumu
- Stil ve görünüm
- Farklı kullanım alanları`,

      books: `
Kitap ürünleri için değerlendirme kriterleri:
- İçerik kalitesi ve derinlik
- Anlatım tarzı ve akıcılık
- Öğretici değer
- Çeviri kalitesi (varsa)
- Hedef kitle uygunluğu
- Pratik uygulanabilirlik
- Referans değeri
- Sayfa sayısı ve fiyat`,

      home: `
Ev eşyaları için değerlendirme kriterleri:
- Fonksiyonellik ve kullanışlılık
- Malzeme kalitesi
- Montaj ve kurulum
- Alan verimliliği
- Bakım ve temizlik kolaylığı
- Tasarım ve estetik
- Dayanıklılık
- Garanti ve servis`,

      sports: `
Spor ürünleri için değerlendirme kriterleri:
- Performans artışı
- Ergonomi ve konfor
- Malzeme kalitesi
- Güvenlik özellikleri
- Dayanıklılık
- Bakım gereksinimleri
- Farklı aktivitelerde kullanım
- Taşınabilirlik`
    };

    return specs[category] || specs.electronics;
  }

  /**
   * Ürün ID'sinden kategori belirler
   */
  determineProductCategory(productId) {
    if (productId <= 10) return 'electronics';
    if (productId <= 15) return 'clothing';
    if (productId <= 20) return 'shoes';
    if (productId <= 25) return 'books';
    if (productId <= 30) return 'home';
    return 'sports';
  }

  /**
   * AI yanıtını parse eder
   */
  parseEnhancedReview(responseText) {
    try {
      const cleanText = responseText.trim().replace(/```json|```/g, '');
      const parsed = JSON.parse(cleanText);
      
      return {
        comment: parsed.comment || 'Yorum geliştirilemedi',
        props: parsed.pros || [],
        cons: parsed.cons || [],
        usageContext: parsed.usageContext || '',
        recommendation: parsed.recommendation || ''
      };
    } catch (error) {
      console.error('❌ AI yanıt parse hatası:', error);
      return {
        comment: 'Yorum geliştirme sırasında hata oluştu',
        props: [],
        cons: [],
        usageContext: '',
        recommendation: ''
      };
    }
  }

  /**
   * Rate limiting için bekleme
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Spesifik ürün için yorumları güncelle
   */
  async upgradeProductReviews(productId, apiKey) {
    if (!apiKey) {
      throw new Error('Gemini API key gerekli');
    }

    this.geminiService.setApiKey(apiKey);
    
    try {
      // Index gerekmeyen basit query kullan
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('productId', '==', productId)
      );

      const reviewsSnapshot = await getDocs(reviewsQuery);
      console.log(`📊 Ürün ${productId} için ${reviewsSnapshot.size} yorum bulundu`);

      // Client-side sorting (en yeni önce)  
      const sortedDocs = reviewsSnapshot.docs.sort((a, b) => {
        const dateA = a.data().createdAt?.toDate?.() || new Date(a.data().date);
        const dateB = b.data().createdAt?.toDate?.() || new Date(b.data().date);
        return dateB - dateA;
      });

      const results = [];
      for (const reviewDoc of sortedDocs) {
        const reviewData = reviewDoc.data();
        
        if (reviewData.enhanced) {
          console.log(`⏭️ Yorum zaten enhanced: ${reviewDoc.id}`);
          continue;
        }

        try {
          const enhancedReview = await this.enhanceReview(reviewData, reviewDoc.id);
          results.push({ id: reviewDoc.id, success: true, enhancedReview });
          
          await this.delay(1000);
        } catch (error) {
          results.push({ id: reviewDoc.id, success: false, error: error.message });
        }
      }

      return { success: true, results };
    } catch (error) {
      console.error(`❌ Ürün ${productId} yorum güncelleme hatası:`, error);
      throw error;
    }
  }

  /**
   * Review istatistiklerini getir
   */
  async getReviewStats() {
    try {
      const reviewsSnapshot = await getDocs(collection(db, 'reviews'));
      const reviews = reviewsSnapshot.docs.map(doc => doc.data());
      
      const total = reviews.length;
      const enhanced = reviews.filter(r => r.enhanced).length;
      const byRating = {};
      
      reviews.forEach(review => {
        byRating[review.rating] = (byRating[review.rating] || 0) + 1;
      });

      return {
        total,
        enhanced,
        needsUpgrade: total - enhanced,
        enhancementRate: total > 0 ? ((enhanced / total) * 100).toFixed(2) : 0,
        ratingDistribution: byRating
      };
    } catch (error) {
      console.error('❌ İstatistik alma hatası:', error);
      throw error;
    }
  }
}

// Singleton instance
let enhancedReviewSystemInstance = null;

export function getEnhancedReviewSystem() {
  if (!enhancedReviewSystemInstance) {
    enhancedReviewSystemInstance = new EnhancedReviewSystem();
  }
  return enhancedReviewSystemInstance;
}

/**
 * Kolay kullanım için wrapper fonksiyonlar
 */
export async function upgradeAllReviews(apiKey) {
  const system = getEnhancedReviewSystem();
  return await system.upgradeAllReviews(apiKey);
}

export async function upgradeProductReviews(productId, apiKey) {
  const system = getEnhancedReviewSystem();
  return await system.upgradeProductReviews(productId, apiKey);
}

export async function getReviewStats() {
  const system = getEnhancedReviewSystem();
  return await system.getReviewStats();
}

export default EnhancedReviewSystem;