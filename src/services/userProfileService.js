import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

class UserProfileService {
  constructor() {
    this.collectionName = 'userProfiles';
  }

  // Kullanıcı profilini kaydet
  async saveUserProfile(userId, profileData) {
    try {
      console.log('💾 Saving user profile to Firebase:', userId);
      
      const profileDoc = {
        userId,
        responses: profileData.responses,
        analysis: profileData.analysis,
        version: '1.0',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };

      const docRef = doc(db, this.collectionName, userId);
      await setDoc(docRef, profileDoc);
      
      console.log('✅ User profile saved successfully');
      return { success: true, profileId: userId };
      
    } catch (error) {
      console.error('❌ Error saving user profile:', error);
      throw new Error(`Profil kaydedilirken hata oluştu: ${error.message}`);
    }
  }

  // Kullanıcı profilini getir
  async getUserProfile(userId) {
    try {
      console.log('📖 Getting user profile from Firebase:', userId);
      
      const docRef = doc(db, this.collectionName, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('✅ User profile found');
        return {
          success: true,
          profile: {
            userId: data.userId,
            responses: data.responses,
            analysis: data.analysis,
            version: data.version,
            createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
            updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
            isActive: data.isActive
          }
        };
      } else {
        console.log('ℹ️ No user profile found');
        return { success: false, message: 'Profil bulunamadı' };
      }
      
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      throw new Error(`Profil getirilirken hata oluştu: ${error.message}`);
    }
  }

  // Kullanıcı profilini güncelle
  async updateUserProfile(userId, updates) {
    try {
      console.log('🔄 Updating user profile:', userId);
      
      const docRef = doc(db, this.collectionName, userId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        version: '1.0'
      };
      
      await updateDoc(docRef, updateData);
      
      console.log('✅ User profile updated successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw new Error(`Profil güncellenirken hata oluştu: ${error.message}`);
    }
  }

  // Profil var mı kontrol et
  async hasUserProfile(userId) {
    try {
      const docRef = doc(db, this.collectionName, userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('❌ Error checking user profile:', error);
      return false;
    }
  }

  // LocalStorage'dan Firebase'e migrate et
  async migrateFromLocalStorage(userId) {
    try {
      const localProfile = localStorage.getItem('userProfile');
      if (!localProfile) return null;
      
      const profile = JSON.parse(localProfile);
      
      // Eğer kullanıcı ID'si eşleşiyorsa veya anonymous ise migrate et
      if (profile.userId === userId || profile.userId === 'anonymous') {
        await this.saveUserProfile(userId, {
          responses: profile.responses,
          analysis: profile.analysis
        });
        
        // LocalStorage'ı temizle
        localStorage.removeItem('userProfile');
        
        console.log('✅ Profile migrated from localStorage to Firebase');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error migrating profile:', error);
      return false;
    }
  }

  // Profil istatistikleri
  async getProfileStats(userId) {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile.success) return null;
      
      const responses = profile.profile.responses;
      const analysis = profile.profile.analysis;
      
      return {
        completionDate: profile.profile.createdAt,
        lastUpdate: profile.profile.updatedAt,
        questionCount: Object.keys(responses).length,
        confidenceScore: analysis?.confidence || 0,
        profileScore: analysis?.profileScore || 0,
        version: profile.profile.version
      };
    } catch (error) {
      console.error('❌ Error getting profile stats:', error);
      return null;
    }
  }

  // Profili sil (soft delete)
  async deleteUserProfile(userId) {
    try {
      await this.updateUserProfile(userId, { 
        isActive: false,
        deletedAt: serverTimestamp()
      });
      
      console.log('✅ User profile soft deleted');
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting user profile:', error);
      throw error;
    }
  }

  // Profil backup oluştur
  createBackup(profile) {
    const backup = {
      backup_date: new Date().toISOString(),
      profile_data: profile,
      version: '1.0'
    };
    
    const backupJson = JSON.stringify(backup, null, 2);
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_profile_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Singleton instance
let userProfileServiceInstance = null;

export function getUserProfileService() {
  if (!userProfileServiceInstance) {
    userProfileServiceInstance = new UserProfileService();
  }
  return userProfileServiceInstance;
}

export default UserProfileService;