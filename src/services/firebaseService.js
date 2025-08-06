// Firebase service for Firestore operations
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

class FirebaseService {
  // Collections
  static COLLECTIONS = {
    USERS: 'users',
    PRODUCTS: 'products',
    ORDERS: 'orders',
    CART: 'cart',
    REVIEWS: 'reviews',
    CATEGORIES: 'categories',
    USER_BEHAVIOR: 'userBehavior',
    RECOMMENDATIONS: 'recommendations',
    SEARCH_HISTORY: 'searchHistory'
  };

  // User Management
  static async createUser(userId, userData) {
    try {
      await setDoc(doc(db, this.COLLECTIONS.USERS, userId), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async getUser(userId) {
    try {
      const userDoc = await getDoc(doc(db, this.COLLECTIONS.USERS, userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  static async updateUser(userId, userData) {
    try {
      await updateDoc(doc(db, this.COLLECTIONS.USERS, userId), {
        ...userData,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Product Management (OPTIMIZED - minimized data transfer)
  static async getProducts(filters = {}) {
    try {
      console.log('FirebaseService: Getting products with SERVER-SIDE filters:', filters);
      let q = collection(db, this.COLLECTIONS.PRODUCTS);
      
      // OPTIMIZATION: Use server-side filtering to reduce data transfer
      
      // Apply category filter (requires single-field index: category)
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      
      // Apply brand filter (requires single-field index: brand)
      if (filters.brand) {
        q = query(q, where('brand', '==', filters.brand));
      }
      
      // Apply stock filter (requires single-field index: stock)
      if (filters.inStock) {
        q = query(q, where('stock', '>', 0));
      }
      
      // Apply price range filters (requires composite index: price_asc OR price_desc)
      if (filters.priceMin !== undefined && filters.priceMax !== undefined) {
        q = query(q, where('price', '>=', filters.priceMin), where('price', '<=', filters.priceMax));
      } else if (filters.priceMin !== undefined) {
        q = query(q, where('price', '>=', filters.priceMin));
      } else if (filters.priceMax !== undefined) {
        q = query(q, where('price', '<=', filters.priceMax));
      }
      
      // Apply ordering (requires composite index if combined with filters)
      if (filters.orderBy) {
        const direction = filters.orderDirection === 'desc' ? 'desc' : 'asc';
        q = query(q, orderBy(filters.orderBy, direction));
      } else {
        // Default ordering by creation date
        q = query(q, orderBy('createdAt', 'desc'));
      }
      
      // Apply pagination with proper limit (AFTER filtering and ordering)
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }
      
      // Apply pagination offset if provided (requires cursor-based pagination for efficiency)
      if (filters.startAfter) {
        q = query(q, startAfter(filters.startAfter));
      }

      console.log('📊 Executing optimized Firebase query with server-side filtering');
      const querySnapshot = await getDocs(q);
      let products = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // OPTIMIZATION: Only extract fields actually used in UI components
        const optimizedProduct = {
          id: doc.id,
          firebaseId: data.firebaseId,
          name: data.name,
          slug: data.slug,
          brand: data.brand,
          price: data.price,
          originalPrice: data.originalPrice,
          discount: data.discount,
          rating: data.rating,
          reviewCount: data.reviewCount,
          images: data.images || [],
          tags: data.tags || [],
          stock: data.stock,
          category: data.category,
          shortDescription: data.shortDescription,
          aiGenerated: data.aiGenerated,
          createdAt: data.createdAt,
          // Only include full data if specifically requested
          ...(filters.includeFullData && { ...data })
        };
        products.push(optimizedProduct);
      });
      
      console.log('🔥 Firebase returned optimized products:', products.length);
      
      // Remove duplicates based on firebaseId - keep only the first occurrence
      const uniqueProducts = [];
      const seenFirebaseIds = new Set();
      
      for (const product of products) {
        if (product.firebaseId && !seenFirebaseIds.has(product.firebaseId)) {
          seenFirebaseIds.add(product.firebaseId);
          uniqueProducts.push(product);
        } else if (!product.firebaseId) {
          // If no firebaseId, keep it (shouldn't happen in our case but safety check)
          uniqueProducts.push(product);
        }
      }
      
      products = uniqueProducts;
      console.log('✅ After deduplication:', products.length);
      
      // MINIMAL client-side filtering only for complex conditions not supported by Firebase
      // (Most filtering is now done server-side for performance)
      
      console.log('FirebaseService: Filtered products:', products.length);
      return products;
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  }

  static async getProduct(productId, options = {}) {
    try {
      // Ensure productId is a string
      const id = String(productId);
      
      if (!id || id === 'undefined' || id === 'null') {
        console.warn('Invalid productId provided:', productId);
        return null;
      }
      
      const productDoc = await getDoc(doc(db, this.COLLECTIONS.PRODUCTS, id));
      if (productDoc.exists()) {
        const data = productDoc.data();
        
        // OPTIMIZATION: Return optimized data by default, full data if requested
        if (options.minimal) {
          // Ultra-minimal for cart items
          return {
            id: productDoc.id,
            name: data.name,
            slug: data.slug,
            price: data.price,
            originalPrice: data.originalPrice,
            images: data.images || [],
            stock: data.stock
          };
        } else if (options.includeFullData) {
          // Full product data (for product detail pages)
          return { id: productDoc.id, ...data };
        } else {
          // Standard optimized data (for cards, lists)
          return {
            id: productDoc.id,
            firebaseId: data.firebaseId,
            name: data.name,
            slug: data.slug,
            brand: data.brand,
            price: data.price,
            originalPrice: data.originalPrice,
            discount: data.discount,
            rating: data.rating,
            reviewCount: data.reviewCount,
            images: data.images || [],
            tags: data.tags || [],
            stock: data.stock,
            category: data.category,
            shortDescription: data.shortDescription,
            aiGenerated: data.aiGenerated
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting product:', error);
      throw error;
    }
  }

  static async createProduct(productData) {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTIONS.PRODUCTS), {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id, success: true };
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // User Behavior Tracking
  static async trackUserBehavior(userId, behaviorData) {
    try {
      // Validate userId
      if (!userId) {
        console.warn('Cannot track behavior: userId is undefined');
        return { success: false, error: 'User ID is required' };
      }

      await addDoc(collection(db, this.COLLECTIONS.USER_BEHAVIOR), {
        userId: String(userId), // Ensure userId is a string
        ...behaviorData,
        timestamp: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error tracking user behavior:', error);
      throw error;
    }
  }

  static async getUserBehavior(userId, limitCount = 50) {
    try {
      // Try simple query first if indexes are building
      let q = query(
        collection(db, this.COLLECTIONS.USER_BEHAVIOR),
        where('userId', '==', userId),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const behaviors = [];
      querySnapshot.forEach((doc) => {
        behaviors.push({ id: doc.id, ...doc.data() });
      });
      
      return behaviors;
    } catch (error) {
      console.error('Error getting user behavior:', error);
      throw error;
    }
  }

  // Search History
  static async saveSearchQuery(userId, query, results) {
    try {
      await addDoc(collection(db, this.COLLECTIONS.SEARCH_HISTORY), {
        userId,
        query,
        resultsCount: results.length,
        timestamp: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error saving search query:', error);
      throw error;
    }
  }

  static async getSearchHistory(userId, limitCount = 20) {
    try {
      // Use simple query while indexes are building
      const q = query(
        collection(db, this.COLLECTIONS.SEARCH_HISTORY),
        where('userId', '==', userId),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const searches = [];
      querySnapshot.forEach((doc) => {
        searches.push({ id: doc.id, ...doc.data() });
      });
      
      return searches;
    } catch (error) {
      console.error('Error getting search history:', error);
      throw error;
    }
  }

  // Cart Management
  static async addToCart(userId, productId, quantity = 1) {
    try {
      const cartRef = doc(db, this.COLLECTIONS.CART, `${userId}_${productId}`);
      const cartDoc = await getDoc(cartRef);
      
      if (cartDoc.exists()) {
        // Update existing item
        await updateDoc(cartRef, {
          quantity: increment(quantity),
          updatedAt: serverTimestamp()
        });
      } else {
        // Add new item
        await setDoc(cartRef, {
          userId,
          productId,
          quantity,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  static async getCartItems(userId) {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.CART),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const cartItems = [];
      querySnapshot.forEach((doc) => {
        cartItems.push({ id: doc.id, ...doc.data() });
      });
      
      return cartItems;
    } catch (error) {
      console.error('Error getting cart items:', error);
      throw error;
    }
  }

  static async removeFromCart(userId, productId) {
    try {
      await deleteDoc(doc(db, this.COLLECTIONS.CART, `${userId}_${productId}`));
      return { success: true };
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  // Recommendations
  static async saveRecommendations(userId, recommendations, source = 'gemini') {
    try {
      await setDoc(doc(db, this.COLLECTIONS.RECOMMENDATIONS, userId), {
        userId,
        recommendations,
        source,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
      return { success: true };
    } catch (error) {
      console.error('Error saving recommendations:', error);
      throw error;
    }
  }

  static async getRecommendations(userId) {
    try {
      const recommendationDoc = await getDoc(doc(db, this.COLLECTIONS.RECOMMENDATIONS, userId));
      if (recommendationDoc.exists()) {
        const data = recommendationDoc.data();
        // Check if recommendations are still valid (not expired)
        if (data.expiresAt && data.expiresAt.toDate() > new Date()) {
          return data.recommendations;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  // Orders
  static async createOrder(orderData) {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTIONS.ORDERS), {
        ...orderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'pending'
      });
      return { id: docRef.id, success: true };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  static async getUserOrders(userId) {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.ORDERS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders = [];
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      
      return orders;
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }
  }

  // Real-time listeners
  static subscribeToUserCart(userId, callback) {
    const q = query(
      collection(db, this.COLLECTIONS.CART),
      where('userId', '==', userId)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const cartItems = [];
      querySnapshot.forEach((doc) => {
        cartItems.push({ id: doc.id, ...doc.data() });
      });
      callback(cartItems);
    });
  }

  static subscribeToProducts(callback, filters = {}) {
    let q = collection(db, this.COLLECTIONS.PRODUCTS);
    
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    
    return onSnapshot(q, (querySnapshot) => {
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });
      callback(products);
    });
  }

  // Batch operations
  static async batchUpdateProducts(updates) {
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ id, data }) => {
        const productRef = doc(db, this.COLLECTIONS.PRODUCTS, id);
        batch.update(productRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error batch updating products:', error);
      throw error;
    }
  }

  // Utility methods
  static async checkConnection() {
    try {
      // Try to get a small document to test connection
      const testQuery = query(collection(db, this.COLLECTIONS.PRODUCTS), limit(1));
      const result = await getDocs(testQuery);
      console.log('Firebase connection test result:', result.size, 'documents found');
      return { success: true, message: 'Firebase connection successful' };
    } catch (error) {
      console.error('Firebase connection failed:', error);
      return { success: false, message: error.message };
    }
  }
}

export default FirebaseService;