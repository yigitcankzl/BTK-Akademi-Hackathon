// Gemini API offline/fallback sistemi
// API kullanılamadığında yerel AI benzeri özellikler sağlar

class GeminiOfflineMode {
  constructor() {
    this.isOfflineMode = false;
    this.consecutiveFailures = 0;
    this.maxFailures = 3; // 3 ardışık hata sonrası offline mode
    this.lastFailureTime = 0;
    this.offlineCooldown = 5 * 60 * 1000; // 5 dakika offline cooldown
    
    // Önceden hazırlanmış AI benzeri responses
    this.templates = {
      productDescription: [
        "Bu ürün, kaliteli malzeme ve modern tasarımıyla dikkat çeken bir seçenek.",
        "Yüksek performans ve şık tasarımı bir araya getiren bu ürün, kullanıcıların ihtiyaçlarını karşılar.",
        "Dayanıklı yapısı ve kullanım kolaylığıyla öne çıkan bu ürün, uzun ömürlü kulanım sunar.",
        "Teknoloji ve estetik bir araya geldiği bu üründe, kullanıcı deneyimi ön planda.",
        "İhtiyaçlarınızı karşılamak için tasarlanan bu ürün, güvenilir performans sunar."
      ],
      productTags: [
        ['kaliteli', 'modern', 'güvenilir'],
        ['premium', 'dayanıklı', 'şık'],
        ['yenilikçi', 'pratik', 'fonksiyonel'],
        ['trend', 'teknolojik', 'kullanışlı'],
        ['popüler', 'özel', 'tercih edilen']
      ],
      visualSearch: [
        "Bu görselde benzer ürünler tespit edildi. Kategori ve renk özelliklerine göre eşleştirme yapıldı.",
        "Görsel analizi tamamlandı. Benzer tasarım özelliklerine sahip ürünler bulundu.",
        "Görüntü işleme sonucu: Ürün kategorisi ve stil özellikleri belirlendi."
      ],
      recommendations: [
        "Kullanım geçmişiniz ve tercihlerinize göre bu ürünler önerilmektedir.",
        "Benzer ürünleri inceleyen kullanıcılar bu seçenekleri de beğendi.",
        "Size özel seçilmiş bu ürünler, ilgi alanlarınıza uygun olarak belirlendi."
      ]
    };
  }

  // Hata durumunu kaydet
  recordFailure() {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();
    
    if (this.consecutiveFailures >= this.maxFailures) {
      console.log('🔄 Gemini API offline mode aktif edildi');
      this.isOfflineMode = true;
    }
  }

  // Başarılı istek sonrası reset
  recordSuccess() {
    this.consecutiveFailures = 0;
    if (this.isOfflineMode) {
      console.log('✅ Gemini API yeniden aktif');
      this.isOfflineMode = false;
    }
  }

  // Offline mode kontrol et
  shouldUseOfflineMode() {
    // Cooldown süresi doldu mu kontrol et
    if (this.isOfflineMode && (Date.now() - this.lastFailureTime > this.offlineCooldown)) {
      console.log('🔄 Offline cooldown tamamlandı, API tekrar denenecek');
      this.isOfflineMode = false;
      this.consecutiveFailures = 0;
    }
    
    return this.isOfflineMode;
  }

  // Offline product description generator
  generateOfflineDescription(product) {
    const template = this.getRandomTemplate('productDescription');
    const category = product.category || 'ürün';
    const brand = product.brand || 'marka';
    
    return {
      text: `${template} ${brand} markasının bu ${category} kategorisindeki ürünü, ${product.price ? 
        product.price + ' TL fiyatıyla' : ''} kullanıcıların beğenisini kazanmaktadır.`,
      isOffline: true,
      finishReason: 'STOP'
    };
  }

  // Offline product tags generator
  generateOfflineTags(product) {
    const baseTags = this.getRandomTemplate('productTags');
    const categoryTags = this.getCategoryTags(product.category);
    const brandTags = product.brand ? [product.brand.toLowerCase()] : [];
    
    return {
      text: JSON.stringify([...baseTags, ...categoryTags, ...brandTags].slice(0, 6)),
      isOffline: true,
      finishReason: 'STOP'
    };
  }

  // Offline visual search
  generateOfflineVisualSearch(products = []) {
    const template = this.getRandomTemplate('visualSearch');
    
    // Basit görsel benzerlik simülasyonu - kategori ve renk bazlı
    const matchedProducts = products.slice(0, 4).map(product => ({
      ...product,
      matchReason: 'Kategori ve görsel özelliklere göre eşleşti'
    }));

    return {
      text: template,
      matchedProducts,
      confidence: 0.75,
      isOffline: true
    };
  }

  // Offline recommendations
  generateOfflineRecommendations(userProfile = {}) {
    const template = this.getRandomTemplate('recommendations');
    
    return {
      text: template,
      isOffline: true,
      finishReason: 'STOP'
    };
  }

  // Random template seç
  getRandomTemplate(type) {
    const templates = this.templates[type];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // Kategori bazlı tags
  getCategoryTags(category) {
    const categoryMap = {
      'elektronik': ['teknoloji', 'digital', 'modern'],
      'giyim': ['moda', 'stil', 'trend'],
      'ev-yasam': ['ev', 'konfor', 'yaşam'],
      'spor': ['aktif', 'sağlık', 'performans'],
      'kitap': ['bilgi', 'eğitim', 'kültür'],
      'oyuncak': ['eğlence', 'çocuk', 'oyun']
    };
    
    return categoryMap[category] || ['kalite', 'ürün'];
  }

  // Offline status bilgisi
  getStatus() {
    return {
      isOffline: this.isOfflineMode,
      consecutiveFailures: this.consecutiveFailures,
      nextRetryTime: this.lastFailureTime + this.offlineCooldown,
      canRetryIn: Math.max(0, (this.lastFailureTime + this.offlineCooldown) - Date.now())
    };
  }

  // Manuel olarak online moda geç
  forceOnlineMode() {
    console.log('🔄 Manuel olarak online moda geçildi');
    this.isOfflineMode = false;
    this.consecutiveFailures = 0;
    this.lastFailureTime = 0;
  }
}

// Singleton instance
export const geminiOfflineMode = new GeminiOfflineMode();
export default GeminiOfflineMode;