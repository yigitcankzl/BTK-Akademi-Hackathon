/**
 * Review Management Admin Component
 * 
 * Yöneticiler için yorum yönetim paneli:
 * - Mevcut yorumları görüntüleme
 * - Basit yorumları AI ile geliştirme
 * - Toplu işlem yapabilme
 * - İstatistikleri görüntüleme
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  RefreshCw, 
  BarChart3, 
  Star, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Zap,
  TrendingUp,
  Users,
  MessageSquare,
  Settings,
  Play,
  Pause,
  Download
} from 'lucide-react';
import { 
  upgradeAllReviews, 
  upgradeProductReviews, 
  getReviewStats 
} from '../../utils/enhancedReviews';

const ReviewManagement = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [upgradeProgress, setUpgradeProgress] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadStats();
    // API key'i önce environment'tan, sonra localStorage'dan yükle
    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const savedApiKey = localStorage.getItem('gemini_api_key');
    
    if (envApiKey && envApiKey !== 'your_gemini_api_key_here') {
      setApiKey(envApiKey);
    } else if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const loadStats = async () => {
    try {
      const reviewStats = await getReviewStats();
      setStats(reviewStats);
    } catch (error) {
      console.error('İstatistik yükleme hatası:', error);
      addLog('error', 'İstatistikler yüklenemedi: ' + error.message);
    }
  };

  const addLog = (type, message) => {
    const newLog = {
      id: Date.now(),
      type, // success, error, info, warning
      message,
      timestamp: new Date().toLocaleTimeString('tr-TR')
    };
    setLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  const handleUpgradeAll = async () => {
    if (!apiKey.trim()) {
      alert('Lütfen Gemini API key girin');
      return;
    }

    if (!confirm('Tüm yorumları geliştirmek istediğinizden emin misiniz? Bu işlem uzun sürebilir.')) {
      return;
    }

    setIsLoading(true);
    setUpgradeProgress({ current: 0, total: stats?.needsUpgrade || 0 });
    
    try {
      // API key'i kaydet
      localStorage.setItem('gemini_api_key', apiKey);
      
      addLog('info', 'Tüm yorumlar geliştiriliyor...');
      
      const result = await upgradeAllReviews(apiKey);
      
      if (result.success) {
        addLog('success', `✅ ${result.processedCount}/${result.totalCount} yorum başarıyla geliştirildi`);
        await loadStats();
      } else {
        addLog('error', 'Yorum geliştirme başarısız: ' + result.message);
      }
    } catch (error) {
      console.error('Yorum geliştirme hatası:', error);
      addLog('error', 'Hata: ' + error.message);
    } finally {
      setIsLoading(false);
      setUpgradeProgress(null);
    }
  };

  const handleUpgradeProduct = async () => {
    if (!apiKey.trim()) {
      alert('Lütfen Gemini API key girin');
      return;
    }

    if (!selectedProduct) {
      alert('Lütfen bir ürün ID girin');
      return;
    }

    setIsLoading(true);
    
    try {
      addLog('info', `Ürün ${selectedProduct} yorumları geliştiriliyor...`);
      
      const result = await upgradeProductReviews(parseInt(selectedProduct), apiKey);
      
      if (result.success) {
        const successCount = result.results.filter(r => r.success).length;
        addLog('success', `✅ Ürün ${selectedProduct}: ${successCount} yorum geliştirildi`);
        await loadStats();
      } else {
        addLog('error', `Ürün ${selectedProduct} yorum geliştirme başarısız`);
      }
    } catch (error) {
      console.error('Product yorum geliştirme hatası:', error);
      addLog('error', 'Hata: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const exportLogs = () => {
    const logData = logs.map(log => ({
      time: log.timestamp,
      type: log.type,
      message: log.message
    }));
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-management-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info': 
      default: return <MessageSquare className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
              <Settings className="w-8 h-8 text-primary-600" />
              <span>Yorum Yönetim Paneli</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Firebase'teki yorumları AI ile geliştirin ve yönetin
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadStats}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Yenile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Yorum</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Geliştirilmiş</p>
                <p className="text-3xl font-bold text-green-600">{stats.enhanced}</p>
              </div>
              <Zap className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Geliştirilmeli</p>
                <p className="text-3xl font-bold text-orange-600">{stats.needsUpgrade}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Geliştirme Oranı</p>
                <p className="text-3xl font-bold text-purple-600">{stats.enhancementRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">API Yapılandırması</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                API key güvenli şekilde saklanır ve sadece AI işlemleri için kullanılır
              </p>
            </div>
          </div>
        </div>

        {/* Bulk Operations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Toplu İşlemler</h3>
          
          <div className="space-y-4">
            <button
              onClick={handleUpgradeAll}
              disabled={isLoading || !apiKey.trim()}
              className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 font-medium"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>İşlem Yapılıyor...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Tüm Yorumları Geliştir</span>
                </>
              )}
            </button>

            <div className="flex space-x-2">
              <input
                type="number"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                placeholder="Ürün ID"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={handleUpgradeProduct}
                disabled={isLoading || !apiKey.trim()}
                className="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Geliştir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      {upgradeProgress && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">İşlem İlerlemesi</h3>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${upgradeProgress.total > 0 ? (upgradeProgress.current / upgradeProgress.total) * 100 : 0}%` 
              }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {upgradeProgress.current} / {upgradeProgress.total} yorum işlendi
          </p>
        </div>
      )}

      {/* Activity Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Aktivite Logları</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportLogs}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm transition-colors flex items-center space-x-1"
            >
              <Download className="w-3 h-3" />
              <span>Dışa Aktar</span>
            </button>
            <button
              onClick={() => setLogs([])}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm transition-colors"
            >
              Temizle
            </button>
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto space-y-2">
          {logs.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Henüz log kaydı bulunmuyor
            </p>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                {getLogIcon(log.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">{log.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{log.timestamp}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rating Distribution */}
      {stats && stats.ratingDistribution && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Puan Dağılımı</h3>
          
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats.ratingDistribution[rating] || 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 w-16">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {rating}
                    </span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                    {count}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500 w-12 text-right">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewManagement;