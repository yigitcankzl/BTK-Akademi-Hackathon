import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, Heart, ArrowRight, CreditCard, CheckCircle, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import cartService from '../services/ecommerce/cartService';
import { getOrderService } from '../services/orderService';
import { getOrderBasedRecommendationService } from '../services/orderBasedRecommendationService';
import { ECOMMERCE_CONFIG } from '../utils/constants';

const Cart = () => {
  const { state, dispatch, actionTypes } = useApp();
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [cartJustCleared, setCartJustCleared] = useState(false);

  useEffect(() => {
    // Set user ID in cart service when user changes
    if (state.user?.profile?.id) {
      cartService.setUserId(state.user.profile.id);
    } else {
      cartService.setUserId(null);
    }
    
    // Don't reload cart if it was just cleared after payment
    if (!cartJustCleared) {
      loadCartData();
    }
  }, [state.cart, state.user?.profile?.id, cartJustCleared]);

  const loadCartData = async () => {
    try {
      const cartSummary = await cartService.getCartSummary();
      setCartData(cartSummary);
    } catch (error) {
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'error',
          message: 'Sepet yüklenirken hata oluştu',
          duration: 5000,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemKey, newQuantity) => {
    try {
      const updatedCart = await cartService.updateItemQuantity(itemKey, newQuantity);
      dispatch({ type: actionTypes.SET_CART, payload: updatedCart });
    } catch (error) {
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'error',
          message: error.message,
          duration: 5000,
        },
      });
    }
  };

  const handleRemoveItem = async (itemKey) => {
    try {
      const updatedCart = await cartService.removeItem(itemKey);
      dispatch({ type: actionTypes.SET_CART, payload: updatedCart });
      
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'success',
          message: 'Ürün sepetten kaldırıldı',
          duration: 3000,
        },
      });
    } catch (error) {
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'error',
          message: 'Ürün kaldırılırken hata oluştu',
          duration: 5000,
        },
      });
    }
  };

  const handleSaveForLater = async (itemKey) => {
    try {
      const updatedCart = await cartService.saveForLater(itemKey);
      dispatch({ type: actionTypes.SET_CART, payload: updatedCart });
      
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'success',
          message: 'Ürün daha sonra için kaydedildi',
          duration: 3000,
        },
      });
    } catch (error) {
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'error',
          message: 'Ürün kaydedilirken hata oluştu',
          duration: 5000,
        },
      });
    }
  };

  const handleAutomaticCheckout = async () => {
    if (!cartData || cartData.items.length === 0) {
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'warning',
          message: 'Sepetiniz boş, ödeme yapılamaz',
          duration: 3000,
        }
      });
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      console.log('🚀 Starting automatic checkout...');
      
      const orderService = getOrderService();
      
      // Otomatik ödeme işlemini başlat
      const result = await orderService.processAutomaticCheckout(cartData, state.user);
      
      if (result.success) {
        // Başarılı ödeme
        setSuccessOrder(result.order);
        setOrderSuccess(true);
        
        // Sepeti temizle
        console.log('🗑️ Clearing cart after successful payment...');
        console.log('📊 Current cart before clearing:', cartData);
        await cartService.clearCart();
        dispatch({ type: actionTypes.CLEAR_CART });
        console.log('✅ CartService and Redux cleared');
        
        // Cart state'ini de güncelle ve boş sepet objesi oluştur
        const emptyCart = {
          items: [],
          itemCount: 0,
          isEmpty: true,
          totals: {
            subtotal: 0,
            tax: 0,
            shipping: 0,
            discount: 0,
            total: 0
          },
          coupon: null,
          qualifiesForFreeShipping: false,
          freeShippingThreshold: 500
        };
        
        setCartData(emptyCart);
        setCartJustCleared(true);
        console.log('✅ Cart cleared successfully');
        
        // Başarı bildirimi
        dispatch({
          type: actionTypes.ADD_NOTIFICATION,
          payload: {
            id: Date.now(),
            type: 'success',
            message: `🎉 Siparişiniz başarıyla alındı! Sipariş No: ${result.order.orderId}`,
            duration: 8000,
          }
        });
        
        console.log('✅ Automatic checkout completed successfully');
        
        // 3 saniye sonra AI önerileri al (async olarak)
        setTimeout(() => {
          getPostOrderRecommendations(result.order);
        }, 3000);
        
      } else {
        throw new Error(result.message || 'Ödeme işlemi başarısız');
      }
      
    } catch (error) {
      console.error('❌ Automatic checkout failed:', error);
      
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'error',
          message: error.message || 'Ödeme işlemi sırasında hata oluştu',
          duration: 5000,
        }
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getPostOrderRecommendations = async (order) => {
    try {
      if (!state.settings.geminiApiKey) {
        console.log('No Gemini API key, skipping post-order recommendations');
        return;
      }

      console.log('🤖 Getting post-order AI recommendations...');
      
      const recommendationService = getOrderBasedRecommendationService();
      const userId = state.user?.profile?.id || state.user?.id || state.user?.uid;
      
      if (!userId) {
        console.log('No user ID, skipping recommendations');
        return;
      }

      const recommendations = await recommendationService.getRecommendationsBasedOnOrderHistory(
        userId, 
        state.settings.geminiApiKey,
        { maxRecommendations: 4, excludeRecentPurchases: false }
      );

      if (recommendations.success && recommendations.recommendations.length > 0) {
        console.log('✅ Post-order recommendations ready:', recommendations.recommendations.length);
        
        dispatch({
          type: actionTypes.ADD_NOTIFICATION,
          payload: {
            id: Date.now(),
            type: 'info',
            message: '🛍️ Sipariş geçmişinize göre yeni öneriler hazırlandı! Öneriler sayfasını ziyaret edin.',
            duration: 6000,
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Error getting post-order recommendations:', error);
      // Hata durumunda sessizce devam et
    }
  };


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-gray-200 dark:bg-gray-700 h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!cartData || cartData.isEmpty) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-800 mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <ShoppingCart className="h-12 w-12 text-gray-400" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Sepetiniz boş
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            ShopSmart'taki harika ürünleri keşfetmeye başlayın
          </p>
          
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-2xl font-semibold transition-colors text-lg"
          >
            <span>Alışverişe Başla</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <ShoppingCart className="w-8 h-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Sepetim ({cartData.itemCount} ürün)
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {cartData.items.map((item) => (
              <motion.div
                key={item.key}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-start space-x-4">
                  {/* Product Image */}
                  <Link to={`/product/${item.slug}`} className="flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-xl"
                    />
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.slug}`}
                      className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 transition-colors"
                    >
                      {item.name}
                    </Link>
                    
                    {/* Variants */}
                    {Object.keys(item.selectedVariants).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(item.selectedVariants).map(([key, value]) => (
                          <span
                            key={key}
                            className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm px-2 py-1 rounded"
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Availability */}
                    {!item.isAvailable && (
                      <p className="text-red-500 text-sm mt-2">
                        Bu ürün artık mevcut değil
                      </p>
                    )}

                    {/* Price & Actions */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-primary-600">
                          {ECOMMERCE_CONFIG.CURRENCY_SYMBOL}{item.price.toLocaleString('tr-TR')}
                        </span>
                        {item.originalPrice > item.price && (
                          <span className="text-sm text-gray-500 line-through">
                            {ECOMMERCE_CONFIG.CURRENCY_SYMBOL}{item.originalPrice.toLocaleString('tr-TR')}
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.key, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        
                        <span className="w-12 text-center font-medium">
                          {item.quantity}
                        </span>
                        
                        <button
                          onClick={() => handleUpdateQuantity(item.key, item.quantity + 1)}
                          disabled={!item.isAvailable || item.quantity >= item.stockAvailable}
                          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Item Actions */}
                    <div className="flex items-center space-x-4 mt-4">
                      <button
                        onClick={() => handleSaveForLater(item.key)}
                        className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        <span>Daha sonra için kaydet</span>
                      </button>
                      
                      <button
                        onClick={() => handleRemoveItem(item.key)}
                        className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Kaldır</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Sipariş Özeti
            </h2>


            {/* Price Breakdown */}
            <div className="space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Ara Toplam</span>
                <span className="font-medium">
                  {ECOMMERCE_CONFIG.CURRENCY_SYMBOL}{cartData.totals.subtotal.toLocaleString('tr-TR')}
                </span>
              </div>
              
              {cartData.totals.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>İndirim</span>
                  <span>
                    -{ECOMMERCE_CONFIG.CURRENCY_SYMBOL}{cartData.totals.discount.toLocaleString('tr-TR')}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Kargo</span>
                <span className="font-medium">
                  {cartData.totals.shipping === 0 ? (
                    <span className="text-green-600">Ücretsiz</span>
                  ) : (
                    `${ECOMMERCE_CONFIG.CURRENCY_SYMBOL}${cartData.totals.shipping.toLocaleString('tr-TR')}`
                  )}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">KDV</span>
                <span className="font-medium">
                  {ECOMMERCE_CONFIG.CURRENCY_SYMBOL}{cartData.totals.tax.toLocaleString('tr-TR')}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center py-4 text-xl font-bold">
              <span className="text-gray-900 dark:text-white">Toplam</span>
              <span className="text-primary-600">
                {ECOMMERCE_CONFIG.CURRENCY_SYMBOL}{cartData.totals.total.toLocaleString('tr-TR')}
              </span>
            </div>

            {/* Free Shipping Progress */}
            {!cartData.qualifiesForFreeShipping && (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Ücretsiz kargo için</span>
                  <span className="font-medium">
                    {ECOMMERCE_CONFIG.CURRENCY_SYMBOL}
                    {(cartData.freeShippingThreshold - cartData.totals.subtotal).toLocaleString('tr-TR')} kaldı
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((cartData.totals.subtotal / cartData.freeShippingThreshold) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Automatic Checkout Button */}
            <motion.button
              onClick={handleAutomaticCheckout}
              disabled={isProcessingPayment || cartData.items.length === 0}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-3 text-lg shadow-lg hover:shadow-xl"
              whileHover={{ scale: isProcessingPayment ? 1 : 1.02 }}
              whileTap={{ scale: isProcessingPayment ? 1 : 0.98 }}
            >
              {isProcessingPayment ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-5 h-5" />
                  </motion.div>
                  <span>Ödeme İşleniyor...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Otomatik Öde</span>
                  <span className="bg-white/20 px-2 py-1 rounded text-sm">₺{cartData.totals.total.toFixed(2)}</span>
                </>
              )}
            </motion.button>

            {/* Continue Shopping */}
            <Link
              to="/products"
              className="block text-center text-primary-600 hover:text-primary-700 font-medium mt-4 transition-colors"
            >
              Alışverişe devam et
            </Link>
          </div>
        </div>
      </div>
      
      {/* Order Success Modal */}
      <AnimatePresence>
        {orderSuccess && successOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setOrderSuccess(false);
                  setCartJustCleared(false); // Reset flag when modal is closed
                  // Boş sepet objesi oluştur
                  const emptyCart = {
                    items: [],
                    itemCount: 0,
                    isEmpty: true,
                    totals: {
                      subtotal: 0,
                      tax: 0,
                      shipping: 0,
                      discount: 0,
                      total: 0
                    },
                    coupon: null,
                    qualifiesForFreeShipping: false,
                    freeShippingThreshold: 500
                  };
                  setCartData(emptyCart);
                  console.log('✅ Empty cart set via X button');
                }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              
              {/* Success Message */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-900 dark:text-white mb-4"
              >
                🎉 Sipariş Başarılı!
              </motion.h2>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3 mb-6"
              >
                <p className="text-gray-600 dark:text-gray-400">
                  Siparişiniz başarıyla alındı ve işleme konuldu.
                </p>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 border border-green-200/50 dark:border-green-800/50">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Sipariş No:</span>
                      <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                        {successOrder.orderId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Toplam:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ₺{successOrder.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Durum:</span>
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        ✅ Onaylandı
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  📧 Sipariş detayları e-posta adresinize gönderildi.
                </p>
              </motion.div>
              
              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <Link
                  to="/recommendations"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2"
                  onClick={() => {
                    setOrderSuccess(false);
                    // Boş sepet objesi oluştur
                    const emptyCart = {
                      items: [],
                      itemCount: 0,
                      isEmpty: true,
                      totals: {
                        subtotal: 0,
                        tax: 0,
                        shipping: 0,
                        discount: 0,
                        total: 0
                      },
                      coupon: null,
                      qualifiesForFreeShipping: false,
                      freeShippingThreshold: 500
                    };
                    setCartData(emptyCart);
                    setCartJustCleared(false); // Reset flag when modal is closed
                    console.log('✅ Empty cart set via AI button');
                  }}
                >
                  <Heart className="w-4 h-4" />
                  <span>AI Önerilerini Gör</span>
                </Link>
                
                <button
                  onClick={() => {
                    setOrderSuccess(false);
                    // Boş sepet objesi oluştur
                    const emptyCart = {
                      items: [],
                      itemCount: 0,
                      isEmpty: true,
                      totals: {
                        subtotal: 0,
                        tax: 0,
                        shipping: 0,
                        discount: 0,
                        total: 0
                      },
                      coupon: null,
                      qualifiesForFreeShipping: false,
                      freeShippingThreshold: 500
                    };
                    setCartData(emptyCart);
                    setCartJustCleared(false); // Reset flag when modal is closed
                    console.log('✅ Empty cart set via continue shopping button');
                  }}
                  className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-xl font-medium transition-colors"
                >
                  Alışverişe Devam Et
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cart;