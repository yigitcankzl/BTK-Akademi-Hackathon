/**
 * Optimized Cart Service with Advanced Firebase Read Optimization
 * 
 * Key Optimizations:
 * - Eliminates N+1 query problems with batch product fetching
 * - Intelligent caching for frequently accessed cart data
 * - Real-time cart synchronization with efficient listeners
 * - Optimistic updates for better user experience
 * - Comprehensive error handling and recovery
 */

import FirebaseService from './firebaseService'; // Use existing cart methods
import { getOptimizedCache } from './optimizedDataCache';
import { getOptimizedProductService } from './optimizedProductService';

class OptimizedCartService {
  constructor() {
    this.cache = getOptimizedCache();
    this.productService = getOptimizedProductService();
    this.activeListeners = new Map(); // Track active real-time listeners
  }

  /**
   * Get user cart with optimized product data loading (solves N+1 problem)
   */
  async getUserCart(userId, useCache = true) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const cacheKey = `cart:${userId}`;

    if (useCache) {
      try {
        return await this.cache.get(
          cacheKey,
          'carts',
          () => this.fetchCartFromFirebase(userId)
        );
      } catch (error) {
        console.error('❌ Optimized cart fetch failed:', error);
        throw error;
      }
    } else {
      return await this.fetchCartFromFirebase(userId);
    }
  }

  /**
   * Fetch cart from Firebase with optimized batch product loading
   */
  async fetchCartFromFirebase(userId) {
    try {
      console.log(`🛒 Fetching cart for user: ${userId}`);
      
      // Get cart items from Firebase
      const cartItems = await FirebaseService.getUserCart(userId);
      
      if (!cartItems || cartItems.length === 0) {
        return {
          userId,
          items: [],
          totalItems: 0,
          totalPrice: 0,
          lastUpdated: new Date().toISOString(),
          isEmpty: true
        };
      }

      // Extract unique product IDs to eliminate duplicate fetches
      const uniqueProductIds = [...new Set(cartItems.map(item => item.productId))];
      console.log(`📦 Batch fetching ${uniqueProductIds.length} unique products for cart`);

      // Batch fetch all products at once (eliminates N+1 queries)
      const products = await this.productService.getProductsBatch(uniqueProductIds);
      const productMap = new Map();
      
      // Create product lookup map
      Object.entries(products).forEach(([productId, product]) => {
        if (product) {
          productMap.set(productId, product);
        }
      });

      // Enrich cart items with product data
      const enrichedItems = cartItems
        .map(item => this.enrichCartItem(item, productMap))
        .filter(item => item.product !== null); // Remove items with missing products

      // Calculate cart totals
      const totals = this.calculateCartTotals(enrichedItems);

      const optimizedCart = {
        userId,
        items: enrichedItems,
        totalItems: enrichedItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: totals.totalPrice,
        totalOriginalPrice: totals.totalOriginalPrice,
        totalDiscount: totals.totalDiscount,
        totalSavings: totals.totalSavings,
        lastUpdated: new Date().toISOString(),
        isEmpty: enrichedItems.length === 0,
        hasUnavailableItems: enrichedItems.some(item => !item.isAvailable),
        optimizedFetch: true
      };

      console.log(`✅ Cart loaded: ${enrichedItems.length} items, ₺${totals.totalPrice.toFixed(2)} total`);
      return optimizedCart;

    } catch (error) {
      console.error(`❌ Error fetching cart for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Enrich cart item with product data and calculate derived properties
   */
  enrichCartItem(cartItem, productMap) {
    const product = productMap.get(cartItem.productId);
    
    if (!product) {
      console.warn(`⚠️ Product not found for cart item: ${cartItem.productId}`);
      return {
        ...cartItem,
        product: null,
        isAvailable: false,
        itemTotalPrice: 0,
        itemOriginalPrice: 0,
        itemDiscount: 0,
        error: 'Product not found'
      };
    }

    // Calculate item-specific pricing
    const itemPrice = product.price || 0;
    const itemOriginalPrice = product.originalPrice || itemPrice;
    const itemTotalPrice = itemPrice * cartItem.quantity;
    const itemOriginalTotalPrice = itemOriginalPrice * cartItem.quantity;
    const itemDiscount = itemOriginalTotalPrice - itemTotalPrice;

    // Check availability
    const isAvailable = product.stock >= cartItem.quantity;
    const stockStatus = this.getStockStatus(product.stock, cartItem.quantity);

    return {
      ...cartItem,
      product,
      
      // Pricing information
      itemPrice,
      itemOriginalPrice,
      itemTotalPrice,
      itemOriginalTotalPrice,
      itemDiscount,
      itemSavings: itemDiscount > 0 ? itemDiscount : 0,
      
      // Availability information
      isAvailable,
      stockStatus,
      maxAvailableQuantity: product.stock,
      
      // Display information
      displayName: product.name,
      displayImage: product.images?.[0] || '',
      displaySlug: product.slug,
      
      // Metadata
      lastChecked: new Date().toISOString(),
      key: `${cartItem.productId}_${JSON.stringify(cartItem.selectedVariants || {})}`
    };
  }

  /**
   * Calculate comprehensive cart totals
   */
  calculateCartTotals(cartItems) {
    const totals = cartItems.reduce((acc, item) => {
      if (item.isAvailable) {
        acc.totalPrice += item.itemTotalPrice || 0;
        acc.totalOriginalPrice += item.itemOriginalTotalPrice || 0;
        acc.totalDiscount += item.itemDiscount || 0;
      } else {
        acc.unavailableItemsValue += item.itemTotalPrice || 0;
      }
      return acc;
    }, {
      totalPrice: 0,
      totalOriginalPrice: 0,
      totalDiscount: 0,
      unavailableItemsValue: 0
    });

    totals.totalSavings = totals.totalDiscount;
    totals.discountPercentage = totals.totalOriginalPrice > 0 
      ? (totals.totalDiscount / totals.totalOriginalPrice * 100).toFixed(2)
      : 0;

    return totals;
  }

  /**
   * Get stock status with intelligent messaging
   */
  getStockStatus(availableStock, requestedQuantity) {
    if (availableStock === 0) {
      return { status: 'out_of_stock', message: 'Stokta yok', available: 0 };
    } else if (availableStock < requestedQuantity) {
      return { 
        status: 'insufficient_stock', 
        message: `Sadece ${availableStock} adet mevcut`, 
        available: availableStock 
      };
    } else if (availableStock <= 5) {
      return { 
        status: 'low_stock', 
        message: `Son ${availableStock} adet`, 
        available: availableStock 
      };
    } else {
      return { status: 'in_stock', message: 'Stokta', available: availableStock };
    }
  }

  /**
   * Add item to cart with optimistic updates
   */
  async addToCart(userId, productId, quantity = 1, selectedVariants = {}) {
    if (!userId || !productId) {
      throw new Error('User ID and Product ID are required');
    }

    try {
      console.log(`➕ Adding to cart: ${productId} x${quantity} for user ${userId}`);

      // Get product details first to validate
      const product = await this.productService.getProduct(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Check stock availability
      if (product.stock < quantity) {
        throw new Error(`Insufficient stock. Only ${product.stock} items available.`);
      }

      // Optimistic cache update (immediate UI feedback)
      const cacheKey = `cart:${userId}`;
      const currentCart = await this.getUserCart(userId);
      
      // Update cache optimistically
      const optimisticCart = this.updateCartOptimistically(
        currentCart, 
        productId, 
        quantity, 
        selectedVariants, 
        product,
        'add'
      );
      
      this.cache.set(cacheKey, optimisticCart, 'carts');

      // Perform actual Firebase operation
      const result = await FirebaseService.addToCart(
        userId, 
        productId, 
        quantity, 
        selectedVariants
      );

      // Invalidate cache to ensure consistency
      this.cache.invalidate(cacheKey, 'carts');

      // Warm cache with fresh data
      setTimeout(() => {
        this.getUserCart(userId, false).catch(console.error);
      }, 100);

      console.log(`✅ Item added to cart successfully`);
      return result;

    } catch (error) {
      console.error('❌ Failed to add item to cart:', error);
      
      // Revert optimistic update on failure
      const cacheKey = `cart:${userId}`;
      this.cache.invalidate(cacheKey, 'carts');
      
      throw error;
    }
  }

  /**
   * Update cart item quantity with optimistic updates
   */
  async updateCartItem(userId, productId, quantity, selectedVariants = {}) {
    if (!userId || !productId) {
      throw new Error('User ID and Product ID are required');
    }

    try {
      console.log(`🔄 Updating cart item: ${productId} to quantity ${quantity}`);

      if (quantity <= 0) {
        return await this.removeFromCart(userId, productId, selectedVariants);
      }

      // Validate stock
      const product = await this.productService.getProduct(productId);
      if (product && product.stock < quantity) {
        throw new Error(`Insufficient stock. Only ${product.stock} items available.`);
      }

      // Optimistic update
      const cacheKey = `cart:${userId}`;
      const currentCart = await this.getUserCart(userId);
      const optimisticCart = this.updateCartOptimistically(
        currentCart, 
        productId, 
        quantity, 
        selectedVariants, 
        product,
        'update'
      );
      
      this.cache.set(cacheKey, optimisticCart, 'carts');

      // Perform Firebase operation
      const result = await FirebaseService.updateCartItem(
        userId, 
        productId, 
        quantity, 
        selectedVariants
      );

      // Refresh cache
      this.cache.invalidate(cacheKey, 'carts');

      console.log(`✅ Cart item updated successfully`);
      return result;

    } catch (error) {
      console.error('❌ Failed to update cart item:', error);
      
      // Revert optimistic update
      const cacheKey = `cart:${userId}`;
      this.cache.invalidate(cacheKey, 'carts');
      
      throw error;
    }
  }

  /**
   * Remove item from cart with optimistic updates
   */
  async removeFromCart(userId, productId, selectedVariants = {}) {
    if (!userId || !productId) {
      throw new Error('User ID and Product ID are required');
    }

    try {
      console.log(`➖ Removing from cart: ${productId} for user ${userId}`);

      // Optimistic update
      const cacheKey = `cart:${userId}`;
      const currentCart = await this.getUserCart(userId);
      const optimisticCart = this.updateCartOptimistically(
        currentCart, 
        productId, 
        0, 
        selectedVariants, 
        null,
        'remove'
      );
      
      this.cache.set(cacheKey, optimisticCart, 'carts');

      // Perform Firebase operation
      const result = await FirebaseService.removeFromCart(
        userId, 
        productId, 
        selectedVariants
      );

      // Refresh cache
      this.cache.invalidate(cacheKey, 'carts');

      console.log(`✅ Item removed from cart successfully`);
      return result;

    } catch (error) {
      console.error('❌ Failed to remove item from cart:', error);
      
      // Revert optimistic update
      const cacheKey = `cart:${userId}`;
      this.cache.invalidate(cacheKey, 'carts');
      
      throw error;
    }
  }

  /**
   * Clear entire cart with cache invalidation
   */
  async clearCart(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      console.log(`🗑️ Clearing cart for user: ${userId}`);

      const result = await FirebaseService.clearCart(userId);
      
      // Invalidate all cart-related caches
      this.cache.invalidate(`cart:${userId}`, 'carts');
      
      console.log(`✅ Cart cleared successfully`);
      return result;

    } catch (error) {
      console.error('❌ Failed to clear cart:', error);
      throw error;
    }
  }

  /**
   * Optimistic cart updates for immediate UI feedback
   */
  updateCartOptimistically(currentCart, productId, quantity, selectedVariants, product, operation) {
    const items = [...(currentCart.items || [])];
    const itemKey = `${productId}_${JSON.stringify(selectedVariants)}`;
    const existingItemIndex = items.findIndex(item => item.key === itemKey);

    switch (operation) {
      case 'add':
        if (existingItemIndex >= 0) {
          items[existingItemIndex].quantity += quantity;
        } else if (product) {
          const newItem = this.enrichCartItem({
            productId,
            quantity,
            selectedVariants,
            addedAt: new Date().toISOString()
          }, new Map([[productId, product]]));
          items.push(newItem);
        }
        break;

      case 'update':
        if (existingItemIndex >= 0) {
          items[existingItemIndex].quantity = quantity;
        }
        break;

      case 'remove':
        if (existingItemIndex >= 0) {
          items.splice(existingItemIndex, 1);
        }
        break;
    }

    // Recalculate totals
    const totals = this.calculateCartTotals(items);

    return {
      ...currentCart,
      items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: totals.totalPrice,
      totalOriginalPrice: totals.totalOriginalPrice,
      totalDiscount: totals.totalDiscount,
      totalSavings: totals.totalSavings,
      lastUpdated: new Date().toISOString(),
      isEmpty: items.length === 0,
      optimisticUpdate: true
    };
  }

  /**
   * Set up real-time cart synchronization
   */
  subscribeToCart(userId, callback) {
    if (!userId || !callback) {
      throw new Error('User ID and callback are required');
    }

    const listenerId = `cart_${userId}_${Date.now()}`;
    
    try {
      const unsubscribe = FirebaseService.subscribeToUserCart(
        userId,
        async (cartData) => {
          try {
            // Process cart data with optimized product loading
            const optimizedCart = await this.fetchCartFromFirebase(userId);
            
            // Update cache
            const cacheKey = `cart:${userId}`;
            this.cache.set(cacheKey, optimizedCart, 'carts');
            
            // Notify callback
            callback(optimizedCart);
          } catch (error) {
            console.error('❌ Error processing cart subscription data:', error);
            callback({ error: error.message });
          }
        }
      );

      this.activeListeners.set(listenerId, unsubscribe);
      
      console.log(`👂 Cart subscription established for user: ${userId}`);
      return () => {
        unsubscribe();
        this.activeListeners.delete(listenerId);
        console.log(`🔕 Cart subscription ended for user: ${userId}`);
      };

    } catch (error) {
      console.error('❌ Failed to subscribe to cart:', error);
      throw error;
    }
  }

  /**
   * Validate cart items and update availability
   */
  async validateCartItems(userId) {
    try {
      console.log(`✅ Validating cart items for user: ${userId}`);
      
      const cart = await this.getUserCart(userId, false); // Fresh data
      const validationResults = [];
      let hasChanges = false;

      for (const item of cart.items) {
        const validation = {
          productId: item.productId,
          originalQuantity: item.quantity,
          isValid: true,
          issues: []
        };

        // Check if product still exists
        if (!item.product) {
          validation.isValid = false;
          validation.issues.push('Product no longer exists');
          validation.suggestedAction = 'remove';
          hasChanges = true;
        } else {
          // Check stock availability
          if (item.product.stock < item.quantity) {
            validation.isValid = false;
            validation.issues.push(`Insufficient stock (${item.product.stock} available)`);
            validation.suggestedQuantity = item.product.stock;
            validation.suggestedAction = item.product.stock > 0 ? 'reduce' : 'remove';
            hasChanges = true;
          }

          // Check price changes
          if (Math.abs(item.itemPrice - item.product.price) > 0.01) {
            validation.issues.push(`Price changed from ₺${item.itemPrice} to ₺${item.product.price}`);
            validation.priceChange = {
              old: item.itemPrice,
              new: item.product.price,
              difference: item.product.price - item.itemPrice
            };
          }
        }

        validationResults.push(validation);
      }

      return {
        isValid: !hasChanges,
        hasChanges,
        items: validationResults,
        validatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Cart validation failed:', error);
      throw error;
    }
  }

  /**
   * Get cart statistics and analytics
   */
  getCartAnalytics(cart) {
    if (!cart || !cart.items) {
      return null;
    }

    const analytics = {
      totalItems: cart.totalItems,
      uniqueProducts: cart.items.length,
      totalValue: cart.totalPrice,
      averageItemPrice: cart.items.length > 0 ? cart.totalPrice / cart.totalItems : 0,
      totalSavings: cart.totalSavings || 0,
      categories: {},
      brands: {},
      priceRanges: { low: 0, medium: 0, high: 0 },
      unavailableItems: cart.items.filter(item => !item.isAvailable).length
    };

    // Analyze by categories and brands
    cart.items.forEach(item => {
      if (item.product) {
        const category = item.product.category;
        const brand = item.product.brand;
        const price = item.product.price;

        analytics.categories[category] = (analytics.categories[category] || 0) + item.quantity;
        analytics.brands[brand] = (analytics.brands[brand] || 0) + item.quantity;

        // Price range analysis
        if (price < 100) analytics.priceRanges.low += item.quantity;
        else if (price < 1000) analytics.priceRanges.medium += item.quantity;
        else analytics.priceRanges.high += item.quantity;
      }
    });

    return analytics;
  }

  /**
   * Cleanup resources and listeners
   */
  cleanup() {
    // Close all active listeners
    this.activeListeners.forEach((unsubscribe, listenerId) => {
      try {
        unsubscribe();
        console.log(`🔕 Cleaned up listener: ${listenerId}`);
      } catch (error) {
        console.warn(`⚠️ Error cleaning up listener ${listenerId}:`, error);
      }
    });
    
    this.activeListeners.clear();
    console.log('✅ Cart service cleanup completed');
  }
}

// Singleton instance
let optimizedCartServiceInstance = null;

export function getOptimizedCartService() {
  if (!optimizedCartServiceInstance) {
    optimizedCartServiceInstance = new OptimizedCartService();
  }
  return optimizedCartServiceInstance;
}

export default OptimizedCartService;