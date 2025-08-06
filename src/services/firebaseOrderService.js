// Firebase Orders Service
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import firebaseAuthService from './firebaseAuthService';
import { getGeminiService } from './geminiAPI';

class FirebaseOrderService {
  constructor() {
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

  // Get current user ID
  getCurrentUserId() {
    const user = firebaseAuthService.getCurrentUser();
    if (!user) {
      throw new Error('Kullanıcı oturumu açık değil');
    }
    return user.uid;
  }

  // Get all orders for current user
  async getOrders() {
    try {
      const userId = this.getCurrentUserId();
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders = [];
      
      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamps to ISO strings
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
          estimatedDelivery: doc.data().estimatedDelivery?.toDate?.()?.toISOString() || doc.data().estimatedDelivery,
        });
      });

      // If no orders exist, create mock orders for demo
      if (orders.length === 0) {
        await this.createMockOrdersForUser(userId);
        return await this.getOrders(); // Recursively call to get the newly created orders
      }

      return orders;
    } catch (error) {
      console.error('Error getting orders:', error);
      throw new Error('Siparişler yüklenirken hata oluştu');
    }
  }

  // Get single order by ID
  async getOrderById(orderId) {
    try {
      const userId = this.getCurrentUserId();
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      
      if (!orderDoc.exists()) {
        return null;
      }

      const orderData = orderDoc.data();
      
      // Check if order belongs to current user
      if (orderData.userId !== userId) {
        throw new Error('Bu siparişe erişim yetkiniz yok');
      }

      return {
        id: orderDoc.id,
        ...orderData,
        createdAt: orderData.createdAt?.toDate?.()?.toISOString() || orderData.createdAt,
        updatedAt: orderData.updatedAt?.toDate?.()?.toISOString() || orderData.updatedAt,
        estimatedDelivery: orderData.estimatedDelivery?.toDate?.()?.toISOString() || orderData.estimatedDelivery,
      };
    } catch (error) {
      console.error('Error getting order by ID:', error);
      throw new Error('Sipariş bilgileri alınırken hata oluştu');
    }
  }

  // Get order by order number
  async getOrderByNumber(orderNumber) {
    try {
      const userId = this.getCurrentUserId();
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef, 
        where('userId', '==', userId),
        where('orderNumber', '==', orderNumber),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        estimatedDelivery: doc.data().estimatedDelivery?.toDate?.()?.toISOString() || doc.data().estimatedDelivery,
      };
    } catch (error) {
      console.error('Error getting order by number:', error);
      throw new Error('Sipariş bulunamadı');
    }
  }

  // Create new order
  async createOrder(orderData) {
    try {
      const userId = this.getCurrentUserId();
      const orderNumber = this.generateOrderNumber();
      const trackingNumber = this.generateTrackingNumber();
      const orderId = `${userId}_${Date.now()}`;
      
      const order = {
        userId,
        orderNumber,
        trackingNumber,
        status: 'confirmed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
            timestamp: serverTimestamp(),
            note: 'Sipariş onaylandı ve işleme alındı'
          }
        ]
      };

      await setDoc(doc(db, 'orders', orderId), order);
      
      // Update user's order count in their profile
      await this.updateUserOrderCount(userId);
      
      // Simulate order progression for demo
      this.simulateOrderProgress(orderId);
      
      return {
        id: orderId,
        ...order,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimatedDelivery: typeof order.estimatedDelivery === 'string' ? order.estimatedDelivery : new Date(order.estimatedDelivery).toISOString(),
      };
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Sipariş oluşturulurken hata oluştu');
    }
  }

  // Update order status
  async updateOrderStatus(orderId, newStatus, note = '') {
    try {
      const userId = this.getCurrentUserId();
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (!orderDoc.exists()) {
        throw new Error('Sipariş bulunamadı');
      }

      const orderData = orderDoc.data();
      
      // Check if order belongs to current user
      if (orderData.userId !== userId) {
        throw new Error('Bu siparişi güncelleme yetkiniz yok');
      }

      const statusHistory = orderData.statusHistory || [];
      statusHistory.push({
        status: newStatus,
        timestamp: serverTimestamp(),
        note: note || this.getStatusDescription(newStatus)
      });

      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        statusHistory
      });

      return await this.getOrderById(orderId);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Sipariş durumu güncellenirken hata oluştu');
    }
  }

  // Cancel order
  async cancelOrder(orderId, reason = '') {
    return await this.updateOrderStatus(orderId, 'cancelled', `Sipariş iptal edildi. ${reason}`);
  }

  // Reorder - create new order with same items
  async reorder(orderId) {
    try {
      const originalOrder = await this.getOrderById(orderId);
      if (!originalOrder) {
        throw new Error('Orijinal sipariş bulunamadı');
      }

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

      return await this.createOrder(orderData);
    } catch (error) {
      console.error('Error reordering:', error);
      throw new Error('Tekrar sipariş verilirken hata oluştu');
    }
  }

  // Track order with AI insights
  async trackOrder(orderNumber) {
    try {
      const order = await this.getOrderByNumber(orderNumber);
      if (!order) {
        throw new Error('Sipariş bulunamadı');
      }

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
      throw new Error('Sipariş takip edilirken hata oluştu');
    }
  }

  // Get AI-powered delivery insights
  async getAIDeliveryInsights(order) {
    try {
      const prompt = `
        Bir e-ticaret siparişi için teslimat tahminini analiz et:
        
        Sipariş Bilgileri:
        - Sipariş Tarihi: ${order.createdAt}
        - Durum: ${this.getStatusInfo(order.status).name}
        - Şehir: ${order.shippingAddress?.city || 'Belirtilmemiş'}
        - Kargo: ${order.shippingMethod?.name || 'Standart'}
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

  // Get order statistics for current user
  async getOrderStats() {
    try {
      const orders = await this.getOrders();
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
    } catch (error) {
      console.error('Error getting order stats:', error);
      return {
        totalOrders: 0,
        totalSpent: 0,
        statusCounts: {},
        recentOrders: [],
        averageOrderValue: 0
      };
    }
  }

  // Filter orders
  async filterOrders(filters = {}) {
    try {
      const userId = this.getCurrentUserId();
      const ordersRef = collection(db, 'orders');
      let q = query(
        ordersRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      // Note: Firebase doesn't support complex filtering in a single query
      // We'll fetch all orders and filter in memory for now
      const querySnapshot = await getDocs(q);
      let orders = [];
      
      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
          estimatedDelivery: doc.data().estimatedDelivery?.toDate?.()?.toISOString() || doc.data().estimatedDelivery,
        });
      });

      // Apply filters in memory
      if (filters.status) {
        orders = orders.filter(order => order.status === filters.status);
      }

      if (filters.dateFrom) {
        orders = orders.filter(order => new Date(order.createdAt) >= new Date(filters.dateFrom));
      }

      if (filters.dateTo) {
        orders = orders.filter(order => new Date(order.createdAt) <= new Date(filters.dateTo));
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        orders = orders.filter(order => 
          order.orderNumber.toLowerCase().includes(searchTerm) ||
          order.trackingNumber.toLowerCase().includes(searchTerm) ||
          order.items.some(item => item.name.toLowerCase().includes(searchTerm))
        );
      }

      return orders;
    } catch (error) {
      console.error('Error filtering orders:', error);
      throw new Error('Siparişler filtrelenirken hata oluştu');
    }
  }

  // Create mock orders for new user (demo purposes)
  async createMockOrdersForUser(userId) {
    try {
      const batch = writeBatch(db);
      const now = new Date();
      
      const mockOrders = [
        {
          id: `${userId}_demo_1`,
          userId,
          orderNumber: this.generateOrderNumber(),
          trackingNumber: this.generateTrackingNumber(),
          status: 'delivered',
          createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          estimatedDelivery: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
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
            fullName: 'Ahmet Yılmaz',
            address: 'Atatürk Caddesi No: 123',
            city: 'İstanbul',
            district: 'Kadıköy',
            postalCode: '34710',
            phone: '+90 555 123 4567'
          },
          billingAddress: {
            fullName: 'Ahmet Yılmaz',
            address: 'Atatürk Caddesi No: 123',
            city: 'İstanbul',
            district: 'Kadıköy',
            postalCode: '34710'
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
          },
          statusHistory: [
            {
              status: 'confirmed',
              timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
              note: 'Sipariş onaylandı ve işleme alındı'
            },
            {
              status: 'delivered',
              timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
              note: 'Sipariş başarıyla teslim edildi'
            }
          ]
        },
        {
          id: `${userId}_demo_2`,
          userId,
          orderNumber: this.generateOrderNumber(),
          trackingNumber: this.generateTrackingNumber(),
          status: 'shipped',
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          estimatedDelivery: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
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
            fullName: 'Ahmet Yılmaz',
            address: 'Atatürk Caddesi No: 123',
            city: 'İstanbul',
            district: 'Kadıköy',
            postalCode: '34710',
            phone: '+90 555 123 4567'
          },
          billingAddress: {
            fullName: 'Ahmet Yılmaz',
            address: 'Atatürk Caddesi No: 123',
            city: 'İstanbul',
            district: 'Kadıköy',
            postalCode: '34710'
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
          },
          statusHistory: [
            {
              status: 'confirmed',
              timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
              note: 'Sipariş onaylandı ve işleme alındı'
            },
            {
              status: 'shipped',
              timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
              note: 'Sipariş kargo şirketine teslim edildi'
            }
          ]
        }
      ];

      // Add orders to batch
      mockOrders.forEach(order => {
        const orderRef = doc(db, 'orders', order.id);
        batch.set(orderRef, order);
      });

      // Commit batch
      await batch.commit();
      
      console.log('Mock orders created for user:', userId);
    } catch (error) {
      console.error('Error creating mock orders:', error);
    }
  }

  // Update user's order count
  async updateUserOrderCount(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const orders = await this.getOrders();
      
      await updateDoc(userRef, {
        orderCount: orders.length + 1,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.warn('Could not update user order count:', error);
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
    const deliveryDays = parseInt(shippingMethod?.estimatedDays?.toString().split('-')[1] || shippingMethod?.estimatedDays?.toString().split(' ')[0] || '3');
    const estimatedDate = new Date(today);
    estimatedDate.setDate(today.getDate() + deliveryDays);
    return estimatedDate;
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

  // Simulate order progression for demo
  simulateOrderProgress(orderId) {
    const progressSteps = [
      { status: 'preparing', delay: 2000 },
      { status: 'shipped', delay: 5000 },
      { status: 'out_for_delivery', delay: 8000 }
    ];

    progressSteps.forEach(({ status, delay }) => {
      setTimeout(async () => {
        try {
          await this.updateOrderStatus(orderId, status);
        } catch (error) {
          console.warn('Could not update order status in simulation:', error);
        }
      }, delay);
    });
  }
}

// Create singleton instance
const firebaseOrderService = new FirebaseOrderService();

export default firebaseOrderService;