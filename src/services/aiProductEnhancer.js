// AI-Powered Product Data Enhancer
// Generates rich semantic attributes for products using AI

import { getGeminiService } from './geminiAPI';

class AIProductEnhancer {
  constructor() {
    this.geminiService = getGeminiService();
  }

  // Generate comprehensive AI attributes for a product
  async enhanceProduct(product, apiKey) {
    try {
      console.log('🧠 AI-enhancing product:', product.name);
      
      this.geminiService.setApiKey(apiKey);
      
      const prompt = this.buildEnhancementPrompt(product);
      const response = await this.geminiService.generateContent(prompt, {
        temperature: 0.7,
        maxOutputTokens: 1500
      });

      const enhancement = this.parseEnhancementResponse(response.text);
      
      // Merge with original product
      const enhancedProduct = {
        ...product,
        aiEnhanced: true,
        aiAttributes: enhancement,
        enhancedAt: new Date().toISOString(),
        // Flatten some key attributes for easy access
        semanticTags: enhancement.semanticTags || [],
        emotionalTriggers: enhancement.emotionalTriggers || [],
        useContexts: enhancement.useContexts || [],
        styleAttributes: enhancement.styleAttributes || {},
        targetPersonas: enhancement.targetPersonas || []
      };

      console.log('✅ Product enhanced with AI attributes:', Object.keys(enhancement));
      return enhancedProduct;

    } catch (error) {
      console.error('❌ AI enhancement failed:', error);
      return {
        ...product,
        aiEnhanced: false,
        enhancementError: error.message
      };
    }
  }

  buildEnhancementPrompt(product) {
    return `Sen uzman bir ürün analisti ve pazarlama uzmanısın. Bu ürünü kapsamlı olarak analiz et ve zengin semantik özellikler çıkar.

ÜRÜN BİLGİLERİ:
- İsim: ${product.name}
- Kategori: ${product.category}
- Marka: ${product.brand || 'Bilinmiyor'}
- Fiyat: ₺${product.price}
- Açıklama: ${product.description}
- Puan: ${product.rating}/5

GÖREV: Bu ürün için aşağıdaki kategorilerde detaylı analiz yap:

1. SEMANTİK ETIKETLER (semanticTags):
   - Ürünün temel özelliklerini tanımlayan 15-20 etiket
   - Örnek: ["premium", "minimalist", "çok_amaçlı", "dayanıklı", "şık"]

2. DUYGUSAL TETİKLEYİCİLER (emotionalTriggers):
   - Bu ürünün uyandırdığı duygular ve hisler
   - Örnek: ["güven", "prestij", "rahatlık", "özgürlük", "başarı_hissi"]

3. KULLANIM BAĞLAMLARI (useContexts):
   - Ürünün kullanılabileceği durumlar ve ortamlar
   - Örnek: ["iş_toplantısı", "günlük_hayat", "özel_davet", "spor", "seyahat"]

4. STİL ÖZELLİKLERİ (styleAttributes):
   - aesthetic: Modern/Klasik/Vintage/Minimalist
   - formality: Casual/Semi-formal/Formal
   - complexity: Basit/Orta/Karmaşık
   - uniqueness: Yaygın/Özel/Nadir

5. HEDEF KİŞİLİKLER (targetPersonas):
   - Bu ürünü tercih edecek kişilik tipleri
   - Örnek: ["profesyonel_çalışan", "spor_seven", "moda_takipçisi", "pratik_odaklı"]

6. YAŞAM TARZI UYUMU (lifestyleMatch):
   - Hangi yaşam tarzlarına uygun
   - Örnek: ["aktif_yaşam", "lüks_yaşam", "minimalist_yaşam", "aile_odaklı"]

7. FİYAT PSİKOLOJİSİ (pricePerception):
   - value_proposition: "premium", "budget", "mid_range"
   - price_sensitivity: "düşük", "orta", "yüksek"
   - quality_expectation: "temel", "standart", "premium", "lüks"

8. SEASONAL UYUM (seasonality):
   - Hangi mevsimlerde daha uygun
   - Örnek: ["ilkbahar", "yaz", "sonbahar", "kış", "tüm_mevsim"]

9. KOMBİNASYON ÖNERİLERİ (combinationSuggestions):
   - Bu ürünle iyi gidecek ürün kategorileri
   - Örnek: ["pantolon", "ayakkabı", "aksesuar", "çanta"]

10. REKABET ANALİZİ (competitivePosition):
    - Benzer ürünlerle karşılaştırıldığında güçlü yönler
    - Örnek: ["fiyat_avantajı", "kalite_üstünlüğü", "tasarım_farklılığı"]

YANIT FORMATI:
Sadece JSON formatında döndür:

{
  "semanticTags": ["tag1", "tag2", ...],
  "emotionalTriggers": ["emotion1", "emotion2", ...],
  "useContexts": ["context1", "context2", ...],
  "styleAttributes": {
    "aesthetic": "Modern",
    "formality": "Casual",
    "complexity": "Basit",
    "uniqueness": "Özel"
  },
  "targetPersonas": ["persona1", "persona2", ...],
  "lifestyleMatch": ["lifestyle1", "lifestyle2", ...],
  "pricePerception": {
    "value_proposition": "mid_range",
    "price_sensitivity": "orta",
    "quality_expectation": "standart"
  },
  "seasonality": ["mevsim1", "mevsim2", ...],
  "combinationSuggestions": ["kategori1", "kategori2", ...],
  "competitivePosition": ["avantaj1", "avantaj2", ...]
}

ÖNEMLİ: Sadece JSON döndür, başka açıklama ekleme!`;
  }

