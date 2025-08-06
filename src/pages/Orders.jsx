import React, { useState, useEffect } from 'react';
import { 
  Receipt, Package, Truck, MapPin, Clock, Search, Filter,
  Eye, RotateCcw, X, CheckCircle, Info, User, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import firebaseOrderService from '../services/firebaseOrderService';
import firebaseAuthService from '../services/firebaseAuthService';
import { useNotification } from '../components/common/NotificationContainer';
import { testFirebaseOrders } from '../utils/testFirebaseOrders';

const Orders = () => {
  const notification = useNotification();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // Check authentication status
    const user = firebaseAuthService.getCurrentUser();
    setIsAuthenticated(!!user);
    
    if (user) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const userOrders = await firebaseOrderService.getOrders();
      setOrders(userOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      notification.error('Hata', error.message || 'Siparişler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    if (!isAuthenticated || orders.length === 0) {
      setFilteredOrders([]);
      return;
    }

    try {
      // Use Firebase service's filtering if we have filters
      if (statusFilter !== 'all' || searchTerm) {
        const filters = {};
        if (statusFilter !== 'all') filters.status = statusFilter;
        if (searchTerm) filters.search = searchTerm;
        
        const filtered = await firebaseOrderService.filterOrders(filters);
        setFilteredOrders(filtered);
      } else {
        // No filters, show all orders
        setFilteredOrders(orders);
      }
    } catch (error) {
      console.error('Error applying filters:', error);
      // Fallback to local filtering
      let filtered = [...orders];

      if (statusFilter !== 'all') {
        filtered = filtered.filter(order => order.status === statusFilter);
      }

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(order =>
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.trackingNumber.toLowerCase().includes(searchLower) ||
          order.items.some(item => item.name.toLowerCase().includes(searchLower))
        );
      }

      setFilteredOrders(filtered);
    }
  };

  const handleTrackOrder = async (order) => {
    setSelectedOrder(order);
    setTrackingData(null);
    
    try {
      const trackingInfo = await firebaseOrderService.trackOrder(order.orderNumber);
      setTrackingData(trackingInfo);
    } catch (error) {
      console.error('Error tracking order:', error);
      notification.error('Hata', error.message || 'Sipariş takip edilirken hata oluştu');
    }
  };

  const handleReorder = async (orderId) => {
    try {
      await firebaseOrderService.reorder(orderId);
      notification.success('Başarılı', 'Sipariş tekrar oluşturuldu!');
      loadOrders();
    } catch (error) {
      console.error('Error reordering:', error);
      notification.error('Hata', error.message || 'Tekrar sipariş verilirken hata oluştu');
    }
  };

  const getStatusColor = (status) => {
    const statusInfo = firebaseOrderService.getStatusInfo(status);
    const colorMap = {
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return colorMap[statusInfo.color] || colorMap.gray;
  };

  // Test Firebase integration (development helper)
  const handleTestFirebase = async () => {
    setTesting(true);
    try {
      const result = await testFirebaseOrders();
      if (result.success) {
        notification.success('Test Başarılı', 'Firebase Orders entegrasyonu çalışıyor!');
        console.log('Test result:', result.data);
      } else {
        notification.error('Test Başarısız', result.error);
      }
    } catch (error) {
      notification.error('Test Hatası', error.message);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      pending: Clock,
      confirmed: CheckCircle,
      preparing: Package,
      shipped: Truck,
      out_for_delivery: MapPin,
      delivered: CheckCircle,
      cancelled: X,
      returned: RotateCcw
    };
    return iconMap[status] || Info;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-red-500 to-pink-500 mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <User className="h-12 w-12 text-white" />
          </motion.div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Giriş Gerekli
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Siparişlerinizi görmek için lütfen giriş yapın veya hesap oluşturun.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="/login"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Giriş Yap
            </motion.a>
            <motion.a
              href="/register"
              className="inline-flex items-center px-6 py-3 border border-primary-600 text-primary-600 rounded-xl hover:bg-primary-50 transition-colors font-semibold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Hesap Oluştur
            </motion.a>
          </div>
        </motion.div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Receipt className="h-12 w-12 text-white" />
          </motion.div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Henüz Sipariş Yok
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            ShopSmart'ta akıllı alışverişe başlayın - AI destekli öneriler ile ilk siparişinizi verin!
          </p>
          
          <motion.a
            href="/products"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Alışverişe Başla
          </motion.a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div 
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Siparişlerim
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            ShopSmart - Akıllı Alışverişin Yeni Adresi'ndeki siparişlerinizi takip edin - {filteredOrders.length} sipariş bulundu
          </p>
        </div>
        
        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Sipariş ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span>Filtrele</span>
          </button>
          
          {/* Development Test Button */}
          {import.meta.env.DEV && (
            <button
              onClick={handleTestFirebase}
              disabled={testing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{testing ? 'Test Ediliyor...' : 'Firebase Test'}</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Durum
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">Tümü</option>
                  <option value="confirmed">Onaylandı</option>
                  <option value="preparing">Hazırlanıyor</option>
                  <option value="shipped">Kargoya Verildi</option>
                  <option value="out_for_delivery">Dağıtımda</option>
                  <option value="delivered">Teslim Edildi</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders List */}
      <div className="space-y-6">
        {filteredOrders.map((order) => {
          const StatusIcon = getStatusIcon(order.status);
          const statusInfo = firebaseOrderService.getStatusInfo(order.status);
          
          return (
            <motion.div
              key={order.id}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-2xl">📦</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Sipariş #{order.orderNumber}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('tr-TR')} tarihinde verildi
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      <div className="flex items-center space-x-1">
                        <StatusIcon className="w-4 h-4" />
                        <span>{statusInfo.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Tutar</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {order.totals?.total?.toFixed(2) || '0.00'}₺
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ürün Sayısı</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {order.items?.length || 0} ürün
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Takip No</p>
                      <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                        {order.trackingNumber}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {order.items?.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-6 h-6 object-cover rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {item.name}
                        </span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          +{order.items.length - 3} daha
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                  <motion.button
                    onClick={() => handleTrackOrder(order)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Takip Et</span>
                  </motion.button>
                  
                  {order.status === 'delivered' && (
                    <motion.button
                      onClick={() => handleReorder(order.id)}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Tekrar Sipariş</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Order Tracking Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Sipariş Takibi
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {trackingData ? (
                <div className="space-y-6">
                  {/* Order Info */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sipariş No</p>
                        <p className="font-semibold">{selectedOrder.orderNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Takip No</p>
                        <p className="font-mono font-semibold">{selectedOrder.trackingNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Durum</p>
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-sm ${getStatusColor(selectedOrder.status)}`}>
                          {React.createElement(getStatusIcon(selectedOrder.status), { className: "w-4 h-4" })}
                          <span>{firebaseOrderService.getStatusInfo(selectedOrder.status).name}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Tahmini Teslimat</p>
                        <p className="font-semibold">
                          {new Date(selectedOrder.estimatedDelivery).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Insights */}
                  {trackingData.insights && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            AI Teslimat Analizi
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300">
                            {trackingData.insights}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status History */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Sipariş Geçmişi
                    </h3>
                    <div className="space-y-4">
                      {selectedOrder.statusHistory?.map((status, index) => (
                        <div key={index} className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                            {React.createElement(getStatusIcon(status.status), { 
                              className: "w-4 h-4 text-primary-600 dark:text-primary-400" 
                            })}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {firebaseOrderService.getStatusInfo(status.status).name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(status.timestamp).toLocaleString('tr-TR')}
                              </p>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              {status.note}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Teslimat Adresi
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedOrder.shippingAddress?.fullName}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {selectedOrder.shippingAddress?.address}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {selectedOrder.shippingAddress?.city} {selectedOrder.shippingAddress?.postalCode}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {selectedOrder.shippingAddress?.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;