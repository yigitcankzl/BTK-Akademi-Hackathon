import { getGeminiService } from './geminiAPI';

class UserService {
  constructor() {
    this.currentUser = this.loadUser();
    this.defaultPreferences = {
      theme: 'auto', // auto, light, dark
      language: 'tr',
      currency: 'TRY',
      notifications: {
        orderUpdates: true,
        promotions: true,
        newsletter: true,
        aiRecommendations: true
      },
      shopping: {
        autoSaveToWishlist: false,
        showPriceAlerts: true,
        preferredCategories: [],
        budgetLimit: null,
        autoApplyCoupons: true
      },
      ai: {
        personalizedRecommendations: true,
        chatMemory: true,
        styleProfile: true,
        autoTranslate: false
      },
      privacy: {
        shareActivityData: false,
        allowTargetedAds: false,
        cookiePreferences: 'essential'
      }
    };
  }

  // Load user from localStorage
  loadUser() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Return default guest user
    return {
      id: 'guest',
      isGuest: true,
      profile: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        birthDate: '',
        gender: '',
        avatar: null
      },
      addresses: [],
      preferences: { ...this.defaultPreferences },
      wishlist: [],
      recentlyViewed: [],
      styleProfile: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
  }

  // Save user to localStorage
  saveUser() {
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Update user profile
  updateProfile(profileData) {
    this.currentUser.profile = {
      ...this.currentUser.profile,
      ...profileData
    };
    this.currentUser.updatedAt = new Date().toISOString();
    this.saveUser();
    return this.currentUser;
  }

  // Update user preferences
  updatePreferences(preferences) {
    this.currentUser.preferences = {
      ...this.currentUser.preferences,
      ...preferences
    };
    this.currentUser.updatedAt = new Date().toISOString();
    this.saveUser();
    return this.currentUser.preferences;
  }

  // Add address
  addAddress(address) {
    const newAddress = {
      id: Date.now().toString(),
      ...address,
      isDefault: this.currentUser.addresses.length === 0,
      createdAt: new Date().toISOString()
    };
    
    this.currentUser.addresses.push(newAddress);
    this.saveUser();
    return newAddress;
  }

  // Update address
  updateAddress(addressId, addressData) {
    const index = this.currentUser.addresses.findIndex(addr => addr.id === addressId);
    if (index !== -1) {
      this.currentUser.addresses[index] = {
        ...this.currentUser.addresses[index],
        ...addressData,
        updatedAt: new Date().toISOString()
      };
      this.saveUser();
      return this.currentUser.addresses[index];
    }
    return null;
  }

  // Delete address
  deleteAddress(addressId) {
    const index = this.currentUser.addresses.findIndex(addr => addr.id === addressId);
    if (index !== -1) {
      const deletedAddress = this.currentUser.addresses.splice(index, 1)[0];
      
      // If deleted address was default, make first remaining address default
      if (deletedAddress.isDefault && this.currentUser.addresses.length > 0) {
        this.currentUser.addresses[0].isDefault = true;
      }
      
      this.saveUser();
      return true;
    }
    return false;
  }

  // Set default address
  setDefaultAddress(addressId) {
    this.currentUser.addresses.forEach(addr => {
      addr.isDefault = addr.id === addressId;
    });
    this.saveUser();
  }

  // Get addresses
  getAddresses() {
    return this.currentUser.addresses;
  }

  // Get default address
  getDefaultAddress() {
    return this.currentUser.addresses.find(addr => addr.isDefault) || this.currentUser.addresses[0];
  }

  // Wishlist management
  addToWishlist(productId) {
    if (!this.currentUser.wishlist.includes(productId)) {
      this.currentUser.wishlist.push(productId);
      this.saveUser();
    }
  }

  removeFromWishlist(productId) {
    const index = this.currentUser.wishlist.indexOf(productId);
    if (index !== -1) {
      this.currentUser.wishlist.splice(index, 1);
      this.saveUser();
    }
  }

  isInWishlist(productId) {
    return this.currentUser.wishlist.includes(productId);
  }

  getWishlist() {
    return this.currentUser.wishlist;
  }

  // Recently viewed products
  addToRecentlyViewed(productId) {
    const recent = this.currentUser.recentlyViewed.filter(id => id !== productId);
    recent.unshift(productId);
    this.currentUser.recentlyViewed = recent.slice(0, 20); // Keep last 20
    this.saveUser();
  }

  getRecentlyViewed() {
    return this.currentUser.recentlyViewed;
  }

  // AI Style Profile
  async generateStyleProfile(preferences, uploadedImages = []) {
    try {
      const prompt = `
        Kullanıcı için kişiselleştirilmiş bir stil profili oluştur:
        
        Kullanıcı Tercihleri:
        - Kategoriler: ${preferences.categories?.join(', ') || 'Belirtilmemiş'}
        - Renk Tercihleri: ${preferences.colors?.join(', ') || 'Belirtilmemiş'}
        - Stil: ${preferences.style || 'Belirtilmemiş'}
        - Bütçe: ${preferences.budget || 'Belirtilmemiş'}
        - Yaş Grubu: ${preferences.ageGroup || 'Belirtilmemiş'}
        
        Kısa ve öz bir stil profili çıkar (maksimum 3-4 cümle).
        Hangi ürün türlerinin önerilmesi gerektiğini belirt.
      `;

      const geminiService = getGeminiService();
      const response = await geminiService.generateContent(prompt);
      const analysis = response.text;
      
      const styleProfile = {
        id: Date.now().toString(),
        analysis,
        preferences,
        createdAt: new Date().toISOString(),
        confidence: Math.random() * 30 + 70 // 70-100% confidence
      };

      this.currentUser.styleProfile = styleProfile;
      this.saveUser();
      
      return styleProfile;
    } catch (error) {
      console.error('Error generating style profile:', error);
      throw error;
    }
  }

  // Get style recommendations
  async getStyleRecommendations(products) {
    if (!this.currentUser.styleProfile) {
      return products.slice(0, 10); // Return random products if no profile
    }

    try {
      const prompt = `
        Kullanıcının stil profiline göre ürünleri değerlendir:
        
        Stil Profili: ${this.currentUser.styleProfile.analysis}
        
        Ürünler: ${products.slice(0, 20).map(p => `${p.name} - ${p.category} - ${p.price}₺`).join(', ')}
        
        En uygun 10 ürünün ID'lerini JSON array olarak döndür: ["id1", "id2", ...]
      `;

      const geminiService = getGeminiService();
      const response = await geminiService.generateContent(prompt);
      
      // Try to parse JSON response
      try {
        const recommendedIds = JSON.parse(response.text);
        const recommended = products.filter(p => recommendedIds.includes(p.id.toString()));
        return recommended.length > 0 ? recommended : products.slice(0, 10);
      } catch (parseError) {
        console.error('Failed to parse recommendations:', parseError);
        return products.slice(0, 10);
      }
    } catch (error) {
      console.error('Error getting style recommendations:', error);
      return products.slice(0, 10);
    }
  }

  // Login user
  login(email, password) {
    // Mock login - in real app, this would call an API
    const mockUser = {
      id: Date.now().toString(),
      isGuest: false,
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        email: email,
        phone: '+90 532 123 45 67',
        birthDate: '1990-01-01',
        gender: 'male',
        avatar: null
      },
      addresses: [
        {
          id: '1',
          title: 'Ev',
          fullName: 'John Doe',
          phone: '+90 532 123 45 67',
          address: 'Atatürk Caddesi No:123',
          city: 'İstanbul',
          district: 'Beşiktaş',
          postalCode: '34357',
          isDefault: true,
          createdAt: new Date().toISOString()
        }
      ],
      preferences: { ...this.defaultPreferences },
      wishlist: [],
      recentlyViewed: [],
      styleProfile: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    this.currentUser = mockUser;
    this.saveUser();
    return mockUser;
  }

  // Register user
  register(userData) {
    // Mock registration
    const newUser = {
      id: Date.now().toString(),
      isGuest: false,
      profile: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone || '',
        birthDate: userData.birthDate || '',
        gender: userData.gender || '',
        avatar: null
      },
      addresses: [],
      preferences: { ...this.defaultPreferences },
      wishlist: [],
      recentlyViewed: [],
      styleProfile: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    this.currentUser = newUser;
    this.saveUser();
    return newUser;
  }

  // Logout user
  logout() {
    this.currentUser = {
      id: 'guest',
      isGuest: true,
      profile: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        birthDate: '',
        gender: '',
        avatar: null
      },
      addresses: [],
      preferences: { ...this.defaultPreferences },
      wishlist: [],
      recentlyViewed: [],
      styleProfile: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    
    localStorage.removeItem('currentUser');
  }

  // Upload avatar
  uploadAvatar(file) {
    // Mock upload - in real app, this would upload to a server
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.currentUser.profile.avatar = e.target.result;
        this.saveUser();
        resolve(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  // Get user statistics
  getUserStats() {
    return {
      totalOrders: 0, // Would be calculated from orders
      totalSpent: 0, // Would be calculated from orders
      wishlistItems: this.currentUser.wishlist.length,
      addresses: this.currentUser.addresses.length,
      memberSince: this.currentUser.createdAt,
      lastLogin: this.currentUser.lastLoginAt
    };
  }

  // Export user data (GDPR compliance)
  exportUserData() {
    return {
      profile: this.currentUser.profile,
      addresses: this.currentUser.addresses,
      preferences: this.currentUser.preferences,
      wishlist: this.currentUser.wishlist,
      recentlyViewed: this.currentUser.recentlyViewed,
      styleProfile: this.currentUser.styleProfile,
      exportedAt: new Date().toISOString()
    };
  }

  // Delete user account
  deleteAccount() {
    localStorage.removeItem('currentUser');
    this.logout();
  }
}

export default new UserService();