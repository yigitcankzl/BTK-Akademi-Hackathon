import { ECOMMERCE_CONFIG, STORAGE_KEYS } from '../../utils/constants';
import productService from './productService';
import CartFirebaseService from '../cartFirebaseService';

class CartService {
  constructor() {
    this.storageKey = `${STORAGE_KEYS.CART || 'ecommerce-cart'}`;
    this.useFirebase = true; // Toggle to use Firebase or localStorage
    this.currentUserId = null; // Will be set when user logs in
    this.cart = this.loadCart(); // Always initialize cart for fallback
  }

  // Set user ID and load user-specific cart
  setUserId(userId) {
    if (this.currentUserId !== userId) {
      console.log('🔄 CartService: Switching to user:', userId);
      this.currentUserId = userId;
      this.storageKey = `${STORAGE_KEYS.CART || 'ecommerce-cart'}-${userId || 'anonymous'}`;
      this.cart = this.loadCart();
    }
  }

  // Load cart from localStorage
  loadCart() {
    try {
      const savedCart = localStorage.getItem(this.storageKey);
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        console.log('📦 CartService: Loaded cart with', cart.items?.length || 0, 'items');
        return {
          items: cart.items || [],
          coupon: cart.coupon || null,
          lastUpdated: cart.lastUpdated || new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }

    console.log('🆕 CartService: Creating new empty cart');
    return {
      items: [],
      coupon: null,
      lastUpdated: new Date().toISOString()
    };
  }

  // Save cart to localStorage
  saveCart() {
    try {
      this.cart.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }

  // Add item to cart
  async addItem(productId, quantity = 1, selectedVariants = {}) {
    try {
      console.log('🛒 CartService: Adding item to cart', { productId, quantity, selectedVariants });
      
      const product = await productService.getProduct(productId);
      console.log('✅ Product found:', product?.name);
      
      // Check availability
      const availability = await productService.checkAvailability(productId, quantity);
      if (!availability.available) {
        throw new Error('Product is out of stock');
      }
      console.log('✅ Product availability checked:', availability);

      // Use Firebase if enabled
      if (this.useFirebase) {
        try {
          console.log('🔥 Using Firebase cart for user:', this.currentUserId);
          const cart = await CartFirebaseService.addItem(
            this.currentUserId, 
            productId, 
            quantity, 
            selectedVariants
          );
          console.log('✅ Firebase cart updated:', cart);
          
          const summary = await this.calculateCartSummary(cart, productService);
          console.log('✅ Cart summary calculated:', summary);
          return summary;
        } catch (error) {
          console.error('❌ Firebase cart error, falling back to localStorage:', error);
          this.useFirebase = false;
          // Continue with localStorage logic below
        }
      }

      // Create unique item key based on product and variants
      const itemKey = this.generateItemKey(productId, selectedVariants);
      
      // Check if item already exists in cart
      const existingItemIndex = this.cart.items.findIndex(item => item.key === itemKey);
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const existingItem = this.cart.items[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        
        // Check if new quantity exceeds stock or max limit
        if (newQuantity > product.stock) {
          throw new Error(`Only ${product.stock} items available in stock`);
        }
        
        if (newQuantity > ECOMMERCE_CONFIG.MAX_CART_ITEMS) {
          throw new Error(`Maximum ${ECOMMERCE_CONFIG.MAX_CART_ITEMS} items allowed per product`);
        }
        
        this.cart.items[existingItemIndex].quantity = newQuantity;
      } else {
        // Add new item to cart
        const cartItem = {
          key: itemKey,
          productId: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          originalPrice: product.originalPrice,
          discount: product.discount,
          image: product.images[0],
          quantity,
          selectedVariants,
          addedAt: new Date().toISOString()
        };
        
        this.cart.items.push(cartItem);
      }
      
      this.saveCart();
      return await this.getCartSummary();
    } catch (error) {
      throw new Error(`Failed to add item to cart: ${error.message}`);
    }
  }

  // Remove item from cart
  async removeItem(itemKey) {
    // Use Firebase if enabled
    if (this.useFirebase) {
      try {
        console.log('🔥 Removing item from Firebase cart:', itemKey);
        
        // Parse the itemKey to get productId and variants
        const [productId, variantString] = itemKey.split('_');
        let selectedVariants = {};
        
        if (variantString && variantString !== 'undefined') {
          try {
            // Parse variants from key format "key:value|key2:value2"
            const variantPairs = variantString.split('|').filter(pair => pair);
            for (const pair of variantPairs) {
              const [key, value] = pair.split(':');
              if (key && value) {
                selectedVariants[key] = value;
              }
            }
          } catch (error) {
            console.error('Error parsing variants from itemKey:', error);
          }
        }
        
        await CartFirebaseService.removeItem(this.currentUserId, productId, selectedVariants);
        return await this.getCartSummary();
      } catch (error) {
        console.error('❌ Firebase remove item error, falling back to localStorage:', error);
        this.useFirebase = false;
        // Continue with localStorage logic below
      }
    }

    const itemIndex = this.cart.items.findIndex(item => item.key === itemKey);
    if (itemIndex >= 0) {
      this.cart.items.splice(itemIndex, 1);
      this.saveCart();
    }
    return await this.getCartSummary();
  }

  // Update item quantity
  async updateItemQuantity(itemKey, quantity) {
    // Use Firebase if enabled
    if (this.useFirebase) {
      try {
        console.log('🔥 Updating item quantity in Firebase cart:', itemKey, quantity);
        
        // Parse the itemKey to get productId and variants
        const [productId, variantString] = itemKey.split('_');
        let selectedVariants = {};
        
        if (variantString && variantString !== 'undefined') {
          try {
            // Parse variants from key format "key:value|key2:value2"
            const variantPairs = variantString.split('|').filter(pair => pair);
            for (const pair of variantPairs) {
              const [key, value] = pair.split(':');
              if (key && value) {
                selectedVariants[key] = value;
              }
            }
          } catch (error) {
            console.error('Error parsing variants from itemKey:', error);
          }
        }
        
        await CartFirebaseService.updateItemQuantity(this.currentUserId, productId, quantity, selectedVariants);
        return await this.getCartSummary();
      } catch (error) {
        console.error('❌ Firebase update quantity error, falling back to localStorage:', error);
        this.useFirebase = false;
        // Continue with localStorage logic below
      }
    }

    const itemIndex = this.cart.items.findIndex(item => item.key === itemKey);
    if (itemIndex < 0) {
      throw new Error('Item not found in cart');
    }

    const item = this.cart.items[itemIndex];
    
    if (quantity <= 0) {
      return await this.removeItem(itemKey);
    }

    // Check availability
    const availability = await productService.checkAvailability(item.productId, quantity);
    if (!availability.available) {
      throw new Error(`Only ${availability.stock} items available in stock`);
    }

    if (quantity > ECOMMERCE_CONFIG.MAX_CART_ITEMS) {
      throw new Error(`Maximum ${ECOMMERCE_CONFIG.MAX_CART_ITEMS} items allowed per product`);
    }

    this.cart.items[itemIndex].quantity = quantity;
    this.saveCart();
    return await this.getCartSummary();
  }

  // Clear entire cart
  async clearCart() {
    console.log('🧹 CartService: Clearing cart...');
    this.cart.items = [];
    this.cart.coupon = null;
    this.saveCart();
    console.log('✅ CartService: Cart cleared and saved to localStorage');
    const summary = await this.getCartSummary();
    console.log('📊 CartService: New cart summary:', { itemCount: summary.itemCount, isEmpty: summary.isEmpty });
    return summary;
  }

  // Clear all cart data from localStorage (for debugging)
  clearAllCartData() {
    const keys = Object.keys(localStorage);
    const cartKeys = keys.filter(key => key.includes('ecommerce-cart'));
    cartKeys.forEach(key => {
      console.log('🗑️ Removing cart data:', key);
      localStorage.removeItem(key);
    });
    this.cart = {
      items: [],
      coupon: null,
      lastUpdated: new Date().toISOString()
    };
  }

  // Apply coupon code
  async applyCoupon(couponCode) {
    // Mock coupon validation
    const validCoupons = {
      'WELCOME10': { type: 'percentage', value: 10, minAmount: 100 },
      'SAVE20': { type: 'percentage', value: 20, minAmount: 200 },
      'FLAT50': { type: 'fixed', value: 50, minAmount: 300 },
      'FREESHIP': { type: 'free_shipping', value: 0, minAmount: 0 }
    };

    const coupon = validCoupons[couponCode.toUpperCase()];
    if (!coupon) {
      throw new Error('Invalid coupon code');
    }

    const subtotal = this.calculateSubtotal();
    if (subtotal < coupon.minAmount) {
      throw new Error(`Minimum order amount ₺${coupon.minAmount} required for this coupon`);
    }

    this.cart.coupon = {
      code: couponCode.toUpperCase(),
      ...coupon,
      appliedAt: new Date().toISOString()
    };

    this.saveCart();
    return await this.getCartSummary();
  }

  // Remove coupon
  async removeCoupon() {
    this.cart.coupon = null;
    this.saveCart();
    return await this.getCartSummary();
  }

  // Get cart items with full product details
  async getCartWithProducts() {
    const itemsWithProducts = await Promise.all(
      this.cart.items.map(async (item) => {
        try {
          const product = await productService.getProduct(item.productId);
          return {
            ...item,
            product,
            isAvailable: product.stock >= item.quantity,
            currentPrice: product.price, // In case price changed
            stockAvailable: product.stock
          };
        } catch (error) {
          // Product might be deleted or unavailable
          return {
            ...item,
            isAvailable: false,
            error: 'Product not available'
          };
        }
      })
    );

    return {
      ...this.cart,
      items: itemsWithProducts
    };
  }

  // Calculate subtotal
  calculateSubtotal() {
    return this.cart.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  // Calculate discount amount
  calculateDiscount() {
    if (!this.cart.coupon) return 0;

    const subtotal = this.calculateSubtotal();
    const coupon = this.cart.coupon;

    switch (coupon.type) {
      case 'percentage':
        return Math.min(subtotal * (coupon.value / 100), subtotal);
      case 'fixed':
        return Math.min(coupon.value, subtotal);
      default:
        return 0;
    }
  }

  // Calculate shipping cost
  calculateShipping(shippingMethod = 'standard') {
    const subtotal = this.calculateSubtotal();
    
    // Free shipping threshold
    if (subtotal >= ECOMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD) {
      return 0;
    }

    // Free shipping coupon
    if (this.cart.coupon && this.cart.coupon.type === 'free_shipping') {
      return 0;
    }

    // Default shipping rates
    const shippingRates = {
      standard: 15,
      express: 25,
      overnight: 50
    };

    return shippingRates[shippingMethod] || shippingRates.standard;
  }

  // Calculate tax
  calculateTax() {
    const subtotal = this.calculateSubtotal();
    const discount = this.calculateDiscount();
    const taxableAmount = subtotal - discount;
    
    return Math.max(0, taxableAmount * ECOMMERCE_CONFIG.TAX_RATE);
  }

  // Get cart summary with totals
  async getCartSummary(shippingMethod = 'standard') {
    // Use Firebase if enabled
    if (this.useFirebase) {
      try {
        return await this.calculateCartSummary(null, productService);
      } catch (error) {
        console.error('Firebase cart summary error, falling back to localStorage:', error);
        this.useFirebase = false;
        // Continue with localStorage logic below
      }
    }
    const subtotal = this.calculateSubtotal();
    const discount = this.calculateDiscount();
    const shipping = this.calculateShipping(shippingMethod);
    const tax = this.calculateTax();
    const total = subtotal - discount + shipping + tax;

    return {
      items: this.cart.items,
      itemCount: this.cart.items.reduce((count, item) => count + item.quantity, 0),
      coupon: this.cart.coupon,
      totals: {
        subtotal,
        discount,
        shipping,
        tax,
        total
      },
      lastUpdated: this.cart.lastUpdated,
      isEmpty: this.cart.items.length === 0,
      qualifiesForFreeShipping: subtotal >= ECOMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD,
      freeShippingThreshold: ECOMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD
    };
  }

  // Generate unique key for cart items
  generateItemKey(productId, selectedVariants = {}) {
    const variantString = Object.entries(selectedVariants)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    
    return `${productId}_${variantString}`;
  }

  // Save items for later (wishlist functionality)
  async saveForLater(itemKey) {
    const itemIndex = this.cart.items.findIndex(item => item.key === itemKey);
    if (itemIndex < 0) {
      throw new Error('Item not found in cart');
    }

    const item = this.cart.items[itemIndex];
    
    // Move to saved items (wishlist)
    const savedItems = JSON.parse(localStorage.getItem('saved-items') || '[]');
    savedItems.push({
      ...item,
      savedAt: new Date().toISOString()
    });
    
    localStorage.setItem('saved-items', JSON.stringify(savedItems));
    
    // Remove from cart
    this.cart.items.splice(itemIndex, 1);
    this.saveCart();
    
    return await this.getCartSummary();
  }

  // Move item from saved items back to cart
  async moveToCart(itemKey) {
    const savedItems = JSON.parse(localStorage.getItem('saved-items') || '[]');
    const itemIndex = savedItems.findIndex(item => item.key === itemKey);
    
    if (itemIndex < 0) {
      throw new Error('Item not found in saved items');
    }

    const item = savedItems[itemIndex];
    
    // Check availability
    const availability = await productService.checkAvailability(item.productId, item.quantity);
    if (!availability.available) {
      throw new Error('Product is no longer available');
    }

    // Add back to cart
    this.cart.items.push({
      ...item,
      addedAt: new Date().toISOString()
    });

    // Remove from saved items
    savedItems.splice(itemIndex, 1);
    localStorage.setItem('saved-items', JSON.stringify(savedItems));
    
    this.saveCart();
    return await this.getCartSummary();
  }

  // Get saved items
  getSavedItems() {
    try {
      return JSON.parse(localStorage.getItem('saved-items') || '[]');
    } catch (error) {
      console.error('Error loading saved items:', error);
      return [];
    }
  }

  // Calculate cart summary for Firebase cart
  async calculateCartSummary(firebaseCart, productService) {
    try {
      const populatedCart = await CartFirebaseService.getCartWithProducts(
        this.currentUserId, 
        productService
      );
      
      const subtotal = populatedCart.totalPrice || 0;
      const discount = populatedCart.coupon ? this.calculateDiscount(subtotal, populatedCart.coupon) : 0;
      const shipping = subtotal >= ECOMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD ? 0 : 15;
      const tax = (subtotal - discount) * ECOMMERCE_CONFIG.TAX_RATE;
      const total = subtotal - discount + shipping + tax;

      return {
        items: populatedCart.populatedItems || [],
        itemCount: populatedCart.totalItems || 0,
        coupon: populatedCart.coupon,
        totals: {
          subtotal,
          discount,
          shipping,
          tax,
          total
        },
        lastUpdated: populatedCart.updatedAt,
        isEmpty: !populatedCart.items || populatedCart.items.length === 0,
        qualifiesForFreeShipping: subtotal >= ECOMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD,
        freeShippingThreshold: ECOMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD
      };
    } catch (error) {
      console.error('Error calculating Firebase cart summary:', error);
      return {
        items: [],
        itemCount: 0,
        coupon: null,
        totals: { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 },
        isEmpty: true,
        qualifiesForFreeShipping: false,
        freeShippingThreshold: ECOMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD
      };
    }
  }
}

// Create singleton instance
const cartService = new CartService();

export default cartService;