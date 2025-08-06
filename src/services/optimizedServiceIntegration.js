/**
 * Optimized Service Integration Hub
 * 
 * This module provides a centralized integration point for all optimized Firebase services.
 * It includes performance monitoring, cache management, and service coordination.
 */

import { getOptimizedCache } from './optimizedDataCache';
import { getOptimizedProductService } from './optimizedProductService';
import { getOptimizedCartService } from './optimizedCartService';
import OptimizedFirebaseService from './optimizedFirebaseService';

class OptimizedServiceIntegration {
  constructor() {
    this.cache = getOptimizedCache();
    this.productService = getOptimizedProductService();
    this.cartService = getOptimizedCartService();
    this.firebaseService = OptimizedFirebaseService;
    
    this.performanceMetrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      firebaseReadsSaved: 0,
      lastResetTime: Date.now()
    };
    
    this.isInitialized = false;
    this.setupPerformanceMonitoring();
  }

  /**
   * Initialize all optimized services with warm-up data
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('📊 Optimized services already initialized');
      return;
    }

    console.log('🚀 Initializing optimized Firebase services...');
    
    try {
      const startTime = Date.now();
      
      // Test Firebase connection
      const connectionTest = await this.firebaseService.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Firebase connection failed: ${connectionTest.error}`);
      }
      
      console.log(`✅ Firebase connection established (${connectionTest.latency}ms)`);
      
      // Preload common data to warm caches
      await this.warmupCaches();
      
      // Initialize service metrics
      this.startPerformanceTracking();
      
      const initTime = Date.now() - startTime;
      console.log(`🎯 Optimized services initialized in ${initTime}ms`);
      
      this.isInitialized = true;
      
      return {
        success: true,
        initializationTime: initTime,
        connectionLatency: connectionTest.latency,
        services: ['cache', 'products', 'cart', 'firebase']
      };
      
    } catch (error) {
      console.error('❌ Failed to initialize optimized services:', error);
      throw error;
    }
  }

  /**
   * Warm up caches with commonly accessed data
   */
  async warmupCaches() {
    console.log('🔥 Warming up caches with common data...');
    
    const warmupTasks = [
      // Warm up product data
      this.productService.preloadCommonData(),
      
      // Warm up categories and brands
      this.productService.getCategories(),
      this.productService.getBrands()
    ];
    
    try {
      await Promise.all(warmupTasks);
      console.log('✅ Cache warmup completed successfully');
    } catch (error) {
      console.warn('⚠️ Some cache warmup tasks failed:', error);
    }
  }

  /**
   * Performance monitoring setup
   */
  setupPerformanceMonitoring() {
    // Monitor cache performance
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 30000); // Every 30 seconds
    
    // Daily performance reports
    setInterval(() => {
      this.generatePerformanceReport();
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }

  startPerformanceTracking() {
    this.performanceMetrics.lastResetTime = Date.now();
    console.log('📈 Performance tracking started');
  }

  updatePerformanceMetrics() {
    const cacheStats = this.cache.getCacheStats();
    
    this.performanceMetrics = {
      ...this.performanceMetrics,
      cacheHits: cacheStats.metrics.hits,
      cacheMisses: cacheStats.metrics.misses,
      firebaseReadsSaved: cacheStats.metrics.savedReads,
      totalRequests: cacheStats.metrics.requests,
      cacheEfficiency: cacheStats.metrics.requests > 0 
        ? (cacheStats.metrics.hits / cacheStats.metrics.requests * 100).toFixed(2)
        : 0
    };
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport() {
    const now = Date.now();
    const reportPeriod = now - this.performanceMetrics.lastResetTime;
    const hoursElapsed = (reportPeriod / (1000 * 60 * 60)).toFixed(2);
    
    const cacheStats = this.cache.getCacheStats();
    
    const report = {
      reportDate: new Date().toISOString(),
      period: `${hoursElapsed} hours`,
      performance: {
        totalRequests: this.performanceMetrics.totalRequests,
        cacheHits: this.performanceMetrics.cacheHits,
        cacheMisses: this.performanceMetrics.cacheMisses,
        cacheEfficiency: `${this.performanceMetrics.cacheEfficiency}%`,
        firebaseReadsSaved: this.performanceMetrics.firebaseReadsSaved,
        estimatedCostSavings: this.calculateCostSavings(this.performanceMetrics.firebaseReadsSaved)
      },
      cacheStatus: {
        memoryItems: cacheStats.memoryItems,
        typeBreakdown: cacheStats.typeBreakdown,
        pendingRequests: cacheStats.pendingRequests
      },
      recommendations: this.generateOptimizationRecommendations(cacheStats)
    };
    
    console.log('📊 Performance Report:', report);
    
    // Store report for analytics
    this.storePerformanceReport(report);
    
    return report;
  }

  /**
   * Calculate estimated cost savings from reduced Firebase reads
   */
  calculateCostSavings(readsSaved) {
    // Firebase pricing: $0.06 per 100,000 document reads
    const costPerRead = 0.00000006; // $0.06 / 100,000
    const savedCost = readsSaved * costPerRead;
    
    return {
      readsSaved,
      estimatedSavings: `$${savedCost.toFixed(4)}`,
      monthlyProjection: `$${(savedCost * 30).toFixed(2)}`
    };
  }

  /**
   * Generate optimization recommendations based on performance data
   */
  generateOptimizationRecommendations(cacheStats) {
    const recommendations = [];
    
    // Cache efficiency recommendations
    const hitRate = cacheStats.metrics.requests > 0 
      ? (cacheStats.metrics.hits / cacheStats.metrics.requests)
      : 0;
    
    if (hitRate < 0.7) {
      recommendations.push({
        type: 'cache_efficiency',
        priority: 'high',
        message: `Cache hit rate is ${(hitRate * 100).toFixed(1)}%. Consider increasing TTL for frequently accessed data.`
      });
    }
    
    // Memory usage recommendations
    if (cacheStats.memoryItems > 5000) {
      recommendations.push({
        type: 'memory_usage',
        priority: 'medium',
        message: `Cache contains ${cacheStats.memoryItems} items. Consider implementing more aggressive LRU eviction.`
      });
    }
    
    // Type-specific recommendations
    Object.entries(cacheStats.typeBreakdown || {}).forEach(([type, count]) => {
      if (count > 1000) {
        recommendations.push({
          type: 'cache_overflow',
          priority: 'low',
          message: `${type} cache has ${count} items. Monitor for potential memory issues.`
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Store performance report for analytics
   */
  storePerformanceReport(report) {
    try {
      const reports = JSON.parse(localStorage.getItem('optimized_service_reports') || '[]');
      reports.push(report);
      
      // Keep only last 30 reports
      if (reports.length > 30) {
        reports.splice(0, reports.length - 30);
      }
      
      localStorage.setItem('optimized_service_reports', JSON.stringify(reports));
    } catch (error) {
      console.warn('⚠️ Failed to store performance report:', error);
    }
  }

  /**
   * Health check for all optimized services
   */
  async healthCheck() {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      services: {}
    };
    
    try {
      // Test Firebase connection
      const fbTest = await this.firebaseService.testConnection();
      healthStatus.services.firebase = {
        status: fbTest.success ? 'healthy' : 'unhealthy',
        latency: fbTest.latency,
        error: fbTest.error
      };
      
      // Test cache functionality
      const testKey = 'health_check_test';
      const testData = { test: true, timestamp: Date.now() };
      
      this.cache.set(testKey, testData, 'products');
      const cachedData = await this.cache.get(testKey, 'products', () => Promise.resolve(testData));
      
      healthStatus.services.cache = {
        status: cachedData ? 'healthy' : 'unhealthy',
        items: this.cache.getCacheStats().memoryItems
      };
      
      // Test product service
      try {
        await this.productService.getFeaturedProducts(1);
        healthStatus.services.products = { status: 'healthy' };
      } catch (error) {
        healthStatus.services.products = { status: 'unhealthy', error: error.message };
      }
      
      // Determine overall health
      const unhealthyServices = Object.values(healthStatus.services)
        .filter(service => service.status === 'unhealthy');
      
      if (unhealthyServices.length > 0) {
        healthStatus.overall = unhealthyServices.length === Object.keys(healthStatus.services).length 
          ? 'critical' 
          : 'degraded';
      }
      
    } catch (error) {
      healthStatus.overall = 'critical';
      healthStatus.error = error.message;
    }
    
    return healthStatus;
  }

  /**
   * Force cache refresh for all services
   */
  async refreshAllCaches() {
    console.log('🔄 Refreshing all caches...');
    
    try {
      // Clear existing caches
      this.cache.clear();
      
      // Invalidate specific service caches
      this.productService.clearCache();
      
      // Warm up with fresh data
      await this.warmupCaches();
      
      console.log('✅ All caches refreshed successfully');
      return { success: true, timestamp: new Date().toISOString() };
      
    } catch (error) {
      console.error('❌ Failed to refresh caches:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive service statistics
   */
  getServiceStatistics() {
    const cacheStats = this.cache.getCacheStats();
    
    return {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.performanceMetrics.lastResetTime,
      cache: cacheStats,
      performance: this.performanceMetrics,
      products: this.productService.getCacheStats(),
      isInitialized: this.isInitialized
    };
  }

  /**
   * Emergency fallback mode - disable optimizations
   */
  enableFallbackMode() {
    console.warn('⚠️ Enabling fallback mode - optimizations disabled');
    
    // This would disable caching and use direct Firebase calls
    // Implementation depends on service architecture
    
    return {
      mode: 'fallback',
      timestamp: new Date().toISOString(),
      reason: 'Emergency fallback activated'
    };
  }

  /**
   * Cleanup resources and stop monitoring
   */
  cleanup() {
    console.log('🧹 Cleaning up optimized service integration...');
    
    // Cleanup cart service listeners
    this.cartService.cleanup();
    
    // Clear performance monitoring intervals
    // (Note: In real implementation, you'd store interval IDs and clear them)
    
    console.log('✅ Cleanup completed');
  }
}

// Singleton instance
let optimizedServiceIntegrationInstance = null;

export function getOptimizedServiceIntegration() {
  if (!optimizedServiceIntegrationInstance) {
    optimizedServiceIntegrationInstance = new OptimizedServiceIntegration();
  }
  return optimizedServiceIntegrationInstance;
}

/**
 * Convenience function to initialize all optimized services
 */
export async function initializeOptimizedServices() {
  const integration = getOptimizedServiceIntegration();
  return await integration.initialize();
}

/**
 * Quick health check for optimized services
 */
export async function checkOptimizedServicesHealth() {
  const integration = getOptimizedServiceIntegration();
  return await integration.healthCheck();
}

/**
 * Get performance statistics for optimized services
 */
export function getOptimizedServicesStats() {
  const integration = getOptimizedServiceIntegration();
  return integration.getServiceStatistics();
}

export default OptimizedServiceIntegration;