// AI Recommendation Caching Service
// Implements in-memory and localStorage caching for AI recommendations

class RecommendationCache {
  constructor() {
    this.memoryCache = new Map();
    this.cacheTimeout = 20 * 60 * 1000; // 20 minutes - much longer cache
    this.maxCacheSize = 500; // Larger cache size
  }

  // Generate cache key from user context and options
  generateCacheKey(userId, contextType, contextData, userProfile = {}) {
    const keyData = {
      userId,
      contextType,
      contextData: this.sanitizeContextData(contextData),
      profileHash: this.hashUserProfile(userProfile)
    };
    return btoa(JSON.stringify(keyData)).replace(/[+/=]/g, '');
  }

  // Sanitize context data for consistent caching
  sanitizeContextData(contextData) {
    if (!contextData) return {};
    
    const sanitized = { ...contextData };
    
    // Remove timestamp-sensitive data
    delete sanitized.timestamp;
    delete sanitized.sessionId;
    delete sanitized.requestId;
    
    // Sort arrays for consistent hashing
    if (sanitized.cartItems) {
      sanitized.cartItems = sanitized.cartItems
        .map(item => ({ id: item.id, quantity: item.quantity }))
        .sort((a, b) => a.id.localeCompare(b.id));
    }
    
    return sanitized;
  }

  // Generate hash from user profile for caching
  hashUserProfile(userProfile) {
    if (!userProfile || Object.keys(userProfile).length === 0) return 'default';
    
    const profileString = JSON.stringify({
      age: userProfile.age,
      gender: userProfile.gender,
      interests: userProfile.interests?.sort(),
      preferences: userProfile.preferences
    });
    
    return btoa(profileString).slice(0, 16);
  }

  // Get cached recommendations
  async getCachedRecommendations(userId, contextType, contextData, userProfile) {
    const cacheKey = this.generateCacheKey(userId, contextType, contextData, userProfile);
    
    // Check memory cache first
    const memoryCached = this.memoryCache.get(cacheKey);
    if (memoryCached && !this.isExpired(memoryCached.timestamp)) {
      console.log('✅ Cache hit (memory):', cacheKey.slice(0, 16));
      return memoryCached.data;
    }

    // Check localStorage cache
    try {
      const localCached = localStorage.getItem(`ai_rec_${cacheKey}`);
      if (localCached) {
        const parsed = JSON.parse(localCached);
        if (!this.isExpired(parsed.timestamp)) {
          console.log('✅ Cache hit (localStorage):', cacheKey.slice(0, 16));
          
          // Update memory cache
          this.memoryCache.set(cacheKey, parsed);
          this.cleanupMemoryCache();
          
          return parsed.data;
        } else {
          localStorage.removeItem(`ai_rec_${cacheKey}`);
        }
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }

    console.log('❌ Cache miss:', cacheKey.slice(0, 16));
    return null;
  }

  // Cache recommendations
  async cacheRecommendations(userId, contextType, contextData, userProfile, recommendations) {
    const cacheKey = this.generateCacheKey(userId, contextType, contextData, userProfile);
    const cacheData = {
      data: recommendations,
      timestamp: Date.now(),
      userId,
      contextType
    };

    // Update memory cache
    this.memoryCache.set(cacheKey, cacheData);
    this.cleanupMemoryCache();

    // Update localStorage cache
    try {
      localStorage.setItem(`ai_rec_${cacheKey}`, JSON.stringify(cacheData));
      console.log('💾 Cached recommendations:', cacheKey.slice(0, 16));
    } catch (error) {
      console.warn('Cache write error:', error);
      // If localStorage is full, clear old cache entries
      this.clearExpiredLocalStorage();
    }
  }

  // Check if cache entry is expired
  isExpired(timestamp) {
    return Date.now() - timestamp > this.cacheTimeout;
  }

  // Cleanup memory cache to prevent memory leaks
  cleanupMemoryCache() {
    if (this.memoryCache.size <= this.maxCacheSize) return;

    // Remove oldest entries
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = entries.slice(0, entries.length - this.maxCacheSize);
    toRemove.forEach(([key]) => this.memoryCache.delete(key));
    
    console.log(`🧹 Cleaned up ${toRemove.length} old cache entries`);
  }

  // Clear expired localStorage entries
  clearExpiredLocalStorage() {
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ai_rec_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (this.isExpired(data.timestamp)) {
              keysToRemove.push(key);
            }
          } catch (error) {
            keysToRemove.push(key); // Remove invalid entries
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🧹 Cleared ${keysToRemove.length} expired localStorage entries`);
      
    } catch (error) {
      console.warn('Error clearing localStorage cache:', error);
    }
  }

  // Clear all cache
  clearAllCache() {
    this.memoryCache.clear();
    
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ai_rec_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('🧹 Cleared all recommendation cache');
    } catch (error) {
      console.warn('Error clearing all cache:', error);
    }
  }

  // Get cache statistics
  getCacheStats() {
    const memorySize = this.memoryCache.size;
    let localStorageSize = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ai_rec_')) {
          localStorageSize++;
        }
      }
    } catch (error) {
      console.warn('Error getting localStorage stats:', error);
    }

    return {
      memoryCache: memorySize,
      localStorage: localStorageSize,
      cacheTimeout: this.cacheTimeout / 1000 / 60 // in minutes
    };
  }
}

// Create singleton instance
let cacheInstance = null;

export function getRecommendationCache() {
  if (!cacheInstance) {
    cacheInstance = new RecommendationCache();
  }
  return cacheInstance;
}

export default RecommendationCache;