import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  User, 
  Clock, 
  ThumbsUp, 
  Camera, 
  Upload, 
  Sparkles, 
  Eye, 
  ShoppingBag, 
  Zap,
  CheckCircle,
  XCircle,
  Target,
  Users
} from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { createGeminiService } from '../../services/geminiAPI';
import { getVisualSearchService } from '../../services/visualSearchService';
import ProductCard from './ProductCard';
import { useApp } from '../../contexts/AppContext';
import { getReviewsByProductId } from '../../data/sampleReviews';

const EnhancedReviewsWithVisualAnalysis = ({ productId, productName, productImage }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [complementaryProducts, setComplementaryProducts] = useState([]);
  const [showComplementary, setShowComplementary] = useState(false);

  const { state } = useApp();
  const { settings } = state;

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      console.log('Loading reviews for productId:', productId);
      
      // Firebase'den yüklemeyi dene, başarısız olursa local data kullan
      try {
        const reviewsRef = collection(db, 'reviews');
        const q = query(
          reviewsRef, 
          where('productId', '==', parseInt(productId))
        );
        
        const snapshot = await getDocs(q);
        const firebaseReviewsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (firebaseReviewsData.length > 0) {
          // Firebase'de yorum varsa onu kullan
          firebaseReviewsData.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
              return b.createdAt.toDate() - a.createdAt.toDate();
            }
            return 0;
          });
          
          console.log('Loaded Firebase reviews:', firebaseReviewsData);
          setReviews(firebaseReviewsData);
          return;
        }
      } catch (firebaseError) {
        console.log('Firebase reviews not available, using local data');
      }
      
      // Firebase'de yorum yoksa veya hata varsa local data kullan
      const localReviews = getReviewsByProductId(productId);
      console.log('Using local reviews:', localReviews);
      setReviews(localReviews);
      
    } catch (error) {
      console.error('Error loading reviews:', error);
      // Fallback: local reviews
      const localReviews = getReviewsByProductId(productId);
      setReviews(localReviews);
    } finally {
      setLoading(false);
    }
  };

  // Visual analysis function
  const analyzeProductImage = async () => {
    if (!productImage || !settings.geminiApiKey) {
      console.log('No image or API key for analysis');
      return;
    }

    setAnalyzingImage(true);
    try {
      console.log('🔍 Starting visual analysis for product:', productName);
      
      const geminiService = createGeminiService(settings.geminiApiKey, settings.selectedModel);
      
      // Create analysis prompt specifically for this product image
      const prompt = `Analyze this product image for "${productName}" and provide detailed insights for potential customers. Focus on:

1. 🎨 **Visual Appeal & Style**: What makes this product visually attractive?
2. 👔 **Styling Suggestions**: How can customers style this item?
3. 🌈 **Color Coordination**: What colors and items would complement this?
4. 🛍️ **Occasion Usage**: When and where would this product be appropriate?
5. 📏 **Fit & Sizing Insights**: Any visual cues about fit or sizing?
6. ✨ **Quality Indicators**: What quality aspects are visible?
7. 🔗 **Complementary Items**: What other products would go well with this?

Provide practical, helpful insights that would assist customers in making an informed purchase decision. Write in Turkish, be detailed but concise.`;

      // Fetch and convert image to base64
      const response = await fetch(productImage);
      const blob = await response.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.readAsDataURL(blob);
      });

      const analysisResponse = await geminiService.generateContentWithImage(
        prompt,
        base64,
        { mimeType: blob.type }
      );

      setImageAnalysis(analysisResponse.text);
      console.log('✅ Visual analysis completed');
      
      // Get complementary products based on analysis
      await getComplementaryProducts(analysisResponse.text);
    } catch (error) {
      console.error('Error analyzing product image:', error);
      setImageAnalysis('Görsel analizi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setAnalyzingImage(false);
    }
  };

  // Get complementary products based on visual analysis
  const getComplementaryProducts = async (analysisText) => {
    try {
      console.log('🛍️ Getting complementary products based on visual analysis');
      
      const visualSearchService = getVisualSearchService();
      const result = await visualSearchService.getMatchingProducts(
        analysisText,
        settings.geminiApiKey,
        {
          maxRecommendations: 8,
          includeComplementary: true
        }
      );
      
      // Filter out the current product
      const filteredProducts = result.products.filter(p => p.id !== parseInt(productId));
      setComplementaryProducts(filteredProducts);
      
      console.log('✅ Found complementary products:', filteredProducts.length);
    } catch (error) {
      console.error('Error getting complementary products:', error);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            📝 Müşteri Değerlendirmeleri & Görsel Analiz
          </h3>
          {reviews.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {renderStars(Math.round(getAverageRating()))}
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                {getAverageRating()}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                ({reviews.length} değerlendirme)
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {reviews.length > 2 && (
            <motion.button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showAnalysis
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showAnalysis ? 'AI Analizi Gizle' : '🤖 AI Analizi Göster'}
            </motion.button>
          )}
          
          {productImage && (
            <motion.button
              onClick={analyzeProductImage}
              disabled={analyzingImage}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                analyzingImage
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white'
              }`}
              whileHover={{ scale: analyzingImage ? 1 : 1.02 }}
              whileTap={{ scale: analyzingImage ? 1 : 0.98 }}
            >
              {analyzingImage ? (
                <div className="flex items-center space-x-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-4 h-4" />
                  </motion.div>
                  <span>Analiz Ediliyor...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4" />
                  <span>📸 Görseli Analiz Et</span>
                </div>
              )}
            </motion.button>
          )}
          
          {complementaryProducts.length > 0 && (
            <motion.button
              onClick={() => setShowComplementary(!showComplementary)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showComplementary
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-4 h-4" />
                <span>{showComplementary ? 'Ürünleri Gizle' : `🛍️ Uyumlu Ürünler (${complementaryProducts.length})`}</span>
              </div>
            </motion.button>
          )}
        </div>
      </div>


      {/* Visual Analysis Results */}
      <AnimatePresence>
        {imageAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 dark:from-blue-900/20 dark:via-cyan-900/10 dark:to-blue-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50"
          >
            <div className="flex items-start space-x-4">
              <div className="relative w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                <img 
                  src={productImage} 
                  alt={productName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <Camera className="w-6 h-6 text-blue-500" />
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                    🤖 AI Görsel Analizi
                  </h4>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                    {imageAnalysis}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complementary Products */}
      <AnimatePresence>
        {showComplementary && complementaryProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 dark:from-green-900/20 dark:via-emerald-900/10 dark:to-green-900/20 rounded-xl p-6 border border-green-200/50 dark:border-green-800/50"
          >
            <div className="flex items-center space-x-3 mb-6">
              <ShoppingBag className="w-6 h-6 text-green-500" />
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                🛍️ Bu Ürünle Uyumlu Öneriler ({complementaryProducts.length})
              </h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {complementaryProducts.slice(0, 8).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="relative h-32 bg-gray-100 dark:bg-gray-600 rounded-lg mb-3 overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h5 className="font-medium text-sm text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {product.name}
                  </h5>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      ₺{product.price}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {product.rating}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  {review.userAvatar ? (
                    <img 
                      src={review.userAvatar} 
                      alt={review.userName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {review.userName}
                      </h4>
                      {review.verified && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          ✅ Doğrulanmış
                        </span>
                      )}
                      {review.enhanced && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          🤖 AI Enhanced
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{review.date}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 mb-3">
                    {renderStars(review.rating)}
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                    {review.comment}
                  </p>
                  
                  {/* Enhanced review details */}
                  {review.enhanced && (
                    <div className="space-y-4 mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-900/50 dark:to-blue-900/10 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                      
                      {/* Usage Context */}
                      {review.usageContext && (
                        <div className="mt-3">
                          <h5 className="flex items-center space-x-2 font-semibold text-blue-700 dark:text-blue-400 mb-2 text-sm">
                            <Target className="w-4 h-4" />
                            <span>👤 Kullanım Deneyimi</span>
                          </h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                            {review.usageContext}
                          </p>
                        </div>
                      )}
                      
                      {/* Recommendation */}
                      {review.recommendation && (
                        <div className="mt-3">
                          <h5 className="flex items-center space-x-2 font-semibold text-purple-700 dark:text-purple-400 mb-2 text-sm">
                            <Users className="w-4 h-4" />
                            <span>💡 Tavsiye</span>
                          </h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                            {review.recommendation}
                          </p>
                        </div>
                      )}
                      
                      {/* Enhanced badge */}
                      <div className="flex items-center justify-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          <Sparkles className="w-3 h-3" />
                          <span>🤖 AI ile zenginleştirilmiş yorum</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-4 text-sm">
                      <motion.button
                        className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>Yararlı ({review.helpful || 0})</span>
                      </motion.button>
                    </div>
                    
                    {review.enhanced && (
                      <div className="flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400">
                        <Sparkles className="w-3 h-3" />
                        <span>Detaylı İnceleme</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Henüz değerlendirme yok
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Bu ürün için ilk değerlendirmeyi siz yapın!
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedReviewsWithVisualAnalysis;