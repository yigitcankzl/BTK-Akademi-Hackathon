// React hook for Firebase operations
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import FirebaseService from '../services/firebaseService';
import { getGeminiFirebaseService } from '../services/geminiFirebaseService';
import { getErrorMessage } from '../utils/helpers';

export function useFirebase() {
  const { state, dispatch, actionTypes } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const geminiFirebaseService = getGeminiFirebaseService(state.settings.geminiApiKey);

  // User Management
  const createUser = useCallback(async (userId, userData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await FirebaseService.createUser(userId, userData);
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getUser = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const user = await FirebaseService.getUser(userId);
      return user;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (userId, userData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await FirebaseService.updateUser(userId, userData);
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Product Management
  const getProducts = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const products = await FirebaseService.getProducts(filters);
      
      // Update app state with products
      dispatch({
        type: actionTypes.SET_PRODUCTS,
        payload: products
      });
      
      return products;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dispatch, actionTypes]);

  const getProduct = useCallback(async (productId) => {
    try {
      setLoading(true);
      setError(null);
      const product = await FirebaseService.getProduct(productId);
      return product;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // User Behavior Tracking
  const trackBehavior = useCallback(async (userId, action, data = {}) => {
    try {
      await FirebaseService.trackUserBehavior(userId, {
        action,
        ...data,
        userAgent: navigator.userAgent,
        referrer: document.referrer
      });
    } catch (err) {
      // Don't throw error for tracking failures, just log
      console.warn('Failed to track user behavior:', err);
    }
  }, []);

  const getBehaviorAnalysis = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const analysis = await geminiFirebaseService.analyzeUserBehavior(userId);
      return analysis;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [geminiFirebaseService]);

  // Recommendations
  const getRecommendations = useCallback(async (userId, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      const recommendations = await geminiFirebaseService.generateProductRecommendations(userId, options);
      
      // Update app state
      dispatch({
        type: actionTypes.SET_RECOMMENDATIONS,
        payload: recommendations
      });
      
      return recommendations;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [geminiFirebaseService, dispatch, actionTypes]);

  // Smart Search
  const smartSearch = useCallback(async (userId, query, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      const results = await geminiFirebaseService.smartSearch(userId, query, options);
      
      // Track search behavior
      await trackBehavior(userId, 'search', {
        query,
        resultsCount: results.length
      });
      
      return results;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [geminiFirebaseService, trackBehavior]);

  // Cart Management
  const addToCart = useCallback(async (userId, productId, quantity = 1) => {
    try {
      setLoading(true);
      setError(null);
      const result = await FirebaseService.addToCart(userId, productId, quantity);
      
      // Track behavior
      await trackBehavior(userId, 'add_to_cart', {
        productId,
        quantity
      });
      
      // Refresh cart in app state
      const cartItems = await FirebaseService.getCartItems(userId);
      dispatch({
        type: actionTypes.SET_CART_ITEMS,
        payload: cartItems
      });
      
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [trackBehavior, dispatch, actionTypes]);

  const getCartItems = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const cartItems = await FirebaseService.getCartItems(userId);
      
      dispatch({
        type: actionTypes.SET_CART_ITEMS,
        payload: cartItems
      });
      
      return cartItems;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dispatch, actionTypes]);

  const removeFromCart = useCallback(async (userId, productId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await FirebaseService.removeFromCart(userId, productId);
      
      // Track behavior
      await trackBehavior(userId, 'remove_from_cart', {
        productId
      });
      
      // Refresh cart
      const cartItems = await FirebaseService.getCartItems(userId);
      dispatch({
        type: actionTypes.SET_CART_ITEMS,
        payload: cartItems
      });
      
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [trackBehavior, dispatch, actionTypes]);

  // Orders
  const createOrder = useCallback(async (orderData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await FirebaseService.createOrder(orderData);
      
      // Track order creation
      await trackBehavior(orderData.userId, 'create_order', {
        orderId: result.id,
        total: orderData.total,
        itemCount: orderData.items.length
      });
      
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [trackBehavior]);

  const getUserOrders = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const orders = await FirebaseService.getUserOrders(userId);
      return orders;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time subscriptions
  const subscribeToCart = useCallback((userId, callback) => {
    return FirebaseService.subscribeToUserCart(userId, (cartItems) => {
      dispatch({
        type: actionTypes.SET_CART_ITEMS,
        payload: cartItems
      });
      callback(cartItems);
    });
  }, [dispatch, actionTypes]);

  const subscribeToProducts = useCallback((callback, filters = {}) => {
    return FirebaseService.subscribeToProducts((products) => {
      dispatch({
        type: actionTypes.SET_PRODUCTS,
        payload: products
      });
      callback(products);
    }, filters);
  }, [dispatch, actionTypes]);

  // Utility functions
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const testConnection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await geminiFirebaseService.testIntegration();
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [geminiFirebaseService]);

  // Auto-track page views
  useEffect(() => {
    const currentUser = state.user; // Assuming you have user in app state
    if (currentUser) {
      trackBehavior(currentUser.id, 'page_view', {
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    }
  }, [trackBehavior, state.user]);

  return {
    // State
    loading,
    error,
    
    // User Management
    createUser,
    getUser,
    updateUser,
    
    // Products
    getProducts,
    getProduct,
    
    // Behavior & Analytics
    trackBehavior,
    getBehaviorAnalysis,
    
    // Recommendations
    getRecommendations,
    
    // Search
    smartSearch,
    
    // Cart
    addToCart,
    getCartItems,
    removeFromCart,
    
    // Orders
    createOrder,
    getUserOrders,
    
    // Real-time subscriptions
    subscribeToCart,
    subscribeToProducts,
    
    // Utilities
    clearError,
    testConnection
  };
}

export default useFirebase;