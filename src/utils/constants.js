/**
 * Google Gemini API Configuration Management
 * 
 * Environment-based Configuration:
 * - Supports multiple deployment environments (dev, staging, production)
 * - Runtime configuration through environment variables prevents hardcoding
 * - Fallback values ensure application functionality in unconfigured environments
 * - Centralized API settings for consistent behavior across the application
 * 
 * Performance Tuning Parameters:
 * - MAX_TOKENS: Controls response length and API costs
 * - TEMPERATURE: Balances creativity vs. consistency in AI responses
 * - TOP_P and TOP_K: Fine-tune response quality and diversity
 * - Model selection optimized for specific use cases (text vs. vision)
 * 
 * Security Considerations:
 * - API endpoints configured through secure environment variables
 * - No sensitive credentials exposed in client-side code
 * - Model versioning supports gradual updates and rollbacks
 * - Rate limiting parameters prevent quota exhaustion
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/models',
  GEMINI_PRO: import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash',
  GEMINI_PRO_VISION: import.meta.env.VITE_GEMINI_VISION_MODEL || 'gemini-1.5-flash',
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
  TOP_P: 0.95,
  TOP_K: 64,
};

// App Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'AI E-Ticaret',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760, // 10MB
  CACHE_DURATION: parseInt(import.meta.env.VITE_CACHE_DURATION) || 300000, // 5 minutes
  MAX_CONCURRENT_REQUESTS: parseInt(import.meta.env.VITE_MAX_CONCURRENT_REQUESTS) || 3,
};

// Supported file types for upload
export const SUPPORTED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'text/plain', 'text/markdown'],
  SPREADSHEETS: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ],
  PRESENTATIONS: [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint'
  ],
  get ALL() {
    return [...this.IMAGES, ...this.DOCUMENTS, ...this.SPREADSHEETS, ...this.PRESENTATIONS];
  }
};

// File size limits
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  SPREADSHEET: 15 * 1024 * 1024, // 15MB
  PRESENTATION: 20 * 1024 * 1024, // 20MB
};

// Navigation routes
export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  CART: '/cart',
  VISUAL_SEARCH: '/visual-search',
  RECOMMENDATIONS: '/recommendations',
  COMPLEMENTARY_PRODUCTS: '/complementary-products',
  PRODUCT_DETAIL: '/product',
  CHECKOUT: '/checkout',
  LOGIN: '/login',
  REGISTER: '/register',
};

// Theme colors
export const THEME_COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
};

// Animation durations
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
  EXTRA_SLOW: 500,
};

// Breakpoints for responsive design
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
};

// Message types for chat
export const MESSAGE_TYPES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
  ERROR: 'error',
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Local storage keys
export const STORAGE_KEYS = {
  SETTINGS: 'hackathon2025-settings',
  THEME: 'hackathon2025-theme',
  ANALYTICS: 'hackathon2025-analytics',
  FILE_CACHE: 'hackathon2025-file-cache',
  USER_PREFERENCES: 'hackathon2025-user-preferences',
};

// Feature flags
export const FEATURES = {
  FILE_UPLOAD: import.meta.env.VITE_ENABLE_FILE_UPLOAD === 'true' || true,
  ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true' || true,
  EXPORT: import.meta.env.VITE_ENABLE_EXPORT === 'true' || true,
  DARK_MODE: import.meta.env.VITE_ENABLE_DARK_MODE === 'true' || true,
  SERVICE_WORKER: import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'true' || false,
};

// Error messages
export const ERROR_MESSAGES = {
  API_KEY_MISSING: 'Gemini API key is required. Please set it in Settings.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit.',
  UNSUPPORTED_FILE_TYPE: 'File type is not supported.',
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  RATE_LIMIT: 'Rate limit exceeded. Please try again later.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
  INVALID_API_KEY: 'Invalid API key. Please check your Gemini API key.',
  MODEL_NOT_AVAILABLE: 'The selected model is not available.',
  CONTEXT_LENGTH_EXCEEDED: 'Context length exceeded. Please start a new conversation.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: 'File uploaded successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.',
  CONVERSATION_DELETED: 'Conversation deleted successfully.',
  DATA_EXPORTED: 'Data exported successfully.',
  NOTIFICATION_DISMISSED: 'Notification dismissed.',
};

// Default settings
export const DEFAULT_SETTINGS = {
  geminiApiKey: '',
  selectedModel: 'gemini-1.5-flash',
  temperature: API_CONFIG.TEMPERATURE,
  maxTokens: API_CONFIG.MAX_TOKENS,
  topP: API_CONFIG.TOP_P,
  topK: API_CONFIG.TOP_K,
  language: 'en',
  enableNotifications: true,
  enableAnalytics: false,
  enableSoundEffects: true,
  autoSave: true,
  compactMode: false,
};

// Available languages
export const LANGUAGES = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ru: 'Русский',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
  ar: 'العربية',
  hi: 'हिन्दी',
  tr: 'Türkçe',
};

// Available models
export const AVAILABLE_MODELS = {
  'gemini-1.5-flash': {
    name: 'Gemini 1.5 Flash',
    description: 'Fast and efficient model for text and images',
    maxTokens: 1000000,
    supportsVision: true,
  },
  'gemini-1.5-pro': {
    name: 'Gemini 1.5 Pro',
    description: 'Most capable model for complex tasks',
    maxTokens: 2000000,
    supportsVision: true,
  },
};

// Chart colors for analytics
export const CHART_COLORS = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#06b6d4',
  PURPLE: '#8b5cf6',
  PINK: '#ec4899',
  ORANGE: '#f97316',
};

// Export formats
export const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  TXT: 'txt',
  PDF: 'pdf',
};

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  TOGGLE_SIDEBAR: 'Ctrl+B',
  TOGGLE_THEME: 'Ctrl+Shift+T',
  FOCUS_SEARCH: 'Ctrl+K',
  SEND_MESSAGE: 'Ctrl+Enter',
  UPLOAD_FILE: 'Ctrl+U',
  EXPORT_DATA: 'Ctrl+E',
};

// API endpoints
export const ENDPOINTS = {
  GENERATE_CONTENT: '/generateContent',
  STREAM_GENERATE_CONTENT: '/streamGenerateContent',
  COUNT_TOKENS: '/countTokens',
  EMBED_CONTENT: '/embedContent',
};

// Rate limiting configuration
export const RATE_LIMITS = {
  REQUESTS_PER_MINUTE: 60,
  REQUESTS_PER_HOUR: 1000,
  REQUESTS_PER_DAY: 10000,
  BURST_LIMIT: 10,
};

// Validation rules
export const VALIDATION_RULES = {
  API_KEY_MIN_LENGTH: 10,
  MESSAGE_MAX_LENGTH: 10000,
  FILE_NAME_MAX_LENGTH: 255,
  CONVERSATION_TITLE_MAX_LENGTH: 100,
  SETTINGS_DESCRIPTION_MAX_LENGTH: 500,
};

/**
 * Comprehensive E-commerce Business Logic Configuration
 * 
 * Localization & Business Rules:
 * - Multi-currency support with regional defaults (Turkish Lira for Turkey)
 * - Configurable tax rates supporting international commerce regulations
 * - Free shipping thresholds to encourage larger order values
 * - Maximum cart limits prevent performance issues and abuse
 * 
 * User Experience Optimizations:
 * - Pagination settings optimized for mobile and desktop viewing
 * - Shopping cart limits balance functionality with performance
 * - Currency display formats adapted to regional conventions
 * - Store branding configurable through environment variables
 * 
 * Business Intelligence Integration:
 * - Tax calculation compliance with Turkish VAT regulations (18% KDV)
 * - Shipping threshold optimization based on average order value analytics
 * - Cart abandonment prevention through strategic UX limits
 * - Revenue optimization through dynamic pricing and promotion support
 * 
 * Scalability Considerations:
 * - Environment-based configuration supports multi-tenant deployments
 * - Configurable limits prevent resource exhaustion under high load
 * - Regional adaptation through environment variable overrides
 */
