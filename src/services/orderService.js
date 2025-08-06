import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { generateId } from '../utils/helpers';

class OrderService {
  constructor() {
    this.ordersCollection = 'orders';
  }

  // Otomatik ödeme işlemi
  async processAutomaticCheckout(cartData, userData) {
    try {
      console.log('🛒 Processing automatic checkout...', { 
        items: cartData.items.length, 
        total: cartData.totals?.total || 0,
        user: userData?.profile?.displayName || 'Anonymous'
      });

      // Sipariş verisini hazırla
      const orderData = {
        // Sipariş bilgileri
        orderId: generateId(),
        userId: userData?.profile?.id || userData?.id || userData?.uid || 'anonymous',
        userEmail: userData?.profile?.email || userData?.email || null,
        userName: userData?.profile?.displayName || userData?.displayName || 'Anonymous User',
        
        // Sepet bilgileri
        items: cartData.items.map(item => ({
          productId: item.productId,
          productName: item.productName || `Ürün ${item.productId}`,
          quantity: item.quantity,
          price: item.price || 0,
          total: (item.price || 0) * item.quantity
        })),
        
        // Finansal bilgiler
        subtotal: cartData.totals?.subtotal || 0,
        tax: cartData.totals?.tax || 0,
        shipping: cartData.totals?.shipping || 0,
        discount: cartData.totals?.discount || 0,
        total: cartData.totals?.total || 0,
        
        // Ödeme bilgileri
        paymentMethod: 'auto-pay',
        paymentStatus: 'completed',
        paymentDate: new Date().toISOString(),
        
        // Sipariş durumu
        orderStatus: 'confirmed',
        deliveryStatus: 'preparing',
        estimatedDelivery: this.calculateEstimatedDelivery(),
        
        // Metadata
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        orderSource: 'web-app',
        isAutomatic: true
      };

      console.log('📝 Order data prepared:', orderData);

      // Firebase'e sipariş kaydet
      const docRef = await addDoc(collection(db, this.ordersCollection), orderData);
      
      // Başarılı sipariş verisi
      const successOrder = {
        ...orderData,
        firebaseId: docRef.id,
        createdAt: new Date() // Local datetime for immediate display
      };

      console.log('✅ Order saved to Firebase:', docRef.id);

      // Sipariş başarı logu
      this.logOrderSuccess(successOrder);

      return {
        success: true,
        order: successOrder,
        message: 'Siparişiniz başarıyla alındı!'
      };

    } catch (error) {
      console.error('❌ Automatic checkout failed:', error);
      
      return {
        success: false,
        error: error.message,
        message: 'Sipariş işlemi sırasında hata oluştu. Lütfen tekrar deneyin.'
      };
    }
  }

