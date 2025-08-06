import { createGeminiService } from './geminiAPI';

/**
 * AI Content Generation Service for E-commerce
 * Provides AI-generated product descriptions, tags, and marketing content
 */

export class AIContentService {
  constructor(apiKey) {
    this.geminiService = createGeminiService(apiKey);
  }

  /**
   * Generate enhanced product description
   */
  async generateProductDescription(product) {
    try {
      const features = product.features ? product.features.join(', ') : '';
      const specifications = product.specifications ? 
        Object.entries(product.specifications)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ') : '';

      const prompt = `Aşağıdaki ürün için detaylı ve çekici bir Türkçe ürün açıklaması oluştur:

📦 ÜRÜN BİLGİLERİ:
• İsim: ${product.name}
• Kategori: ${product.category}
• Marka: ${product.brand || 'Belirtilmemiş'}
• Fiyat: ₺${product.price?.toLocaleString('tr-TR') || 'Belirtilmemiş'}
• Mevcut Açıklama: ${product.description || 'Yok'}
• Temel Özellikler: ${features || 'Belirtilmemiş'}
• Teknik Özellikler: ${specifications || 'Belirtilmemiş'}
• Puan: ${product.rating || 'Henüz puanlanmamış'}/5
• Stok Durumu: ${product.stock > 0 ? `${product.stock} adet mevcut` : 'Stokta yok'}

🎯 GÖREVİN:
3-4 paragraf halinde, pazarlama odaklı ama samimi bir Türkçe açıklama yaz. Şunları mutlaka dahil et:

1️⃣ **Ürün Tanıtımı**: Ürünün ne olduğu ve temel faydaları
2️⃣ **Hedef Kitle**: Kim için ideal, hangi ihtiyaçları karşılıyor
3️⃣ **Üstün Özellikler**: Diğer alternatiflerden farkı, öne çıkan özellikleri
4️⃣ **Değer Önerisi**: Neden bu ürünü seçmeli, fiyat-performans değerlendirmesi

📝 **Yazım Kuralları:**
- Türkçe karakter kullan (ğ, ü, ş, ı, ç, ö)
- Samimi ama profesyonel dil
- Abartısız, gerçekçi ifadeler
- Müşteriye direkt hitap et ("Bu ürün ile...")
- Teknik terimleri açıkla

Sadece açıklamayı ver, başka açıklama ekleme.`;

      const response = await this.geminiService.generateContent(prompt);
      let description = response.text.trim();
      
      // Clean up the response if it has any unwanted formatting
      description = description.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      
      return description || product.description || 'Bu harika ürün hakkında detaylı bilgi yakında eklenecek.';
    } catch (error) {
      console.error('Error generating product description:', error);
      
      // Return enhanced static description based on product data
      if (product.description) {
        return product.description;
      }
      
      // Generate fallback description without AI
      const category = product.category || 'ürün';
      const brand = product.brand ? ` ${product.brand} markasından` : '';
      const price = product.price ? ` ₺${product.price.toLocaleString('tr-TR')} fiyatında` : '';
      const rating = product.rating ? ` ${product.rating}/5 yıldız puana sahip` : '';
      
      return `${brand} kaliteli ${category}${price}${rating}. Bu ürün size uygun mu? Detayları inceleyin ve size en uygun seçimi yapın.`;
    }
  }

  /**
   * Generate SEO-friendly product tags
   */
  async generateProductTags(product) {
    try {
      const prompt = `Aşağıdaki ürün için SEO dostu Türkçe etiketler (taglar) oluştur:

Ürün: ${product.name}
Kategori: ${product.category}
Marka: ${product.brand || 'Belirtilmemiş'}
Açıklama: ${product.description || 'Yok'}

10-15 adet kısa, arama dostu etiket oluştur. Etiketleri virgülle ayırarak ver.
Örnekler: "yüksek kalite", "uygun fiyat", "trend", "popüler", "dayanıklı" vb.`;

      const response = await this.geminiService.generateContent(prompt);
      const tagsText = response.text.trim();
      return tagsText.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } catch (error) {
      console.error('Error generating product tags:', error);
      
      // Generate fallback tags based on product properties
      const fallbackTags = [];
      if (product.category) fallbackTags.push(product.category.toLowerCase());
      if (product.brand) fallbackTags.push(product.brand.toLowerCase());
      if (product.price) {
        if (product.price < 100) fallbackTags.push('uygun fiyat');
        else if (product.price > 500) fallbackTags.push('premium');
      }
      if (product.rating && product.rating >= 4) fallbackTags.push('yüksek puan');
      
      fallbackTags.push('kaliteli', 'önerilen');
      
      return fallbackTags.length > 0 ? fallbackTags : ['kaliteli', 'uygun fiyat', 'önerilen'];
    }
  }

  /**
   * Generate product comparison text
   */
  async generateProductComparison(product1, product2) {
    try {
      const prompt = `Bu iki ürünü karşılaştır ve Türkçe detaylı bir karşılaştırma metni oluştur:

ÜRÜN 1:
- İsim: ${product1.name}
- Fiyat: ${product1.price} TRY
- Kategori: ${product1.category}
- Puan: ${product1.rating || 'Yok'}

ÜRÜN 2:
- İsim: ${product2.name}
- Fiyat: ${product2.price} TRY
- Kategori: ${product2.category}
- Puan: ${product2.rating || 'Yok'}

Karşılaştırmada şunları içer:
1. Fiyat-performans analizi
2. Hangi durumda hangisinin tercih edilebileceği
3. Her ürünün artıları ve eksileri
4. Tavsiye notu

Objektif ve yardımcı bir ton kullan.`;

      const response = await this.geminiService.generateContent(prompt);
      return response.text.trim();
    } catch (error) {
      console.error('Error generating product comparison:', error);
      return 'Ürün karşılaştırması şu anda mevcut değil.';
    }
  }