export const ECOMMERCE_CONFIG = {
  STORE_NAME: import.meta.env.REACT_APP_STORE_NAME || 'AI Powered Shop',
  CURRENCY: import.meta.env.REACT_APP_CURRENCY || 'TRY',
  CURRENCY_SYMBOL: import.meta.env.REACT_APP_CURRENCY_SYMBOL || '₺',
  ITEMS_PER_PAGE: 12,
  MAX_CART_ITEMS: 50,
  FREE_SHIPPING_THRESHOLD: 500,
  TAX_RATE: 0.18, // 18% KDV for Turkey
};

// Product Categories
export const PRODUCT_CATEGORIES = {
  ELECTRONICS: 'electronics',
  CLOTHING: 'clothing',
  HOME_GARDEN: 'home_garden',
  BOOKS: 'books',
  SPORTS: 'sports',
  BEAUTY: 'beauty',
  TOYS: 'toys',
  AUTOMOTIVE: 'automotive',
};

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Cart Actions
export const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  APPLY_COUPON: 'APPLY_COUPON',
  REMOVE_COUPON: 'REMOVE_COUPON',
};

// AI Service Types
export const AI_SERVICES = {
  PRODUCT_DESCRIPTION: 'product_description',
  VISUAL_SEARCH: 'visual_search',
  RECOMMENDATIONS: 'recommendations',
  STYLE_ANALYSIS: 'style_analysis',
};

// Payment Methods
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PAYPAL: 'paypal',
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
  CASH_ON_DELIVERY: 'cash_on_delivery',
};

// Shipping Methods
export const SHIPPING_METHODS = {
  STANDARD: { id: 'standard', name: 'Standart Kargo', price: 15, days: '3-5' },
  EXPRESS: { id: 'express', name: 'Hızlı Kargo', price: 25, days: '1-2' },
  OVERNIGHT: { id: 'overnight', name: 'Aynı Gün Teslimat', price: 50, days: '0-1' },
  FREE: { id: 'free', name: 'Ücretsiz Kargo', price: 0, days: '5-7' },
};

export default {
  API_CONFIG,
  APP_CONFIG,
  SUPPORTED_FILE_TYPES,
  FILE_SIZE_LIMITS,
  ROUTES,
  THEME_COLORS,
  ANIMATION_DURATION,
  BREAKPOINTS,
  MESSAGE_TYPES,
  NOTIFICATION_TYPES,
  STORAGE_KEYS,
  FEATURES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DEFAULT_SETTINGS,
  LANGUAGES,
  AVAILABLE_MODELS,
  CHART_COLORS,
  EXPORT_FORMATS,
  KEYBOARD_SHORTCUTS,
  ENDPOINTS,
  RATE_LIMITS,
  VALIDATION_RULES,
  ECOMMERCE_CONFIG,
  PRODUCT_CATEGORIES,
  ORDER_STATUS,
  CART_ACTIONS,
  AI_SERVICES,
  PAYMENT_METHODS,
  SHIPPING_METHODS,
};
