import React, { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon, Globe, Bell, BarChart3, Sparkles, Check, MessageSquare, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { useNotification } from '../components/common/NotificationContainer';
import { LANGUAGES } from '../utils/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import generateAdvancedReviews from '../utils/generateAdvancedReviews';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const Settings = () => {
  const { state, dispatch, actionTypes } = useApp();
  const { settings } = state;
  const notification = useNotification();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isGeneratingReviews, setIsGeneratingReviews] = useState(false);

  // Sync local settings with context settings when they change
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('Saving settings:', localSettings);
      
      dispatch({
        type: actionTypes.UPDATE_SETTINGS,
        payload: localSettings,
      });
      
      console.log('Settings dispatched successfully');
      notification.success('Settings Saved', 'Your settings have been saved successfully.');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      notification.error('Save Failed', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };


  const updateSetting = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleGenerateReviews = async () => {
    setIsGeneratingReviews(true);
    try {
      notification.add({
        type: 'info',
        message: 'Yorumlar oluşturuluyor, lütfen bekleyin...',
        duration: 5000
      });

      const result = await generateAdvancedReviews();
      
      notification.add({
        type: 'success',
        message: `✅ ${result.totalReviews} gelişmiş yorum ${result.productsCount} ürün için oluşturuldu!`,
        duration: 8000
      });
    } catch (error) {
      console.error('Error generating reviews:', error);
      notification.add({
        type: 'error',
        message: '❌ Yorumlar oluşturulurken hata oluştu: ' + error.message,
        duration: 8000
      });
    } finally {
      setIsGeneratingReviews(false);
    }
  };

  return (
    <motion.div 
      className="max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="mb-12" variants={itemVariants}>
        <div className="text-center mb-8">
          <motion.div 
            className="mx-auto flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 mb-8 shadow-xl relative"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            <SettingsIcon className="h-10 w-10 text-white" />
            <motion.div
              className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Check className="w-3 h-3 text-white" />
            </motion.div>
          </motion.div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Ayarlar
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            ShopSmart deneyiminizi kişiselleştirin ve akıllı alışveriş tercihlerinizi yönetin
          </p>
        </div>
      </motion.div>

      <div className="space-y-8">

        {/* App Preferences */}
        <motion.div 
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-gray-200/50 dark:border-gray-700/50 p-8 shadow-lg"
          variants={itemVariants}
          whileHover={{ scale: 1.01, y: -2 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
            >
              <Globe className="w-6 h-6 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Preferences
            </h2>
          </div>
          
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Language
              </label>
              <motion.select
                value={localSettings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="input-field transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                whileFocus={{ scale: 1.01 }}
              >
                {Object.entries(LANGUAGES).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </motion.select>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.label 
                  className="flex items-center p-4 rounded-2xl bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/30 dark:to-gray-600/30 hover:from-primary-50/50 hover:to-accent-50/50 dark:hover:from-primary-900/20 dark:hover:to-accent-900/20 transition-all duration-300 cursor-pointer group"
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="relative"
                    whileTap={{ scale: 0.95 }}
                  >
                    <input
                      type="checkbox"
                      checked={localSettings.enableNotifications}
                      onChange={(e) => updateSetting('enableNotifications', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                      localSettings.enableNotifications 
                        ? 'bg-gradient-to-r from-primary-500 to-accent-500' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      <motion.div
                        className="w-5 h-5 bg-white rounded-full shadow-md m-0.5"
                        animate={{ x: localSettings.enableNotifications ? 24 : 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </motion.div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-5 h-5 text-primary-500" />
                      <span className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        Notifications
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Receive updates and alerts
                    </p>
                  </div>
                </motion.label>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.label 
                  className="flex items-center p-4 rounded-2xl bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/30 dark:to-gray-600/30 hover:from-primary-50/50 hover:to-accent-50/50 dark:hover:from-primary-900/20 dark:hover:to-accent-900/20 transition-all duration-300 cursor-pointer group"
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="relative"
                    whileTap={{ scale: 0.95 }}
                  >
                    <input
                      type="checkbox"
                      checked={localSettings.enableAnalytics}
                      onChange={(e) => updateSetting('enableAnalytics', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                      localSettings.enableAnalytics 
                        ? 'bg-gradient-to-r from-primary-500 to-accent-500' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      <motion.div
                        className="w-5 h-5 bg-white rounded-full shadow-md m-0.5"
                        animate={{ x: localSettings.enableAnalytics ? 24 : 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </motion.div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5 text-primary-500" />
                      <span className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        Analytics
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Help improve the experience
                    </p>
                  </div>
                </motion.label>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div 
          className="flex justify-end"
          variants={itemVariants}
        >
          <AnimatePresence>
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mr-4 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded-2xl text-sm font-medium flex items-center"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Unsaved changes
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.button
            onClick={handleSave}
            disabled={isSaving}
            className={`btn-primary flex items-center transition-all duration-200 ${
              hasChanges ? 'animate-pulse shadow-glow' : ''
            }`}
            whileHover={{ scale: isSaving ? 1 : 1.02 }}
            whileTap={{ scale: isSaving ? 1 : 0.98 }}
          >
            {isSaving ? (
              <LoadingSpinner size="small" className="mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </motion.button>
        </motion.div>

        {/* Reviews Management Section */}
        <motion.div 
          className="bg-gradient-to-br from-orange-50 via-red-50 to-orange-50 dark:from-orange-900/20 dark:via-red-900/10 dark:to-orange-900/20 rounded-3xl p-8 border border-orange-200/50 dark:border-orange-800/50 backdrop-blur-sm mt-8"
          variants={itemVariants}
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-3 mb-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <MessageSquare className="w-8 h-8 text-orange-500" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Yorum Yönetimi
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Tüm ürünler için gelişmiş ve detaylı yorumlar oluşturun. Mevcut yorumlar silinir ve her ürün için AI destekli gerçekçi yorumlar eklenir.
            </p>
          </div>

          <motion.button
            onClick={handleGenerateReviews}
            disabled={isGeneratingReviews}
            className={`mx-auto flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
              isGeneratingReviews ? 'animate-pulse' : ''
            }`}
            whileHover={{ scale: isGeneratingReviews ? 1 : 1.05 }}
            whileTap={{ scale: isGeneratingReviews ? 1 : 0.95 }}
          >
            {isGeneratingReviews ? (
              <>
                <LoadingSpinner size="small" className="mr-3" />
                <span>Yorumlar Oluşturuluyor...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-3" />
                <span>🎯 Gelişmiş Yorumlar Oluştur</span>
              </>
            )}
          </motion.button>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
              <Sparkles className="w-4 h-4" />
              <span>Her ürün için 3-10 arası detaylı yorum oluşturulacak</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Status Banner */}
      <motion.div 
        className="text-center mt-12"
        variants={itemVariants}
      >
        <motion.div
          className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-indigo-50 via-purple-50/50 to-indigo-50 dark:from-indigo-900/20 dark:via-purple-900/10 dark:to-indigo-900/20 rounded-3xl border border-indigo-200/50 dark:border-indigo-800/50 backdrop-blur-sm"
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-6 h-6 text-indigo-500" />
          </motion.div>
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Settings optimized for the best experience!
          </span>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <SettingsIcon className="w-6 h-6 text-purple-500" />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Settings;
