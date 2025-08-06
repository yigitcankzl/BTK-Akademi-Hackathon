import React, { useState, useEffect } from 'react';
import { Grid, List, Filter, SortAsc } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import { useApp } from '../../contexts/AppContext';
import productService from '../../services/ecommerce/productService';
import { ECOMMERCE_CONFIG } from '../../utils/constants';

const ProductGrid = ({ 
  products: initialProducts,
  showFilters = true,
  showSort = true,
  showViewToggle = true,
  className = '',
  itemsPerPage = ECOMMERCE_CONFIG.ITEMS_PER_PAGE 
}) => {
  const { state, dispatch, actionTypes } = useApp();
  const [products, setProducts] = useState(initialProducts || []);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { filters, searchQuery } = state.products;

  // Fetch products when filters change
  useEffect(() => {
    if (!initialProducts) {
      fetchProducts();
    } else {
      setProducts(initialProducts);
    }
  }, [filters, searchQuery, sortBy, sortOrder, currentPage, initialProducts]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      console.log('ProductGrid: Fetching products with options:', {
        page: currentPage,
        limit: itemsPerPage,
        category: filters.category,
        brand: filters.brand,
        minPrice: filters.priceRange[0],
        maxPrice: filters.priceRange[1],
        sortBy,
        sortOrder,
        search: searchQuery,
      });

      const options = {
        page: currentPage,
        limit: itemsPerPage,
        category: filters.category,
        brand: filters.brand,
        minPrice: filters.priceRange[0],
        maxPrice: filters.priceRange[1],
        sortBy,
        sortOrder,
        search: searchQuery,
      };

      const response = await productService.getProducts(options);
      console.log('ProductGrid: Received response:', response);
      console.log('ProductGrid: Pagination info:', {
        totalPages: response.pagination.totalPages,
        totalItems: response.pagination.totalItems,
        currentPage: response.pagination.currentPage,
        limit: response.pagination.itemsPerPage
      });
      setProducts(response.products);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('ProductGrid: Error fetching products:', error);
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

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sortOptions = [
    { value: 'name', label: 'İsim' },
    { value: 'price', label: 'Fiyat' },
    { value: 'rating', label: 'Değerlendirme' },
    { value: 'createdAt', label: 'Yeni Eklenenler' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
      },
    },
  };

  return (
    <div className={`${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          {/* Results Count */}
          <span className="text-gray-600 dark:text-gray-400">
            {products.length} ürün gösteriliyor
          </span>

          {/* Filters Toggle (Mobile) */}
          {showFilters && (
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="lg:hidden flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filtreler</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Sort Dropdown */}
          {showSort && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sıralama:</span>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <React.Fragment key={option.value}>
                    <option value={`${option.value}-asc`}>
                      {option.label} (A-Z)
                    </option>
                    <option value={`${option.value}-desc`}>
                      {option.label} (Z-A)
                    </option>
                  </React.Fragment>
                ))}
              </select>
            </div>
          )}

          {/* View Mode Toggle */}
          {showViewToggle && (
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className={`lg:block ${showFiltersPanel ? 'block' : 'hidden'} w-full lg:w-64 flex-shrink-0`}>
            <ProductFilters />
          </div>
        )}

        {/* Products Container */}
        <div className="flex-1">
          {loading ? (
            // Loading Skeleton
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {Array.from({ length: itemsPerPage }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-700 aspect-square rounded-2xl mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            // Empty State
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Ürün bulunamadı
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Arama kriterlerinizle eşleşen ürün bulunamadı. Filtreleri değiştirmeyi deneyin.
              </p>
              <button
                onClick={() => {
                  dispatch({ type: actionTypes.SET_PRODUCT_FILTERS, payload: {
                    category: null,
                    brand: null,
                    priceRange: [0, 100000],
                    rating: 0,
                  }});
                  dispatch({ type: actionTypes.CLEAR_SEARCH });
                }}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Filtreleri Temizle
              </button>
            </motion.div>
          ) : (
            // Products Grid/List
            <motion.div
              className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {products.map((product, index) => (
                  <motion.div
                    key={product.id || `product-${index}`}
                    variants={itemVariants}
                    layout
                  >
                    <ProductCard 
                      product={product} 
                      className={viewMode === 'list' ? 'flex' : ''}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Pagination */}
          {console.log('ProductGrid render: totalPages =', totalPages, 'products.length =', products.length)}
          {(totalPages > 1 || true) && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Önceki
              </button>
              
              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1;
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 2 && page <= currentPage + 2)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm rounded-lg ${
                        currentPage === page
                          ? 'bg-primary-600 text-white'
                          : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 3 ||
                  page === currentPage + 3
                ) {
                  return (
                    <span key={page} className="px-2 text-gray-500">
                      ...
                    </span>
                  );
                }
                return null;
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sonraki
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductGrid;