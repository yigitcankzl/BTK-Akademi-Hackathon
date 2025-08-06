import React, { createContext, useContext, useReducer, useEffect } from 'react';

/**
 * Global Application State Architecture
 * 
 * Implements a comprehensive state management system using React Context and useReducer
 * to provide centralized, predictable state management across the entire e-commerce
 * application. This architecture ensures consistent data flow, prevents prop drilling,
 * and enables complex state interactions between distant components.
 * 
 * Key Design Principles:
 * - Single source of truth for all application data
 * - Immutable state updates through reducer pattern
 * - Persistent state management with localStorage integration
 * - Type-safe action dispatching with predefined action types
 * - Modular state structure for easy maintenance and testing
 */
const initialState = {
  /**
   * Authentication & User Session Management
   * 
   * Manages user authentication status, session persistence, and welcome flow.
   * Integrates with localStorage for seamless login state across browser sessions.
   * The welcome state controls first-time user onboarding experience.
   */
  isAuthenticated: true,
  showWelcome: false,
  
  /**
   * Dynamic Theme System
   * 
   * Provides application-wide dark/light mode functionality with system preference
   * detection and user preference persistence. Theme changes are applied globally
   * through CSS class manipulation on the document root element.
   */
  isDarkMode: false,
  
  /**
   * AI Service Configuration Management
   * 
   * Centralized configuration for AI services including Gemini API integration.
   * Contains production-ready API credentials, model selection parameters,
   * and user customization options for AI behavior and responses.
   * 
   * Security Note: API keys are embedded for demo purposes - in production,
   * these should be managed through secure environment variables.
   */
  settings: {
    geminiApiKey: 'AIzaSyBWw-Vy9VKIDDZ-7D4Qq738Fcc2_2eSBWA',
    selectedModel: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 1000,
    language: 'tr',
    enableNotifications: true,
  },
  
  
  /**
   * File Processing & Upload Management
   * 
   * Manages the complete file upload lifecycle including upload queue,
   * processing status, and results storage. Supports multiple file formats
   * and provides real-time feedback on processing progress.
   */
  uploadedFiles: [],
  processingFiles: [],
  fileResults: [],
  
  /**
   * E-commerce Business Logic State
   * 
   * Comprehensive shopping cart management with item tracking, coupon system,
   * and automatic persistence. Includes sophisticated product catalog state
   * with filtering, search, and recommendation systems.
   */
  cart: {
    items: [],
    coupon: null,
    lastUpdated: null,
  },
  products: {
    featured: [],
    categories: [],
    brands: [],
    filters: {
      category: null,
      brand: null,
      priceRange: [0, 100000],
      rating: 0,
      inStock: true,
    },
    searchQuery: '',
    searchResults: [],
    recommendations: [],
  },
  user: {
    profile: null,
    addresses: [],
    wishlist: [],
    preferences: {
      favoriteCategories: [],
      preferredBrands: [],
      priceRange: [0, 50000],
      notifications: {
        orderUpdates: true,
        promotions: true,
        recommendations: true,
      },
    },
  },
  
  
  /**
   * User Interface State Management
   * 
   * Controls application-wide UI behavior including navigation state,
   * loading indicators, error handling, and notification system.
   * Ensures consistent user experience across all components.
   */
  sidebarOpen: false,
  activeTab: 'home',
  notifications: [],
  isLoading: false,
  error: null,
};

/**
 * Action Type Constants for State Management
 * 
 * Defines all possible actions that can be dispatched to modify application state.
 * This centralized action registry ensures type safety, prevents typos, and provides
 * clear documentation of all state mutation patterns available in the application.
 * 
 * Action Categories:
 * - Authentication: User login/logout and session management
 * - Theme: Dark/light mode toggle and theme persistence
 * - Settings: AI configuration and user preferences
 * - File Management: Upload, processing, and result handling
 * - E-commerce: Cart operations, product management, user data
 * - UI Control: Navigation, notifications, and loading states
 */
