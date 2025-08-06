import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../config/firebase';

class CartFirebaseService {
  static collectionName = 'carts';

  // Get user's cart
  static async getUserCart(userId) {
    try {
      if (!userId) return null;

      const cartsRef = collection(db, this.collectionName);
      const q = query(cartsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new cart for user
        return await this.createUserCart(userId);
      }

      const cartDoc = querySnapshot.docs[0];
      return {
        id: cartDoc.id,
        ...cartDoc.data()
      };
    } catch (error) {
      console.error('Error getting user cart:', error);
      throw error;
    }
  }

  // Create new cart for user
  static async createUserCart(userId) {
    try {
      const newCart = {
        userId,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, this.collectionName), newCart);
      return {
        id: docRef.id,
        ...newCart
      };
    } catch (error) {
      console.error('Error creating user cart:', error);
      throw error;
    }
  }

  // Add item to cart
  static async addItem(userId, productId, quantity = 1, selectedVariants = {}) {
    try {
      const cart = await this.getUserCart(userId);
      
      // Check if item already exists
      const existingItemIndex = cart.items.findIndex(item => 
        item.productId === productId && 
        JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
      );

      if (existingItemIndex >= 0) {
        // Update existing item
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        cart.items.push({
          productId,
          quantity,
          selectedVariants,
          addedAt: new Date()
        });
      }

      // Recalculate totals
      cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      cart.updatedAt = new Date();

      // Update in Firebase
      await updateDoc(doc(db, this.collectionName, cart.id), {
        items: cart.items,
        totalItems: cart.totalItems,
        updatedAt: cart.updatedAt
      });

      return cart;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  }

  // Update item quantity
  static async updateItemQuantity(userId, productId, quantity, selectedVariants = {}) {
    try {
      const cart = await this.getUserCart(userId);
      
      const itemIndex = cart.items.findIndex(item => 
        item.productId === productId && 
        JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
      );

      if (itemIndex >= 0) {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          cart.items.splice(itemIndex, 1);
        } else {
          // Update quantity
          cart.items[itemIndex].quantity = quantity;
        }

        // Recalculate totals
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.updatedAt = new Date();

        // Update in Firebase
        await updateDoc(doc(db, this.collectionName, cart.id), {
          items: cart.items,
          totalItems: cart.totalItems,
          updatedAt: cart.updatedAt
        });
      }

      return cart;
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    }
  }

  // Remove item from cart
  static async removeItem(userId, productId, selectedVariants = {}) {
    try {
      return await this.updateItemQuantity(userId, productId, 0, selectedVariants);
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  }

  // Clear entire cart
  static async clearCart(userId) {
    try {
      const cart = await this.getUserCart(userId);
      
      await updateDoc(doc(db, this.collectionName, cart.id), {
        items: [],
        totalItems: 0,
        totalPrice: 0,
        updatedAt: new Date()
      });

      return {
        ...cart,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  // Get cart with populated product details (OPTIMIZED - eliminates N+1 queries)
  static async getCartWithProducts(userId, productService) {
    try {
      const cart = await this.getUserCart(userId);
      if (!cart || !cart.items.length) {
        return {
          ...cart,
          items: [],
          populatedItems: []
        };
      }

      // Extract unique product IDs to eliminate duplicate fetches
      const productIds = [...new Set(cart.items.map(item => item.productId))];
      
      // Batch fetch all products at once (eliminates N+1 queries)
      console.log(`📦 Batch fetching ${productIds.length} products for cart`);
      let productsMap = {};
      
      try {
        // Use batch method if available (optimized service)
        if (productService.getProductsBatch) {
          productsMap = await productService.getProductsBatch(productIds);
        } else {
          // Fallback: concurrent individual fetches with minimal data (cart-optimized)
          const productPromises = productIds.map(id => 
            productService.getProduct(id, { minimal: true }).catch(error => {
              console.warn(`Failed to fetch product ${id}:`, error);
              return null;
            })
          );
          const products = await Promise.all(productPromises);
          productIds.forEach((id, index) => {
            if (products[index]) {
              productsMap[id] = products[index];
            }
          });
        }
      } catch (error) {
        console.error('Error batch fetching products:', error);
        productsMap = {};
      }

      // Map cart items to populated items using batch-fetched products
      const populatedItems = cart.items.map((item) => {
        const product = productsMap[item.productId];
        
        if (product) {
          return {
            key: `${item.productId}_${JSON.stringify(item.selectedVariants)}`,
            productId: item.productId,
            name: product.name,
            slug: product.slug,
            price: product.price,
            originalPrice: product.originalPrice,
            discount: product.discount,
            image: product.images && product.images[0] ? product.images[0] : '',
            quantity: item.quantity,
            selectedVariants: item.selectedVariants || {},
            addedAt: item.addedAt,
            isAvailable: product.stock >= item.quantity,
            stockAvailable: product.stock,
            product,
            totalPrice: product.price * item.quantity
          };
        } else {
          // Handle missing products gracefully
          console.warn(`Product ${item.productId} not found or failed to load`);
          return {
            key: `${item.productId}_${JSON.stringify(item.selectedVariants)}`,
            productId: item.productId,
            name: 'Product not found',
            slug: '',
            price: 0,
            originalPrice: 0,
            discount: 0,
            image: '',
            quantity: item.quantity,
            selectedVariants: item.selectedVariants || {},
            addedAt: item.addedAt,
            isAvailable: false,
            stockAvailable: 0,
            product: null,
            totalPrice: 0
          };
        }
      });

      // Calculate total price
      const totalPrice = populatedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

      return {
        ...cart,
        populatedItems,
        totalPrice
      };
    } catch (error) {
      console.error('Error getting cart with products:', error);
      throw error;
    }
  }

  // Listen to cart changes
  static subscribeToCart(userId, callback) {
    try {
      const cartsRef = collection(db, this.collectionName);
      const q = query(cartsRef, where('userId', '==', userId));
      
      return onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const cartDoc = querySnapshot.docs[0];
          callback({
            id: cartDoc.id,
            ...cartDoc.data()
          });
        } else {
          callback(null);
        }
      });
    } catch (error) {
      console.error('Error subscribing to cart:', error);
      throw error;
    }
  }

  // Apply coupon
  static async applyCoupon(userId, couponCode) {
    try {
      const cart = await this.getUserCart(userId);
      
      // Mock coupon validation - in real app, validate against coupons collection
      const validCoupons = {
        'WELCOME10': { discount: 0.1, type: 'percentage' },
        'SAVE20': { discount: 0.2, type: 'percentage' },
        'FLAT50': { discount: 50, type: 'fixed' }
      };

      const coupon = validCoupons[couponCode.toUpperCase()];
      if (!coupon) {
        throw new Error('Invalid coupon code');
      }

      await updateDoc(doc(db, this.collectionName, cart.id), {
        coupon: {
          code: couponCode.toUpperCase(),
          ...coupon,
          appliedAt: new Date()
        },
        updatedAt: new Date()
      });

      return {
        ...cart,
        coupon: {
          code: couponCode.toUpperCase(),
          ...coupon,
          appliedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error applying coupon:', error);
      throw error;
    }
  }

  // Remove coupon
  static async removeCoupon(userId) {
    try {
      const cart = await this.getUserCart(userId);
      
      await updateDoc(doc(db, this.collectionName, cart.id), {
        coupon: null,
        updatedAt: new Date()
      });

      return {
        ...cart,
        coupon: null
      };
    } catch (error) {
      console.error('Error removing coupon:', error);
      throw error;
    }
  }
}

export default CartFirebaseService;