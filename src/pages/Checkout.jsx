import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CreditCard, Truck, MapPin, User, Phone, Mail, 
  ShieldCheck, ArrowLeft, CheckCircle, AlertCircle,
  Package, Clock, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import checkoutService from '../services/ecommerce/checkoutService';
import { useNotification } from '../components/common/NotificationContainer';

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

const Checkout = () => {
  const { state, dispatch, actionTypes } = useApp();
  const navigate = useNavigate();
  const notification = useNotification();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  
  // Form data
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
    notes: ''
  });
  
  const [billingAddress, setBillingAddress] = useState(null);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    holderName: '',
    expiryDate: '',
    cvv: ''
  });
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [customerNotes, setCustomerNotes] = useState('');
  
  const [orderTotals, setOrderTotals] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [errors, setErrors] = useState({});

  const cartItems = state.cart?.items || [];

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }
    
    // Load payment and shipping methods
    setPaymentMethods(checkoutService.getPaymentMethods());
    setShippingMethods(checkoutService.getShippingMethods());
    
    // Set default shipping method
    const defaultShipping = checkoutService.getShippingMethods()[0];
    setSelectedShippingMethod(defaultShipping);
  }, [cartItems.length, navigate]);

  useEffect(() => {
    // Calculate totals whenever relevant data changes
    if (cartItems.length > 0) {
      const totals = checkoutService.calculateOrderTotals(
        cartItems,
        shippingAddress,
        appliedCoupon
      );
      setOrderTotals(totals);
    }
  }, [cartItems, shippingAddress, appliedCoupon]);

  const handleAddressChange = (field, value) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleCardChange = (field, value) => {
    setCardDetails(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step >= 1) {
      // Validate shipping address
      if (!shippingAddress.fullName) newErrors.fullName = 'Ad soyad gerekli';
      if (!shippingAddress.phone) newErrors.phone = 'Telefon gerekli';
      if (!shippingAddress.email) newErrors.email = 'E-posta gerekli';
      if (!shippingAddress.address) newErrors.address = 'Adres gerekli';
      if (!shippingAddress.city) newErrors.city = 'Şehir gerekli';
      if (!shippingAddress.postalCode) newErrors.postalCode = 'Posta kodu gerekli';
    }
    
    if (step >= 2) {
      // Validate shipping method
      if (!selectedShippingMethod) newErrors.shippingMethod = 'Kargo seçimi gerekli';
    }
    
    if (step >= 3) {
      // Validate payment method
      if (!selectedPaymentMethod) newErrors.paymentMethod = 'Ödeme yöntemi seçimi gerekli';
      
      // Validate card details if needed
      if (['credit_card', 'debit_card'].includes(selectedPaymentMethod?.id)) {
        if (!cardDetails.number) newErrors.cardNumber = 'Kart numarası gerekli';
        if (!cardDetails.holderName) newErrors.holderName = 'Kart sahibi adı gerekli';
        if (!cardDetails.expiryDate) newErrors.expiryDate = 'Son kullanma tarihi gerekli';
        if (!cardDetails.cvv) newErrors.cvv = 'CVV gerekli';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handlePlaceOrder = async () => {
    if (!validateStep(3)) return;
    
    setIsProcessing(true);
    
    const orderData = {
      items: cartItems,
      totals: orderTotals,
      shippingAddress,
      billingAddress: sameAsShipping ? shippingAddress : billingAddress,
      paymentMethod: selectedPaymentMethod,
      shippingMethod: selectedShippingMethod,
      cardDetails: ['credit_card', 'debit_card'].includes(selectedPaymentMethod?.id) ? cardDetails : null,
      customerNotes,
      appliedCoupon
    };

    try {
      const result = await checkoutService.processOrder(orderData);
      
      if (result.success) {
        setOrderResult(result);
        setCurrentStep(4);
        
        // Clear cart
        dispatch({
          type: actionTypes.CLEAR_CART
        });
        
        // Add order to user orders
        dispatch({
          type: actionTypes.ADD_ORDER,
          payload: result.order
        });
        
        notification.success('Sipariş Başarılı', 'Siparişiniz başarıyla oluşturuldu!');
      } else {
        notification.error('Sipariş Hatası', result.error);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      notification.error('Hata', 'Sipariş işlenirken bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Sepetiniz Boş
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Checkout yapabilmek için önce sepete ürün eklemelisiniz.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Alışverişe Başla
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      className="max-w-6xl mx-auto px-4 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="flex items-center justify-between mb-8" variants={itemVariants}>
        <div className="flex items-center space-x-4">
          <Link
            to="/cart"
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Sepete Dön</span>
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Checkout
        </h1>
      </motion.div>

      {/* Progress Steps */}
      <motion.div className="mb-8" variants={itemVariants}>
        <div className="flex items-center justify-center space-x-8">
          {[
            { step: 1, title: 'Teslimat', icon: MapPin },
            { step: 2, title: 'Kargo', icon: Truck },
            { step: 3, title: 'Ödeme', icon: CreditCard },
            { step: 4, title: 'Onay', icon: CheckCircle }
          ].map(({ step, title, icon: Icon }) => (
            <div key={step} className="flex items-center space-x-2">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                currentStep >= step 
                  ? 'bg-primary-600 border-primary-600 text-white' 
                  : 'border-gray-300 dark:border-gray-600 text-gray-400'
              }`}>
                {currentStep > step ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span className={`font-medium ${
                currentStep >= step 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-400'
              }`}>
                {title}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {/* Step 1: Shipping Address */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Teslimat Adresi
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ad Soyad *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.fullName}
                      onChange={(e) => handleAddressChange('fullName', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                        errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="Ad Soyad"
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Telefon *
                    </label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => handleAddressChange('phone', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                        errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="0532 123 45 67"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      E-posta *
                    </label>
                    <input
                      type="email"
                      value={shippingAddress.email}
                      onChange={(e) => handleAddressChange('email', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                        errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="ornek@email.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Adres *
                    </label>
                    <textarea
                      value={shippingAddress.address}
                      onChange={(e) => handleAddressChange('address', e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                        errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="Mahalle, sokak, bina no, daire no"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Şehir *
                    </label>
                    <select
                      value={shippingAddress.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                        errors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    >
                      <option value="">Şehir Seçin</option>
                      <option value="İstanbul">İstanbul</option>
                      <option value="Ankara">Ankara</option>
                      <option value="İzmir">İzmir</option>
                      <option value="Bursa">Bursa</option>
                      <option value="Antalya">Antalya</option>
                      <option value="Adana">Adana</option>
                      <option value="Konya">Konya</option>
                      <option value="Gaziantep">Gaziantep</option>
                      <option value="Other">Diğer</option>
                    </select>
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Posta Kodu *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.postalCode}
                      onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                        errors.postalCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="34000"
                    />
                    {errors.postalCode && (
                      <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <motion.button
                    onClick={handleNextStep}
                    className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Devam Et
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Shipping Method */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Kargo Seçenekleri
                </h2>
                
                <div className="space-y-4">
                  {shippingMethods.map((method) => (
                    <motion.div
                      key={method.id}
                      className={`p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                        selectedShippingMethod?.id === method.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-primary-300'
                      }`}
                      onClick={() => setSelectedShippingMethod(method)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl">{method.icon}</div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {method.name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              {method.description}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {method.estimatedDays}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {method.price === 0 ? 'Ücretsiz' : `${method.price}₺`}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-8 flex justify-between">
                  <motion.button
                    onClick={handlePrevStep}
                    className="px-8 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Geri
                  </motion.button>
                  <motion.button
                    onClick={handleNextStep}
                    className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Devam Et
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Ödeme Yöntemi
                </h2>
                
                {/* Payment Methods */}
                <div className="space-y-4 mb-8">
                  {paymentMethods.map((method) => (
                    <motion.div
                      key={method.id}
                      className={`p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                        selectedPaymentMethod?.id === method.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-primary-300'
                      }`}
                      onClick={() => setSelectedPaymentMethod(method)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{method.icon}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {method.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {method.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Card Details for Credit/Debit Cards */}
                {['credit_card', 'debit_card'].includes(selectedPaymentMethod?.id) && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Kart Bilgileri
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Kart Numarası *
                        </label>
                        <input
                          type="text"
                          value={cardDetails.number}
                          onChange={(e) => handleCardChange('number', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                            errors.cardNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                        />
                        {errors.cardNumber && (
                          <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
                        )}
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Kart Sahibi Adı *
                        </label>
                        <input
                          type="text"
                          value={cardDetails.holderName}
                          onChange={(e) => handleCardChange('holderName', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                            errors.holderName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                          placeholder="JOHN DOE"
                        />
                        {errors.holderName && (
                          <p className="text-red-500 text-sm mt-1">{errors.holderName}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Son Kullanma Tarihi *
                        </label>
                        <input
                          type="text"
                          value={cardDetails.expiryDate}
                          onChange={(e) => handleCardChange('expiryDate', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                            errors.expiryDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                        {errors.expiryDate && (
                          <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          CVV *
                        </label>
                        <input
                          type="text"
                          value={cardDetails.cvv}
                          onChange={(e) => handleCardChange('cvv', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                            errors.cvv ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                          placeholder="123"
                          maxLength={4}
                        />
                        {errors.cvv && (
                          <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-8 flex justify-between">
                  <motion.button
                    onClick={handlePrevStep}
                    className="px-8 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Geri
                  </motion.button>
                  <motion.button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold flex items-center space-x-2 disabled:opacity-50"
                    whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                    whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>İşleniyor...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        <span>Siparişi Tamamla</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Order Confirmation */}
            {currentStep === 4 && orderResult && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </motion.div>
                
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Siparişiniz Alındı!
                </h2>
                
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                  Teşekkür ederiz! Siparişiniz başarıyla oluşturuldu.
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 mb-8">
                  <div className="grid md:grid-cols-2 gap-6 text-left">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Sipariş Detayları
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Sipariş No: <span className="font-mono">{orderResult.order.orderNumber}</span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Takip No: <span className="font-mono">{orderResult.order.trackingNumber}</span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Durum: <span className="text-green-600 font-semibold">Onaylandı</span>
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Teslimat Bilgileri
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Tahmini Teslimat: {new Date(orderResult.order.estimatedDelivery).toLocaleDateString('tr-TR')}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Kargo: {selectedShippingMethod?.name}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    onClick={() => navigate('/orders')}
                    className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Siparişlerimi Görüntüle
                  </motion.button>
                  <motion.button
                    onClick={() => navigate('/products')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Alışverişe Devam Et
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <motion.div 
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg sticky top-8"
            variants={itemVariants}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Sipariş Özeti
            </h3>
            
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={`${item.productId}-${item.variantId || ''}`} className="flex items-center space-x-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Adet: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {(item.price * item.quantity).toFixed(2)}₺
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Totals */}
            {orderTotals && (
              <div className="border-t border-gray-200 dark:border-gray-600 pt-6 space-y-3">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Ara Toplam</span>
                  <span>{orderTotals.subtotal.toFixed(2)}₺</span>
                </div>
                
                {orderTotals.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>İndirim</span>
                    <span>-{orderTotals.discount.toFixed(2)}₺</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Kargo</span>
                  <span>{orderTotals.shipping === 0 ? 'Ücretsiz' : `${orderTotals.shipping.toFixed(2)}₺`}</span>
                </div>
                
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>KDV</span>
                  <span>{orderTotals.tax.toFixed(2)}₺</span>
                </div>
                
                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-3">
                  <span>Toplam</span>
                  <span>{orderTotals.total.toFixed(2)}₺</span>
                </div>
              </div>
            )}
            
            {/* Security Badge */}
            <div className="mt-6 flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm">256-bit SSL ile güvenli ödeme</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Checkout;