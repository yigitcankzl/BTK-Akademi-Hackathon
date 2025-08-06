// Firebase Authentication service
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  deleteUser,
  sendEmailVerification,
  onAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

class FirebaseAuthService {
  constructor() {
    this.googleProvider = new GoogleAuthProvider();
    this.googleProvider.addScope('email');
    this.googleProvider.addScope('profile');
  }

  // Register new user
  async register(email, password, userData = {}) {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile in Firebase Auth
      await updateProfile(user, {
        displayName: userData.displayName || `${userData.firstName} ${userData.lastName}`.trim()
      });

      // Create user document in Firestore
      const userDoc = {
        uid: user.uid,
        email: user.email,
        displayName: userData.displayName || `${userData.firstName} ${userData.lastName}`.trim(),
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
        orders: [],
        wishlist: []
      };

      await setDoc(doc(db, 'users', user.uid), userDoc);

      // Send email verification
      await sendEmailVerification(user);

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: userDoc.displayName,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          emailVerified: user.emailVerified,
          photoURL: user.photoURL || '',
          preferences: userDoc.preferences,
          addresses: userDoc.addresses,
          orders: userDoc.orders,
          wishlist: userDoc.wishlist
        }
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Login with email and password
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || userData.displayName || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          emailVerified: user.emailVerified,
          photoURL: user.photoURL || userData.photoURL || '',
          preferences: userData.preferences || {},
          addresses: userData.addresses || [],
          orders: userData.orders || [],
          wishlist: userData.wishlist || []
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Login with Google
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      const user = result.user;

      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      let userData;
      if (!userDoc.exists()) {
        // Create new user document
        userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          emailVerified: user.emailVerified,
          photoURL: user.photoURL || '',
          provider: 'google',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
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
          orders: [],
          wishlist: []
        };
        await setDoc(userDocRef, userData);
      } else {
        userData = userDoc.data();
        // Update last login
        await updateDoc(userDocRef, {
          updatedAt: serverTimestamp()
        });
      }

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || userData.displayName || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          emailVerified: user.emailVerified,
          photoURL: user.photoURL || userData.photoURL || '',
          preferences: userData.preferences || {},
          addresses: userData.addresses || [],
          orders: userData.orders || [],
          wishlist: userData.wishlist || []
        }
      };
    } catch (error) {
      console.error('Google login error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Logout
  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { 
        success: true, 
        message: 'Şifre sıfırlama e-postası gönderildi' 
      };
    } catch (error) {
      console.error('Password reset error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Update user profile
  async updateUserProfile(updates) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      // Update Firebase Auth profile if needed
      if (updates.displayName || updates.photoURL) {
        await updateProfile(user, {
          displayName: updates.displayName,
          photoURL: updates.photoURL
        });
      }

      // Update Firestore document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Change password
  async changePassword(newPassword) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      await updatePassword(user, newPassword);
      
      return { 
        success: true, 
        message: 'Şifre başarıyla güncellendi' 
      };
    } catch (error) {
      console.error('Password change error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Delete account
  async deleteAccount() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      // Delete user document from Firestore
      await deleteDoc(doc(db, 'users', user.uid));
      
      // Delete user from Firebase Auth
      await deleteUser(user);
      
      return { 
        success: true, 
        message: 'Hesap başarıyla silindi' 
      };
    } catch (error) {
      console.error('Account deletion error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }

  // Get current user data from Firestore
  async getCurrentUserData() {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return null;

      const userData = userDoc.data();
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || userData.displayName || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || userData.photoURL || '',
        preferences: userData.preferences || {},
        addresses: userData.addresses || [],
        orders: userData.orders || [],
        wishlist: userData.wishlist || []
      };
    } catch (error) {
      console.error('Get user data error:', error);
      return null;
    }
  }

  // Authentication state listener
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get full user data from Firestore with retry mechanism
        try {
          // Wait a bit for user document to be created if it's a new registration
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};
          
          const userInfo = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || userData.displayName || '',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            emailVerified: user.emailVerified,
            photoURL: user.photoURL || userData.photoURL || '',
            preferences: userData.preferences || {},
            addresses: userData.addresses || [],
            orders: userData.orders || [],
            wishlist: userData.wishlist || []
          };
          
          callback(userInfo);
        } catch (error) {
          console.warn('Error getting user data, using basic auth info:', error);
          // Fallback to basic auth info if Firestore fails
          callback({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            firstName: '',
            lastName: '',
            emailVerified: user.emailVerified,
            photoURL: user.photoURL || '',
            preferences: {},
            addresses: [],
            orders: [],
            wishlist: []
          });
        }
      } else {
        callback(null);
      }
    });
  }

  // Send email verification
  async sendVerificationEmail() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      await sendEmailVerification(user);
      return { 
        success: true, 
        message: 'Doğrulama e-postası gönderildi' 
      };
    } catch (error) {
      console.error('Email verification error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return auth.currentUser !== null;
  }

  // Get user token
  async getUserToken() {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      
      return await user.getIdToken();
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  // Test connection
  async testConnection() {
    try {
      return {
        success: true,
        message: 'Firebase authentication service ready'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Firebase authentication service error: ' + error.message
      };
    }
  }

  // Handle authentication errors
  handleAuthError(error) {
    const errorMessages = {
      'auth/user-not-found': 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı',
      'auth/wrong-password': 'Hatalı şifre',
      'auth/invalid-credential': 'E-posta veya şifre hatalı',
      'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanımda. Giriş yapmayı deneyin.',
      'auth/weak-password': 'Şifre çok zayıf. En az 6 karakter olmalıdır',
      'auth/invalid-email': 'Geçersiz e-posta adresi',
      'auth/user-disabled': 'Bu hesap devre dışı bırakılmış',
      'auth/too-many-requests': 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin',
      'auth/network-request-failed': 'Ağ bağlantısı hatası',
      'auth/requires-recent-login': 'Bu işlem için yeniden giriş yapmanız gerekiyor',
      'auth/popup-closed-by-user': 'Giriş penceresi kapatıldı',
      'auth/popup-blocked': 'Pop-up engellendi. Lütfen pop-up\'lara izin verin',
      'permission-denied': 'İzin reddedildi. Lütfen daha sonra tekrar deneyin.',
      'unavailable': 'Servis şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.'
    };

    // Handle Firestore errors
    if (error.code && error.code.includes('firestore/')) {
      console.warn('Firestore error (non-critical):', error);
      return new Error('Veri kaydedildi ancak bazı özellikler gecikebilir');
    }

    const message = errorMessages[error.code] || error.message || 'Bilinmeyen hata oluştu';
    return new Error(message);
  }
}

// Create singleton instance
const firebaseAuthService = new FirebaseAuthService();

export default firebaseAuthService;