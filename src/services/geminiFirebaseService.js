// Integration service between Firebase data and Gemini AI
import { getGeminiService, createGeminiService } from './geminiAPI';
import FirebaseService from './firebaseService';
import { getErrorMessage } from '../utils/helpers';

class GeminiFirebaseService {
  constructor(apiKey = null) {
    // Initialize with API key from context if provided
    if (apiKey) {
      this.geminiService = createGeminiService(apiKey);
    } else {
      this.geminiService = getGeminiService();
    }
  }
  
  // Update API key when it changes
  updateApiKey(apiKey) {
    if (apiKey) {
      this.geminiService = createGeminiService(apiKey);
    }
  }

  // Generate product recommendations based on user data and behavior
  async generateProductRecommendations(userId, options = {}) {
    console.log('🔍 Starting recommendation generation for user:', userId, 'with options:', options);
    try {
      const {
        maxRecommendations = 10,
        includeUserHistory = true,
        includeBehaviorAnalysis = true,
        useCache = true
      } = options;

      // Skip cache - always generate fresh recommendations
      console.log('🔄 Generating fresh recommendations (cache disabled)...');

      // Gather user data with error handling
      let userData = null;
      let userBehavior = [];
      let cartItems = [];
      let searchHistory = [];

      try {
        userData = await FirebaseService.getUser(userId);
      } catch (error) {
        console.warn('Could not fetch user data:', error);
      }

      try {
        userBehavior = includeUserHistory ? await FirebaseService.getUserBehavior(userId, 50) : [];
      } catch (error) {
        console.warn('Could not fetch user behavior:', error);
      }

      try {
        cartItems = await FirebaseService.getCartItems(userId);
      } catch (error) {
        console.warn('Could not fetch cart items:', error);
      }

      try {
        searchHistory = await FirebaseService.getSearchHistory(userId, 20);
      } catch (error) {
        console.warn('Could not fetch search history:', error);
      }
      
      // Get available products - fallback to local data if Firebase fails
      let products = [];
      try {
        products = await FirebaseService.getProducts({ limit: 100 });
      } catch (error) {
        console.warn('Could not fetch products from Firebase, using local data');
        // Import local products as fallback
        const { getAllProducts } = await import('../data/products');
        products = getAllProducts().slice(0, 100);
      }

      // Prepare data for Gemini
      const promptData = {
        user: userData ? {
          id: userData.id,
          preferences: userData.preferences || {},
          demographics: {
            age: userData.age,
            location: userData.location,
            gender: userData.gender
          }
        } : null,
        recentBehavior: userBehavior.slice(0, 10).map(behavior => ({
          action: behavior.action,
          productId: behavior.productId,
          category: behavior.category,
          timestamp: behavior.timestamp
        })),
        cartItems: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        searchHistory: searchHistory.slice(0, 10).map(search => ({
          query: search.query,
          timestamp: search.timestamp
        })),
        availableProducts: products.map(product => ({
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          rating: product.rating,
          tags: product.tags || []
        }))
      };

      const prompt = this.buildRecommendationPrompt(promptData, maxRecommendations);
      console.log('🤖 Calling Gemini API for recommendations...');
      
      let recommendations = [];
      try {
        const response = await this.geminiService.generateContent(prompt, {
          temperature: 0.7,
          maxOutputTokens: 1000
        });

        console.log('✅ Gemini API response received');
        console.log('🔍 Raw Gemini response:', response.text);
        // Parse recommendations from response
        recommendations = this.parseRecommendationsResponse(response.text, products);
        console.log('✅ Parsed recommendations:', recommendations.length);
      } catch (geminiError) {
        console.warn('⚠️ Gemini API failed, using fallback directly:', geminiError.message);
        // Directly use fallback if Gemini fails
        recommendations = this.generateFallbackRecommendations(products, promptData, maxRecommendations);
      }

      // Save recommendations to Firebase
      await FirebaseService.saveRecommendations(userId, recommendations, 'gemini');

      // Track this recommendation generation
      await FirebaseService.trackUserBehavior(userId, {
        action: 'recommendation_generated',
        count: recommendations.length,
        source: 'gemini'
      });

      return recommendations;
    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      
      // Fallback: return smart filtered products if Gemini fails
      try {
        console.log('🔄 Using fallback recommendation system...');
        const fallbackRecommendations = this.generateFallbackRecommendations(products, promptData, maxRecommendations);
        console.log('✅ Fallback recommendations generated:', fallbackRecommendations.length);
        return fallbackRecommendations;
      } catch (fallbackError) {
        console.error('❌ Fallback recommendations also failed:', fallbackError);
        throw new Error(`Failed to generate recommendations: ${getErrorMessage(error)}`);
      }
    }
  }

