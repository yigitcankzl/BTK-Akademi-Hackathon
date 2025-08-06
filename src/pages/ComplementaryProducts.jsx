import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Search, 
  Sparkles, 
  ShoppingBag, 
 
  Zap, 
  Heart,
  RefreshCw,
  Star,
  Upload,
  Image as ImageIcon,
  Filter,
  ArrowUpDown,
  Clock,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import ProductCard from '../components/ecommerce/ProductCard';
import productService from '../services/ecommerce/productService';
import { ComponentErrorBoundary } from '../components/common/ErrorBoundary';

// Lazy import services to prevent circular dependency issues
let createGeminiService = null;
let getVisualSearchService = null;

const loadServices = async () => {
  try {
    if (!createGeminiService) {
      const geminiModule = await import('../services/geminiAPI');
      createGeminiService = geminiModule.createGeminiService;
    }
    if (!getVisualSearchService) {
      const visualModule = await import('../services/visualSearchService');
      getVisualSearchService = visualModule.getVisualSearchService;
    }
    return { createGeminiService, getVisualSearchService };
  } catch (error) {
    console.error('Error loading services:', error);
    throw new Error('Servisler yüklenirken hata oluştu');
  }
};

const ComplementaryProductsInner = () => {
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [complementaryProducts, setComplementaryProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState(null);

  const { state } = useApp();
  const { settings } = state;

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        const result = await productService.getProducts({ limit: 50 }); // Get more products for selection
        setProducts(result.products || []);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Analyze uploaded image
  const analyzeUploadedImage = async (imageUrl) => {
    if (!settings.geminiApiKey) {
      setError('Gemini API anahtarı bulunamadı. Lütfen ayarlarınızı kontrol edin.');
      return;
    }

    setAnalyzingImage(true);
    setError(null);
    
    try {
      console.log('🔍 Starting visual analysis for complementary products');
      
      // Load services dynamically
      const { createGeminiService: createService } = await loadServices();
      const geminiService = createService(settings.geminiApiKey, settings.selectedModel);
      
      const prompt = `Bu yüklenen ürün görseli için detaylı görsel analiz yap ve tamamlayıcı ürün önerileri sun:

ÜRÜN ANALİZİ:
1. 🎨 **Stil & Tasarım**: Bu ürünün görsel özellikleri ve tarzı
2. 🌈 **Renk Analizi**: Dominant renkler ve uyumlu renk paleti
3. 👔 **Kategori**: Ürün türü ve kullanım alanları
4. ✨ **Kalite İpuçları**: Görselden anlaşılan kalite göstergeleri

TAMAMLAYICI ÜRÜN ÖNERİLERİ:
5. 🛍️ **Kombine Edilebilecek Ürünler**: Bu ürünle mükemmel uyum sağlayacak diğer ürün türleri
6. 🎯 **Renk Koordinasyonu**: Hangi renklerle kombine edilebilir
7. 🏷️ **Kategori Önerileri**: Hangi kategorilerden ürünler uyumlu olur
8. 💡 **Stil Tavsiyeleri**: Nasıl kombinlenebilir, hangi durumlarda kullanılır

Müşterilerin bu ürünü satın aldıklarında aynı zamanda ihtiyaç duyacakları tamamlayıcı ürünleri önermek için detaylı analiz yap. Türkçe olarak, pratik ve faydalı öneriler sun.`;

      // For uploaded images, use the base64 data directly
      try {
        const imageData = imageUrl.split(',')[1];
        const mimeType = imageUrl.split(';')[0].split(':')[1];
        
        if (!imageData || !mimeType) {
          throw new Error('Görsel formatı desteklenmiyor');
        }

        const analysisResponse = await geminiService.generateContentWithImage(
          prompt,
          imageData,
          { mimeType }
        );

        setImageAnalysis(analysisResponse.text);
        console.log('✅ Visual analysis completed');
        
        // Add to analysis history
        const historyItem = {
          id: Date.now(),
          product: { name: 'Yüklenen Görsel', image: uploadedImage },
          analysis: analysisResponse.text,
          timestamp: new Date().toLocaleString('tr-TR')
        };
        setAnalysisHistory(prev => [historyItem, ...prev.slice(0, 4)]); // Keep last 5
        
        // Get complementary products based on analysis
        await getComplementaryProducts(analysisResponse.text);
        
      } catch (decodeError) {
        throw new Error('Görsel işleme hatası: ' + decodeError.message);
      }
    } catch (error) {
      console.error('Error analyzing product image:', error);
      
      let errorMessage = 'Görsel analizi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
      
      // Specific error handling
      if (error.message.includes('Rate limit') || error.message.includes('overloaded')) {
        errorMessage = '🔄 AI servis yoğunluğu nedeniyle analiz gecikti. Birkaç saniye bekleyip tekrar deneyin.';
      } else if (error.message.includes('offline') || error.message.includes('Offline')) {
        errorMessage = '📡 Şu anda offline modda çalışıyoruz. Temel görsel analiz yapılacak.';
      }
      
      setImageAnalysis(errorMessage);
      setError(errorMessage);
    } finally {
      setAnalyzingImage(false);
    }
  };

  const getComplementaryProducts = async (analysisText) => {
    if (!products || products.length === 0) {
      console.log('⚠️ No products available for matching');
      return;
    }
    
    setIsLoadingProducts(true);
    try {
      console.log('🛍️ Getting complementary products based on visual analysis');
      
      // Load services dynamically
      const { getVisualSearchService: getService } = await loadServices();
      const visualSearchService = getService();
      const result = await visualSearchService.getMatchingProducts(
        analysisText || imageAnalysis,
        settings.geminiApiKey,
        {
          maxRecommendations: 12,
          includeComplementary: true
        }
      );
      
      console.log('✅ Found complementary products:', result.products.length);
      console.log('🔍 Matching method used:', result.matchingMethod);
      console.log('📈 Confidence level:', result.confidence);
      
      setComplementaryProducts(result.products || []);
      
    } catch (error) {
      console.error('Error getting complementary products:', error);
      setComplementaryProducts([]);
      
      // Set a user-friendly error message
      setImageAnalysis(prevAnalysis => 
        prevAnalysis + '\n\n⚠️ Tamamlayıcı ürün arama sırasında bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Dosya boyutu çok büyük. Lütfen 5MB\'dan küçük bir görsel seçin.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
        setError(null);
        // Analyze uploaded image
        analyzeUploadedImage(e.target.result);
      };
      reader.onerror = () => {
        setError('Dosya okuma hatası oluştu. Lütfen tekrar deneyin.');
      };
      reader.readAsDataURL(file);
    } else {
      setError('Lütfen geçerli bir görsel dosyası seçin (JPG, PNG, GIF).');
    }
  };

  if (!settings.geminiApiKey) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center mb-6">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              API Anahtarı Gerekli
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Tamamlayıcı ürün önerilerini görmek için önce Gemini API anahtarınızı yapılandırmanız gerekiyor.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🤖 Tamamlayıcı Ürün Keşfi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI ile görsel analiz yaparak ürünlerinizle uyumlu tamamlayıcı ürünleri keşfedin
          </p>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6"
          >
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 dark:text-red-200 text-sm">
                  {error}
                </p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 dark:text-red-400 text-xs underline mt-1 hover:no-underline"
                >
                  Kapat
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-8"
        >
          <div className="max-w-2xl mx-auto">
            {/* Image Upload */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Kendi Görselinizi Yükleyin
              </h3>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Görsel dosyası yüklemek için tıklayın
                  </p>
                  <p className="text-xs text-gray-500">
                    JPG, PNG, GIF desteklenir
                  </p>
                </label>
              </div>
              
              {uploadedImage && (
                <div className="mt-4">
                  <div className="relative w-32 h-32 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <img 
                      src={uploadedImage} 
                      alt="Yüklenen görsel"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Analysis Results */}
        <AnimatePresence>
          {uploadedImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-pink-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50 mb-8"
            >
              <div className="flex items-start space-x-6">
                <div className="relative w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                  <img 
                    src={uploadedImage} 
                    alt="Yüklenen görsel"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Camera className="w-5 h-5 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          🤖 AI Görsel Analiz Sonucu
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Yüklenen Görsel
                        </p>
                      </div>
                    </div>
                    
                    {analyzingImage && (
                      <div className="flex items-center space-x-2 text-purple-600">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Zap className="w-4 h-4" />
                        </motion.div>
                        <span className="text-sm">Analiz ediliyor...</span>
                      </div>
                    )}
                  </div>

                  {imageAnalysis && (
                    <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <h4 className="font-semibold text-gray-900 dark:text-white">AI Analiz Sonucu</h4>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                        {imageAnalysis}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Complementary Products Results */}
        <AnimatePresence>
          {isLoadingProducts ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4"
              >
                <ShoppingBag className="w-6 h-6 text-white" />
              </motion.div>
              <p className="text-gray-600 dark:text-gray-400">
                Tamamlayıcı ürünler bulunuyor...
              </p>
            </motion.div>
          ) : complementaryProducts.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Results Header */}
              <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 dark:from-green-900/20 dark:via-emerald-900/10 dark:to-green-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800 dark:text-green-200">
                      Tamamlayıcı Ürün Önerileri Hazır!
                    </span>
                  </div>
                  <motion.button
                    onClick={() => getComplementaryProducts()}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium rounded-lg transition-all duration-300 text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Yenile</span>
                  </motion.button>
                </div>
                <p className="text-green-700 dark:text-green-300 text-sm mt-2">
                  {complementaryProducts.length} ürün bu ürününüzle mükemmel uyum sağlayacak. 🤖 AI ile analiz edildi.
                </p>
              </div>
              
              {/* Products Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {complementaryProducts.map((complementaryProduct, index) => (
                  <motion.div
                    key={complementaryProduct.id}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <ProductCard product={complementaryProduct} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : imageAnalysis && !isLoadingProducts ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-yellow-500" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Tamamlayıcı Ürün Bulunamadı
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Bu ürün için şu an tamamlayıcı ürün önerisi bulunamadı. Daha sonra tekrar deneyin.
              </p>
              <motion.button
                onClick={() => getComplementaryProducts()}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tekrar Dene</span>
              </motion.button>
            </motion.div>
          ) : !analyzingImage && !uploadedImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl flex items-center justify-center mb-6">
                <Camera className="w-8 h-8 text-purple-500" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Tamamlayıcı Ürün Keşfine Başlayın
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Mevcut ürünlerden birini seçin veya kendi görselinizi yükleyerek AI ile analiz ederek size en uygun tamamlayıcı ürünleri keşfedin.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis History */}
        {analysisHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Son Analizler
            </h3>
            <div className="space-y-3">
              {analysisHistory.slice(0, 3).map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => {
                    setSelectedProduct(item.product);
                    setImageAnalysis(item.analysis);
                    getComplementaryProducts(item.analysis);
                  }}
                >
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.timestamp}
                    </p>
                  </div>
                  <Eye className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Wrap with error boundary
const ComplementaryProducts = () => {
  return (
    <ComponentErrorBoundary
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-4xl mx-auto text-center py-16">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Tamamlayıcı Ürünler Yüklenemiyor
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-4">
              Bu sayfa yüklenirken bir hata oluştu. Sayfayı yenilemeyi deneyin.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      }
    >
      <ComplementaryProductsInner />
    </ComponentErrorBoundary>
  );
};

export default ComplementaryProducts;