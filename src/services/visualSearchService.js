import { getGeminiService } from './geminiAPI';
import productService from './ecommerce/productService';
import { getErrorMessage } from '../utils/helpers';

class VisualSearchService {
  constructor() {
    this.geminiService = getGeminiService();
  }

  // Görsel analiz sonuçlarına göre uyumlu ürünler öner
  async getMatchingProducts(analysisResult, apiKey, options = {}) {
    try {
      const {
        maxRecommendations = 6,
        includeComplementary = true,
        priceRange = 'all'
      } = options;

      console.log('🔍 Getting matching products for visual analysis:', analysisResult);

      // Mevcut ürünleri al
      let allProducts = [];
      try {
        const result = await productService.getProducts({ limit: 100 });
        allProducts = result.products;
      } catch (error) {
        const { getAllProducts } = await import('../data/products');
        allProducts = getAllProducts();
      }

      if (!apiKey) {
        // API key yoksa basit algoritma kullan
        return this.getMatchingProductsWithAlgorithm(analysisResult, allProducts, maxRecommendations);
      }

      // Gemini API ile akıllı eşleştirme
      this.geminiService.setApiKey(apiKey);
      return await this.getMatchingProductsWithAI(analysisResult, allProducts, maxRecommendations);

    } catch (error) {
      console.error('Error in visual search matching:', error);
      throw new Error(`Görsel eşleştirme hatası: ${getErrorMessage(error)}`);
    }
  }