  // Generate fallback recommendations when Gemini AI fails
  generateFallbackRecommendations(products, promptData, maxRecommendations) {
    try {
      console.log('Generating fallback recommendations...');
      
      if (!products || products.length === 0) {
        return [];
      }

      // Simple algorithm: prioritize by rating and randomize
      const sortedProducts = products
        .filter(p => p && p.id) // Ensure valid products
        .sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA; // Higher rating first
        })
        .slice(0, maxRecommendations * 2) // Get more than needed
        .sort(() => Math.random() - 0.5) // Randomize
        .slice(0, maxRecommendations); // Final selection

      console.log(`Generated ${sortedProducts.length} fallback recommendations`);
      return sortedProducts;
    } catch (error) {
      console.error('Error in fallback recommendations:', error);
      return [];
    }
  }

  // Analyze user behavior and generate insights
  async analyzeUserBehavior(userId) {
    try {
      const userBehavior = await FirebaseService.getUserBehavior(userId, 100);
      const orders = await FirebaseService.getUserOrders(userId);
      const userData = await FirebaseService.getUser(userId);

      if (!userBehavior.length && !orders.length) {
        return {
          insights: ['New user - not enough data for analysis'],
          suggestions: ['Explore our popular categories', 'Add items to your wishlist'],
          confidence: 0.1
        };
      }

      const analysisData = {
        user: userData,
        behaviorHistory: userBehavior.map(b => ({
          action: b.action,
          category: b.category,
          productId: b.productId,
          timestamp: b.timestamp
        })),
        orderHistory: orders.map(o => ({
          items: o.items,
          total: o.total,
          category: o.category,
          timestamp: o.createdAt
        }))
      };

      const prompt = `
Analyze this user's shopping behavior and provide insights:

User Data: ${JSON.stringify(analysisData, null, 2)}

Please provide:
1. Key behavioral patterns
2. Shopping preferences
3. Recommended categories
4. Best times to engage
5. Potential interests

Return response as JSON with this structure:
{
  "insights": ["insight1", "insight2"],
  "preferences": {
    "categories": ["category1", "category2"],
    "priceRange": "budget/mid/premium",
    "shoppingStyle": "impulsive/research-based/seasonal"
  },
  "suggestions": ["suggestion1", "suggestion2"],
  "engagement": {
    "bestTimes": ["morning", "evening"],
    "frequency": "weekly/monthly"
  },
  "confidence": 0.8
}
`;

      const response = await this.geminiService.generateContent(prompt, {
        temperature: 0.3,
        maxOutputTokens: 800
      });

      const analysis = this.parseJsonResponse(response.text);

      // Save analysis insights
      await FirebaseService.trackUserBehavior(userId, {
        action: 'behavior_analysis',
        insights: analysis.insights,
        confidence: analysis.confidence
      });

      return analysis;
    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      throw new Error(`Failed to analyze user behavior: ${getErrorMessage(error)}`);
    }
  }

  // Smart search using Gemini + Firebase data
  async smartSearch(userId, searchQuery, options = {}) {
    try {
      const {
        includePersonalization = true,
        maxResults = 20,
        categoryFilter = null
      } = options;

      // Get products from Firebase
      const filters = {};
      if (categoryFilter) filters.category = categoryFilter;
      const products = await FirebaseService.getProducts(filters);

      // Get user context for personalization
      let userContext = {};
      if (includePersonalization && userId) {
        const userData = await FirebaseService.getUser(userId);
        const recentBehavior = await FirebaseService.getUserBehavior(userId, 10);
        const searchHistory = await FirebaseService.getSearchHistory(userId, 5);
        
        userContext = {
          preferences: userData?.preferences || {},
          recentViews: recentBehavior.filter(b => b.action === 'view_product'),
          searchHistory: searchHistory.map(s => s.query)
        };
      }

      const prompt = `
You are a smart product search assistant. Given a search query and product catalog, find the most relevant products.

Search Query: "${searchQuery}"

User Context: ${JSON.stringify(userContext, null, 2)}

Available Products: ${JSON.stringify(products.map(p => ({
  id: p.id,
  name: p.name,
  description: p.description,
  category: p.category,
  price: p.price,
  tags: p.tags || [],
  rating: p.rating
})), null, 2)}

Instructions:
1. Match products based on query relevance
2. Consider user preferences and history for personalization
3. Rank results by relevance score
4. Return maximum ${maxResults} results

Return response as JSON array:
[
  {
    "productId": "id",
    "relevanceScore": 0.95,
    "matchReason": "why this product matches"
  }
]

Sort by relevanceScore (highest first).
`;

      const response = await this.geminiService.generateContent(prompt, {
        temperature: 0.2,
        maxOutputTokens: 1500
      });

      const searchResults = this.parseJsonResponse(response.text);
      
      // Get full product details for results
      const detailedResults = searchResults
        .map(result => {
          const product = products.find(p => p.id === result.productId);
          return product ? {
            ...product,
            relevanceScore: result.relevanceScore,
            matchReason: result.matchReason
          } : null;
        })
        .filter(Boolean)
        .slice(0, maxResults);

      // Save search query
      if (userId) {
        await FirebaseService.saveSearchQuery(userId, searchQuery, detailedResults);
        
        // Track search behavior
        await FirebaseService.trackUserBehavior(userId, {
          action: 'smart_search',
          query: searchQuery,
          resultsCount: detailedResults.length
        });
      }

      return detailedResults;
    } catch (error) {
      console.error('Error in smart search:', error);
      throw new Error(`Smart search failed: ${getErrorMessage(error)}`);
    }
  }

  // Generate product descriptions using Gemini
  async generateProductDescription(productData) {
    try {
      const prompt = `
Create an engaging and informative product description for this product:

Product: ${JSON.stringify(productData, null, 2)}

Requirements:
- Highlight key features and benefits
- Use persuasive but honest language
- Include technical specifications if relevant
- Keep it concise but informative
- Make it SEO-friendly

Return only the description text, no additional formatting.
`;

      const response = await this.geminiService.generateContent(prompt, {
        temperature: 0.6,
        maxOutputTokens: 500
      });

      return response.text.trim();
    } catch (error) {
      console.error('Error generating product description:', error);
      throw new Error(`Failed to generate description: ${getErrorMessage(error)}`);
    }
  }

  // Content generation for personalized marketing
  async generatePersonalizedContent(userId, contentType = 'email') {
    try {
      const userData = await FirebaseService.getUser(userId);
      const recentBehavior = await FirebaseService.getUserBehavior(userId, 20);
      const recommendations = await FirebaseService.getRecommendations(userId);

      const prompt = `
Generate personalized ${contentType} content for this user:

User: ${JSON.stringify(userData, null, 2)}
Recent Activity: ${JSON.stringify(recentBehavior, null, 2)}
Recommendations: ${JSON.stringify(recommendations, null, 2)}

Create engaging, personalized content that:
- Addresses the user by name
- References their interests/recent activity
- Includes relevant product recommendations
- Has a clear call-to-action
- Maintains professional tone

Return the content ready to use.
`;

      const response = await this.geminiService.generateContent(prompt, {
        temperature: 0.7,
        maxOutputTokens: 1000
      });

      return response.text;
    } catch (error) {
      console.error('Error generating personalized content:', error);
      throw new Error(`Failed to generate content: ${getErrorMessage(error)}`);
    }
  }

  // Helper methods
  buildRecommendationPrompt(data, maxRecommendations) {
    const userContext = data.user ? `
KULLANICI PROFİLİ:
- Yaş: ${data.user.demographics?.age || 'Bilinmiyor'}
- Lokasyon: ${data.user.demographics?.location || 'Bilinmiyor'}
- Favori kategoriler: ${data.user.preferences?.categories?.join(', ') || 'Yok'}
- Fiyat aralığı tercihi: ${data.user.preferences?.priceRange || 'Belirtilmemiş'}
` : 'Kullanıcı profili: Anonim kullanıcı';

    const behaviorContext = data.recentBehavior?.length > 0 ? `
SON DAVRANIŞLAR:
${data.recentBehavior.map(b => `- ${b.action}: ${b.productId} (${b.category}) - ${b.timestamp}`).join('\n')}
` : 'Son davranış: Yok';

    const cartContext = data.cartItems?.length > 0 ? `
SEPETTEKİ ÜRÜNLER:
${data.cartItems.map(item => `- Ürün ID: ${item.productId} (Adet: ${item.quantity})`).join('\n')}
` : 'Sepet: Boş';

    const searchContext = data.searchHistory?.length > 0 ? `
ARAMA GEÇMİŞİ:
${data.searchHistory.map(search => `- "${search.query}" - ${search.timestamp}`).join('\n')}
` : 'Arama geçmişi: Yok';

    return `Sen akıllı bir e-ticaret ürün öneri sistemisin. Türkiye'deki kullanıcılar için en uygun ${maxRecommendations} ürün öner.

${userContext}

${behaviorContext}

${cartContext}

${searchContext}

MEVCUT ÜRÜNLER:
${data.availableProducts.map(p => `
- ID: ${p.id}
- İsim: ${p.name}
- Kategori: ${p.category}
- Fiyat: ₺${p.price}
- Puan: ${p.rating}/5
- Etiketler: ${p.tags?.join(', ') || 'Yok'}
`).join('')}

GÖREV:
1. Kullanıcının demografik bilgilerini dikkate al
2. Son davranışlarına göre ilgi alanlarını belirle
3. Sepetindeki ürünlerle uyumlu tamamlayıcı ürünler öner
4. Arama geçmişinden ilgi alanlarını çıkar
5. Farklı kategorilerden çeşitlilik sağla
6. Fiyat-performans dengesini koru
7. Yüksek puanlı ürünleri tercih et

TÜRKÇE DÜŞÜN:
- Kullanıcı hangi yaş grubunda?
- Hangi kategorilere ilgisi var?
- Bütçesi nasıl?
- Hangi markalar tercih edebilir?
- Sezonsal faktörler var mı?

YANIT FORMATI:
Sadece ürün ID'lerini JSON array olarak ver:
["id1", "id2", "id3", "id4", "id5", "id6"]

Başka açıklama ekleme, sadece JSON array döndür.`;
  }

  parseRecommendationsResponse(responseText, allProducts) {
    try {
      // Clean the response text
      const cleanText = responseText.trim().replace(/```json|```/g, '');
      console.log('🔍 Cleaned response text:', cleanText);
      
      const productIds = JSON.parse(cleanText);
      console.log('🔍 Parsed product IDs:', productIds);
      console.log('🔍 Available product IDs:', allProducts.map(p => p.id).slice(0, 10));
      
      // Get full product details - try both id and firebaseId
      const recommendations = productIds
        .map(id => {
          const found = allProducts.find(p => 
            p.id === id || 
            p.firebaseId === id || 
            p.id === String(id) || 
            p.firebaseId === String(id)
          );
          if (!found) {
            console.log(`⚠️ Product ID ${id} not found in products`);
          }
          return found;
        })
        .filter(Boolean);
      
      console.log('✅ Found products:', recommendations.map(p => p.name));
      return recommendations;
    } catch (error) {
      console.error('❌ Error parsing recommendations:', error);
      console.log('📄 Response text that failed to parse:', responseText);
      // Fallback: return some random products
      return allProducts.slice(0, 5);
    }
  }

  parseJsonResponse(responseText) {
    try {
      const cleanText = responseText.trim().replace(/```json|```/g, '');
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new Error('Invalid response format from AI service');
    }
  }

  // Test the integration
  async testIntegration() {
    try {
      // Test Firebase connection
      const firebaseTest = await FirebaseService.checkConnection();
      
      // Test Gemini connection
      const geminiTest = await this.geminiService.testConnection();
      
      return {
        firebase: firebaseTest,
        gemini: geminiTest,
        integration: {
          success: firebaseTest.success && geminiTest.success,
          message: 'Firebase + Gemini integration ready'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Integration test failed: ${getErrorMessage(error)}`
      };
    }
  }
}

// Create singleton instance
let geminiFirebaseInstance = null;

export function getGeminiFirebaseService(apiKey = null) {
  if (!geminiFirebaseInstance) {
    geminiFirebaseInstance = new GeminiFirebaseService(apiKey);
  } else if (apiKey) {
    // Update existing instance with new API key
    geminiFirebaseInstance.updateApiKey(apiKey);
  }
  return geminiFirebaseInstance;
}

export default GeminiFirebaseService;