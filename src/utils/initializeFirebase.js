import ProductFirebaseService from '../services/productFirebaseService';
import FirebaseService from '../services/firebaseService';
import { db, auth, storage } from '../config/firebase';

// Re-export Firebase services for convenience
export { db, auth, storage };

class FirebaseInitializer {
  static async initializeDatabase() {
    try {
      console.log('🚀 Starting Firebase database initialization...');
      
      // Check Firebase connection
      const connectionTest = await FirebaseService.checkConnection();
      if (!connectionTest.success) {
        throw new Error(`Firebase connection failed: ${connectionTest.message}`);
      }
      console.log('✅ Firebase connection successful');
      
      // Initialize products
      await ProductFirebaseService.initializeProducts();
      console.log('✅ Products initialized successfully');
      
      // Get final product count
      const allProducts = await ProductFirebaseService.getAllProducts();
      console.log(`✅ Database initialization complete! Total products: ${allProducts.length}`);
      
      return {
        success: true,
        message: `Database initialized with ${allProducts.length} products`,
        productCount: allProducts.length
      };
      
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  static async getStatus() {
    try {
      const connectionTest = await FirebaseService.checkConnection();
      const products = await ProductFirebaseService.getAllProducts();
      
      return {
        connected: connectionTest.success,
        productCount: products.length,
        initialized: products.length > 0
      };
    } catch (error) {
      return {
        connected: false,
        productCount: 0,
        initialized: false,
        error: error.message
      };
    }
  }
}

// Auto-initialize when imported (can be disabled by setting environment variable)
if (typeof window !== 'undefined' && !import.meta.env.VITE_SKIP_FIREBASE_INIT) {
  // Initialize on client side after a short delay
  setTimeout(() => {
    console.log('🚀 Starting Firebase auto-initialization...');
    FirebaseInitializer.initializeDatabase().then(result => {
      if (result.success) {
        console.log('🎉 Firebase auto-initialization completed successfully');
      } else {
        console.warn('⚠️ Firebase auto-initialization failed, will fallback to local data');
      }
    }).catch(error => {
      console.error('💥 Firebase auto-initialization error:', error);
    });
  }, 2000);
}

export default FirebaseInitializer;