  // AI destekli ürün eşleştirme
  async getMatchingProductsWithAI(analysisResult, allProducts, maxRecommendations) {
    try {
      const prompt = `Sen akıllı bir moda ve stil uzmanısın. Kullanıcının yüklediği görsel analizi sonuçlarına göre, mevcut ürün kataloğundan en uygun ${maxRecommendations} ürünü seç.

GÖRSEL ANALİZ SONUCU:
${analysisResult}

MEVCUT ÜRÜN KATALOĞU:
${allProducts.map(p => `
- ID: ${p.id}
- İsim: ${p.name}
- Kategori: ${p.category}
- Marka: ${p.brand || 'Bilinmiyor'}
- Renk/Açıklama: ${p.description}
- Fiyat: ₺${p.price}
- Puan: ${p.rating}/5
- Stok: ${p.stock}
`).join('')}

EŞLEŞTIRME KRİTERLERİ:
1. 🎨 RENK UYUMU: Görseldeki renklere uygun veya tamamlayıcı renkler
2. 👔 STİL UYUMU: Görseldeki stil ve kategoriye uygun ürünler  
3. 🏷️ KATEGORİ UYUMU: Aynı veya tamamlayıcı kategorilerden seçim
4. 💰 FİYAT UYUMU: Benzer fiyat segmentinden tercih
5. ⭐ KALİTE: Yüksek puanlı ürünleri öncelik ver
6. 📦 STOK: Stokta olan ürünleri seç

ÖZEL TALEPLER:
- Eğer görsel bir gömlek ise → pantolon, ayakkabı, aksesuar öner
- Eğer görsel bir elbise ise → ayakkabı, çanta, takı öner  
- Eğer görsel bir ayakkabı ise → uyumlu kıyafetler öner
- Renk uyumunu çok önemse (tamamlayıcı renkler dahil)
- Stil bütünlüğünü koru

YANIT FORMATI:
Sadece seçilen ürün ID'lerini JSON array olarak ver. ID'ler string veya sayısal olabilir:
["1", "2", "3"] veya [1, 2, 3] formatında

ÖNEMLİ: ID'ler yukarıdaki listeden birebir alınmalı
Başka açıklama ekleme, sadece JSON array döndür.`;

      const response = await this.geminiService.generateContent(prompt, {
        temperature: 0.7,
        maxOutputTokens: 500
      });

      console.log('🤖 AI Visual Matching response:', response.text);
      console.log('🤖 AI Response length:', response.text.length);
      console.log('🤖 AI Response first 100 chars:', response.text.substring(0, 100));

      // JSON parse et - daha tolerant parsing
      let cleanText = response.text.trim().replace(/```json|```/g, '');
      
      // Extract JSON array from response text - handle both string and numeric IDs
      const jsonMatch = cleanText.match(/\[([\s\S]*?)\]/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }
      
      let productIds;
      try {
        productIds = JSON.parse(cleanText);
      } catch (parseError) {
        // Fallback: extract both numbers and strings manually
        console.log('JSON parse failed, extracting IDs manually from:', cleanText);
        
        // Try to extract quoted strings first (for Firebase document IDs)
        const stringMatches = cleanText.match(/"([^"]+)"/g);
        if (stringMatches && stringMatches.length > 0) {
          productIds = stringMatches.map(s => s.replace(/"/g, ''));
          console.log('Extracted string IDs:', productIds);
        } else {
          // Fallback to numeric extraction
          const numbers = cleanText.match(/\d+/g);
          productIds = numbers ? numbers.map(n => parseInt(n)) : [];
          console.log('Extracted numeric IDs:', productIds);
        }
      }

      // Ürün ID'lerini gerçek ürünlerle eşleştir - handle both string and numeric IDs
      const matchedProducts = productIds
        .map(id => {
          // Try exact match first
          let product = allProducts.find(p => p.id === id);
          // If not found and id is string, try converting to number
          if (!product && typeof id === 'string' && !isNaN(id)) {
            product = allProducts.find(p => p.id === parseInt(id));
          }
          // If not found and id is number, try converting to string
          if (!product && typeof id === 'number') {
            product = allProducts.find(p => p.id === id.toString());
          }
          return product;
        })
        .filter(Boolean)
        .slice(0, maxRecommendations);

      console.log('✅ AI Visual Matching products:', matchedProducts.length);
      
      // If AI matching failed to find sufficient products, use algorithm fallback
      if (matchedProducts.length < maxRecommendations * 0.5) {
        console.log('⚠️ AI matching found insufficient products, using algorithm fallback');
        return this.getMatchingProductsWithAlgorithm(analysisResult, allProducts, maxRecommendations);
      }

      return {
        products: matchedProducts,
        matchingMethod: 'ai',
        confidence: matchedProducts.length >= maxRecommendations * 0.8 ? 'high' : 'medium'
      };

    } catch (error) {
      console.warn('AI visual matching failed, using algorithm fallback:', error);
      console.log('AI Response that failed to parse:', error.response || error.message);
      return this.getMatchingProductsWithAlgorithm(analysisResult, allProducts, maxRecommendations);
    }
  }

  // Algoritma tabanlı ürün eşleştirme
  getMatchingProductsWithAlgorithm(analysisResult, allProducts, maxRecommendations) {
    console.log('🔧 Using algorithm-based visual matching');

    try {
      // Analiz sonucundan anahtar kelimeleri çıkar
      const keywords = this.extractKeywords(analysisResult);
      const colors = this.extractColors(analysisResult);
      const categories = this.extractCategories(analysisResult);

      console.log('Extracted:', { keywords, colors, categories });

      // Ürünleri skorla
      const scoredProducts = allProducts
        .filter(p => p.stock > 0) // Stokta olanlar
        .map(product => {
          let score = 0;
          let matchReasons = [];

          // Kategori eşleşmesi - daha esnek
          categories.forEach(category => {
            const categoryLower = category.toLowerCase();
            const productName = product.name?.toLowerCase() || '';
            const productCategory = product.category?.toLowerCase() || '';
            const productDesc = product.description?.toLowerCase() || '';
            
            if (productCategory.includes(categoryLower) || 
                productName.includes(categoryLower) ||
                productDesc.includes(categoryLower)) {
              score += 30;
              matchReasons.push(`Kategori: ${category}`);
            }
          });

          // Renk eşleşmesi - daha kapsamlı
          colors.forEach(color => {
            const colorLower = color.toLowerCase();
            const productName = product.name?.toLowerCase() || '';
            const productDesc = product.description?.toLowerCase() || '';
            
            if (productName.includes(colorLower) || productDesc.includes(colorLower)) {
              score += 25;
              matchReasons.push(`Renk: ${color}`);
            }
          });

          // Anahtar kelime eşleşmesi
          keywords.forEach(keyword => {
            const keywordLower = keyword.toLowerCase();
            const productName = product.name?.toLowerCase() || '';
            const productDesc = product.description?.toLowerCase() || '';
            
            if (productName.includes(keywordLower) || productDesc.includes(keywordLower)) {
              score += 15;
              matchReasons.push(`Keyword: ${keyword}`);
            }
          });

          // Giyim kategorisi bonusu (eğer görsel giyim analizi ise)
          const clothingKeywords = ['shirt', 'gömlek', 'dress', 'elbise', 'pants', 'pantolon', 'jacket', 'ceket'];
          const hasClothingKeyword = clothingKeywords.some(kw => 
            analysisResult.toLowerCase().includes(kw)
          );
          
          if (hasClothingKeyword && (product.category?.toLowerCase().includes('giyim') || 
                                     product.category?.toLowerCase().includes('moda') ||
                                     product.category?.toLowerCase().includes('clothing'))) {
            score += 20;
            matchReasons.push('Giyim kategorisi');
          }

          // Kalite bonusu
          score += (product.rating || 0) * 5;

          // Stok bonusu
          if (product.stock > 10) score += 5;

          // Eğer hiç eşleşme yoksa rastgele bir skor ver (0-20 arası)
          if (score === 0) {
            score = Math.random() * 20;
            matchReasons.push('Genel öneri');
          }

          return { 
            ...product, 
            matchScore: score,
            matchReasons: matchReasons
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore);

      // En iyi eşleşenleri al, ama en az 3 ürün garantisi
      let selectedProducts = scoredProducts.slice(0, maxRecommendations);
      
      // Eğer yeterli ürün yoksa, popüler ürünlerle tamamla
      if (selectedProducts.length < 3) {
        const additionalProducts = allProducts
          .filter(p => p.stock > 0 && !selectedProducts.some(s => s.id === p.id))
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, maxRecommendations - selectedProducts.length);
        
        selectedProducts = [...selectedProducts, ...additionalProducts];
      }

      console.log('Algorithm matching results:', selectedProducts.map(p => ({
        name: p.name,
        score: p.matchScore,
        reasons: p.matchReasons
      })));

      return {
        products: selectedProducts,
        matchingMethod: 'algorithm',
        confidence: selectedProducts.length >= maxRecommendations * 0.7 ? 'medium' : 'low'
      };

    } catch (error) {
      console.error('Algorithm matching failed:', error);
      // En son çare: popüler ürünler
      const fallbackProducts = allProducts
        .filter(p => p.stock > 0)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, maxRecommendations);

      return {
        products: fallbackProducts,
        matchingMethod: 'fallback',
        confidence: 'low'
      };
    }
  }

  // Analiz sonucundan anahtar kelimeleri çıkar
  extractKeywords(analysisResult) {
    const text = analysisResult.toLowerCase();
    const keywords = [];

    // Giyim türleri
    const clothingTypes = ['shirt', 'gömlek', 'tshirt', 'tişört', 'dress', 'elbise', 'pants', 'pantolon', 'jeans', 'jacket', 'ceket', 'sweater', 'kazak', 'hoodie', 'sweatshirt'];
    clothingTypes.forEach(type => {
      if (text.includes(type)) keywords.push(type);
    });

    // Stiller
    const styles = ['casual', 'günlük', 'formal', 'resmi', 'elegant', 'şık', 'sporty', 'spor', 'vintage', 'modern', 'relaxed', 'fitted', 'slim'];
    styles.forEach(style => {
      if (text.includes(style)) keywords.push(style);
    });

    // Malzemeler
    const materials = ['cotton', 'pamuk', 'linen', 'keten', 'denim', 'kot', 'silk', 'ipek', 'wool', 'yün', 'polyester'];
    materials.forEach(material => {
      if (text.includes(material)) keywords.push(material);
    });

    return [...new Set(keywords)]; // Tekrarları kaldır
  }

  // Analiz sonucundan renkleri çıkar
  extractColors(analysisResult) {
    const text = analysisResult.toLowerCase();
    const colors = [];

    const colorMap = {
      'beige': ['beige', 'bej', 'krem', 'cream'],
      'white': ['white', 'beyaz', 'off-white'],
      'black': ['black', 'siyah'],
      'blue': ['blue', 'mavi', 'navy', 'lacivert'],
      'red': ['red', 'kırmızı'],
      'green': ['green', 'yeşil'],
      'brown': ['brown', 'kahverengi', 'tan'],
      'gray': ['gray', 'grey', 'gri'],
      'pink': ['pink', 'pembe'],
      'yellow': ['yellow', 'sarı']
    };

    Object.entries(colorMap).forEach(([color, variations]) => {
      variations.forEach(variation => {
        if (text.includes(variation)) {
          colors.push(color);
        }
      });
    });

    return [...new Set(colors)]; // Tekrarları kaldır
  }

  // Analiz sonucundan kategorileri çıkar
  extractCategories(analysisResult) {
    const text = analysisResult.toLowerCase();
    const categories = [];

    const categoryMap = {
      'Gömlek': ['shirt', 'gömlek', 'button-down', 'collar'],
      'T-shirt': ['t-shirt', 'tshirt', 'tişört'],
      'Pantolon': ['pants', 'pantolon', 'trousers', 'jeans'],
      'Elbise': ['dress', 'elbise'],
      'Ceket': ['jacket', 'ceket', 'blazer'],
      'Ayakkabı': ['shoe', 'ayakkabı', 'sneaker', 'boot'],
      'Aksesuar': ['accessory', 'aksesuar', 'bag', 'çanta', 'watch', 'saat']
    };

    Object.entries(categoryMap).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          categories.push(category);
        }
      });
    });

    return [...new Set(categories)]; // Tekrarları kaldır
  }

  // Tamamlayıcı ürün kategorilerini belirle
  getComplementaryCategories(mainCategory) {
    const complementaryMap = {
      'Gömlek': ['Pantolon', 'Ayakkabı', 'Aksesuar', 'Ceket'],
      'T-shirt': ['Pantolon', 'Ayakkabı', 'Ceket', 'Aksesuar'],
      'Pantolon': ['Gömlek', 'T-shirt', 'Ayakkabı', 'Ceket'],
      'Elbise': ['Ayakkabı', 'Aksesuar', 'Ceket'],
      'Ayakkabı': ['Pantolon', 'Gömlek', 'T-shirt', 'Elbise'],
      'Ceket': ['Gömlek', 'T-shirt', 'Pantolon']
    };

    return complementaryMap[mainCategory] || [];
  }
}

// Singleton instance
let visualSearchInstance = null;

export function getVisualSearchService() {
  if (!visualSearchInstance) {
    visualSearchInstance = new VisualSearchService();
  }
  return visualSearchInstance;
}

export default VisualSearchService;