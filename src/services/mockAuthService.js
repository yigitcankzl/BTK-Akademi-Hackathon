// Mock Authentication service for development
class MockAuthService {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    this.users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    
    // Check for existing session
    const storedUser = localStorage.getItem('mockCurrentUser');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
      setTimeout(() => {
        this.notifyListeners(this.currentUser);
      }, 100);
    } else {
      setTimeout(() => {
        this.notifyListeners(null);
      }, 100);
    }
  }

  // Register new user
  async register(email, password, userData = {}) {
    try {
      // Check if user already exists
      const existingUser = this.users.find(u => u.email === email);
      if (existingUser) {
        throw new Error('Bu e-posta adresi zaten kullanımda');
      }

      // Create new user
      const newUser = {
        uid: Date.now().toString(),
        email,
        displayName: userData.displayName || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        emailVerified: false,
        photoURL: '',
        createdAt: new Date().toISOString(),
        preferences: {
          favoriteCategories: [],
          preferredBrands: [],
          priceRange: [0, 50000],
          notifications: {
            orderUpdates: true,
            promotions: true,
            recommendations: true
          }
        },
        addresses: [],
        password // In real app, this would be hashed
      };

      this.users.push(newUser);
      localStorage.setItem('mockUsers', JSON.stringify(this.users));

      // Auto login after registration
      const { password: _, ...userWithoutPassword } = newUser;
      this.currentUser = userWithoutPassword;
      localStorage.setItem('mockCurrentUser', JSON.stringify(this.currentUser));
      this.notifyListeners(this.currentUser);

      return {
        success: true,
        user: this.currentUser
      };
    } catch (error) {
      throw error;
    }
  }

  // Login with email and password
  async login(email, password) {
    try {
      const user = this.users.find(u => u.email === email && u.password === password);
      if (!user) {
        throw new Error('E-posta veya şifre hatalı');
      }

      const { password: _, ...userWithoutPassword } = user;
      this.currentUser = userWithoutPassword;
      localStorage.setItem('mockCurrentUser', JSON.stringify(this.currentUser));
      this.notifyListeners(this.currentUser);

      return {
        success: true,
        user: this.currentUser
      };
    } catch (error) {
      throw error;
    }
  }

  // Login with Google (mock)
  async loginWithGoogle() {
    try {
      const mockGoogleUser = {
        uid: 'google_' + Date.now().toString(),
        email: 'google.user@gmail.com',
        displayName: 'Google User',
        firstName: 'Google',
        lastName: 'User',
        emailVerified: true,
        photoURL: 'https://ui-avatars.com/api/?name=Google+User&background=random',
        provider: 'google',
        createdAt: new Date().toISOString(),
        preferences: {
          favoriteCategories: [],
          preferredBrands: [],
          priceRange: [0, 50000],
          notifications: {
            orderUpdates: true,
            promotions: true,
            recommendations: true
          }
        },
        addresses: []
      };

      this.currentUser = mockGoogleUser;
      localStorage.setItem('mockCurrentUser', JSON.stringify(this.currentUser));
      this.notifyListeners(this.currentUser);

      return {
        success: true,
        user: this.currentUser
      };
    } catch (error) {
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      this.currentUser = null;
      localStorage.removeItem('mockCurrentUser');
      this.notifyListeners(null);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      const user = this.users.find(u => u.email === email);
      if (!user) {
        throw new Error('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı');
      }

      return { 
        success: true, 
        message: 'Şifre sıfırlama e-postası gönderildi (Mock)' 
      };
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(updates) {
    try {
      if (!this.currentUser) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      this.currentUser = { ...this.currentUser, ...updates };
      localStorage.setItem('mockCurrentUser', JSON.stringify(this.currentUser));
      
      // Update in users array
      const userIndex = this.users.findIndex(u => u.uid === this.currentUser.uid);
      if (userIndex !== -1) {
        this.users[userIndex] = { ...this.users[userIndex], ...updates };
        localStorage.setItem('mockUsers', JSON.stringify(this.users));
      }

      this.notifyListeners(this.currentUser);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get current user data
  async getCurrentUserData() {
    return this.currentUser;
  }

  // Authentication state listener
  onAuthStateChange(callback) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners
  notifyListeners(user) {
    this.listeners.forEach(listener => listener(user));
  }

  // Send email verification
  async sendVerificationEmail() {
    return { 
      success: true, 
      message: 'Doğrulama e-postası gönderildi (Mock)' 
    };
  }

  // Change password
  async changePassword(newPassword) {
    try {
      if (!this.currentUser) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      // Update password in users array
      const userIndex = this.users.findIndex(u => u.uid === this.currentUser.uid);
      if (userIndex !== -1) {
        this.users[userIndex].password = newPassword;
        localStorage.setItem('mockUsers', JSON.stringify(this.users));
      }

      return { 
        success: true, 
        message: 'Şifre başarıyla güncellendi' 
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete account
  async deleteAccount() {
    try {
      if (!this.currentUser) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      // Remove from users array
      this.users = this.users.filter(u => u.uid !== this.currentUser.uid);
      localStorage.setItem('mockUsers', JSON.stringify(this.users));
      
      // Logout
      await this.logout();
      
      return { 
        success: true, 
        message: 'Hesap başarıyla silindi' 
      };
    } catch (error) {
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Get user token (mock)
  async getUserToken() {
    if (!this.currentUser) return null;
    return 'mock_token_' + this.currentUser.uid;
  }

  // Test connection
  async testConnection() {
    return {
      success: true,
      message: 'Mock authentication service ready'
    };
  }
}

// Create singleton instance
const mockAuthService = new MockAuthService();

export default mockAuthService;