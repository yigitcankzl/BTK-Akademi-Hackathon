import { getGeminiService } from './geminiAPI';
import { getOrderService } from './orderService';
import productService from './ecommerce/productService';
import { getErrorMessage } from '../utils/helpers';

class OrderBasedRecommendationService {
  constructor() {
    this.geminiService = getGeminiService();
    this.orderService = getOrderService();
  }

  // Sipariş geçmişine göre AI önerileri
  async getRecommendationsBasedOnOrderHistory(userId, apiKey, options = {}) {
    try {
      const {
        maxRecommendations = 6,
        includeAnalysis = true,
        excludeRecentPurchases = true
      } = options;

      console.log('🛍️ Getting AI recommendations based on order history for user:', userId);

      if (!apiKey) {
        throw new Error('Gemini API key is required for AI recommendations');
      }

      // Gemini servisini güncelle
      this.geminiService.setApiKey(apiKey);

      // Sipariş geçmişini al
      const orderHistory = await this.orderService.getUserOrderHistory(userId, 20);
      
      if (orderHistory.length === 0) {
        console.log('No order history found, returning general recommendations');
        return this.getNewUserRecommendations(maxRecommendations);
      }

      // Sipariş verilerini AI için hazırla
      const orderAnalysis = this.orderService.prepareOrderDataForAI(orderHistory);
      
      // Mevcut ürünleri al
      let allProducts = [];
      try {
        const result = await productService.getProducts({ limit: 100 });
        allProducts = result.products;
      } catch (error) {
        const { getAllProducts } = await import('../data/products');
        allProducts = getAllProducts();
      }

      // Son satın alınan ürünleri çıkar (istenirse)
      let availableProducts = allProducts;
      if (excludeRecentPurchases) {
        const recentProductIds = this.extractRecentProductIds(orderHistory, 30); // Son 30 gün
        availableProducts = allProducts.filter(p => !recentProductIds.includes(p.id));
      }

      // AI prompt'ını oluştur
      const prompt = this.buildOrderBasedPrompt(orderAnalysis, orderHistory, availableProducts, maxRecommendations);
      
      console.log('🤖 Sending order history to Gemini for analysis...');
      
      // Gemini'ye sor
      const response = await this.geminiService.generateContent(prompt, {
        temperature: 0.7,
        maxOutputTokens: 800
      });

      console.log('✅ Gemini response received:', response.text);

      // Yanıtı parse et
      const recommendations = this.parseAIRecommendations(response.text, availableProducts);

      return {
        success: true,
        recommendations,
        analysis: includeAnalysis ? orderAnalysis : null,
        method: 'ai-order-history',
        confidence: recommendations.length >= maxRecommendations * 0.8 ? 'high' : 'medium'
      };

    } catch (error) {
      console.error('❌ Error getting order-based recommendations:', error);
      
      // Fallback: sipariş geçmişine göre basit algoritma
      return this.getFallbackOrderRecommendations(userId, maxRecommendations);
    }
  }

