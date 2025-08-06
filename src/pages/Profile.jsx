import React, { useState, useEffect } from 'react';
import { 
  User, Camera, MapPin, Heart, Clock, Settings, Shield, Download,
  Edit, Plus, Trash2, Check, X, Mail, Phone, Calendar, Globe,
  Bell, Palette, Zap, Sparkles, Star, Package, CreditCard, Save, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import userService from '../services/userService';
import { getUserProfileService } from '../services/userProfileService';
import { useNotification } from '../components/common/NotificationContainer';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  
  const notification = useNotification();

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: ''
  });

  const [addressForm, setAddressForm] = useState({
    title: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    postalCode: ''
  });

  const [preferences, setPreferences] = useState({});
  const [aiProfile, setAiProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    loadUserData();
    checkAIProfile();
  }, []);

  const checkAIProfile = async () => {
    setProfileLoading(true);
    try {
      const currentUser = userService.getCurrentUser();
      const userId = currentUser?.profile?.id || currentUser?.id;
      
      if (userId) {
        const userProfileService = getUserProfileService();
        const result = await userProfileService.getUserProfile(userId);
        
        if (result.success) {
          setAiProfile(result.profile);
        }
      }
    } catch (error) {
      console.error('Error checking AI profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadUserData = () => {
    setLoading(true);
    try {
      const currentUser = userService.getCurrentUser();
      setUser(currentUser);
      setProfileForm(currentUser.profile);
      setPreferences(currentUser.preferences);
    } catch (error) {
      console.error('Error loading user data:', error);
      notification.error('Hata', 'Kullanıcı bilgileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updatedUser = userService.updateProfile(profileForm);
      setUser(updatedUser);
      setEditingProfile(false);
      notification.success('Başarılı', 'Profil bilgileri güncellendi');
    } catch (error) {
      console.error('Error saving profile:', error);
      notification.error('Hata', 'Profil güncellenirken hata oluştu');
    }
  };

  const handleAddAddress = async () => {
    try {
      await userService.addAddress(addressForm);
      const updatedUser = userService.getCurrentUser();
      setUser(updatedUser);
      setAddressForm({
        title: '',
        fullName: '',
        phone: '',
        address: '',
        city: '',
        district: '',
        postalCode: ''
      });
      setShowAddAddress(false);
      notification.success('Başarılı', 'Adres eklendi');
    } catch (error) {
      console.error('Error adding address:', error);
      notification.error('Hata', 'Adres eklenirken hata oluştu');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await userService.deleteAddress(addressId);
      const updatedUser = userService.getCurrentUser();
      setUser(updatedUser);
      notification.success('Başarılı', 'Adres silindi');
    } catch (error) {
      console.error('Error deleting address:', error);
      notification.error('Hata', 'Adres silinirken hata oluştu');
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        await userService.uploadAvatar(file);
        const updatedUser = userService.getCurrentUser();
        setUser(updatedUser);
        notification.success('Başarılı', 'Profil fotoğrafı güncellendi');
      } catch (error) {
        console.error('Error uploading avatar:', error);
        notification.error('Hata', 'Fotoğraf yüklenirken hata oluştu');
      }
    }
  };

  const handlePreferenceChange = (category, key, value) => {
    const newPreferences = {
      ...preferences,
      [category]: {
        ...preferences[category],
        [key]: value
      }
    };
    setPreferences(newPreferences);
    userService.updatePreferences(newPreferences);
    notification.success('Başarılı', 'Tercihler güncellendi');
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'addresses', label: 'Adresler', icon: MapPin },
    { id: 'preferences', label: 'Tercihler', icon: Settings },
    { id: 'privacy', label: 'Gizlilik', icon: Shield }
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Profilim
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          ShopSmart hesabınızı yönetin ve akıllı alışveriş tercihlerinizi güncelleyin
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <motion.div 
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg sticky top-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {/* User Avatar */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  {user?.profile.avatar ? (
                    <img
                      src={user.profile.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
                  <Camera className="w-3 h-3 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mt-3">
                {user?.profile.firstName || 'Misafir'} {user?.profile.lastName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user?.profile.email || 'Email belirtilmemiş'}
              </p>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* AI Profile Questionnaire Link */}
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-3 mb-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900 dark:text-white">AI Profil Anketi</h4>
                {aiProfile && (
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded-full">
                    Tamamlandı
                  </span>
                )}
              </div>
              
              {profileLoading ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Profil durumu kontrol ediliyor...
                </p>
              ) : aiProfile ? (
                <div className="space-y-2 mb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AI profiliniz mevcut • %{aiProfile.analysis?.profileScore || 'N/A'} uyumluluk
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Güncelleme: {new Date(aiProfile.updatedAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Size özel AI önerileri için kişiliğinizi tanıtın
                </p>
              )}
              
              <Link
                to="/profile/questionnaire"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm"
              >
                <Brain className="w-4 h-4" />
                <span>{aiProfile ? 'Profili Düzenle' : 'Anketi Başlat'}</span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Profil Bilgileri
                  </h2>
                  <button
                    onClick={() => setEditingProfile(!editingProfile)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>{editingProfile ? 'İptal' : 'Düzenle'}</span>
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ad
                    </label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      disabled={!editingProfile}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Soyad
                    </label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      disabled={!editingProfile}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      E-posta
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      disabled={!editingProfile}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      disabled={!editingProfile}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Doğum Tarihi
                    </label>
                    <input
                      type="date"
                      value={profileForm.birthDate}
                      onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                      disabled={!editingProfile}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cinsiyet
                    </label>
                    <select
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                      disabled={!editingProfile}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
                    >
                      <option value="">Seçiniz</option>
                      <option value="male">Erkek</option>
                      <option value="female">Kadın</option>
                      <option value="other">Diğer</option>
                    </select>
                  </div>
                </div>

                {editingProfile && (
                  <div className="mt-6 flex justify-end space-x-4">
                    <button
                      onClick={() => setEditingProfile(false)}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Kaydet</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <motion.div
                key="addresses"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Adres Defteri
                    </h2>
                    <button
                      onClick={() => setShowAddAddress(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Yeni Adres</span>
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {user?.addresses?.map((address) => (
                      <div
                        key={address.id}
                        className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {address.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {address.isDefault && (
                              <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                                Varsayılan
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {address.fullName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {address.address}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {address.city} / {address.district} {address.postalCode}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {address.phone}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Add Address Form */}
                  {showAddAddress && (
                    <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Yeni Adres Ekle
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Adres Başlığı (Ev, İş vb.)"
                          value={addressForm.title}
                          onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                          className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder="Ad Soyad"
                          value={addressForm.fullName}
                          onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                          className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <input
                          type="tel"
                          placeholder="Telefon"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                          className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder="Şehir"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <textarea
                          placeholder="Adres"
                          value={addressForm.address}
                          onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                          className="md:col-span-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          rows={3}
                        />
                      </div>
                      <div className="mt-4 flex justify-end space-x-4">
                        <button
                          onClick={() => setShowAddAddress(false)}
                          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                          İptal
                        </button>
                        <button
                          onClick={handleAddAddress}
                          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          Ekle
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Notifications */}
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>Bildirim Tercihleri</span>
                  </h3>
                  <div className="space-y-4">
                    {[
                      { key: 'orderUpdates', label: 'Sipariş güncellemeleri', desc: 'Sipariş durumu değişikliklerinde bildirim al' },
                      { key: 'promotions', label: 'Promosyonlar', desc: 'İndirim ve kampanya bildirimlerini al' },
                      { key: 'newsletter', label: 'Bülten', desc: 'Haftalık ürün önerilerini ve haberleri al' },
                      { key: 'aiRecommendations', label: 'AI Önerileri', desc: 'Kişiselleştirilmiş AI önerilerini al' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{item.label}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.notifications?.[item.key] || false}
                            onChange={(e) => handlePreferenceChange('notifications', item.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Preferences */}
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>AI Tercihleri</span>
                  </h3>
                  <div className="space-y-4">
                    {[
                      { key: 'personalizedRecommendations', label: 'Kişiselleştirilmiş Öneriler', desc: 'AI ile özelleştirilmiş ürün önerileri al' },
                      { key: 'chatMemory', label: 'Sohbet Hafızası', desc: 'AI asistanın önceki konuşmaları hatırlamasına izin ver' },
                      { key: 'styleProfile', label: 'Stil Profili', desc: 'AI ile otomatik stil profili oluştur' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{item.label}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.ai?.[item.key] || false}
                            onChange={(e) => handlePreferenceChange('ai', item.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                  <Shield className="w-6 h-6" />
                  <span>Gizlilik ve Güvenlik</span>
                </h2>

                <div className="space-y-6">
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Veri İndirme
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Kişisel verilerinizin bir kopyasını indirin (GDPR uyumlu)
                    </p>
                    <button
                      onClick={() => {
                        const data = userService.exportUserData();
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'verilerim.json';
                        a.click();
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Verilerimi İndir</span>
                    </button>
                  </div>

                  <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Hesap Silme
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Hesabınızı ve tüm verilerinizi kalıcı olarak silin
                    </p>
                    <button
                      onClick={() => {
                        if (confirm('Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
                          userService.deleteAccount();
                          notification.success('Başarılı', 'Hesabınız silindi');
                        }
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hesabı Sil</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Profile;