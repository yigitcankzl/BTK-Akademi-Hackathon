import React, { useState, useEffect } from 'react';
import { X, Star, Check, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';
import productService from '../../services/ecommerce/productService';
import { ECOMMERCE_CONFIG } from '../../utils/constants';

const ProductFilters = ({ onClose }) => {
  const { state, dispatch, actionTypes } = useApp();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [tempPriceRange, setTempPriceRange] = useState([0, 100000]);
  const [loading, setLoading] = useState(true);

  const { filters } = state.products;

  // Load filter options
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Update local price range when filters change
  useEffect(() => {
    setPriceRange(filters.priceRange);
    setTempPriceRange(filters.priceRange);
  }, [filters.priceRange]);

  const loadFilterOptions = async () => {
    try {
      const [categoriesData, brandsData, priceRangeData] = await Promise.all([
        productService.getCategories(),
        productService.getBrands(),
        productService.getPriceRange(),
      ]);

      setCategories(categoriesData);
      setBrands(brandsData);
      setPriceRange([priceRangeData.min, priceRangeData.max]);
      setTempPriceRange([priceRangeData.min, priceRangeData.max]);
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId) => {
    const newCategory = filters.category === categoryId ? null : categoryId;
    dispatch({
      type: actionTypes.SET_PRODUCT_FILTERS,
      payload: { category: newCategory },
    });
  };

  const handleBrandChange = (brandName) => {
    const newBrand = filters.brand === brandName ? null : brandName;
    dispatch({
      type: actionTypes.SET_PRODUCT_FILTERS,
      payload: { brand: newBrand },
    });
  };

  const handleRatingChange = (rating) => {
    const newRating = filters.rating === rating ? 0 : rating;
    dispatch({
      type: actionTypes.SET_PRODUCT_FILTERS,
      payload: { rating: newRating },
    });
  };

  const handlePriceRangeChange = (newRange) => {
    setTempPriceRange(newRange);
  };

  const applyPriceRange = () => {
    dispatch({
      type: actionTypes.SET_PRODUCT_FILTERS,
      payload: { priceRange: tempPriceRange },
    });
  };

  const handleInStockChange = (inStock) => {
    dispatch({
      type: actionTypes.SET_PRODUCT_FILTERS,
      payload: { inStock },
    });
  };

  const clearFilters = () => {
    dispatch({
      type: actionTypes.SET_PRODUCT_FILTERS,
      payload: {
        category: null,
        brand: null,
        priceRange: [0, 100000],
        rating: 0,
        inStock: true,
      },
    });
  };

  const hasActiveFilters = 
    filters.category ||
    filters.brand ||
    filters.rating > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 100000 ||
    !filters.inStock;

  const renderStars = (rating, filled = false) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          filled && index < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg sticky top-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filtreler
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Temizle
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Categories */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Kategoriler
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={filters.category === category.id}
                    onChange={() => handleCategoryChange(category.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      filters.category === category.id
                        ? 'bg-primary-600 border-primary-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {filters.category === category.id && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {category.productCount} ürün
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Brands */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Markalar
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {brands.map((brand) => (
              <label
                key={brand.name}
                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={filters.brand === brand.name}
                    onChange={() => handleBrandChange(brand.name)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      filters.brand === brand.name
                        ? 'bg-primary-600 border-primary-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {filters.brand === brand.name && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {brand.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {brand.productCount}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Fiyat Aralığı
          </h4>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={tempPriceRange[0]}
                onChange={(e) =>
                  handlePriceRangeChange([parseInt(e.target.value) || 0, tempPriceRange[1]])
                }
                className="w-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Min"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                value={tempPriceRange[1]}
                onChange={(e) =>
                  handlePriceRangeChange([tempPriceRange[0], parseInt(e.target.value) || 100000])
                }
                className="w-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Max"
              />
            </div>
            
            <div className="relative">
              <input
                type="range"
                min={0}
                max={100000}
                step={100}
                value={tempPriceRange[0]}
                onChange={(e) =>
                  handlePriceRangeChange([parseInt(e.target.value), tempPriceRange[1]])
                }
                className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 z-10"
                style={{ pointerEvents: 'none' }}
              />
              <input
                type="range"
                min={0}
                max={100000}
                step={100}
                value={tempPriceRange[1]}
                onChange={(e) =>
                  handlePriceRangeChange([tempPriceRange[0], parseInt(e.target.value)])
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{ECOMMERCE_CONFIG.CURRENCY_SYMBOL}0</span>
              <span>{ECOMMERCE_CONFIG.CURRENCY_SYMBOL}100,000+</span>
            </div>
            
            {(tempPriceRange[0] !== filters.priceRange[0] || 
              tempPriceRange[1] !== filters.priceRange[1]) && (
              <button
                onClick={applyPriceRange}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                Fiyat Filtresi Uygula
              </button>
            )}
          </div>
        </div>

        {/* Rating */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Değerlendirme
          </h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <label
                key={rating}
                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
              >
                <input
                  type="radio"
                  name="rating"
                  checked={filters.rating === rating}
                  onChange={() => handleRatingChange(rating)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <div className="flex items-center space-x-1">
                  {renderStars(rating, true)}
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    {rating} yıldız ve üzeri
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Stock Status */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Stok Durumu
          </h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) => handleInStockChange(e.target.checked)}
                className="text-primary-600 focus:ring-primary-500 rounded"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Sadece stokta olanlar
              </span>
            </label>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductFilters;