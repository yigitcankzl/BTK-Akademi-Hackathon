import { getGeminiService } from '../geminiAPI';

class OrderService {
  constructor() {
    this.initializeOrders();
    this.orderStatuses = [
      { id: 'pending', name: 'Beklemede', color: 'yellow', description: 'Sipariş alındı, işleniyor' },
      { id: 'confirmed', name: 'Onaylandı', color: 'blue', description: 'Sipariş onaylandı, hazırlanıyor' },
      { id: 'preparing', name: 'Hazırlanıyor', color: 'purple', description: 'Ürünler paketleniyor' },
      { id: 'shipped', name: 'Kargoya Verildi', color: 'indigo', description: 'Sipariş kargo şirketine teslim edildi' },
      { id: 'out_for_delivery', name: 'Dağıtımda', color: 'orange', description: 'Sipariş size teslim edilmek üzere yolda' },
      { id: 'delivered', name: 'Teslim Edildi', color: 'green', description: 'Sipariş başarıyla teslim edildi' },
      { id: 'cancelled', name: 'İptal Edildi', color: 'red', description: 'Sipariş iptal edildi' },
      { id: 'returned', name: 'İade Edildi', color: 'gray', description: 'Sipariş iade edildi' }
    ];
  }

  // Initialize orders with mock data if none exist
  initializeOrders() {
    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    if (existingOrders.length === 0) {
      // Create mock orders
      const mockOrders = this.createMockOrders();
      this.orders = mockOrders;
      localStorage.setItem('orders', JSON.stringify(mockOrders));
    } else {
      this.orders = existingOrders;
    }
  }

