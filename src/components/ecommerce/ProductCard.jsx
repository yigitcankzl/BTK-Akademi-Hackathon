import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Eye, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';
import cartService from '../../services/ecommerce/cartService';
import { ECOMMERCE_CONFIG } from '../../utils/constants';

const ProductCard = ({ product, showQuickView = true, className = '' }) => {
  const { state, dispatch, actionTypes } = useApp();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showQuickViewModal, setShowQuickViewModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isInWishlist = state.user?.wishlist?.some(item => item.id === product.id) || false;
  const discountPercentage = product.discount;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAddingToCart(true);
    try {
      // Set user ID in cart service
      if (state.user?.profile?.id) {
        cartService.setUserId(state.user.profile.id);
      }
      
      // Use firebaseId if available, otherwise use id
      const productId = product.firebaseId || product.id;
      const cartSummary = await cartService.addItem(productId, 1);
      dispatch({ type: actionTypes.SET_CART, payload: cartSummary });
      
      // Show success notification
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
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInWishlist) {
      dispatch({ type: actionTypes.REMOVE_FROM_WISHLIST, payload: product.id });
    } else {
      dispatch({ type: actionTypes.ADD_TO_WISHLIST, payload: product });
    }
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickViewModal(true);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : index < rating
            ? 'fill-yellow-200 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <>
      <motion.div
        className={`group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${className}`}
        whileHover={{ y: -4 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Product Link Wrapper */}
        <Link to={`/product/${product.slug}`} className="block">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
            {/* Discount Badge */}
            {discountPercentage > 0 && (
              <motion.div
                className="absolute top-3 left-3 z-10 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-semibold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                %{discountPercentage} İndirim
              </motion.div>
            )}

            {/* AI Generated Badge */}
            {product.aiGenerated?.description && (
              <motion.div
                className="absolute top-3 right-3 z-10 bg-purple-500 text-white p-1.5 rounded-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                title="AI Generated Content"
              >
                <Zap className="w-3 h-3" />
              </motion.div>
            )}

            {/* Product Image */}
            <div className="relative w-full h-full">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              )}
              <img
                src={product.images[0]}
                alt={product.name}
                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                loading="lazy"
              />
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />

            {/* Action Buttons */}
            <div className="absolute bottom-3 left-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* Add to Cart Button */}
              <motion.button
                onClick={handleAddToCart}
                disabled={isAddingToCart || product.stock === 0}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{isAddingToCart ? 'Ekleniyor...' : 'Sepete Ekle'}</span>
              </motion.button>

              {/* Quick View Button */}
              {showQuickView && (
                <motion.button
                  onClick={handleQuickView}
                  className="bg-white hover:bg-gray-100 text-gray-700 p-2 rounded-lg transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Hızlı Görünüm"
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
              )}

              {/* Wishlist Button */}
              <motion.button
                onClick={handleToggleWishlist}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isInWishlist
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-white hover:bg-gray-100 text-gray-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={isInWishlist ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
              >
                <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
              </motion.button>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-4">
            {/* Brand */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{product.brand}</p>
            
            {/* Product Name */}
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center space-x-1">
                {renderStars(product.rating)}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({product.reviewCount})
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {ECOMMERCE_CONFIG.CURRENCY_SYMBOL}{product.price.toLocaleString('tr-TR')}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  {ECOMMERCE_CONFIG.CURRENCY_SYMBOL}{product.originalPrice.toLocaleString('tr-TR')}
                </span>
              )}
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Stock Status */}
            {product.stock <= 5 && product.stock > 0 && (
              <p className="text-sm text-orange-500 mt-2">
                Son {product.stock} adet!
              </p>
            )}
            {product.stock === 0 && (
              <p className="text-sm text-red-500 mt-2">Stokta yok</p>
            )}
          </div>
        </Link>
      </motion.div>

      {/* Quick View Modal would go here */}
      {showQuickViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Hızlı Görünüm
                </h2>
                <button
                  onClick={() => setShowQuickViewModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {product.shortDescription}
                  </p>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-2xl font-bold text-primary-600">
                      {ECOMMERCE_CONFIG.CURRENCY_SYMBOL}{product.price.toLocaleString('tr-TR')}
                    </span>
                    {product.originalPrice > product.price && (
                      <span className="text-lg text-gray-500 line-through">
                        {ECOMMERCE_CONFIG.CURRENCY_SYMBOL}{product.originalPrice.toLocaleString('tr-TR')}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      {isAddingToCart ? 'Ekleniyor...' : 'Sepete Ekle'}
                    </button>
                    <Link
                      to={`/product/${product.slug}`}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                      onClick={() => setShowQuickViewModal(false)}
                    >
                      Detayları Gör
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default ProductCard;