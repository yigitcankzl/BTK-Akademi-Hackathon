import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, Heart, ShoppingCart, Truck, Shield, RotateCcw, 
  Plus, Minus, Share2, ArrowLeft, ArrowRight, Zap, MessageCircle, Sparkles, Wand2, Search, RefreshCw, Brain, BarChart3, TrendingUp 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import ProductCard from '../components/ecommerce/ProductCard';
import EnhancedReviewDisplay from '../components/ecommerce/EnhancedReviewDisplay';
import EnhancedReviewsWithVisualAnalysis from '../components/ecommerce/EnhancedReviewsWithVisualAnalysis';
import ReviewSummary from '../components/common/ReviewSummary';
import productService from '../services/ecommerce/productService';
import cartService from '../services/ecommerce/cartService';
import { ECOMMERCE_CONFIG } from '../utils/constants';
import { enhanceProductWithAI } from '../services/aiContentService';
import { getVisualSearchService } from '../services/visualSearchService';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, actionTypes } = useApp();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [aiEnhancedProduct, setAiEnhancedProduct] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [compatibleProducts, setCompatibleProducts] = useState([]);
  const [isLoadingCompatible, setIsLoadingCompatible] = useState(false);
  const [compatibleMethod, setCompatibleMethod] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const isInWishlist = product && state.user.wishlist.some(item => item.id === product.id);

  useEffect(() => {
    loadProduct();
  }, [slug]);

  // Load enhanced reviews for the product
  const loadReviews = async () => {
    if (!product?.id) return;
    
    setLoadingReviews(true);
    try {
      // Import Firebase Firestore functions
      const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      
      // Query enhanced reviews for this product (basit query - index gerektirmez)
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('productId', '==', product.id)
      );
      
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate?.()?.toLocaleDateString('tr-TR') || doc.data().date
      }));
      
      // Client-side sorting (en yeni önce)
      reviewsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.date);
        const dateB = b.createdAt?.toDate?.() || new Date(b.date);
        return dateB - dateA;
      });
      
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'error',
          message: 'Yorumlar yüklenirken hata oluştu',
          duration: 5000,
        },
      });
    } finally {
      setLoadingReviews(false);
    }
  };

  // Load reviews when product changes
  useEffect(() => {
    if (product?.id) {
      loadReviews();
    }
  }, [product?.id]);

  const generateAIContent = async () => {
    if (!product || isGeneratingAI) return;
    
    // Check if API key exists
    if (!state.settings.geminiApiKey) {
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'warning',
          message: 'AI özelliklerini kullanmak için ayarlardan Gemini API anahtarınızı girin.',
          duration: 5000,
        }
      });
      return;
    }
    
    setIsGeneratingAI(true);
    try {
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'info',
          message: 'AI destekli açıklama oluşturuluyor...',
          duration: 3000,
        }
      });

      const enhanced = await enhanceProductWithAI(product, state.settings.geminiApiKey);
      setAiEnhancedProduct(enhanced);
      
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'success',
          message: 'AI destekli açıklama başarıyla oluşturuldu!',
          duration: 4000,
        }
      });
    } catch (error) {
      console.error('Error generating AI content:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      
      let errorMessage = 'AI açıklama oluşturulurken hata oluştu. Lütfen tekrar deneyin.';
      
      if (error.message.includes('overloaded')) {
        errorMessage = 'AI servisi şu anda aşırı yüklü. Lütfen birkaç saniye sonra tekrar deneyin.';
      } else if (error.message.includes('Rate limit')) {
        errorMessage = 'API kullanım limiti aşıldı. Lütfen bir dakika bekleyin.';
      } else if (error.message.includes('Invalid API key')) {
        errorMessage = 'API anahtarı geçersiz. Lütfen ayarlardan kontrol edin.';
      }
      
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'error',
          message: errorMessage,
          duration: 5000,
        }
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const getCompatibleProducts = async () => {
    if (!product || isLoadingCompatible) return;
    
    setIsLoadingCompatible(true);
    try {
      // Ürünü analiz metnine çevir
      const productAnalysis = `
Product Analysis:

**1. Product Type/Category:** ${product.category} - ${product.name}

**2. Key Visual Features:**
* **Brand:** ${product.brand}
* **Price Range:** ₺${product.price} (${product.price < 1000 ? 'Budget' : product.price < 5000 ? 'Mid-range' : 'Premium'})
* **Style:** ${product.description}
* **Category:** ${product.category}

**3. Product Description:** ${product.description}

**4. Features:** ${product.features ? product.features.join(', ') : 'Standard features'}

**5. Target Matching:**
* Find complementary products that work well with this ${product.category.toLowerCase()}
* Consider similar price range and style
* Look for products that complement this brand and category
* Focus on creating a complete look or setup

**Suggested Compatible Categories:**
${product.category.toLowerCase().includes('gömlek') || product.category.toLowerCase().includes('shirt') ? 
  '* Pantolon, Ayakkabı, Ceket, Aksesuar' :
  product.category.toLowerCase().includes('pantolon') || product.category.toLowerCase().includes('pants') ?
  '* Gömlek, T-shirt, Ayakkabı, Ceket' :
  product.category.toLowerCase().includes('ayakkabı') || product.category.toLowerCase().includes('shoe') ?
  '* Pantolon, Gömlek, Aksesuar' :
  '* Complementary accessories and matching items'
}
      `.trim();

      console.log('🔍 Finding compatible products for:', product.name);
      console.log('📝 Product analysis:', productAnalysis);

      const visualSearchService = getVisualSearchService();
      const result = await visualSearchService.getMatchingProducts(
        productAnalysis,
        state.settings.geminiApiKey,
        {
          maxRecommendations: 6,
          includeComplementary: true
        }
      );

      // Mevcut ürünü sonuçlardan çıkar
      const filteredProducts = result.products.filter(p => p.id !== product.id);
      
      setCompatibleProducts(filteredProducts);
      setCompatibleMethod(result.matchingMethod);
      
      console.log('✅ Compatible products found:', {
        method: result.matchingMethod,
        confidence: result.confidence,
        products: filteredProducts.length
      });

    } catch (error) {
      console.error('Error finding compatible products:', error);
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'error',
          message: 'Uyumlu ürünler yüklenirken hata oluştu',
          duration: 5000,
        }
      });
    } finally {
      setIsLoadingCompatible(false);
    }
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await productService.getProductBySlug(slug);
      setProduct(productData);
      setRelatedProducts(productData.relatedProducts);
      
      // Initialize selected variants with first option of each variant
      const initialVariants = {};
      productData.variants?.forEach(variant => {
        if (variant.options.length > 0) {
          initialVariants[variant.id] = variant.options[0];
        }
      });
      setSelectedVariants(initialVariants);
    } catch (error) {
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'error',
          message: 'Ürün yüklenirken hata oluştu',
          duration: 5000,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      const cartSummary = await cartService.addItem(product.id, quantity, selectedVariants);
      dispatch({ type: actionTypes.SET_CART, payload: cartSummary });
      
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'success',
          message: `${product.name} sepete eklendi`,
          duration: 3000,
        },
      });
    } catch (error) {
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'error',
          message: error.message || 'Ürün sepete eklenirken hata oluştu',
          duration: 5000,
        },
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    
    if (isInWishlist) {
      dispatch({ type: actionTypes.REMOVE_FROM_WISHLIST, payload: product.id });
    } else {
      dispatch({ type: actionTypes.ADD_TO_WISHLIST, payload: product });
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 1)) {
      setQuantity(newQuantity);
    }
  };

  const handleVariantChange = (variantId, option) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantId]: option,
    }));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.shortDescription,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'success',
          message: 'Link panoya kopyalandı',
          duration: 3000,
        },
      });
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${
          index < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : index < rating
            ? 'fill-yellow-200 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ürün bulunamadı
          </h2>
          <Link
            to="/products"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Ürünlere geri dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
        <Link to="/" className="hover:text-primary-600">Ana Sayfa</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary-600">Ürünler</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">{product.name}</span>
      </nav>

      {/* Back Button */}
      <Link
        to="/products"
        className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Ürünlere geri dön</span>
      </Link>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <motion.div 
            className="aspect-square overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-700 relative"
            layoutId={`product-image-${product.id}`}
          >
            {product.discount > 0 && (
              <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-1 rounded-lg font-semibold">
                %{product.discount} İndirim
              </div>
            )}
            
            {product.aiGenerated?.description && (
              <div className="absolute top-4 right-4 z-10 bg-purple-500 text-white p-2 rounded-lg" title="AI Generated Content">
                <Zap className="w-4 h-4" />
              </div>
            )}

            <img
              src={product.images[selectedImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Thumbnail Images */}
          {product.images.length > 1 && (
            <div className="flex space-x-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImageIndex === index
                      ? 'border-primary-500'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <p className="text-primary-600 font-medium mb-2">{product.brand}</p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {product.name}
            </h1>
            
            {/* Rating */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center space-x-1">
                {renderStars(product.rating)}
              </div>
              <span className="text-gray-600 dark:text-gray-400">
                ({product.reviewCount} değerlendirme)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-3 mb-6">
              <span className="text-3xl font-bold text-primary-600">
                {ECOMMERCE_CONFIG.CURRENCY_SYMBOL}{product.price.toLocaleString('tr-TR')}
              </span>
              {product.originalPrice > product.price && (
                <div className="flex items-center space-x-2">
                  <span className="text-xl text-gray-500 line-through">
                    {ECOMMERCE_CONFIG.CURRENCY_SYMBOL}{product.originalPrice.toLocaleString('tr-TR')}
                  </span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-lg text-sm font-medium">
                    %{product.discount} tasarruf
                  </span>
                </div>
              )}
            </div>

            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {product.shortDescription}
            </p>
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4">
              {product.variants.map((variant) => (
                <div key={variant.id}>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {variant.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleVariantChange(variant.id, option)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors font-medium ${
                          selectedVariants[variant.id] === option
                            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Miktar</h3>
            <div className="flex items-center space-x-3">
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= product.stock}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {product.stock} adet stokta
              </span>
            </div>
          </div>

          {/* Stock Status */}
          {product.stock <= 5 && product.stock > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <p className="text-orange-800 dark:text-orange-200 font-medium">
                ⚠️ Son {product.stock} adet! Hemen sipariş verin.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <motion.button
              onClick={handleAddToCart}
              disabled={addingToCart || product.stock === 0}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white py-4 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>
                {addingToCart ? 'Ekleniyor...' : product.stock === 0 ? 'Stokta Yok' : 'Sepete Ekle'}
              </span>
            </motion.button>

            <motion.button
              onClick={handleToggleWishlist}
              className={`p-4 rounded-xl border-2 transition-colors ${
                isInWishlist
                  ? 'border-red-500 bg-red-50 text-red-500 dark:bg-red-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
            </motion.button>

            <motion.button
              onClick={handleShare}
              className="p-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <Truck className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Ücretsiz Kargo</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">500₺ üzeri</p>
            </div>
            <div className="text-center">
              <Shield className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Güvenli Ödeme</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">SSL korumalı</p>
            </div>
            <div className="text-center">
              <RotateCcw className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">İade Garantisi</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">30 gün</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-16">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {[
              { id: 'description', label: 'Açıklama' },
              { id: 'specifications', label: 'Özellikler' },
              { id: 'reviews', label: 'Yorumlar' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="py-8">
          <AnimatePresence mode="wait">
            {activeTab === 'description' && (
              <motion.div
                key="description"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="prose dark:prose-invert max-w-none"
              >
                {/* AI Enhancement Button */}
                {state.settings.geminiApiKey && !aiEnhancedProduct && (
                  <motion.div
                    className="mb-6 p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-blue-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/50"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <motion.div
                          className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <Sparkles className="w-4 h-4 text-white" />
                        </motion.div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            AI Destekli Açıklama
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Bu ürün için AI ile geliştirilmiş detaylı açıklama oluştur
                          </p>
                        </div>
                      </div>
                      <motion.button
                        onClick={generateAIContent}
                        disabled={isGeneratingAI}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                        whileHover={{ scale: isGeneratingAI ? 1 : 1.02 }}
                        whileTap={{ scale: isGeneratingAI ? 1 : 0.98 }}
                      >
                        <motion.div
                          animate={isGeneratingAI ? { rotate: 360 } : {}}
                          transition={isGeneratingAI ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                        >
                          <Wand2 className="w-4 h-4" />
                        </motion.div>
                        <span>{isGeneratingAI ? 'Oluşturuluyor...' : 'AI Açıklama Oluştur'}</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* AI Enhanced Content */}
                {aiEnhancedProduct && (
                  <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="bg-gradient-to-r from-green-50 via-blue-50 to-green-50 dark:from-green-900/20 dark:via-blue-900/10 dark:to-green-900/20 rounded-2xl p-6 border border-green-200/50 dark:border-green-800/50">
                      <div className="flex items-center space-x-2 mb-4">
                        <motion.div
                          className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Sparkles className="w-3 h-3 text-white" />
                        </motion.div>
                        <span className="font-semibold text-green-800 dark:text-green-200">
                          AI Destekli Açıklama
                        </span>
                      </div>
                      <div className="text-gray-800 dark:text-gray-200 leading-relaxed">
                        {aiEnhancedProduct.aiDescription?.split('\n').map((paragraph, index) => (
                          <p key={index} className="mb-3 last:mb-0">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                      
                      {/* AI Generated Tags */}
                      {aiEnhancedProduct.aiTags && aiEnhancedProduct.aiTags.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-green-200/50 dark:border-green-700/50">
                          <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                            AI Etiketler:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {aiEnhancedProduct.aiTags.map((tag, index) => (
                              <motion.span
                                key={index}
                                className="px-3 py-1 bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-200 text-xs font-medium rounded-full"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                              >
                                {tag}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Original Description */}
                <div className={aiEnhancedProduct ? 'mt-6 pt-6 border-t border-gray-200 dark:border-gray-700' : ''}>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {aiEnhancedProduct ? 'Temel Açıklama' : 'Ürün Açıklaması'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                    {product.description}
                  </p>
                </div>
                
                {product.features && (
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4">Öne Çıkan Özellikler</h3>
                    <ul className="space-y-2">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-primary-600 mt-1">•</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'specifications' && (
              <motion.div
                key="specifications"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-6">Teknik Özellikler</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {Object.entries(product.specifications || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-medium text-gray-900 dark:text-white">{key}</span>
                        <span className="text-gray-600 dark:text-gray-400">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {loadingReviews ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full"
                      />
                      <span>Yorumlar yükleniyor...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    
                    {/* Review Summary */}
                    {reviews.length > 0 && (
                      <ReviewSummary reviews={reviews} />
                    )}
                    
                    {/* Detailed Reviews */}
                    <EnhancedReviewDisplay 
                      reviews={reviews}
                      productName={product?.name || ''}
                    />
                  </div>
                )}
              </motion.div>
            )}


          </AnimatePresence>
        </div>
      </div>

      {/* Compatible Products Section */}
      <div className="mt-16">
        {compatibleProducts.length === 0 && !isLoadingCompatible ? (
          // Show button when no compatible products loaded
          <div className="text-center">
            <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 dark:from-pink-900/20 dark:via-purple-900/10 dark:to-pink-900/20 rounded-3xl p-12 border border-pink-200/50 dark:border-pink-800/50">
              <motion.div
                className="mx-auto w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-3xl flex items-center justify-center mb-8 shadow-xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <Heart className="h-10 w-10 text-white" />
              </motion.div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Bu Ürünle Uyumlu Olanları Keşfedin
              </h2>
              
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                AI destekli akıllı sistem ile bu ürüne mükemmel uyum sağlayacak diğer ürünleri keşfedin. 
                Stil bütünlüğü için özel önerilerimizi görün.
              </p>

              <motion.button
                onClick={getCompatibleProducts}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Search className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                Uyumlu Ürünleri Keşfet
                <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
              </motion.button>
            </div>
          </div>
        ) : isLoadingCompatible ? (
          // Loading state
          <div className="text-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mx-auto w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mb-6 shadow-xl"
            >
              <Heart className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Uyumlu Ürünler Bulunuyor...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              AI sistemi bu ürüne en uygun olanları analiz ediyor
            </p>
          </div>
        ) : compatibleProducts.length > 0 ? (
          // Show compatible products
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <motion.div
                  className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Heart className="w-4 h-4 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Bu Ürünle Uyumlu Olanlar ({compatibleProducts.length})
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {compatibleMethod === 'ai' ? '🤖 AI ile önerilen uyumlu ürünler' : 
                     compatibleMethod === 'algorithm' ? '🔧 Akıllı algoritma ile seçilen ürünler' : 
                     'Size özel ürün önerileri'}
                  </p>
                </div>
              </div>
              
              <motion.button
                onClick={getCompatibleProducts}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium rounded-xl transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Yenile</span>
              </motion.button>
            </div>

            <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 dark:from-pink-900/20 dark:via-purple-900/10 dark:to-pink-900/20 rounded-2xl p-4 border border-pink-200/50 dark:border-pink-800/50 mb-8">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4 text-pink-600" />
                <span className="font-medium text-pink-800 dark:text-pink-200">
                  Öneriler Hazır!
                </span>
              </div>
              <p className="text-pink-700 dark:text-pink-300 text-sm">
                {compatibleProducts.length} ürün bu ürününüzle mükemmel uyum sağlayacak. 
                {compatibleMethod === 'ai' ? ' AI ile analiz edildi.' : ' Akıllı algoritma ile seçildi.'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {compatibleProducts.map((compatibleProduct, index) => (
                <motion.div
                  key={compatibleProduct.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <ProductCard product={compatibleProduct} />
                </motion.div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProductDetail;