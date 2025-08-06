/**
 * Checkout Service for E-commerce Platform
 * Handles checkout process, order creation, and payment simulation
 */

import { ECOMMERCE_CONFIG } from '../../utils/constants';

class CheckoutService {
  constructor() {
    this.orders = this.loadOrders();
  }

  loadOrders() {
    try {
      const saved = localStorage.getItem('hackathon2025-orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  saveOrders() {
    try {
      localStorage.setItem('hackathon2025-orders', JSON.stringify(this.orders));
    } catch (error) {
      console.error('Error saving orders:', error);
    }
  }

  /**
   * Calculate order totals
   */
  calculateOrderTotals(cartItems, shippingAddress, coupon = null) {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Apply coupon discount
    let discount = 0;
    if (coupon && this.validateCoupon(coupon)) {
      discount = coupon.type === 'percent' 
        ? (subtotal * coupon.value / 100)
        : Math.min(coupon.value, subtotal);
    }

    const discountedSubtotal = subtotal - discount;
    
    // Calculate shipping
    const shippingCost = this.calculateShipping(discountedSubtotal, shippingAddress);
    
    // Calculate tax
    const tax = discountedSubtotal * ECOMMERCE_CONFIG.TAX_RATE;
    
    const total = discountedSubtotal + shippingCost + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      discountedSubtotal: Math.round(discountedSubtotal * 100) / 100,
      shipping: Math.round(shippingCost * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      currency: ECOMMERCE_CONFIG.CURRENCY,
      currencySymbol: ECOMMERCE_CONFIG.CURRENCY_SYMBOL
    };
  }

  /**
   * Calculate shipping cost
   */
  calculateShipping(subtotal, shippingAddress) {
    // Free shipping threshold
    if (subtotal >= ECOMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD) {
      return 0;
    }

    // Different shipping costs based on city/region
    const shippingRates = {
      'İstanbul': 15,
      'Ankara': 18,
      'İzmir': 20,
      'Bursa': 22,
      'Antalya': 25,
      'default': 30
    };

    const city = shippingAddress?.city || 'default';
    return shippingRates[city] || shippingRates.default;
  }

  /**
   * Validate coupon code
   */
  validateCoupon(coupon) {
    if (!coupon || !coupon.code) return false;

    // Check if coupon is expired
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return false;
    }

    // Check usage limits
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return false;
    }

    return true;
  }

  /**
   * Get available payment methods
   */
  getPaymentMethods() {
    return [
      {
        id: 'credit_card',
        name: 'Kredi Kartı',
        description: 'Visa, MasterCard, American Express',
        icon: '💳',
        available: true
      },
      {
        id: 'debit_card',
        name: 'Banka Kartı',
        description: 'Türkiye\'deki tüm bankalar',
        icon: '💰',
        available: true
      },
      {
        id: 'bank_transfer',
        name: 'Havale/EFT',
        description: 'Banka havalesi ile ödeme',
        icon: '🏦',
        available: true
      },
      {
        id: 'mobile_payment',
        name: 'Mobil Ödeme',
        description: 'Papara, İninal, BKM Express',
        icon: '📱',
        available: true
      },
      {
        id: 'installment',
        name: 'Taksit',
        description: '2-12 aya varan taksit seçenekleri',
        icon: '🔄',
        available: true
      }
    ];
  }

  /**
   * Get shipping methods
   */
  getShippingMethods() {
    return [
      {
        id: 'standard',
        name: 'Standart Kargo',
        description: '3-5 iş günü',
        estimatedDays: '3-5',
        price: 15,
        icon: '📦'
      },
      {
        id: 'express',
        name: 'Hızlı Kargo',
        description: '1-2 iş günü',
        estimatedDays: '1-2',
        price: 25,
        icon: '⚡'
      },
      {
        id: 'same_day',
        name: 'Aynı Gün Teslimat',
        description: 'Seçili şehirlerde',
        estimatedDays: 'Aynı gün',
        price: 40,
        icon: '🚀',
        availableCities: ['İstanbul', 'Ankara', 'İzmir']
      }
    ];
  }