  // Kullanıcının sipariş geçmişini getir
  async getUserOrderHistory(userId, limitCount = 10) {
    try {
      console.log('📋 Fetching order history for user:', userId);

      const q = query(
        collection(db, this.ordersCollection),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      
      const orders = [];
      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        });
      });

      console.log('✅ Order history fetched:', orders.length, 'orders');
      return orders;

    } catch (error) {
      console.error('❌ Error fetching order history:', error);
      return [];
    }
  }

  // Sipariş detaylarını getir
  async getOrderById(orderId) {
    try {
      const q = query(
        collection(db, this.ordersCollection),
        where('orderId', '==', orderId)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching order:', error);
      return null;
    }
  }

  // Sipariş geçmişinden AI analizi için veri hazırla
  prepareOrderDataForAI(orders) {
    if (!orders || orders.length === 0) {
      return {
        summary: 'Kullanıcının sipariş geçmişi bulunmuyor.',
        categories: [],
        averageOrderValue: 0,
        totalOrders: 0,
        preferences: {}
      };
    }

    const analysis = {
      totalOrders: orders.length,
      totalSpent: 0,
      categories: {},
      brands: {},
      priceRanges: {
        budget: 0,    // 0-1000
        mid: 0,       // 1000-5000  
        premium: 0    // 5000+
      },
      orderFrequency: this.calculateOrderFrequency(orders),
      lastOrderDate: orders[0]?.createdAt || new Date(),
      favoriteCategories: [],
      averageOrderValue: 0
    };

    // Siparişleri analiz et
    orders.forEach(order => {
      analysis.totalSpent += order.total || 0;

      // Ürün kategorilerini say
      order.items?.forEach(item => {
        const category = this.extractCategoryFromProduct(item);
        analysis.categories[category] = (analysis.categories[category] || 0) + item.quantity;
        
        // Fiyat aralığı analizi
        const itemTotal = item.total || (item.price * item.quantity);
        if (itemTotal < 1000) analysis.priceRanges.budget++;
        else if (itemTotal < 5000) analysis.priceRanges.mid++;
        else analysis.priceRanges.premium++;
      });
    });

    // Ortalama sipariş değeri
    analysis.averageOrderValue = analysis.totalSpent / analysis.totalOrders;

    // En sevilen kategoriler
    analysis.favoriteCategories = Object.entries(analysis.categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    return analysis;
  }

  // Yardımcı fonksiyonlar
  calculateEstimatedDelivery() {
    const now = new Date();
    const deliveryDate = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 gün sonra
    return deliveryDate.toISOString();
  }

  calculateOrderFrequency(orders) {
    if (orders.length < 2) return 'first-time';
    
    const firstOrder = new Date(orders[orders.length - 1].createdAt);
    const lastOrder = new Date(orders[0].createdAt);
    const daysBetween = (lastOrder - firstOrder) / (1000 * 60 * 60 * 24);
    const averageDaysBetweenOrders = daysBetween / (orders.length - 1);

    if (averageDaysBetweenOrders < 7) return 'very-frequent';
    if (averageDaysBetweenOrders < 30) return 'frequent';
    if (averageDaysBetweenOrders < 90) return 'regular';
    return 'occasional';
  }

  extractCategoryFromProduct(item) {
    // Ürün adından kategori çıkarmaya çalış
    const name = (item.productName || '').toLowerCase();
    
    if (name.includes('iphone') || name.includes('phone') || name.includes('telefon')) return 'Elektronik';
    if (name.includes('laptop') || name.includes('computer') || name.includes('bilgisayar')) return 'Bilgisayar';
    if (name.includes('shirt') || name.includes('gömlek') || name.includes('tshirt')) return 'Giyim';
    if (name.includes('shoe') || name.includes('ayakkab')) return 'Ayakkabı';
    if (name.includes('book') || name.includes('kitap')) return 'Kitap';
    if (name.includes('headphone') || name.includes('kulaklık')) return 'Aksesuar';
    
    return 'Genel';
  }

  logOrderSuccess(order) {
    console.log('🎉 Order Success Summary:');
    console.log(`   📦 Order ID: ${order.orderId}`);
    console.log(`   👤 Customer: ${order.userName}`);
    console.log(`   💰 Total: ₺${order.total}`);
    console.log(`   📱 Items: ${order.items.length} products`);
    console.log(`   ⏰ Date: ${new Date(order.paymentDate).toLocaleString('tr-TR')}`);
    console.log(`   🚀 Status: ${order.orderStatus}`);
  }

  // Sipariş istatistikleri
  async getOrderStats(userId) {
    try {
      const orders = await this.getUserOrderHistory(userId, 100); // Son 100 sipariş
      
      if (orders.length === 0) {
        return {
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          lastOrderDate: null
        };
      }

      const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      
      return {
        totalOrders: orders.length,
        totalSpent,
        averageOrderValue: totalSpent / orders.length,
        lastOrderDate: orders[0].createdAt
      };

    } catch (error) {
      console.error('❌ Error getting order stats:', error);
      return {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        lastOrderDate: null
      };
    }
  }
}

// Singleton instance
let orderServiceInstance = null;

export function getOrderService() {
  if (!orderServiceInstance) {
    orderServiceInstance = new OrderService();
  }
  return orderServiceInstance;
}

export default OrderService;