  parseEnhancementResponse(responseText) {
    try {
      const cleanText = responseText.trim().replace(/```json|```/g, '');
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('❌ Failed to parse AI enhancement:', error);
      return this.generateFallbackEnhancement();
    }
  }

  generateFallbackEnhancement() {
    return {
      semanticTags: ["genel_ürün", "standart_kalite", "kullanışlı"],
      emotionalTriggers: ["güven", "memnuniyet"],
      useContexts: ["günlük_kullanım"],
      styleAttributes: {
        aesthetic: "Modern",
        formality: "Casual",
        complexity: "Basit",
        uniqueness: "Yaygın"
      },
      targetPersonas: ["genel_kullanıcı"],
      lifestyleMatch: ["standart_yaşam"],
      pricePerception: {
        value_proposition: "mid_range",
        price_sensitivity: "orta",
        quality_expectation: "standart"
      },
      seasonality: ["tüm_mevsim"],
      combinationSuggestions: ["aksesuar"],
      competitivePosition: ["standart_seçenek"]
    };
  }

  // Batch enhance multiple products
  async enhanceProductBatch(products, apiKey, batchSize = 8) {
    console.log(`🚀 Batch enhancing ${products.length} products...`);
    
    const enhanced = [];
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(products.length/batchSize)}`);
      
      const batchPromises = batch.map(product => 
        this.enhanceProduct(product, apiKey)
      );
      
      const batchResults = await Promise.all(batchPromises);
      enhanced.push(...batchResults);
      
      // Rate limiting - wait 200ms between batches (faster)
      if (i + batchSize < products.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`✅ Batch enhancement completed: ${enhanced.length} products`);
    return enhanced;
  }

  // Create AI similarity score between two products
  calculateAISimilarity(product1, product2) {
    if (!product1.aiAttributes || !product2.aiAttributes) {
      return 0.5; // Neutral similarity if no AI data
    }

    let similarityScore = 0;
    let factors = 0;

    // Semantic tags similarity
    const tags1 = new Set(product1.aiAttributes.semanticTags || []);
    const tags2 = new Set(product2.aiAttributes.semanticTags || []);
    const tagIntersection = new Set([...tags1].filter(x => tags2.has(x)));
    const tagUnion = new Set([...tags1, ...tags2]);
    if (tagUnion.size > 0) {
      similarityScore += (tagIntersection.size / tagUnion.size) * 0.3;
      factors += 0.3;
    }

    // Style attributes similarity
    const style1 = product1.aiAttributes.styleAttributes || {};
    const style2 = product2.aiAttributes.styleAttributes || {};
    let styleMatches = 0;
    let styleTotal = 0;
    Object.keys({...style1, ...style2}).forEach(key => {
      if (style1[key] && style2[key]) {
        styleTotal++;
        if (style1[key] === style2[key]) styleMatches++;
      }
    });
    if (styleTotal > 0) {
      similarityScore += (styleMatches / styleTotal) * 0.25;
      factors += 0.25;
    }

    // Use contexts similarity
    const contexts1 = new Set(product1.aiAttributes.useContexts || []);
    const contexts2 = new Set(product2.aiAttributes.useContexts || []);
    const contextIntersection = new Set([...contexts1].filter(x => contexts2.has(x)));
    const contextUnion = new Set([...contexts1, ...contexts2]);
    if (contextUnion.size > 0) {
      similarityScore += (contextIntersection.size / contextUnion.size) * 0.25;
      factors += 0.25;
    }

    // Target personas similarity
    const personas1 = new Set(product1.aiAttributes.targetPersonas || []);
    const personas2 = new Set(product2.aiAttributes.targetPersonas || []);
    const personaIntersection = new Set([...personas1].filter(x => personas2.has(x)));
    const personaUnion = new Set([...personas1, ...personas2]);
    if (personaUnion.size > 0) {
      similarityScore += (personaIntersection.size / personaUnion.size) * 0.2;
      factors += 0.2;
    }

    return factors > 0 ? similarityScore / factors : 0.5;
  }
}

// Singleton instance
let aiProductEnhancerInstance = null;

export function getAIProductEnhancer() {
  if (!aiProductEnhancerInstance) {
    aiProductEnhancerInstance = new AIProductEnhancer();
  }
  return aiProductEnhancerInstance;
}

export default AIProductEnhancer;