  // Create mock orders for demonstration
  createMockOrders() {
    const now = new Date();
    return [
      {
        id: '1704123456789',
        orderNumber: 'ORD-2024-001',
        trackingNumber: 'TRK-ABC123456',
        status: 'delivered',
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        estimatedDelivery: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            id: '1',
            name: 'Wireless Bluetooth Kulaklık',
            price: 299.99,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
          },
          {
            id: '2',
            name: 'Şarj Kablosu USB-C',
            price: 49.99,
            quantity: 2,
            image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400'
          }
        ],
        totals: {
          subtotal: 399.97,
          shipping: 19.99,
          tax: 41.99,
          total: 461.95
        },
        shippingAddress: {
          name: 'Ahmet Yılmaz',
          street: 'Atatürk Caddesi No: 123',
          city: 'İstanbul',
          district: 'Kadıköy',
          postalCode: '34710',
          country: 'Türkiye',
          phone: '+90 555 123 4567'
        },
        billingAddress: {
          name: 'Ahmet Yılmaz',
          street: 'Atatürk Caddesi No: 123',
          city: 'İstanbul',
          district: 'Kadıköy',
          postalCode: '34710',
          country: 'Türkiye'
        },
        paymentMethod: {
          type: 'credit_card',
          name: 'Kredi Kartı',
          last4: '4567',
          brand: 'Visa'
        },
        shippingMethod: {
          id: 'standard',
          name: 'Standart Kargo',
          price: 19.99,
          estimatedDays: 3
        }
      },
      {
        id: '1704123456790',
        orderNumber: 'ORD-2024-002',
        trackingNumber: 'TRK-DEF789012',
        status: 'shipped',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        estimatedDelivery: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        items: [
          {
            id: '3',
            name: 'Akıllı Saat Sport',
            price: 899.99,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
          }
        ],
        totals: {
          subtotal: 899.99,
          shipping: 0,
          tax: 89.99,
          total: 989.98
        },
        shippingAddress: {
          name: 'Ahmet Yılmaz',
          street: 'Atatürk Caddesi No: 123',
          city: 'İstanbul',
          district: 'Kadıköy',
          postalCode: '34710',
          country: 'Türkiye',
          phone: '+90 555 123 4567'
        },
        billingAddress: {
          name: 'Ahmet Yılmaz',
          street: 'Atatürk Caddesi No: 123',
          city: 'İstanbul',
          district: 'Kadıköy',
          postalCode: '34710',
          country: 'Türkiye'
        },
        paymentMethod: {
          type: 'credit_card',
          name: 'Kredi Kartı',
          last4: '4567',
          brand: 'Visa'
        },
        shippingMethod: {
          id: 'express',
          name: 'Express Kargo',
          price: 0,
          estimatedDays: 1
        }
      },
      {
        id: '1704123456791',
        orderNumber: 'ORD-2024-003',
        trackingNumber: 'TRK-GHI345678',
        status: 'preparing',
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        updatedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        estimatedDelivery: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        items: [
          {
            id: '4',
            name: 'Laptop Çantası Premium',
            price: 199.99,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'
          },
          {
            id: '5',
            name: 'Wireless Mouse',
            price: 79.99,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400'
          }
        ],
        totals: {
          subtotal: 279.98,
          shipping: 19.99,
          tax: 29.99,
          total: 329.96
        },
        shippingAddress: {
          name: 'Ahmet Yılmaz',
          street: 'Atatürk Caddesi No: 123',
          city: 'İstanbul',
          district: 'Kadıköy',
          postalCode: '34710',
          country: 'Türkiye',
          phone: '+90 555 123 4567'
        },
        billingAddress: {
          name: 'Ahmet Yılmaz',
          street: 'Atatürk Caddesi No: 123',
          city: 'İstanbul',
          district: 'Kadıköy',
          postalCode: '34710',
          country: 'Türkiye'
        },
        paymentMethod: {
          type: 'credit_card',
          name: 'Kredi Kartı',
          last4: '4567',
          brand: 'Visa'
        },
        shippingMethod: {
          id: 'standard',
          name: 'Standart Kargo',
          price: 19.99,
          estimatedDays: 3
        }
      }
    ];
  }

  // Get all orders for current user
  getOrders() {
    return this.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Get single order by ID
  getOrderById(orderId) {
    return this.orders.find(order => order.id === orderId);
  }

  // Get order by order number
  getOrderByNumber(orderNumber) {
    return this.orders.find(order => order.orderNumber === orderNumber);
  }

  // Create new order
  createOrder(orderData) {
    const orderNumber = this.generateOrderNumber();
    const trackingNumber = this.generateTrackingNumber();
    
    const order = {
      id: Date.now().toString(),
      orderNumber,
      trackingNumber,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedDelivery: this.calculateEstimatedDelivery(orderData.shippingMethod),
      items: orderData.items,
      totals: orderData.totals,
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      paymentMethod: orderData.paymentMethod,
      shippingMethod: orderData.shippingMethod,
      customerNotes: orderData.customerNotes || '',
      statusHistory: [
        {
          status: 'confirmed',
          timestamp: new Date().toISOString(),
          note: 'Sipariş onaylandı ve işleme alındı'
        }
      ]
    };

    this.orders.push(order);
    this.saveOrders();
    
    // Simulate order progression
    this.simulateOrderProgress(order.id);
    
    return order;
  }

  // Update order status
  updateOrderStatus(orderId, newStatus, note = '') {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: note || this.getStatusDescription(newStatus)
    });

    this.saveOrders();
    return order;
  }

  // Cancel order
  cancelOrder(orderId, reason = '') {
    return this.updateOrderStatus(orderId, 'cancelled', `Sipariş iptal edildi. ${reason}`);
  }

  // Reorder - create new order with same items
  async reorder(orderId) {
    const originalOrder = this.getOrderById(orderId);
    if (!originalOrder) throw new Error('Sipariş bulunamadı');

    // Create new order data based on original
    const orderData = {
      items: originalOrder.items,
      shippingAddress: originalOrder.shippingAddress,
      billingAddress: originalOrder.billingAddress,
      paymentMethod: originalOrder.paymentMethod,
      shippingMethod: originalOrder.shippingMethod,
      customerNotes: `Tekrar sipariş (Orijinal: ${originalOrder.orderNumber})`
    };

    // Recalculate totals (prices might have changed)
    orderData.totals = this.recalculateOrderTotals(originalOrder.items);

    return this.createOrder(orderData);
  }

  // Get order statistics
  getOrderStats() {
    const orders = this.getOrders();
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.totals?.total || 0), 0);
    
    const statusCounts = this.orderStatuses.reduce((acc, status) => {
      acc[status.id] = orders.filter(order => order.status === status.id).length;
      return acc;
    }, {});

    const recentOrders = orders.slice(0, 5);
    
    return {
      totalOrders,
      totalSpent,
      statusCounts,
      recentOrders,
      averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
    };
  }

  // Track order with AI-powered delivery estimates
  async trackOrder(orderNumber) {
    const order = this.getOrderByNumber(orderNumber);
    if (!order) return null;

    try {
      // Get AI-powered delivery insights
      const deliveryInsights = await this.getAIDeliveryInsights(order);
      
      return {
        order,
        insights: deliveryInsights,
        statusInfo: this.getStatusInfo(order.status),
        nextSteps: this.getNextSteps(order.status),
        estimatedDelivery: order.estimatedDelivery
      };
    } catch (error) {
      console.error('Error tracking order:', error);
      return {
        order,
        insights: null,
        statusInfo: this.getStatusInfo(order.status),
        nextSteps: this.getNextSteps(order.status),
        estimatedDelivery: order.estimatedDelivery
      };
    }
  }

  // Get AI-powered delivery insights
  async getAIDeliveryInsights(order) {
    try {
      const prompt = `
        Bir e-ticaret siparişi için teslimat tahminini analiz et:
        
        Sipariş Bilgileri:
        - Sipariş Tarihi: ${order.createdAt}
        - Durum: ${order.status}
        - Şehir: ${order.shippingAddress.city}
        - Kargo: ${order.shippingMethod.name}
        - Tahmini Teslimat: ${order.estimatedDelivery}
        
        Kısa ve net bir teslimat durumu analizi yap (maksimum 2-3 cümle).
        Mevcut duruma göre müşteriye bilgi ver.
      `;

      const geminiService = getGeminiService();
      const response = await geminiService.generateContent(prompt);
      return response.text;
    } catch (error) {
      console.error('AI delivery insights error:', error);
      return 'Teslimat bilgileri AI analizi şu anda mevcut değil.';
    }
  }

  // Helper methods
  generateOrderNumber() {
    const prefix = 'ORD';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp.toString().slice(-6)}${random}`;
  }

  generateTrackingNumber() {
    const prefix = 'TRK';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${timestamp.toString().slice(-8)}${random}`;
  }

  calculateEstimatedDelivery(shippingMethod) {
    const today = new Date();
    const deliveryDays = parseInt(shippingMethod.estimatedDays.split('-')[1] || shippingMethod.estimatedDays.split(' ')[0]);
    const estimatedDate = new Date(today);
    estimatedDate.setDate(today.getDate() + deliveryDays);
    return estimatedDate.toISOString();
  }

  getStatusInfo(status) {
    return this.orderStatuses.find(s => s.id === status) || this.orderStatuses[0];
  }

  getStatusDescription(status) {
    const statusInfo = this.getStatusInfo(status);
    return statusInfo.description;
  }

  getNextSteps(status) {
    const nextStepsMap = {
      pending: ['Sipariş onaylanacak', 'Ödeme kontrolü yapılacak'],
      confirmed: ['Ürünler hazırlanacak', 'Paketleme işlemi başlayacak'],
      preparing: ['Paketleme tamamlanacak', 'Kargo şirketine teslim edilecek'],
      shipped: ['Kargo şirketinden bilgi gelecek', 'Takip numarası aktif olacak'],
      out_for_delivery: ['Kurye size ulaşacak', 'Teslimat gerçekleşecek'],
      delivered: ['Sipariş tamamlandı'],
      cancelled: ['İptal işlemi tamamlandı'],
      returned: ['İade işlemi tamamlandı']
    };

    return nextStepsMap[status] || [];
  }

  recalculateOrderTotals(items) {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18; // 18% KDV
    const shipping = subtotal > 150 ? 0 : 15; // Free shipping over 150₺
    const total = subtotal + tax + shipping;

    return {
      subtotal,
      tax,
      shipping,
      discount: 0,
      total
    };
  }

  saveOrders() {
    localStorage.setItem('orders', JSON.stringify(this.orders));
  }

  // Simulate order progression for demo
  simulateOrderProgress(orderId) {
    const progressSteps = [
      { status: 'preparing', delay: 2000 },
      { status: 'shipped', delay: 5000 },
      { status: 'out_for_delivery', delay: 8000 }
    ];

    progressSteps.forEach(({ status, delay }) => {
      setTimeout(() => {
        this.updateOrderStatus(orderId, status);
      }, delay);
    });
  }

  // Filter orders
  filterOrders(filters = {}) {
    let filtered = [...this.orders];

    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(order => new Date(order.createdAt) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(order => new Date(order.createdAt) <= new Date(filters.dateTo));
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm) ||
        order.trackingNumber.toLowerCase().includes(searchTerm) ||
        order.items.some(item => item.name.toLowerCase().includes(searchTerm))
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

export default new OrderService();