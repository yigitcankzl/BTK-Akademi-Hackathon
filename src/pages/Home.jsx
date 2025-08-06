import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  BarChart3, 
  Zap,
  Brain,
  FileImage,
  ArrowRight,
  Sparkles,
  ShoppingCart,
  Package,
  Camera,
  Heart
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { APP_CONFIG } from '../utils/constants';
import productService from '../services/ecommerce/productService';
import ProductCard from '../components/ecommerce/ProductCard';

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

const floatVariants = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const Home = () => {
  const { state, dispatch, actionTypes } = useApp();
  const { isDarkMode } = state;
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);


  const features = [
    {
      id: 'products',
      title: 'Ürün Kataloğu',
      description: 'Binlerce kaliteli ürünü keşfedin',
      icon: Package,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      link: '/products',
      stats: '1000+ Ürün',
      badge: 'Popüler'
    },
    {
      id: 'cart',
      title: 'Sepetim',
      description: 'Sepetinizdeki ürünleri yönetin',
      icon: ShoppingCart,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
      link: '/cart',
      stats: `${state.cart?.items?.length || 0} Ürün`,
      badge: state.cart?.items?.length > 0 ? 'Dolu' : null
    },
    {
      id: 'visual-search',
      title: 'Görsel Arama',
      description: 'Fotoğraf ile ürün bulun',
      icon: Camera,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
      link: '/visual-search',
      stats: 'AI Destekli',
      badge: 'Yeni'
    },
    {
      id: 'recommendations',
      title: 'Kişisel Öneriler',
      description: 'Size özel seçilmiş ürünler',
      icon: Heart,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20',
      link: '/recommendations',
      stats: 'Sizin İçin',
      badge: 'AI'
    },
    {
      id: 'complementary-products',
      title: 'Tamamlayıcı Ürünler',
      description: 'AI ile uyumlu ürün önerileri alın',
      icon: Sparkles,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20',
      link: '/complementary-products',
      stats: 'AI Eşleştirme',
      badge: 'Yeni'
    },
    {
      id: 'ai-profile',
      title: 'AI Profil Anketi',
      description: 'Kişiliğinizi tanımlayarak özel öneriler alın',
      icon: Brain,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
      link: '/profile/questionnaire',
      stats: 'Kişiselleştir',
      badge: 'Akıllı'
    },
  ];

  // Load featured products from Firebase
  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        setLoadingProducts(true);
        const products = await productService.getFeaturedProducts(6);
        setFeaturedProducts(products);
      } catch (error) {
        console.error('Error loading featured products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadFeaturedProducts();
  }, []);


  return (
    <motion.div 
      className="max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Header */}
      <motion.div className="mb-12" variants={itemVariants}>
        <div className="text-center mb-8 relative">
          {/* Floating decoration */}
          <motion.div
            className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-gradient-to-r from-primary-400/20 to-accent-400/20 rounded-full blur-xl"
            variants={floatVariants}
            animate="animate"
          />
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              <motion.span 
                className="bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-clip-text text-transparent"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                style={{ backgroundSize: '200% 200%' }}
              >
                ShopSmart
              </motion.span>
              <br />
              <span className="text-2xl md:text-3xl font-normal text-gray-700 dark:text-gray-300">
                Akıllı Alışverişin Yeni Adresi
              </span>
            </h1>
            
            <motion.p 
              className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              AI destekli kişisel öneriler, görsel arama ve hızlı teslimat ile{' '}
              <motion.span 
                className="font-semibold text-primary-600 dark:text-primary-400"
                whileHover={{ scale: 1.05 }}
              >
                alışveriş deneyiminizi dönüştürün
              </motion.span>
            </motion.p>
          </motion.div>
        </div>

      </motion.div>

      {/* Feature Cards */}
      <motion.div 
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        variants={containerVariants}
      >
        {features.map((feature, index) => {
          const WrapperComponent = Link;
          const wrapperProps = { to: feature.link, className: "group block h-full" };

          return (
            <motion.div
              key={feature.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <WrapperComponent {...wrapperProps}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 h-full relative overflow-hidden group-hover:border-primary-300 dark:group-hover:border-primary-600">
                  {/* Badge */}
                  {feature.badge && (
                    <div className="absolute top-4 right-4 z-20">
                      <span className="px-2 py-1 text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-full">
                        {feature.badge}
                      </span>
                    </div>
                  )}
                  
                  {/* Background gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-accent-50/30 dark:from-primary-900/5 dark:via-transparent dark:to-accent-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <motion.div 
                        className={`${feature.bgColor} ${feature.color} p-3 rounded-xl shadow-sm`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <feature.icon className="w-6 h-6" />
                      </motion.div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
                        {feature.description}
                      </p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {feature.stats}
                        </span>
                        <motion.div
                          className="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          whileHover={{ x: 4 }}
                        >
                          <ArrowRight className="w-5 h-5 text-primary-500" />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </WrapperComponent>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Getting Started - Removed since API key is embedded */}
      {false && (
        <motion.div 
          variants={itemVariants}
          className="relative mb-12 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-primary-50 via-accent-50/50 to-primary-50 dark:from-primary-900/20 dark:via-accent-900/10 dark:to-primary-900/20 rounded-3xl p-6 md:p-8 border border-primary-200/50 dark:border-primary-800/50 backdrop-blur-sm relative">
            {/* Animated background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-200/30 to-accent-200/30 rounded-full blur-2xl -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent-200/30 to-primary-200/30 rounded-full blur-2xl translate-y-12 -translate-x-12" />
            
            <div className="relative z-10 flex items-start space-x-4 md:space-x-6">
              <motion.div 
                className="bg-gradient-to-br from-primary-500 to-accent-500 p-4 rounded-2xl shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </motion.div>
              
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  🚀 Get Started
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Ready to unlock the power of AI? Configure your Gemini API key to begin using all the amazing features this template has to offer.
                </p>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="inline-flex items-center px-6 py-3 bg-gray-400 text-white font-semibold rounded-2xl opacity-50 cursor-not-allowed">
                    API Yapılandırma Devre Dışı
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      )}


      {/* Featured Products */}
      <motion.div
        variants={itemVariants}
        className="mt-16"
      >
        <div className="text-center mb-8">
          <motion.h2 
            className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
            variants={itemVariants}
          >
            ⭐ Popüler Ürünler
          </motion.h2>
          <motion.p 
            className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            En çok beğenilen ve satın alınan ürünlerimizi keşfedin
          </motion.p>
        </div>

        {loadingProducts ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-64"></div>
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.firebaseId || product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Henüz öne çıkan ürün bulunmuyor
            </p>
          </div>
        )}

        <div className="text-center mt-8">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl"
            >
              Tüm Ürünleri Gör
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </motion.div>
        </div>
      </motion.div>


      {/* Footer Info */}
      <motion.div 
        variants={itemVariants}
        className="mt-8 text-center"
      >
        <motion.div
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-100/50 via-primary-50/30 to-gray-100/50 dark:from-gray-800/50 dark:via-primary-900/20 dark:to-gray-800/50 rounded-2xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            ShopSmart v1.0 - BTK Akademi Hackathon 2025 Projesi
          </p>
          <Sparkles className="w-4 h-4 text-primary-500" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Home;
