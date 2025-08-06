// Authentication service with Firebase
import firebaseAuthService from './firebaseAuthService';
import mockAuthService from './mockAuthService';

class AuthService {
  constructor() {
    // Check if Firebase is properly configured
    this.useFirebase = this.checkFirebaseConfig();
    
    if (this.useFirebase) {
      this.authProvider = firebaseAuthService;
      console.info('Using Firebase authentication service');
    } else {
      this.authProvider = mockAuthService;
      console.info('Using mock authentication service for development');
    }
  }

  // Check if Firebase is properly configured
  checkFirebaseConfig() {
    try {
      // Check if we're in development and Firebase config exists
      const hasValidConfig = import.meta.env.VITE_FIREBASE_PROJECT_ID || 
                           (typeof window !== 'undefined' && window.location.hostname === 'localhost');
      
      // Use Firebase auth if explicitly enabled or in production
      if (import.meta.env.DEV && !import.meta.env.VITE_USE_FIREBASE_AUTH) {
        console.warn('Development mode detected, using mock authentication');
        return false;
      }
      
      return hasValidConfig;
    } catch (error) {
      console.warn('Firebase configuration check failed:', error);
      return false;
    }
  }

  // Register new user
  async register(email, password, userData = {}) {
    return await this.authProvider.register(email, password, userData);
  }

  // Login with email and password
  async login(email, password) {
    return await this.authProvider.login(email, password);
  }

  // Login with Google
  async loginWithGoogle() {
    return await this.authProvider.loginWithGoogle();
  }

  // Logout
  async logout() {
    return await this.authProvider.logout();
  }

  // Reset password
  async resetPassword(email) {
    return await this.authProvider.resetPassword(email);
  }

  // Update user profile
  async updateUserProfile(updates) {
    return await this.authProvider.updateUserProfile(updates);
  }

  // Change password
  async changePassword(newPassword) {
    return await this.authProvider.changePassword(newPassword);
  }

  // Delete user account
  async deleteAccount() {
    return await this.authProvider.deleteAccount();
  }

  // Get current user
  getCurrentUser() {
    return this.authProvider.getCurrentUser();
  }

  // Get current user with data
  async getCurrentUserData() {
    return await this.authProvider.getCurrentUserData();
  }

  // Authentication state listener
  onAuthStateChange(callback) {
    return this.authProvider.onAuthStateChange(callback);
  }

  // Send email verification
  async sendVerificationEmail() {
    return await this.authProvider.sendVerificationEmail();
  }

  // Handle authentication errors
  handleAuthError(error) {
    return this.authProvider.handleAuthError ? this.authProvider.handleAuthError(error) : error;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.authProvider.isAuthenticated();
  }

  // Get user token
  async getUserToken() {
    return await this.authProvider.getUserToken();
  }

  // Test connection
  async testConnection() {
    return await this.authProvider.testConnection();
  }

  // Enable Firebase authentication (for production use)
  enableFirebaseAuth() {
    try {
      this.authProvider = firebaseAuthService;
      this.useFirebase = true;
      console.info('Switched to Firebase authentication service');
      return { success: true, message: 'Firebase authentication enabled' };
    } catch (error) {
      console.error('Failed to enable Firebase auth:', error);
      return { success: false, message: 'Failed to enable Firebase authentication' };
    }
  }

  // Check current authentication provider
  getCurrentProvider() {
    return this.useFirebase ? 'firebase' : 'mock';
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;