  // AI prompt'ını oluştur
  buildOrderBasedPrompt(analysis, orders, products, maxRecommendations) {
    const recentOrders = orders.slice(0, 5); // Son 5 sipariş

    return `Sen akıllı bir e-ticaret öneri uzmanısın. Kullanıcının sipariş geçmişini analiz ederek ${maxRecommendations} ürün öner.

MÜŞTERİ ANALİZİ:
- Toplam Sipariş: ${analysis.totalOrders} adet
- Toplam Harcama: ₺${analysis.totalSpent.toFixed(2)}
- Ortalama Sipariş Değeri: ₺${analysis.averageOrderValue.toFixed(2)}
- Sipariş Sıklığı: ${analysis.orderFrequency}
- Favori Kategoriler: ${analysis.favoriteCategories.join(', ')}
- Son Sipariş: ${analysis.lastOrderDate.toLocaleDateString('tr-TR')}

FİYAT TERCİHLERİ:
- Budget (0-1000₺): ${analysis.priceRanges.budget} ürün
- Orta Segment (1000-5000₺): ${analysis.priceRanges.mid} ürün  
- Premium (5000₺+): ${analysis.priceRanges.premium} ürün

SON SİPARİŞLER:
${recentOrders.map(order => `
📦 Sipariş: ${order.orderId} - ₺${order.total} (${new Date(order.createdAt).toLocaleDateString('tr-TR')})
Ürünler: ${order.items.map(item => `${item.productName} x${item.quantity}`).join(', ')}
`).join('')}

MEVCUT ÜRÜNLER:
${products.slice(0, 50).map(p => `
- ID: ${p.id}
- İsim: ${p.name}
- Kategori: ${p.category}
- Fiyat: ₺${p.price}
- Puan: ${p.rating}/5
- Stok: ${p.stock}
`).join('')}

ÖNERME STRATEJİSİ:
1. 🎯 MÜŞTERİ PROFİLİ: Satın alma geçmişine göre tercihlerini belirle
2. 💰 FİYAT UYUMU: En çok satın aldığı fiyat aralığından seç
3. 📦 KATEGORİ ÇEŞİTLİLİĞİ: Favori kategorilerden + yeni kategoriler keşfet
4. ⭐ KALİTE ODAKLI: Yüksek puanlı ürünleri tercih et
5. 🔄 YENİLİK FAKTÖRÜ: Daha önce almadığı ama sevebileceği ürünler
6. 🛍️ TAMAMLAYICI: Son siparişlerle uyumlu ürünler

MÜŞTERİ PSİKOLOJİSİ:
- Eğer sık sipariş veriyor → Memnun, yeni kategoriler öner
- Eğer premium alıyor → Kaliteli, yeni çıkan ürünler öner  
- Eğer budget alıyor → Uygun fiyatlı, değerli ürünler öner
- Eğer düzenli alışveriş yapıyor → Seasonal/trend ürünler öner

YANIT FORMATI:
Sadece önerilen ürün ID'lerini (sayısal) JSON array olarak ver:
[1, 2, 3, 4, 5, 6]

ÖNEMLİ: Sadece yukarıdaki ürün listesinden ID'ler seç!
Başka açıklama ekleme, sadece JSON array döndür.`;
  }

  // AI yanıtını parse et
  parseAIRecommendations(responseText, allProducts) {
    try {
      console.log('🔍 Parsing AI recommendations:', responseText);
      
      // JSON'ı temizle ve parse et
      const cleanText = responseText.trim().replace(/```json|```/g, '');
      const productIds = JSON.parse(cleanText);
      
      // Ürün ID'lerini gerçek ürünlerle eşleştir
      const recommendations = productIds
        .map(id => allProducts.find(p => p.id === id))
        .filter(Boolean)
        .slice(0, 6);
      
      console.log('✅ Parsed recommendations:', recommendations.map(p => p.name));
      return recommendations;
      
    } catch (error) {
      console.error('❌ Error parsing AI recommendations:', error);
      
      // Fallback: ilk 6 ürünü döndür
      return allProducts.slice(0, 6);
    }
  }