  /**
   * Validate checkout data
   */
  validateCheckoutData(checkoutData) {
    const errors = {};

    // Validate shipping address
    if (!checkoutData.shippingAddress) {
      errors.shippingAddress = 'Teslimat adresi gerekli';
    } else {
      const addr = checkoutData.shippingAddress;
      if (!addr.fullName) errors.fullName = 'Ad soyad gerekli';
      if (!addr.phone) errors.phone = 'Telefon numarası gerekli';
      if (!addr.address) errors.address = 'Adres gerekli';
      if (!addr.city) errors.city = 'Şehir gerekli';
      if (!addr.postalCode) errors.postalCode = 'Posta kodu gerekli';
    }

    // Validate payment method
    if (!checkoutData.paymentMethod) {
      errors.paymentMethod = 'Ödeme yöntemi seçimi gerekli';
    }

    // Validate card details if credit/debit card
    if (['credit_card', 'debit_card'].includes(checkoutData.paymentMethod?.id)) {
      if (!checkoutData.cardDetails) {
        errors.cardDetails = 'Kart bilgileri gerekli';
      } else {
        const card = checkoutData.cardDetails;
        if (!card.number || card.number.length < 16) {
          errors.cardNumber = 'Geçerli kart numarası gerekli';
        }
        if (!card.expiryDate) {
          errors.expiryDate = 'Son kullanma tarihi gerekli';
        }
        if (!card.cvv || card.cvv.length < 3) {
          errors.cvv = 'CVV kodu gerekli';
        }
        if (!card.holderName) {
          errors.holderName = 'Kart sahibi adı gerekli';
        }
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  /**
   * Process order
   */
  async processOrder(orderData) {
    try {
      // Validate order data
      const validationErrors = this.validateCheckoutData(orderData);
      if (validationErrors) {
        throw new Error('Validation failed');
      }

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create order
      const order = {
        id: `ORD-${Date.now()}`,
        orderNumber: this.generateOrderNumber(),
        status: 'confirmed',
        items: orderData.items,
        totals: orderData.totals,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress || orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod,
        shippingMethod: orderData.shippingMethod,
        customerNotes: orderData.customerNotes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimatedDelivery: this.calculateEstimatedDelivery(orderData.shippingMethod),
        trackingNumber: this.generateTrackingNumber(),
        timeline: [
          {
            status: 'confirmed',
            message: 'Siparişiniz alındı ve onaylandı',
            timestamp: new Date().toISOString()
          }
        ]
      };

      // Save order
      this.orders.unshift(order);
      this.saveOrders();

      return {
        success: true,
        order,
        message: 'Siparişiniz başarıyla oluşturuldu!'
      };

    } catch (error) {
      console.error('Order processing error:', error);
      return {
        success: false,
        error: error.message || 'Sipariş işlenirken bir hata oluştu'
      };
    }
  }

  /**
   * Generate order number
   */
  generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `2025${timestamp.slice(-6)}${random}`;
  }

  /**
   * Generate tracking number
   */
  generateTrackingNumber() {
    const prefix = 'HKT';
    const numbers = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    return `${prefix}${numbers}`;
  }

  /**
   * Calculate estimated delivery date
   */
  calculateEstimatedDelivery(shippingMethod) {
    const now = new Date();
    let daysToAdd = 5; // default

    switch (shippingMethod?.id) {
      case 'same_day':
        daysToAdd = 0;
        break;
      case 'express':
        daysToAdd = 2;
        break;
      case 'standard':
        daysToAdd = 5;
        break;
    }

    const deliveryDate = new Date(now);
    deliveryDate.setDate(now.getDate() + daysToAdd);
    return deliveryDate.toISOString();
  }

  /**
   * Get user orders
   */
  getUserOrders(limit = 10) {
    return this.orders.slice(0, limit);
  }

  /**
   * Get order by ID
   */
  getOrderById(orderId) {
    return this.orders.find(order => order.id === orderId);
  }

  /**
   * Update order status
   */
  updateOrderStatus(orderId, newStatus, message) {
    const order = this.getOrderById(orderId);
    if (!order) return false;

    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    
    // Add to timeline
    order.timeline.push({
      status: newStatus,
      message: message || this.getStatusMessage(newStatus),
      timestamp: new Date().toISOString()
    });

    this.saveOrders();
    return true;
  }

  /**
   * Get status message
   */
  getStatusMessage(status) {
    const messages = {
      'confirmed': 'Siparişiniz onaylandı',
      'processing': 'Siparişiniz hazırlanıyor',
      'shipped': 'Siparişiniz kargoya verildi',
      'delivered': 'Siparişiniz teslim edildi',
      'cancelled': 'Siparişiniz iptal edildi'
    };
    return messages[status] || 'Sipariş durumu güncellendi';
  }

  /**
   * Get available coupons (mock data)
   */
  getAvailableCoupons() {
    return [
      {
        code: 'WELCOME10',
        type: 'percent',
        value: 10,
        description: '%10 hoş geldin indirimi',
        minAmount: 100,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        code: 'FREESHIP',
        type: 'shipping',
        value: 0,
        description: 'Ücretsiz kargo',
        minAmount: 200,
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        code: 'SAVE50',
        type: 'amount',
        value: 50,
        description: '50₺ indirim',
        minAmount: 300,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }
}

// Export singleton instance
export default new CheckoutService();