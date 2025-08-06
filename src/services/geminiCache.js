// Gemini API Response Cache System
// Bu cache sistemi API isteklerini minimize eder ve rate limiting'i önler

class GeminiCache {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 100; // Maksimum cache boyutu
    this.defaultTTL = 5 * 60 * 1000; // 5 dakika TTL
    this.requestTimes = []; // Son isteklerin zamanları
    this.maxRequestsPerMinute = 15; // Dakikada maksimum 15 istek
    this.minRequestInterval = 4000; // İstekler arası minimum 4 saniye
    this.lastRequestTime = 0;
  }

  // Cache key'i oluştur
  generateKey(prompt, imageData = null, options = {}) {
    const keyData = {
      prompt: prompt?.substring(0, 200), // Uzun promptları kısalt
      hasImage: !!imageData,
      temperature: options.temperature || 0.7,
      model: options.model || 'gemini-1.5-flash'
    };
    return JSON.stringify(keyData);
  }

  // Cache'den değer al
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // TTL kontrolü
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    console.log('🎯 Cache hit for key:', key.substring(0, 50) + '...');
    return item.data;
  }

  // Cache'e değer kaydet
  set(key, data, ttl = this.defaultTTL) {
    // Cache boyutu kontrolü
    if (this.cache.size >= this.maxCacheSize) {
      // En eski 10 öğeyi sil
      const keys = Array.from(this.cache.keys()).slice(0, 10);
      keys.forEach(k => this.cache.delete(k));
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
      created: Date.now()
    });

    console.log('📦 Cached response for key:', key.substring(0, 50) + '...');
  }

  // Rate limiting kontrolü
  canMakeRequest() {
    const now = Date.now();
    
    // Son istek zamanından minimum interval geçmiş mi?
    if (now - this.lastRequestTime < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - (now - this.lastRequestTime);
      console.log(`⏰ Rate limit: ${Math.ceil(waitTime / 1000)} saniye beklenmeli`);
      return { canRequest: false, waitTime };
    }

    // Son dakikadaki istek sayısını kontrol et
    const oneMinuteAgo = now - 60000;
    this.requestTimes = this.requestTimes.filter(time => time > oneMinuteAgo);
    
    if (this.requestTimes.length >= this.maxRequestsPerMinute) {
      console.log('⏰ Dakikalık rate limit aşıldı, bekleniyor...');
      return { canRequest: false, waitTime: 60000 };
    }

    return { canRequest: true };
  }

  // İstek yapıldığını kaydet
  recordRequest() {
    const now = Date.now();
    this.requestTimes.push(now);
    this.lastRequestTime = now;
  }

  // Cache temizle
  clear() {
    this.cache.clear();
    console.log('🧹 Gemini cache temizlendi');
  }

  // Cache istatistikleri
  getStats() {
    const validItems = Array.from(this.cache.values())
      .filter(item => Date.now() < item.expiry);
    
    return {
      totalItems: this.cache.size,
      validItems: validItems.length,
      recentRequests: this.requestTimes.length,
      lastRequestTime: this.lastRequestTime,
      nextRequestAllowed: this.lastRequestTime + this.minRequestInterval
    };
  }

  // Benzer promptları bul (fuzzy matching)
  findSimilarCached(prompt, threshold = 0.8) {
    for (const [key, item] of this.cache.entries()) {
      if (Date.now() > item.expiry) continue;
      
      try {
        const keyData = JSON.parse(key);
        if (keyData.prompt && this.calculateSimilarity(prompt, keyData.prompt) > threshold) {
          console.log('🔍 Benzer cached response bulundu');
          return item.data;
        }
      } catch (e) {
        // Geçersiz key formatı
      }
    }
    return null;
  }

  // İki string arasındaki benzerliği hesapla
  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    return (longer.length - this.levenshteinDistance(longer, shorter)) / longer.length;
  }

  // Levenshtein distance hesapla
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

// Singleton instance
export const geminiCache = new GeminiCache();
export default GeminiCache;