  // Yeni kullanıcı için öneriler
  async getNewUserRecommendations(maxRecommendations) {
    try {
      let allProducts = [];
      try {
        const result = await productService.getProducts({ limit: 50 });
        allProducts = result.products;
      } catch (error) {
        const { getAllProducts } = await import('../data/products');
        allProducts = getAllProducts().slice(0, 50);
      }

      // Popüler ürünleri seç
      const recommendations = allProducts
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, maxRecommendations);

      return {
        success: true,
        recommendations,
        analysis: {
          message: 'Yeni kullanıcı - en popüler ürünler öneriliyor',
          totalOrders: 0,
          isNewUser: true
        },
        method: 'new-user-popular',
        confidence: 'medium'
      };

    } catch (error) {
      console.error('❌ Error getting new user recommendations:', error);
      return {
        success: false,
        recommendations: [],
        method: 'error',
        confidence: 'low'
      };
    }
  }

  // Fallback algoritma
  async getFallbackOrderRecommendations(userId, maxRecommendations) {
    try {
      console.log('🔧 Using fallback algorithm for order-based recommendations');
      
      const orderHistory = await this.orderService.getUserOrderHistory(userId, 10);
      
      if (orderHistory.length === 0) {
        return this.getNewUserRecommendations(maxRecommendations);
      }

      // Mevcut ürünleri al
      let allProducts = [];
      try {
        const result = await productService.getProducts({ limit: 100 });
        allProducts = result.products;
      } catch (error) {
        const { getAllProducts } = await import('../data/products');
        allProducts = getAllProducts();
      }

      // Basit algoritma: En çok satın alınan kategorilerden öner
      const categoryPreferences = this.extractCategoryPreferences(orderHistory);
      const recentProductIds = this.extractRecentProductIds(orderHistory, 60);

      const recommendations = allProducts
        .filter(product => !recentProductIds.includes(product.id))
        .map(product => {
          let score = 0;
          
          // Kategori tercihi bonusu
          const category = product.category || 'Genel';
          if (categoryPreferences[category]) {
            score += categoryPreferences[category] * 10;
          }
          
          // Kalite bonusu
          score += (product.rating || 0) * 5;
          
          // Stok bonusu
          if (product.stock > 0) score += 10;
          
          return { ...product, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, maxRecommendations);

      return {
        success: true,
        recommendations,
        method: 'fallback-algorithm',
        confidence: 'medium'
      };

    } catch (error) {
      console.error('❌ Fallback algorithm failed:', error);
      return this.getNewUserRecommendations(maxRecommendations);
    }
  }

  // Yardımcı fonksiyonlar
  extractRecentProductIds(orders, days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentProductIds = [];
    
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      if (orderDate > cutoffDate) {
        order.items?.forEach(item => {
          if (item.productId) {
            recentProductIds.push(item.productId);
          }
        });
      }
    });
    
    return [...new Set(recentProductIds)];
  }

  extractCategoryPreferences(orders) {
    const preferences = {};
    
    orders.forEach(order => {
      order.items?.forEach(item => {
        const category = this.orderService.extractCategoryFromProduct(item);
        preferences[category] = (preferences[category] || 0) + item.quantity;
      });
    });
    
    return preferences;
  }

  // Sipariş geçmişine göre kullanıcı insight'ları
  async getUserInsights(userId, apiKey) {
    try {
      if (!apiKey) {
        return { error: 'API key required' };
      }

      this.geminiService.setApiKey(apiKey);
      
      const orderHistory = await this.orderService.getUserOrderHistory(userId, 20);
      
      if (orderHistory.length === 0) {
        return {
          insights: ['Henüz sipariş geçmişi bulunmuyor'],
          recommendations: ['İlk alışverişinizi yapmak için ürünleri keşfedin'],
          type: 'new-user'
        };
      }

      const analysis = this.orderService.prepareOrderDataForAI(orderHistory);
      
      const prompt = `Kullanıcının alışveriş geçmişini analiz et ve kişisel öngörüler ver:

MÜŞTERİ VERİLERİ:
- ${analysis.totalOrders} sipariş, ₺${analysis.totalSpent.toFixed(2)} toplam harcama
- Ortalama: ₺${analysis.averageOrderValue.toFixed(2)} per sipariş
- Favori kategoriler: ${analysis.favoriteCategories.join(', ')}
- Sipariş sıklığı: ${analysis.orderFrequency}

GÖREV: Bu kullanıcı için 3-4 kişisel insight ve 3-4 öneri ver.

Örnek format:
{
  "insights": [
    "Teknoloji ürünlerine yoğun ilgi gösteriyorsunuz",
    "Premium kalite tercih ediyorsunuz",
    "Düzenli alışveriş yapan sadık müşterimizsiniz"
  ],
  "suggestions": [
    "Yeni çıkan teknoloji ürünlerini takip edin",
    "Premium kategorisindeki indirimlerden faydalanın",
    "Sadık müşteri avantajlarından yararlanın"
  ]
}

Sadece JSON döndür, başka açıklama ekleme.`;

      const response = await this.geminiService.generateContent(prompt, {
        temperature: 0.8,
        maxOutputTokens: 400
      });

      const insights = JSON.parse(response.text.trim().replace(/```json|```/g, ''));
      
      return {
        ...insights,
        type: 'experienced-user',
        stats: analysis
      };

    } catch (error) {
      console.error('❌ Error generating user insights:', error);
      return {
        insights: ['Alışveriş geçmişiniz analiz edildi'],
        suggestions: ['Size özel öneriler hazırlanıyor'],
        type: 'error'
      };
    }
  }
}

// Singleton instance
let orderRecommendationInstance = null;

export function getOrderBasedRecommendationService() {
  if (!orderRecommendationInstance) {
    orderRecommendationInstance = new OrderBasedRecommendationService();
  }
  return orderRecommendationInstance;
}

export default OrderBasedRecommendationService;