  /**
   * Generate category description
   */
  async generateCategoryDescription(category, products) {
    try {
      const productCount = products.length;
      const avgPrice = products.length > 0 ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length) : 0;
      const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

      const prompt = `"${category}" kategorisi için çekici ve bilgilendirici bir Türkçe kategori açıklaması yaz:

Kategori İstatistikleri:
- Ürün sayısı: ${productCount}
- Ortalama fiyat: ${avgPrice} TRY
- Mevcut markalar: ${brands.join(', ')}

2-3 paragraf halinde şunları içer:
1. Bu kategorideki ürünlerin genel özellikleri
2. Müşteriler için ne tür faydalar sağladığı
3. Alışveriş yaparken dikkat edilmesi gerekenler
4. Bu kategorideki ürün çeşitliliği hakkında bilgi

Kategori sayfası için uygun, SEO dostu bir ton kullan.`;

      const response = await this.geminiService.generateContent(prompt);
      return response.text.trim();
    } catch (error) {
      console.error('Error generating category description:', error);
      return `${category} kategorisinde kaliteli ürünler bulabilirsiniz.`;
    }
  }

  /**
   * Generate personalized product recommendations text
   */
  async generateRecommendationText(products, userPreferences, context = 'general') {
    try {
      const prompt = `Kullanıcı için kişiselleştirilmiş ürün önerisi metni oluştur:

Önerilen Ürünler:
${products.map((p, i) => `${i + 1}. ${p.name} - ${p.price} TRY`).join('\n')}

Kullanıcı Tercihleri:
- Favori kategoriler: ${userPreferences.favoriteCategories?.join(', ') || 'Yok'}
- Tercih edilen markalar: ${userPreferences.preferredBrands?.join(', ') || 'Yok'}
- Fiyat aralığı: ${userPreferences.priceRange?.[0] || 0}-${userPreferences.priceRange?.[1] || 50000} TRY

Bağlam: ${context}

Bu önerileri neden yaptığını açıklayan, kişiselleştirilmiş ve ikna edici bir metin yaz.
2-3 cümle olsun ve kullanıcıya samimi bir şekilde seslenen bir ton kullan.`;

      const response = await this.geminiService.generateContent(prompt);
      return response.text.trim();
    } catch (error) {
      console.error('Error generating recommendation text:', error);
      return 'Size özel seçilmiş bu ürünler beğeninizi kazanacak!';
    }
  }

  /**
   * Generate marketing copy for promotions
   */
  async generatePromotionText(promotion) {
    try {
      const prompt = `Aşağıdaki promosyon için çekici pazarlama metni oluştur:

Promosyon Detayları:
- Başlık: ${promotion.title || 'Özel Fırsat'}
- İndirim: ${promotion.discount || '0'}%
- Geçerlilik: ${promotion.validUntil || 'Sınırlı süre'}
- Ürün/Kategori: ${promotion.target || 'Seçili ürünler'}

Aciliyet hissi uyandıran, çekici ve aksiyon odaklı bir metin yaz.
1-2 cümle olsun, satışa yönlendirici olsun.`;

      const response = await this.geminiService.generateContent(prompt);
      return response.text.trim();
    } catch (error) {
      console.error('Error generating promotion text:', error);
      return 'Kaçırılmayacak özel fırsat! Sınırlı süre geçerli.';
    }
  }
}

// Export a factory function to create service instance
export const createAIContentService = (apiKey) => {
  return new AIContentService(apiKey);
};

// Utility function to enhance a single product with AI content
export const enhanceProductWithAI = async (product, apiKey) => {
  if (!apiKey) return product;
  
  try {
    const contentService = createAIContentService(apiKey);
    
    const [description, tags] = await Promise.all([
      contentService.generateProductDescription(product),
      contentService.generateProductTags(product)
    ]);

    return {
      ...product,
      aiDescription: description,
      aiTags: tags,
      aiEnhanced: true,
      aiGeneratedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error enhancing product with AI:', error);
    return product;
  }
};

// Utility function to enhance multiple products
export const enhanceProductsWithAI = async (products, apiKey, limit = 5) => {
  if (!apiKey || !products.length) return products;
  
  try {
    const contentService = createAIContentService(apiKey);
    const productsToEnhance = products.slice(0, limit); // Limit to avoid API overuse
    
    const enhancedProducts = await Promise.all(
      productsToEnhance.map(async (product) => {
        try {
          const [description, tags] = await Promise.all([
            contentService.generateProductDescription(product),
            contentService.generateProductTags(product)
          ]);

          return {
            ...product,
            aiDescription: description,
            aiTags: tags,
            aiEnhanced: true,
            aiGeneratedAt: new Date().toISOString()
          };
        } catch (error) {
          console.error(`Error enhancing product ${product.id}:`, error);
          return product;
        }
      })
    );

    // Return enhanced products plus remaining unenhanced ones
    return [...enhancedProducts, ...products.slice(limit)];
  } catch (error) {
    console.error('Error enhancing products with AI:', error);
    return products;
  }
};