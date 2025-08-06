import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Package, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import ProductGrid from '../components/ecommerce/ProductGrid';
import ProductCard from '../components/ecommerce/ProductCard';
import productService from '../services/ecommerce/productService';

const Products = () => {
  const { category } = useParams();
  const { state, dispatch, actionTypes } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryInfo, setCategoryInfo] = useState(null);

  const { products: { searchResults } } = state;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (category) {
      loadCategoryProducts();
    } else {
      // Clear category products when not viewing a category
      setCategoryProducts([]);
      setCategoryInfo(null);
    }
  }, [category]);

  const loadInitialData = async () => {
    try {
      const [featured, categories, brands] = await Promise.all([
        productService.getFeaturedProducts(8),
        productService.getCategories(),
        productService.getBrands(),
      ]);

      setFeaturedProducts(featured);
      dispatch({ type: actionTypes.SET_CATEGORIES, payload: categories });
      dispatch({ type: actionTypes.SET_BRANDS, payload: brands });
    } catch (error) {
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'error',
          message: 'Ürünler yüklenirken hata oluştu',
          duration: 5000,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryProducts = async () => {
    try {
      setLoading(true);
      const [productsResponse, categories] = await Promise.all([
        productService.getProducts({ category, limit: 50 }), // Get more products for category view
        productService.getCategories()
      ]);
      
      setCategoryProducts(productsResponse.products);
      
      // Find category info
      const catInfo = categories.find(cat => cat.id === category);
      setCategoryInfo(catInfo);
      
    } catch (error) {
      console.error('Error loading category products:', error);
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'error',
          message: 'Kategori ürünleri yüklenirken hata oluştu',
          duration: 5000,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const results = await productService.searchProducts(searchQuery);
      dispatch({ type: actionTypes.SET_SEARCH_QUERY, payload: searchQuery });
      dispatch({ type: actionTypes.SET_SEARCH_RESULTS, payload: results });
    } catch (error) {
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'error',
          message: 'Arama sırasında hata oluştu',
          duration: 5000,
        },
      });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    dispatch({ type: actionTypes.CLEAR_SEARCH });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="text-center mb-12" variants={itemVariants}>
        <motion.div
          className="mx-auto flex items-center justify-center h-16 w-16 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 mb-6 shadow-xl"
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ duration: 0.3 }}
        >
          {categoryInfo ? (
            <span className="text-3xl">{categoryInfo.icon}</span>
          ) : (
            <Package className="h-8 w-8 text-white" />
          )}
        </motion.div>

        <motion.h1
          className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          variants={itemVariants}
        >
          {categoryInfo ? categoryInfo.name : 'Ürünler'}
        </motion.h1>

        <motion.p
          className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed"
          variants={itemVariants}
        >
          {categoryInfo ? categoryInfo.description : 'ShopSmart\'ta binlerce kaliteli ürünü keşfedin ve AI destekli akıllı önerilerden faydalanın'}
        </motion.p>

        {/* Search Bar */}
        <motion.form
          onSubmit={handleSearch}
          className="max-w-2xl mx-auto"
          variants={itemVariants}
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-12 py-4 border border-gray-300 dark:border-gray-600 rounded-2xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
              placeholder="Ürün ara... (örn: iPhone, laptop, ayakkabı)"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              {state.products.searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="p-2 text-gray-400 hover:text-gray-600 mr-2"
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-xl mr-2 transition-colors font-medium"
              >
                Ara
              </button>
            </div>
          </div>
        </motion.form>
      </motion.div>

      {/* Search Results or Product Grid */}
      {state.products.searchQuery ? (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              "{state.products.searchQuery}" için arama sonuçları
            </h2>
            <button
              onClick={clearSearch}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Aramayı temizle
            </button>
          </div>
          <ProductGrid products={searchResults} showFilters={false} />
        </motion.div>
      ) : (
        <>
          {/* Category Products */}
          {category ? (
            categoryProducts && categoryProducts.length > 0 ? (
              <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {categoryInfo?.name} Ürünleri
                  </h2>
                  <span className="text-sm text-gray-500">
                    {categoryProducts.length} ürün bulundu
                  </span>
                </div>
                <ProductGrid products={categoryProducts} showFilters={true} />
              </motion.div>
            ) : loading ? (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Kategori ürünleri yükleniyor...</p>
              </motion.div>
            ) : (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-gray-600 dark:text-gray-400">Bu kategoride henüz ürün bulunmuyor.</p>
              </motion.div>
            )
          ) : (
            <>
              {/* Featured Products */}
              {!loading && featuredProducts.length > 0 && (
            <motion.div className="mb-16" variants={itemVariants}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <motion.div
                    className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Öne Çıkan Ürünler
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product, index) => (
                  <motion.div
                    key={product.firebaseId || product.id || `featured-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* All Products with Filters */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center space-x-3 mb-8">
              <motion.div
                className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Package className="w-4 h-4 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Tüm Ürünler
              </h2>
            </div>

            <ProductGrid showFilters={true} />
          </motion.div>
            </>
          )}
        </>
      )}

      {/* Loading State */}
      {loading && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Ürünler yükleniyor...</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Products;