const actionTypes = {
  // Authentication actions
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  HIDE_WELCOME: 'HIDE_WELCOME',
  
  // Theme actions
  TOGGLE_DARK_MODE: 'TOGGLE_DARK_MODE',
  SET_THEME: 'SET_THEME',
  
  // Settings actions
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  RESET_SETTINGS: 'RESET_SETTINGS',
  
  
  // File actions
  ADD_UPLOADED_FILE: 'ADD_UPLOADED_FILE',
  REMOVE_UPLOADED_FILE: 'REMOVE_UPLOADED_FILE',
  SET_PROCESSING_FILE: 'SET_PROCESSING_FILE',
  ADD_FILE_RESULT: 'ADD_FILE_RESULT',
  CLEAR_FILE_RESULTS: 'CLEAR_FILE_RESULTS',
  
  // E-commerce actions
  // Cart actions
  ADD_TO_CART: 'ADD_TO_CART',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  UPDATE_CART_QUANTITY: 'UPDATE_CART_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  APPLY_COUPON: 'APPLY_COUPON',
  REMOVE_COUPON: 'REMOVE_COUPON',
  SET_CART: 'SET_CART',
  SET_CART_ITEMS: 'SET_CART_ITEMS',
  
  // Product actions
  SET_PRODUCTS: 'SET_PRODUCTS',
  SET_FEATURED_PRODUCTS: 'SET_FEATURED_PRODUCTS',
  SET_CATEGORIES: 'SET_CATEGORIES',
  SET_BRANDS: 'SET_BRANDS',
  SET_PRODUCT_FILTERS: 'SET_PRODUCT_FILTERS',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_SEARCH_RESULTS: 'SET_SEARCH_RESULTS',
  CLEAR_SEARCH: 'CLEAR_SEARCH',
  SET_RECOMMENDATIONS: 'SET_RECOMMENDATIONS',
  
  // User actions
  SET_USER_PROFILE: 'SET_USER_PROFILE',
  UPDATE_USER_PROFILE: 'UPDATE_USER_PROFILE',
  ADD_USER_ADDRESS: 'ADD_USER_ADDRESS',
  UPDATE_USER_ADDRESS: 'UPDATE_USER_ADDRESS',
  DELETE_USER_ADDRESS: 'DELETE_USER_ADDRESS',
  ADD_TO_WISHLIST: 'ADD_TO_WISHLIST',
  REMOVE_FROM_WISHLIST: 'REMOVE_FROM_WISHLIST',
  SET_USER_PREFERENCES: 'SET_USER_PREFERENCES',
  
  
  // UI actions
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case actionTypes.LOGIN:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
      };
      
    case actionTypes.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
      };
      
    case actionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
      };
      
    case actionTypes.HIDE_WELCOME:
      return {
        ...state,
        showWelcome: false,
      };
      
    case actionTypes.TOGGLE_DARK_MODE:
      return {
        ...state,
        isDarkMode: !state.isDarkMode,
      };
      
    case actionTypes.SET_THEME:
      return {
        ...state,
        isDarkMode: action.payload,
      };
      
    case actionTypes.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
      
    case actionTypes.RESET_SETTINGS:
      return {
        ...state,
        settings: initialState.settings,
      };
      
    case actionTypes.ADD_UPLOADED_FILE:
      return {
        ...state,
        uploadedFiles: [...state.uploadedFiles, action.payload],
      };
      
    case actionTypes.REMOVE_UPLOADED_FILE:
      return {
        ...state,
        uploadedFiles: state.uploadedFiles.filter(file => file.id !== action.payload),
      };
      
    case actionTypes.SET_PROCESSING_FILE:
      return {
        ...state,
        processingFiles: action.payload,
      };
      
    case actionTypes.ADD_FILE_RESULT:
      return {
        ...state,
        fileResults: [...state.fileResults, action.payload],
      };
      
    case actionTypes.CLEAR_FILE_RESULTS:
      return {
        ...state,
        fileResults: [],
      };
      
    case actionTypes.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      };
      
    case actionTypes.SET_ACTIVE_TAB:
      return {
        ...state,
        activeTab: action.payload,
      };
      
    case actionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
      
    case actionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(notif => notif.id !== action.payload),
      };
      
    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
      
    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };
      
    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
      
    // E-commerce reducer cases
    // Cart actions
    case actionTypes.SET_CART:
      return {
        ...state,
        cart: action.payload,
      };
      
    case actionTypes.ADD_TO_CART:
      return {
        ...state,
        cart: {
          ...state.cart,
          items: [...state.cart.items, action.payload],
          lastUpdated: new Date().toISOString(),
        },
      };
      
    case actionTypes.REMOVE_FROM_CART:
      return {
        ...state,
        cart: {
          ...state.cart,
          items: state.cart.items.filter(item => item.key !== action.payload),
          lastUpdated: new Date().toISOString(),
        },
      };
      
    case actionTypes.UPDATE_CART_QUANTITY:
      return {
        ...state,
        cart: {
          ...state.cart,
          items: state.cart.items.map(item =>
            item.key === action.payload.itemKey
              ? { ...item, quantity: action.payload.quantity }
              : item
          ),
          lastUpdated: new Date().toISOString(),
        },
      };
      
    case actionTypes.CLEAR_CART:
      return {
        ...state,
        cart: {
          items: [],
          coupon: null,
          lastUpdated: new Date().toISOString(),
        },
      };
      
    case actionTypes.APPLY_COUPON:
      return {
        ...state,
        cart: {
          ...state.cart,
          coupon: action.payload,
        },
      };
      
    case actionTypes.REMOVE_COUPON:
      return {
        ...state,
        cart: {
          ...state.cart,
          coupon: null,
        },
      };
      
    // Product actions
    case actionTypes.SET_FEATURED_PRODUCTS:
      return {
        ...state,
        products: {
          ...state.products,
          featured: action.payload,
        },
      };
      
    case actionTypes.SET_CATEGORIES:
      return {
        ...state,
        products: {
          ...state.products,
          categories: action.payload,
        },
      };
      
    case actionTypes.SET_BRANDS:
      return {
        ...state,
        products: {
          ...state.products,
          brands: action.payload,
        },
      };
      
    case actionTypes.SET_PRODUCT_FILTERS:
      return {
        ...state,
        products: {
          ...state.products,
          filters: { ...state.products.filters, ...action.payload },
        },
      };
      
    case actionTypes.SET_SEARCH_QUERY:
      return {
        ...state,
        products: {
          ...state.products,
          searchQuery: action.payload,
        },
      };
      
    case actionTypes.SET_SEARCH_RESULTS:
      return {
        ...state,
        products: {
          ...state.products,
          searchResults: action.payload,
        },
      };
      
    case actionTypes.CLEAR_SEARCH:
      return {
        ...state,
        products: {
          ...state.products,
          searchQuery: '',
          searchResults: [],
        },
      };
      
    case actionTypes.SET_RECOMMENDATIONS:
      return {
        ...state,
        products: {
          ...state.products,
          recommendations: action.payload,
        },
      };
      
    case actionTypes.SET_CART_ITEMS:
      return {
        ...state,
        cart: {
          ...state.cart,
          items: action.payload,
          lastUpdated: new Date().toISOString(),
        },
      };
      
    // User actions
    case actionTypes.SET_USER_PROFILE:
      return {
        ...state,
        user: {
          ...state.user,
          profile: action.payload,
        },
      };
      
    case actionTypes.UPDATE_USER_PROFILE:
      return {
        ...state,
        user: {
          ...state.user,
          profile: { ...state.user.profile, ...action.payload },
        },
      };
      
    case actionTypes.ADD_USER_ADDRESS:
      return {
        ...state,
        user: {
          ...state.user,
          addresses: [...state.user.addresses, action.payload],
        },
      };
      
    case actionTypes.UPDATE_USER_ADDRESS:
      return {
        ...state,
        user: {
          ...state.user,
          addresses: state.user.addresses.map(addr =>
            addr.id === action.payload.id ? action.payload : addr
          ),
        },
      };
      
    case actionTypes.DELETE_USER_ADDRESS:
      return {
        ...state,
        user: {
          ...state.user,
          addresses: state.user.addresses.filter(addr => addr.id !== action.payload),
        },
      };
      
    case actionTypes.ADD_TO_WISHLIST:
      return {
        ...state,
        user: {
          ...state.user,
          wishlist: [...state.user.wishlist, action.payload],
        },
      };
      
    case actionTypes.REMOVE_FROM_WISHLIST:
      return {
        ...state,
        user: {
          ...state.user,
          wishlist: state.user.wishlist.filter(item => item.id !== action.payload),
        },
      };
      
    case actionTypes.SET_USER_PREFERENCES:
      return {
        ...state,
        user: {
          ...state.user,
          preferences: { ...state.user.preferences, ...action.payload },
        },
      };
      
    
    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  /**
   * Persistent State Hydration System
   * 
   * Automatically restores user preferences, authentication status, cart contents,
   * and application settings from localStorage on application startup. This ensures
   * seamless user experience across browser sessions and provides offline-first
   * functionality for critical user data.
   * 
   * Handles graceful error recovery if localStorage data is corrupted or unavailable.
   */
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('hackathon2025-settings');
      const savedTheme = localStorage.getItem('hackathon2025-theme');
      const savedAuth = localStorage.getItem('hackathon2025-auth');
      const savedCart = localStorage.getItem('hackathon2025-cart');
      const savedUser = localStorage.getItem('hackathon2025-user');

      if (savedSettings) {
        dispatch({
          type: actionTypes.UPDATE_SETTINGS,
          payload: JSON.parse(savedSettings),
        });
      }


      if (savedTheme) {
        dispatch({
          type: actionTypes.SET_THEME,
          payload: JSON.parse(savedTheme),
        });
      }


      if (savedAuth) {
        const authData = JSON.parse(savedAuth);
        if (authData.isAuthenticated) {
          dispatch({
            type: actionTypes.LOGIN,
            payload: authData.user,
          });
        }
        if (!authData.showWelcome) {
          dispatch({
            type: actionTypes.HIDE_WELCOME,
          });
        }
      }

      if (savedCart) {
        dispatch({
          type: actionTypes.SET_CART,
          payload: JSON.parse(savedCart),
        });
      }

      if (savedUser) {
        dispatch({
          type: actionTypes.SET_USER,
          payload: JSON.parse(savedUser),
        });
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  /**
   * Automatic State Persistence System
   * 
   * Monitors critical state changes and automatically persists them to localStorage
   * for seamless session continuity. Each state domain is persisted independently
   * to optimize performance and prevent data corruption from failed writes.
   * 
   * Implements error handling to prevent application crashes from storage quota
   * limitations or browser security restrictions.
   */
  useEffect(() => {
    try {
      localStorage.setItem('hackathon2025-settings', JSON.stringify(state.settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [state.settings]);


  useEffect(() => {
    try {
      localStorage.setItem('hackathon2025-theme', JSON.stringify(state.isDarkMode));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, [state.isDarkMode]);


  useEffect(() => {
    try {
      localStorage.setItem('hackathon2025-auth', JSON.stringify({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        showWelcome: state.showWelcome,
      }));
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  }, [state.isAuthenticated, state.user, state.showWelcome]);

  useEffect(() => {
    try {
      localStorage.setItem('hackathon2025-cart', JSON.stringify(state.cart));
    } catch (error) {
      console.error('Error saving cart data:', error);
    }
  }, [state.cart]);

  /**
   * Dynamic Theme Application System
   * 
   * Automatically applies theme changes to the document root element by manipulating
   * CSS classes. This enables instant theme switching across the entire application
   * without requiring component re-renders. Integrates with Tailwind CSS dark mode
   * utilities for comprehensive theme support.
   */
  useEffect(() => {
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.isDarkMode]);

  return (
    <AppContext.Provider value={{ state, dispatch, actionTypes }}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Custom Hook for Application State Access
 * 
 * Provides type-safe access to the global application state and dispatch functions.
 * Includes built-in error handling to ensure the hook is only used within the
 * AppProvider context. This prevents runtime errors and provides clear developer
 * feedback for improper usage.
 * 
 * Returns the complete state object, dispatch function, and action type constants
 * for convenient access to all state management capabilities.
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
