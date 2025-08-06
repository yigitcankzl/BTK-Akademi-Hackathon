import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, TrendingUp, ArrowRight, Zap, User, ShoppingBag, Eye, RefreshCw, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useFirebase } from '../hooks/useFirebase';
import { useGemini } from '../hooks/useGemini';
import ProductCard from '../components/ecommerce/ProductCard';
import productService from '../services/ecommerce/productService';
import cartService from '../services/ecommerce/cartService';
import { getAdvancedAIRecommendationService } from '../services/advancedAIRecommendationService';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const Recommendations = () => {
  const { state } = useApp();
  const { settings, cart, user, products } = state;
  const { getRecommendations, trackBehavior } = useFirebase();
  const { generateContent } = useGemini();
  const [recommendations, setRecommendations] = useState(products.recommendations || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendationType, setRecommendationType] = useState('trending');
  const [aiInsight, setAiInsight] = useState('');

  // Dynamic loading messages based on recommendation type
  const getLoadingTitle = () => {
    const messages = {
      'trending': '📈 Trend Analizi',
      'personalized': '👤 Kişisel Analiz',
      'similar': '🔍 Benzerlik Analizi',
      'cart-based': '🛒 Sepet Analizi',
      'advanced-ai': '🧠 Gelişmiş AI Analizi'
    };
    return messages[recommendationType] || '🤖 AI Analizi';
  };

  const getLoadingDescription = () => {
    const descriptions = {
      'trending': 'Popüler ürünler ve trendler analiz ediliyor...',
      'personalized': 'Sizin için özel öneriler hazırlanıyor...',
      'similar': 'Benzer ürünler ve tercihler inceleniyor...',
      'cart-based': 'Sepetinizdeki ürünlere uygun öneriler bulunuyor...',
      'advanced-ai': 'Psikolojik profil ve bağlamsal faktörler analiz ediliyor...'
    };
    return descriptions[recommendationType] || 'Öneriler hazırlanıyor...';
  };

  // Özel sepet bazlı Gemini AI çağrısı
  const getCartBasedGeminiRecommendations = async (userId, allProducts, cartItems) => {
    console.log('🛒🤖 Calling Gemini for cart-based recommendations...');
    
    try {
      const userProfile = user?.profile || {};
      
      // Sepetteki ürünlerin detaylarını al
      const cartProductDetails = cartItems.map(item => {
        const product = allProducts.find(p => p.id === item.productId);
        return product ? {
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          quantity: item.quantity
        } : null;
      }).filter(Boolean);
      
      const prompt = `Sen akıllı bir e-ticaret sepet analizi uzmanısın. Kullanıcının sepetindeki ürünleri analiz ederek 6 tane mükemmel tamamlayıcı ürün öner.

KULLANICI: ${userProfile.displayName || 'Anonim kullanıcı'}

SEPETTEKİ ÜRÜNLER (${cartItems.length} adet):
${cartProductDetails.map(item => `📦 ${item.name} (${item.category}) - ₺${item.price} x${item.quantity} adet`).join('\n')}

SEPET ANALİZİ GÖREVN:
1. 🎯 Sepet temasını belirle (spor, teknoloji, moda, vs.)
2. 🔗 Tamamlayıcı ürünler bul (aksesuarlar, benzer kategoriler)
3. 💰 Fiyat uyumluluğunu koru (benzer fiyat aralığı)
4. 🌟 Yüksek puanlı alternatifler seç
5. 🎨 Çeşitlilik sağla ama uyumlu kal

MEVCUT ÜRÜNLER (seçenekler):
${allProducts.slice(0, 25).map(p => `- ID: ${p.id}, İsim: ${p.name}, Kategori: ${p.category}, Fiyat: ₺${p.price}, Puan: ${p.rating}/5`).join('\n')}

AKILLI ÖNERİ STRATEJİSİ:
- Sepette Nike ayakkabı var → Adidas, spor kıyafeti, spor aksesuarları öner
- Sepette iPhone var → Apple aksesuarları, kablosuz şarj, kılıf öner  
- Sepette gömlek var → Pantolon, ayakkabı, kemer gibi kombinleyici öner
- Fiyat ortalaması ₺500 → ₺300-800 aralığından seç

ÖNEMLİ: Sadece JSON array formatında ürün ID'lerini döndür:
[1, 2, 3, 4, 5, 6]

Başka hiçbir açıklama ekleme, sadece sayısal ID'leri içeren JSON array döndür.`;

      const response = await generateContent(prompt);
      console.log('🛒🤖 Cart-based Gemini response:', response.text);
      
      // Safely parse JSON with multiple attempts
      let productIds = [];
      try {
        // Try to extract JSON from response
        const cleanText = response.text.trim().replace(/```json|```/g, '');
        console.log('🛒🔍 Cleaned response:', cleanText);
        
        // Try direct JSON parse first
        productIds = JSON.parse(cleanText);
      } catch (parseError) {
        console.log('🛒⚠️ Direct JSON parse failed, trying to extract array...');
        
        // Try to find array pattern in the text
        const arrayMatch = response.text.match(/\[([\s\S]*?)\]/);
        if (arrayMatch) {
          try {
            productIds = JSON.parse(arrayMatch[0]);
            console.log('🛒✅ Extracted array from response:', productIds);
          } catch (arrayError) {
            console.log('🛒❌ Array extraction failed, using fallback');
            // Fallback: extract numbers from text
            const numbers = response.text.match(/\d+/g);
            productIds = numbers ? numbers.slice(0, 6) : [];
          }
        } else {
          // Last fallback: extract any numbers
          const numbers = response.text.match(/\d+/g);
          productIds = numbers ? numbers.slice(0, 6) : [];
        }
      }
      
      console.log('🛒📋 Final product IDs:', productIds);
      
      // Ürün ID'lerini gerçek ürünlerle eşleştir
      const recommendedProducts = productIds
        .map(id => {
          // Try both string and number matching
          const found = allProducts.find(p => 
            p.id === id || 
            p.id === String(id) || 
            p.id === Number(id) ||
            p.firebaseId === id ||
            p.firebaseId === String(id)
          );
          if (!found) {
            console.log(`🛒⚠️ Product not found for ID: ${id}`);
          }
          return found;
        })
        .filter(Boolean)
        .slice(0, 6);
      
      console.log('🛒✅ Cart-based Gemini recommendations:', recommendedProducts.map(p => `${p.name} (${p.category})`));
      return recommendedProducts;
      
    } catch (error) {
      console.error('🛒❌ Cart-based Gemini call failed:', error);
      return [];
    }
  };

  // Direkt Gemini AI çağrısı
  const getDirectGeminiRecommendations = async (userId, allProducts) => {
    console.log('🤖 Calling Gemini directly for recommendations...');
    
    try {
      const userProfile = user?.profile || {};
      const cartItems = cart?.items || [];
      
      const prompt = `Sen akıllı bir e-ticaret ürün öneri uzmanısın. Aşağıdaki kullanıcı için 6 ürün öner:

KULLANICI BİLGİLERİ:
- ID: ${userId}
- Profil: ${userProfile.displayName || 'Anonim kullanıcı'}
- Email: ${userProfile.email || 'Bilinmiyor'}

SEPETTEKİ ÜRÜNLER:
${cartItems.length > 0 ? cartItems.map(item => `- Ürün ID: ${item.productId}, Miktar: ${item.quantity}`).join('\n') : 'Sepet boş'}

MEVCUT ÜRÜNLER (${allProducts.length} adet):
${allProducts.slice(0, 20).map(p => `- ID: ${p.id}, İsim: ${p.name}, Kategori: ${p.category}, Fiyat: ₺${p.price}, Puan: ${p.rating}/5`).join('\n')}

GÖREV:
1. Kullanıcının profiline uygun ürünler seç
2. Sepetindeki ürünlerle uyumlu tamamlayıcı ürünler öner
3. Farklı kategorilerden çeşitlilik sağla
4. Fiyat-performans dengesini koru
5. Yüksek puanlı ürünleri tercih et

YANITINI SADECE ÜRÜN ID'LERİ OLARAK VER:
Örnek: ["prod1", "prod2", "prod3", "prod4", "prod5", "prod6"]

Başka açıklama ekleme, sadece JSON array döndür.`;

      const response = await generateContent(prompt);
      console.log('🤖 Gemini raw response:', response.text);
      
      // JSON parse et
      const cleanText = response.text.trim().replace(/```json|```/g, '');
      const productIds = JSON.parse(cleanText);
      
      // Ürün ID'lerini gerçek ürünlerle eşleştir
      const recommendedProducts = productIds
        .map(id => allProducts.find(p => p.id === id))
        .filter(Boolean)
        .slice(0, 6);
      
      console.log('✅ Gemini recommendations:', recommendedProducts.map(p => p.name));
      return recommendedProducts;
      
    } catch (error) {
      console.error('❌ Direct Gemini call failed:', error);
      return [];
    }
  };

  const recommendationTypes = [
    {
      id: 'trending',
      title: 'Trend Ürünler',
      description: 'En popüler ve trend olan ürünler',
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      id: 'personalized',
      title: 'Kişiselleştirilmiş',
      description: 'Alışveriş geçmişinize göre öneriler',
      icon: User,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      id: 'cart-based',
      title: 'Sepet Bazlı',
      description: 'Sepetinizdeki ürünlere uygun öneriler',
      icon: ShoppingBag,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      id: 'advanced-ai',
      title: 'Gelişmiş AI',
      description: 'Psikoloji ve bağlam analizi ile akıllı öneriler',
      icon: Brain,
      color: 'text-pink-600 dark:text-pink-400', 
      bgColor: 'bg-pink-100 dark:bg-pink-900/20'
    }
  ];

  useEffect(() => {
    // Set user ID in cart service when user changes
    if (user?.profile?.id) {
      cartService.setUserId(user.profile.id);
    } else {
      cartService.setUserId(null);
    }
    generateRecommendations();
  }, [recommendationType, user?.profile?.id]);

  const generateRecommendations = async () => {
    setIsGenerating(true);
    
    try {
      // Debug user state
      console.log('Current user state:', user);
      console.log('User ID:', user?.profile?.id || user?.id || 'No user ID found');
      
      // Get the correct user ID  
      const userId = user?.profile?.id || user?.id || user?.uid || 'anonymous';
      
      // Track user behavior
      if (userId) {
        await trackBehavior(userId, 'view_recommendations', {
          type: recommendationType,
          page: 'recommendations'
        });
      }

      if (recommendationType === 'advanced-ai' && userId && settings.geminiApiKey) {
        // Use Advanced AI recommendation system
        console.log('🧠 Using Advanced AI recommendation system...');
        
        try {
          const advancedAI = getAdvancedAIRecommendationService();
          const result = await advancedAI.getAdvancedRecommendations(userId, {
            apiKey: settings.geminiApiKey,
            contextType: 'browsing',
            contextData: {
              currentPage: 'recommendations',
              cartItems: cart?.items || [],
              recentViews: products.recentlyViewed || []
            },
            userProfile: user?.profile || {},
            maxRecommendations: 6
          });

          if (result.success && result.recommendations.length > 0) {
            setRecommendations(result.recommendations);
            setAiInsight(`🧠 Gelişmiş AI analizi: ${result.recommendations.length} ürün psikolojik profil ve bağlam analizine göre önerildi. Confidence: ${(result.recommendations[0]?.aiRecommendation?.confidence * 100).toFixed(0)}%`);
            console.log('✅ Advanced AI recommendations:', result.recommendations.map(p => p.name));
            setIsGenerating(false);
            return;
          }
        } catch (error) {
          console.error('❌ Advanced AI failed:', error);
          setAiInsight('⚠️ Gelişmiş AI sistemi geçici olarak kullanılamıyor, standart öneriler gösteriliyor.');
        }
      } else if (recommendationType === 'personalized' && userId) {
        // Use Firebase + Gemini integration for personalized recommendations
        const recommendationOptions = {
          maxRecommendations: 6,
          includeUserHistory: true,
          includeBehaviorAnalysis: true,
          useCache: false // Cache disabled to avoid stale recommendations
        };
        
        console.log('🤖 Trying to get Gemini AI recommendations for user:', userId);
        
        // Firebase AI sistemi çalışmazsa direkt Gemini'ye sor
        let firebaseRecommendations = [];
        let usedDirectGemini = false;
        
        try {
          firebaseRecommendations = await getRecommendations(userId, recommendationOptions);
          console.log('📊 Firebase recommendations result:', firebaseRecommendations);
        } catch (fbError) {
          console.warn('⚠️ Firebase failed, trying direct Gemini call...');
          usedDirectGemini = true;
          
          // Get products first for Gemini call
          let allProductsForGemini = [];
          try {
            const result = await productService.getProducts({ limit: 50 });
            allProductsForGemini = result.products;
          } catch (productError) {
            const { getAllProducts } = await import('../data/products');
            allProductsForGemini = getAllProducts().slice(0, 50);
          }
          
          try {
            firebaseRecommendations = await getDirectGeminiRecommendations(userId, allProductsForGemini);
          } catch (geminiError) {
            // If both Firebase and direct Gemini fail, throw to use fallback
            throw new Error('AI services temporarily overloaded');
          }
        }
        
        if (firebaseRecommendations && firebaseRecommendations.length > 0) {
          setRecommendations(firebaseRecommendations);
          setAiInsight(usedDirectGemini 
            ? '🤖 Gemini AI kullanılarak profiliniz, sepetiniz ve tercihleriniz analiz edilerek özellikle sizin için seçildi. Gerçek zamanlı AI analizi!'
            : '📊 Firebase ve Gemini AI kullanılarak kişisel tercihleriniz, alışveriş geçmişiniz ve davranış analiziniz dikkate alınarak özellikle sizin için seçildi.'
          );
        } else {
          // Generate smart personalized recommendations without AI
          console.log('No Firebase recommendations, generating smart local recommendations');
          try {
            const { products: allProducts } = await productService.getProducts({ limit: 50 });
            
            // Enhanced Smart algorithm: category diversity + quality focus
            console.log('🔧 Using enhanced smart algorithm for personalized recommendations');
            
            const categories = [...new Set(allProducts.map(p => p.category))];
            let smartRecommendations = [];
            
            // Get top products from each category with scoring
            categories.forEach(category => {
              const categoryProducts = allProducts
                .filter(p => p.category === category && p.stock > 0)
                .map(product => ({
                  ...product,
                  smartScore: (product.rating || 0) * 10 + // Rating factor
                             (product.stock > 10 ? 5 : 0) + // Stock bonus
                             (product.discount > 0 ? 3 : 0) + // Discount bonus
                             Math.random() * 2 // Small randomness
                }))
                .sort((a, b) => b.smartScore - a.smartScore)
                .slice(0, 2); // Top 2 per category
              smartRecommendations.push(...categoryProducts);
            });
            
            // Add trending/popular products
            const trendingProducts = allProducts
              .filter(p => p.stock > 0 && !smartRecommendations.some(r => r.id === p.id))
              .sort((a, b) => (b.rating || 0) * (b.reviewCount || 1) - (a.rating || 0) * (a.reviewCount || 1))
              .slice(0, 3);
            smartRecommendations.push(...trendingProducts);
            
            // Final selection with variety
            const finalRecommendations = smartRecommendations
              .slice(0, 12) // Take more options
              .sort(() => Math.random() - 0.5) // Shuffle for variety
              .slice(0, 6); // Final 6
            
            setRecommendations(finalRecommendations);
            setAiInsight('🔧 Akıllı algoritma ile farklı kategorilerden en popüler ve yüksek puanlı ürünler seçildi. AI servisleri geçici olarak yoğun - yakında daha kişisel öneriler!');
          } catch (productError) {
            console.warn('Product service failed, using data/products fallback');
            const { getAllProducts } = await import('../data/products');
            const allProducts = getAllProducts().slice(0, 50);
            const localRecommendations = allProducts
              .sort((a, b) => (b.rating || 0) - (a.rating || 0))
              .slice(0, 6);
            setRecommendations(localRecommendations);
            setAiInsight('Yerel ürün datası kullanılarak öneriler gösteriliyor.');
          }
        }
        return;
      }

      // Fallback to local logic for other types or when user not available
      let allProducts = [];
      try {
        const result = await productService.getProducts({ limit: 50 });
        allProducts = result.products;
      } catch (productError) {
        console.warn('Product service failed, using data/products fallback');
        const { getAllProducts } = await import('../data/products');
        allProducts = getAllProducts().slice(0, 50);
      }
      let selectedProducts = [];
      let insight = '';

      if (recommendationType === 'trending') {
        selectedProducts = allProducts
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 6);
        insight = 'En yüksek puanlı ve popüler ürünler seçildi. Bu ürünler diğer kullanıcılar tarafından en çok beğenilen ve satın alınan ürünlerdir.';
      }
      
      else if (recommendationType === 'cart-based') {
        const cartItems = cart?.items || [];
        console.log('🛒 Cart-based recommendations - cart items:', cartItems);
        
        if (cartItems.length > 0 && settings.geminiApiKey) {
          // Tamamen Gemini AI ile sepet bazlı öneriler
          console.log('🤖 Using full Gemini AI for cart-based recommendations...');
          
          try {
            // Özel sepet bazlı Gemini prompt
            const cartBasedGeminiRecommendations = await getCartBasedGeminiRecommendations(userId || 'anonymous', allProducts, cartItems);
            
            if (cartBasedGeminiRecommendations.length > 0) {
              selectedProducts = cartBasedGeminiRecommendations;
              
              // Console'a özel mesaj yazdır
              console.log('🎯 Sepet bazlı AI öneriler:');
              console.log('  Normal öneriler: 0 ürün (Gemini AI tercih edildi)');
              console.log('  + Gemini AI: ' + selectedProducts.length + ' ürün (akıllı sepet analizi)');
              console.log('  = Toplam: ' + selectedProducts.length + ' mükemmel AI öneri');
              console.log('✅ Tüm öneriler Gemini AI tarafından sepet analizine göre seçildi!');
              
              insight = `🤖 Sepetinizdeki ${cartItems.length} ürün Gemini AI tarafından analiz edildi ve size özel tamamlayıcı ürünler seçildi. Tamamen AI destekli öneriler!`;
            } else {
              throw new Error('Gemini AI no recommendations');
            }
          } catch (geminiError) {
            console.warn('⚠️ Gemini AI failed, using fallback algorithm');
            
            // Enhanced Fallback: Smart category-based algorithm
            console.log('🔧 Using enhanced smart algorithm for cart-based recommendations');
            
            // Get categories and brands from cart
            const cartInfo = cartItems.map(item => {
              const product = allProducts.find(p => p.id === item.productId);
              return product ? {
                category: product.category,
                brand: product.brand,
                priceRange: product.price
              } : null;
            }).filter(Boolean);
            
            const cartCategories = [...new Set(cartInfo.map(item => item.category))];
            const cartBrands = [...new Set(cartInfo.map(item => item.brand))];
            const avgPrice = cartInfo.reduce((sum, item) => sum + item.priceRange, 0) / cartInfo.length;
            
            // Smart product selection
            selectedProducts = allProducts
              .filter(p => !cartItems.some(item => item.productId === p.id)) // Exclude cart items
              .map(product => {
                let score = 0;
                
                // Category match bonus
                if (cartCategories.includes(product.category)) score += 40;
                
                // Brand match bonus  
                if (cartBrands.includes(product.brand)) score += 20;
                
                // Price compatibility (within 50% range)
                const priceDiff = Math.abs(product.price - avgPrice) / avgPrice;
                if (priceDiff <= 0.5) score += 20;
                
                // Rating bonus
                score += (product.rating || 0) * 4;
                
                // Stock availability
                if (product.stock > 0) score += 10;
                
                return { ...product, smartScore: score };
              })
              .sort((a, b) => b.smartScore - a.smartScore)
              .slice(0, 12) // Get top 12
              .sort(() => Math.random() - 0.5) // Shuffle for variety
              .slice(0, 6); // Final 6
              
            if (selectedProducts.length < 3) {
              // Ultimate fallback: best rated products
              selectedProducts = allProducts
                .filter(p => p.stock > 0)
                .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                .slice(0, 6);
            }
            
            insight = `Sepetinizdeki ${cartItems.length} ürün analiz edildi. Kategori uyumu, marka tercihi ve fiyat aralığına göre akıllı öneriler seçildi. (AI geçici olarak kullanılamıyor)`;
          }
        } else if (cartItems.length > 0) {
          // API key yok, basit algoritma
          console.log('🔧 No API key, using simple cart-based algorithm');
          const cartCategories = cartItems.map(item => {
            const product = allProducts.find(p => p.id === item.productId);
            return product?.category;
          }).filter(Boolean);
          
          selectedProducts = allProducts
            .filter(p => cartCategories.includes(p.category) && !cartItems.some(item => item.productId === p.id))
            .sort(() => Math.random() - 0.5)
            .slice(0, 6);
            
          insight = `Sepetinizdeki ${cartItems.length} ürüne uygun kategorilerden öneriler. Gemini AI için API anahtarı gerekli.`;
        } else {
          // Sepet boş
          selectedProducts = allProducts.sort(() => Math.random() - 0.5).slice(0, 6);
          insight = 'Sepetiniz boş. Genel popüler ürünler gösteriliyor. Sepete ürün ekledikten sonra AI destekli öneriler alabilirsiniz.';
        }
      }
      
      else {
        // Fallback for personalized without user
        selectedProducts = allProducts.sort(() => Math.random() - 0.5).slice(0, 6);
        insight = 'Kişiselleştirilmiş öneriler için kullanıcı girişi gerekli. Şu anda genel öneriler gösteriliyor.';
      }

      setRecommendations(selectedProducts);
      setAiInsight(insight);
      
    } catch (error) {
      console.error('Error generating recommendations:', error);
      try {
        const { products: allProducts } = await productService.getProducts({ limit: 50 });
        setRecommendations(allProducts.sort(() => Math.random() - 0.5).slice(0, 6));
        setAiInsight('Öneriler oluşturulurken bir hata oluştu. Genel ürün seçimi gösteriliyor.');
      } catch (fallbackError) {
        console.warn('All services failed, using local data');
        const { getAllProducts } = await import('../data/products');
        const allProducts = getAllProducts();
        setRecommendations(allProducts.sort(() => Math.random() - 0.5).slice(0, 6));
        setAiInsight('Yerel ürün datası kullanılarak rastgele öneriler gösteriliyor.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!settings.geminiApiKey && recommendationType === 'personalized') {
    return (
      <motion.div 
        className="max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="text-center py-12" variants={itemVariants}>
          <motion.div 
            className="mx-auto flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-red-500 to-pink-500 mb-8 shadow-xl"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            <Heart className="h-10 w-10 text-white" />
          </motion.div>
          
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            variants={itemVariants}
          >
            AI Kişiselleştirilmiş Öneriler
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            Kişiselleştirilmiş AI önerileri için API anahtarınızı yapılandırmanız gerekiyor.
          </motion.p>

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="inline-flex items-center px-8 py-4 bg-gray-400 text-white font-semibold rounded-2xl opacity-50 cursor-not-allowed">
              API Yapılandırma Devre Dışı
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="text-center py-12 mb-8" variants={itemVariants}>
        <motion.div 
          className="mx-auto flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-red-500 to-pink-500 mb-8 shadow-xl relative"
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ duration: 0.3 }}
        >
          <Heart className="h-10 w-10 text-white" />
          <motion.div
            className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-3 h-3 text-white" />
          </motion.div>
        </motion.div>
        
        <motion.h1 
          className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          variants={itemVariants}
        >
          Kişisel Öneriler
        </motion.h1>
        
        <motion.p 
          className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed"
          variants={itemVariants}
        >
          ShopSmart AI ile size özel seçilmiş ürün önerileri. Tercihlerinize göre kişiselleştirilmiş alışveriş deneyimi.
        </motion.p>
      </motion.div>

      {/* Recommendation Type Selector */}
      <motion.div 
        className="mb-12"
        variants={itemVariants}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendationTypes.map((type) => (
            <motion.button
              key={type.id}
              onClick={() => setRecommendationType(type.id)}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                recommendationType === type.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-primary-300'
              }`}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`${type.bgColor} ${type.color} p-3 rounded-xl`}>
                  <type.icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {type.title}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-left">
                {type.description}
              </p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* AI Insight */}
      {aiInsight && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-blue-50 via-purple-50/50 to-blue-50 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-blue-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-start space-x-3">
              <motion.div
                className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Eye className="w-4 h-4 text-white" />
              </motion.div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  AI Analizi
                </h4>
                <p className="text-gray-700 dark:text-gray-300">
                  {aiInsight}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommendations Grid */}
      <motion.div 
        className="mb-12"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <motion.div
              className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Heart className="w-4 h-4 text-white" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Önerilen Ürünler ({recommendations.length})
            </h3>
          </div>
          
          <motion.button
            onClick={generateRecommendations}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              animate={isGenerating ? { rotate: 360 } : {}}
              transition={isGenerating ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
            >
              <RefreshCw className="w-4 h-4" />
            </motion.div>
            <span>{isGenerating ? 'Yenileniyor...' : 'Yenile'}</span>
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mb-4"
              >
                <Brain className="w-8 h-8 text-white" />
              </motion.div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {getLoadingTitle()}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {getLoadingDescription()}
                </p>
                <div className="flex justify-center items-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                  <span>Ürün semantik analizi</span>
                </div>
                <div className="flex justify-center items-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
                  <span>Kişiselleştirilmiş eşleştirme</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {recommendations.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Status Banner */}
      <motion.div 
        className="text-center"
        variants={itemVariants}
      >
        <motion.div
          className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-red-50 via-pink-50/50 to-red-50 dark:from-red-900/20 dark:via-pink-900/10 dark:to-red-900/20 rounded-3xl border border-red-200/50 dark:border-red-800/50 backdrop-blur-sm"
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-6 h-6 text-red-500" />
          </motion.div>
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            AI destekli öneriler aktif!
          </span>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Heart className="w-6 h-6 text-pink-500" />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Recommendations;