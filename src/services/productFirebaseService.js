import FirebaseService from './firebaseService';
import { SAMPLE_PRODUCTS } from '../data/products';

class ProductFirebaseService {
  // Initialize products in Firebase Firestore
  static async initializeProducts() {
    try {
      console.log('Starting product initialization in Firebase...');
      
      // Check existing products
      const existingProducts = await FirebaseService.getProducts();
      console.log(`Found ${existingProducts.length} existing products in Firebase`);
      
      if (existingProducts.length === 0) {
        // Migrate sample products to Firebase
        await this.migrateProductsToFirebase();
      }
      
      // Add additional products
      await this.addAdditionalProducts();
      
      console.log('Product initialization completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error initializing products:', error);
      throw error;
    }
  }

  // Migrate existing sample products to Firebase
  static async migrateProductsToFirebase() {
    try {
      console.log('Migrating sample products to Firebase...');
      
      for (const product of SAMPLE_PRODUCTS) {
        const firebaseProduct = {
          ...product,
          firebaseId: product.id.toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await FirebaseService.createProduct(firebaseProduct);
        console.log(`Migrated product: ${product.name}`);
      }
      
      console.log('Sample products migration completed');
    } catch (error) {
      console.error('Error migrating products:', error);
      throw error;
    }
  }

  // Add more products to diversify the catalog
  static async addAdditionalProducts() {
    try {
      console.log('Adding additional products...');
      
      const additionalProducts = [
        {
          id: 7,
          name: 'Samsung Galaxy S24 Ultra',
          slug: 'samsung-galaxy-s24-ultra',
          price: 48999,
          originalPrice: 51999,
          discount: 6,
          category: 'electronics',
          subcategory: 'smartphones',
          brand: 'Samsung',
          rating: 4.7,
          reviewCount: 892,
          stock: 20,
          images: [
            'https://picsum.photos/500/500?random=100',
            'https://picsum.photos/500/500?random=101',
            'https://picsum.photos/500/500?random=102'
          ],
          description: 'Flagship Android smartphone with S Pen and advanced camera system',
          shortDescription: 'Premium Android phone with built-in S Pen stylus',
          features: [
            'S Pen integrated stylus',
            '200MP main camera',
            '6.8-inch Dynamic AMOLED display',
            'Snapdragon 8 Gen 3 processor',
            '5000mAh battery'
          ],
          specifications: {
            'Display': '6.8-inch Dynamic AMOLED 2X',
            'Processor': 'Snapdragon 8 Gen 3',
            'Camera': '200MP Main, 50MP Periscope Telephoto',
            'Storage': '256GB',
            'Battery': '5000mAh',
            'Operating System': 'Android 14'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Phantom Black', 'Phantom Silver', 'Phantom Violet'] },
            { id: 'storage', name: 'Depolama', options: ['256GB', '512GB', '1TB'] }
          ],
          tags: ['yeni', 'android', 's-pen', 'premium'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 8,
          name: 'Dell XPS 13',
          slug: 'dell-xps-13',
          price: 38999,
          originalPrice: 41999,
          discount: 7,
          category: 'electronics',
          subcategory: 'laptops',
          brand: 'Dell',
          rating: 4.6,
          reviewCount: 654,
          stock: 15,
          images: [
            'https://picsum.photos/500/500?random=103',
            'https://picsum.photos/500/500?random=104',
            'https://picsum.photos/500/500?random=105'
          ],
          description: 'Premium ultrabook with InfinityEdge display and long battery life',
          shortDescription: 'Compact laptop with virtually borderless display',
          features: [
            '13.4-inch InfinityEdge display',
            'Intel Core i7-1355U processor',
            '16GB LPDDR5 RAM',
            'Up to 12 hours battery life',
            'Compact and lightweight design'
          ],
          specifications: {
            'Display': '13.4-inch FHD+ InfinityEdge',
            'Processor': 'Intel Core i7-1355U',
            'Memory': '16GB LPDDR5',
            'Storage': '512GB SSD',
            'Battery': 'Up to 12 hours',
            'Weight': '1.2 kg'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Platinum Silver', 'Graphite'] },
            { id: 'memory', name: 'Bellek', options: ['16GB', '32GB'] },
            { id: 'storage', name: 'Depolama', options: ['512GB', '1TB'] }
          ],
          tags: ['ultrabook', 'compact', 'premium', 'business'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 9,
          name: 'Adidas Ultraboost 22',
          slug: 'adidas-ultraboost-22',
          price: 4999,
          originalPrice: 5999,
          discount: 17,
          category: 'clothing',
          subcategory: 'shoes',
          brand: 'Adidas',
          rating: 4.5,
          reviewCount: 1523,
          stock: 35,
          images: [
            'https://picsum.photos/500/500?random=106',
            'https://picsum.photos/500/500?random=107',
            'https://picsum.photos/500/500?random=108'
          ],
          description: 'High-performance running shoe with responsive Boost cushioning',
          shortDescription: 'Energy-returning running shoe with Primeknit upper',
          features: [
            'Boost midsole technology',
            'Primeknit upper',
            'Continental Rubber outsole',
            'Sock-like fit',
            'Energy return with every step'
          ],
          specifications: {
            'Upper': 'Primeknit textile',
            'Midsole': 'Boost foam',
            'Outsole': 'Continental Rubber',
            'Drop': '10mm',
            'Weight': '310g (size 9)'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Core Black', 'Cloud White', 'Solar Red', 'Navy Blue'] },
            { id: 'size', name: 'Numara', options: ['38', '39', '40', '41', '42', '43', '44', '45', '46'] }
          ],
          tags: ['koşu', 'spor', 'boost', 'rahat'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 10,
          name: 'Bose QuietComfort Earbuds',
          slug: 'bose-quietcomfort-earbuds',
          price: 7999,
          originalPrice: 8999,
          discount: 11,
          category: 'electronics',
          subcategory: 'audio',
          brand: 'Bose',
          rating: 4.4,
          reviewCount: 467,
          stock: 25,
          images: [
            'https://picsum.photos/500/500?random=109',
            'https://picsum.photos/500/500?random=110',
            'https://picsum.photos/500/500?random=111'
          ],
          description: 'True wireless earbuds with world-class noise cancellation',
          shortDescription: 'Premium wireless earbuds with excellent noise cancellation',
          features: [
            'Active noise cancellation',
            '6 hours battery + 12 hours with case',
            'Weather and sweat resistant',
            'Touch controls',
            'Quick 15-minute charge = 2 hours'
          ],
          specifications: {
            'Driver': 'Full-range',
            'Connectivity': 'Bluetooth 5.1',
            'Battery': '6 + 12 hours',
            'Charging': 'USB-C',
            'Water Resistance': 'IPX4'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Triple Black', 'Soapstone', 'Glacier White'] }
          ],
          tags: ['wireless', 'noise-canceling', 'premium', 'spor'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 11,
          name: 'IKEA BILLY Bookcase',
          slug: 'ikea-billy-bookcase',
          price: 899,
          originalPrice: 999,
          discount: 10,
          category: 'home_garden',
          subcategory: 'furniture',
          brand: 'IKEA',
          rating: 4.3,
          reviewCount: 2847,
          stock: 50,
          images: [
            'https://picsum.photos/500/500?random=112',
            'https://picsum.photos/500/500?random=113',
            'https://picsum.photos/500/500?random=114'
          ],
          description: 'Classic bookcase with adjustable shelves for flexible storage',
          shortDescription: 'Versatile bookcase with adjustable shelves',
          features: [
            'Adjustable shelves',
            'Easy to assemble',
            'Surface treated with wood stain',
            'Can be extended with height extension unit',
            'Classic design fits any room'
          ],
          specifications: {
            'Width': '80 cm',
            'Depth': '28 cm',
            'Height': '202 cm',
            'Material': 'Particleboard, Paper foil',
            'Adjustable shelves': '4 pieces'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['White', 'Brown ash veneer', 'Black-brown'] },
            { id: 'size', name: 'Boyut', options: ['80x28x202 cm', '40x28x202 cm'] }
          ],
          tags: ['kitaplık', 'depolama', 'klasik', 'uygun-fiyat'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 12,
          name: 'Dune: Complete Series',
          slug: 'dune-complete-series',
          price: 149,
          originalPrice: 199,
          discount: 25,
          category: 'books',
          subcategory: 'fiction',
          brand: 'Ace Books',
          rating: 4.6,
          reviewCount: 1876,
          stock: 75,
          images: [
            'https://picsum.photos/500/500?random=115',
            'https://picsum.photos/500/500?random=116',
            'https://picsum.photos/500/500?random=117'
          ],
          description: 'Epic science fiction saga set in a distant future universe',
          shortDescription: 'Complete collection of Frank Herbert\'s legendary sci-fi series',
          features: [
            'All 6 original novels',
            'Premium box set edition',
            'Author introduction',
            'Maps and appendices',
            'Collector\'s edition'
          ],
          specifications: {
            'Books': '6 novels',
            'Pages': '3000+ total',
            'Language': 'Turkish',
            'Publisher': 'Ace Books',
            'Format': 'Paperback box set'
          },
          variants: [
            { id: 'format', name: 'Format', options: ['Paperback Box Set', 'Hardcover Box Set', 'E-book Collection'] }
          ],
          tags: ['sci-fi', 'klasik', 'epic', 'koleksiyon'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 13,
          name: 'Wilson Pro Staff Tennis Racket',
          slug: 'wilson-pro-staff-tennis-racket',
          price: 2499,
          originalPrice: 2999,
          discount: 17,
          category: 'sports',
          subcategory: 'tennis',
          brand: 'Wilson',
          rating: 4.7,
          reviewCount: 543,
          stock: 18,
          images: [
            'https://picsum.photos/500/500?random=118',
            'https://picsum.photos/500/500?random=119',
            'https://picsum.photos/500/500?random=120'
          ],
          description: 'Professional tennis racket with precision control and power',
          shortDescription: 'Pro-level tennis racket for advanced players',
          features: [
            'Graphite construction',
            '100 sq inch head size',
            'Precision control',
            'Professional grip size',
            'Tour-level performance'
          ],
          specifications: {
            'Head Size': '100 sq in',
            'Weight': '315g unstrung',
            'String Pattern': '16x19',
            'Grip Size': '4 1/4',
            'Material': 'Graphite'
          },
          variants: [
            { id: 'grip', name: 'Grip Boyutu', options: ['4 1/8', '4 1/4', '4 3/8', '4 1/2'] },
            { id: 'string', name: 'Germe', options: ['Gerdirili', 'Gerdiriesiz'] }
          ],
          tags: ['tenis', 'professional', 'graphite', 'kontrol'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 14,
          name: 'Clinique Dramatically Different Moisturizing Lotion',
          slug: 'clinique-dramatically-different-moisturizing-lotion',
          price: 899,
          originalPrice: 1099,
          discount: 18,
          category: 'beauty',
          subcategory: 'skincare',
          brand: 'Clinique',
          rating: 4.4,
          reviewCount: 2156,
          stock: 60,
          images: [
            'https://picsum.photos/500/500?random=121',
            'https://picsum.photos/500/500?random=122',
            'https://picsum.photos/500/500?random=123'
          ],
          description: 'Lightweight, oil-free moisturizer for balanced skin hydration',
          shortDescription: 'Daily moisturizer suitable for all skin types',
          features: [
            'Oil-free formula',
            'All skin types',
            'Lightweight texture',
            'Quick absorption',
            'Dermatologist tested'
          ],
          specifications: {
            'Volume': '125ml',
            'Type': 'Lotion',
            'Skin Type': 'All skin types',
            'Formula': 'Oil-free',
            'Usage': 'Daily moisturizer'
          },
          variants: [
            { id: 'size', name: 'Boyut', options: ['50ml', '125ml', '200ml'] },
            { id: 'type', name: 'Tip', options: ['Lotion', 'Gel', 'Cream'] }
          ],
          tags: ['moisturizer', 'oil-free', 'daily-care', 'all-skin-types'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 15,
          name: 'H&M Oversized Hoodie',
          slug: 'hm-oversized-hoodie',
          price: 399,
          originalPrice: 499,
          discount: 20,
          category: 'clothing',
          subcategory: 'hoodies',
          brand: 'H&M',
          rating: 4.2,
          reviewCount: 834,
          stock: 45,
          images: [
            'https://picsum.photos/500/500?random=124',
            'https://picsum.photos/500/500?random=125',
            'https://picsum.photos/500/500?random=126'
          ],
          description: 'Rahat kesimli kapüşonlu sweatshirt, günlük kullanım için ideal',
          shortDescription: 'Oversized kesimli pamuklu hoodie',
          features: [
            '100% pamuk kumaş',
            'Oversized kesim',
            'Kanguru cep',
            'Ayarlanabilir kapüşon',
            'Yumuşak iç astar'
          ],
          specifications: {
            'Kumaş': '100% Pamuk',
            'Kesim': 'Oversized',
            'Yaka': 'Kapüşonlu',
            'Kol': 'Uzun kol',
            'Bakım': 'Makine yıkama 30°C'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Siyah', 'Beyaz', 'Gri', 'Lacivert', 'Bordo'] },
            { id: 'size', name: 'Beden', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] }
          ],
          tags: ['hoodie', 'casual', 'pamuk', 'rahat', 'günlük'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 16,
          name: 'Levi\'s 501 Original Jeans',
          slug: 'levis-501-original-jeans',
          price: 1299,
          originalPrice: 1599,
          discount: 19,
          category: 'clothing',
          subcategory: 'jeans',
          brand: 'Levi\'s',
          rating: 4.6,
          reviewCount: 2156,
          stock: 30,
          images: [
            'https://picsum.photos/500/500?random=127',
            'https://picsum.photos/500/500?random=128',
            'https://picsum.photos/500/500?random=129'
          ],
          description: 'Klasik straight fit jean, zamansız tarz ve dayanıklılık',
          shortDescription: 'Orijinal straight fit denim pantolon',
          features: [
            'Straight fit kesim',
            '100% pamuk denim',
            'Klasik 5 cep',
            'Düğme fly',
            'Shrink-to-fit denim'
          ],
          specifications: {
            'Kumaş': '100% Pamuk Denim',
            'Kesim': 'Straight Fit',
            'Yükselti': 'Normal bel',
            'Kapama': 'Düğme fly',
            'Bakım': 'Soğuk yıkama, ters çevir'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Stonewash', 'Dark Blue', 'Black', 'Light Blue'] },
            { id: 'size', name: 'Beden', options: ['28', '30', '32', '34', '36', '38', '40'] }
          ],
          tags: ['jeans', 'klasik', 'denim', 'straight-fit', 'pamuk'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 17,
          name: 'Zara Basic T-Shirt',
          slug: 'zara-basic-t-shirt',
          price: 149,
          originalPrice: 199,
          discount: 25,
          category: 'clothing',
          subcategory: 'tshirts',
          brand: 'Zara',
          rating: 4.1,
          reviewCount: 967,
          stock: 80,
          images: [
            'https://picsum.photos/500/500?random=130',
            'https://picsum.photos/500/500?random=131',
            'https://picsum.photos/500/500?random=132'
          ],
          description: 'Günlük kullanım için basic pamuklu tişört, her gardırobun vazgeçilmezi',
          shortDescription: 'Basic pamuklu t-shirt, çok renkli seçenekler',
          features: [
            '100% pamuk',
            'Slim fit kesim',
            'Yuvarlak yaka',
            'Kısa kollu',
            'Çok renkli seçenekler'
          ],
          specifications: {
            'Kumaş': '100% Pamuk',
            'Kesim': 'Slim Fit',
            'Yaka': 'Yuvarlak',
            'Kol': 'Kısa kol',
            'Bakım': 'Makine yıkama 40°C'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Beyaz', 'Siyah', 'Gri', 'Lacivert', 'Kırmızı', 'Yeşil', 'Sarı', 'Pembe'] },
            { id: 'size', name: 'Beden', options: ['XS', 'S', 'M', 'L', 'XL'] }
          ],
          tags: ['basic', 'tişört', 'pamuk', 'günlük', 'çok-renkli'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 18,
          name: 'Nike Air Force 1',
          slug: 'nike-air-force-1',
          price: 3999,
          originalPrice: 4499,
          discount: 11,
          category: 'clothing',
          subcategory: 'shoes',
          brand: 'Nike',
          rating: 4.7,
          reviewCount: 3421,
          stock: 25,
          images: [
            'https://picsum.photos/500/500?random=133',
            'https://picsum.photos/500/500?random=134',
            'https://picsum.photos/500/500?random=135'
          ],
          description: 'İkonik basketbol ayakkabısı, sokak modasının vazgeçilmezi',
          shortDescription: 'Klasik beyaz sneaker, zamansız tasarım',
          features: [
            'Deri üst malzeme',
            'Air-Sole unit yastıklama',
            'Dayanıklı kauçuk taban',
            'Klasik tasarım',
            'Her stile uygun'
          ],
          specifications: {
            'Üst Malzeme': 'Gerçek deri',
            'Taban': 'Kauçuk',
            'Yastıklama': 'Air-Sole',
            'Kapama': 'Bağcıklı',
            'Stil': 'Low-top'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Triple White', 'Triple Black', 'White/Black', 'White/Red'] },
            { id: 'size', name: 'Numara', options: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'] }
          ],
          tags: ['sneaker', 'klasik', 'beyaz', 'nike', 'basketbol'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 19,
          name: 'Mango Blazer Ceket',
          slug: 'mango-blazer-ceket',
          price: 799,
          originalPrice: 999,
          discount: 20,
          category: 'clothing',
          subcategory: 'blazers',
          brand: 'Mango',
          rating: 4.3,
          reviewCount: 456,
          stock: 22,
          images: [
            'https://picsum.photos/500/500?random=136',
            'https://picsum.photos/500/500?random=137',
            'https://picsum.photos/500/500?random=138'
          ],
          description: 'Şık blazer ceket, iş ve günlük kullanım için mükemmel',
          shortDescription: 'Klasik kesim blazer, çok amaçlı kullanım',
          features: [
            'Tailored kesim',
            'Tek düğme kapama',
            'Lined iç astar',
            'Shoulder pads',
            'İş ve casual uyum'
          ],
          specifications: {
            'Kumaş': 'Polyester Blend',
            'Kesim': 'Tailored',
            'Kapama': 'Tek düğme',
            'Astar': 'Polyester',
            'Bakım': 'Kuru temizleme'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Siyah', 'Lacivert', 'Kahverengi', 'Gri'] },
            { id: 'size', name: 'Beden', options: ['XS', 'S', 'M', 'L', 'XL'] }
          ],
          tags: ['blazer', 'şık', 'iş', 'formal', 'ceket'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 20,
          name: 'Adidas Originals Track Pants',
          slug: 'adidas-originals-track-pants',
          price: 699,
          originalPrice: 899,
          discount: 22,
          category: 'clothing',
          subcategory: 'pants',
          brand: 'Adidas',
          rating: 4.4,
          reviewCount: 723,
          stock: 35,
          images: [
            'https://picsum.photos/500/500?random=139',
            'https://picsum.photos/500/500?random=140',
            'https://picsum.photos/500/500?random=141'
          ],
          description: 'Sporty track pantolon, rahat kesim ve üç çizgi detayı',
          shortDescription: 'Klasik eşofman altı, streetwear tarzı',
          features: [
            'İkonik 3 çizgi',
            'Elastik bel',
            'Tapered kesim',
            'Polyester kumaş',
            'Streetwear stil'
          ],
          specifications: {
            'Kumaş': '100% Polyester',
            'Kesim': 'Tapered',
            'Kapama': 'Elastik bel',
            'Cep': '2 yan cep',
            'Bakım': 'Makine yıkama 30°C'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Siyah', 'Lacivert', 'Bordo', 'Yeşil'] },
            { id: 'size', name: 'Beden', options: ['S', 'M', 'L', 'XL', 'XXL'] }
          ],
          tags: ['track-pants', 'spor', 'streetwear', 'adidas', 'eşofman'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 21,
          name: 'Koton Boyfriend Gömlek',
          slug: 'koton-boyfriend-gomlek',
          price: 299,
          originalPrice: 399,
          discount: 25,
          category: 'clothing',
          subcategory: 'shirts',
          brand: 'Koton',
          rating: 4.0,
          reviewCount: 542,
          stock: 40,
          images: [
            'https://picsum.photos/500/500?random=21',
            'https://picsum.photos/500/500?random=21a',
            'https://picsum.photos/500/500?random=21b'
          ],
          description: 'Oversize boyfriend gömlek, rahat ve şık kullanım',
          shortDescription: 'Oversize kesimli pamuklu gömlek',
          features: [
            'Boyfriend kesim',
            '100% pamuk',
            'Uzun kollu',
            'Düğmeli ön',
            'Casual stil'
          ],
          specifications: {
            'Kumaş': '100% Pamuk',
            'Kesim': 'Boyfriend/Oversize',
            'Kol': 'Uzun',
            'Kapama': 'Düğmeli',
            'Bakım': 'Makine yıkama 40°C'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Beyaz', 'Açık Mavi', 'Pembe', 'Sarı'] },
            { id: 'size', name: 'Beden', options: ['XS', 'S', 'M', 'L'] }
          ],
          tags: ['gömlek', 'boyfriend', 'oversize', 'pamuk', 'casual'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 22,
          name: 'LC Waikiki Skinny Jean',
          slug: 'lc-waikiki-skinny-jean',
          price: 199,
          originalPrice: 249,
          discount: 20,
          category: 'clothing',
          subcategory: 'jeans',
          brand: 'LC Waikiki',
          rating: 3.9,
          reviewCount: 1234,
          stock: 60,
          images: [
            'https://picsum.photos/500/500?random=22',
            'https://picsum.photos/500/500?random=22a',
            'https://picsum.photos/500/500?random=22b'
          ],
          description: 'Uygun fiyatlı skinny jean, gençler için ideal seçim',
          shortDescription: 'Budget-friendly skinny fit denim',
          features: [
            'Skinny fit',
            'Stretch denim',
            'Normal bel',
            'Klasik 5 cep',
            'Uygun fiyat'
          ],
          specifications: {
            'Kumaş': '98% Pamuk, 2% Elastan',
            'Kesim': 'Skinny Fit',
            'Yükselti': 'Normal bel',
            'Kapama': 'Fermuarlı',
            'Bakım': 'Makine yıkama 30°C'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Koyu Mavi', 'Siyah', 'Gri', 'Açık Mavi'] },
            { id: 'size', name: 'Beden', options: ['26', '28', '30', '32', '34', '36'] }
          ],
          tags: ['skinny', 'jean', 'uygun-fiyat', 'stretch', 'genç'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 23,
          name: 'Puma Suede Classic',
          slug: 'puma-suede-classic',
          price: 2799,
          originalPrice: 3299,
          discount: 15,
          category: 'clothing',
          subcategory: 'shoes',
          brand: 'Puma',
          rating: 4.5,
          reviewCount: 892,
          stock: 28,
          images: [
            'https://picsum.photos/500/500?random=142',
            'https://picsum.photos/500/500?random=143',
            'https://picsum.photos/500/500?random=144'
          ],
          description: 'Retro basketbol ayakkabısı, süet malzeme ile vintage tarz',
          shortDescription: 'Klasik süet sneaker, retro tasarım',
          features: [
            'Süet üst malzeme',
            'Retro basketbol tasarımı',
            'Kauçuk taban',
            'Klasik Puma şeridi',
            'Rahat fit'
          ],
          specifications: {
            'Üst Malzeme': 'Süet deri',
            'Taban': 'Kauçuk',
            'Astar': 'Tekstil',
            'Kapama': 'Bağcıklı',
            'Stil': 'Low-top retro'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Peacoat', 'Rhubarb', 'Classic Blue', 'Forest Night', 'High Risk Red'] },
            { id: 'size', name: 'Numara', options: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'] }
          ],
          tags: ['suede', 'retro', 'klasik', 'basketbol', 'vintage'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 24,
          name: 'Defacto Kadın Elbise',
          slug: 'defacto-kadin-elbise',
          price: 259,
          originalPrice: 349,
          discount: 26,
          category: 'clothing',
          subcategory: 'dresses',
          brand: 'DeFacto',
          rating: 4.1,
          reviewCount: 1567,
          stock: 55,
          images: [
            'https://picsum.photos/500/500?random=145',
            'https://picsum.photos/500/500?random=146',
            'https://picsum.photos/500/500?random=147'
          ],
          description: 'Günlük kullanım için rahat midi elbise, çok renkli seçenekler',
          shortDescription: 'Rahat kesimli midi elbise, çiçekli desenler',
          features: [
            'Midi boy',
            'A-line kesim',
            'Kısa kollu',
            'Çiçekli desenler',
            'Rahat kumaş'
          ],
          specifications: {
            'Kumaş': '95% Polyester, 5% Elastan',
            'Kesim': 'A-line',
            'Boy': 'Midi',
            'Kol': 'Kısa kol',
            'Bakım': 'Makine yıkama 30°C'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Çiçekli Kırmızı', 'Çiçekli Mavi', 'Çiçekli Pembe', 'Düz Siyah', 'Düz Lacivert'] },
            { id: 'size', name: 'Beden', options: ['XS', 'S', 'M', 'L', 'XL'] }
          ],
          tags: ['elbise', 'midi', 'çiçekli', 'günlük', 'kadın'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 25,
          name: 'Columbia Windbreaker',
          slug: 'columbia-windbreaker',
          price: 899,
          originalPrice: 1199,
          discount: 25,
          category: 'clothing',
          subcategory: 'jackets',
          brand: 'Columbia',
          rating: 4.4,
          reviewCount: 423,
          stock: 20,
          images: [
            'https://picsum.photos/500/500?random=148',
            'https://picsum.photos/500/500?random=149',
            'https://picsum.photos/500/500?random=150'
          ],
          description: 'Hafif rüzgarlık ceket, outdoor aktiviteler için ideal',
          shortDescription: 'Su geçirmez rüzgarlık, paketlenebilir',
          features: [
            'Su geçirmez',
            'Rüzgar geçirmez',
            'Paketlenebilir',
            'Kapüşonlu',
            'Hafif kumaş'
          ],
          specifications: {
            'Kumaş': 'Polyester ripstop',
            'Su geçirmezlik': 'DWR kaplama',
            'Kapüşon': 'Ayarlanabilir',
            'Cep': '2 fermuar cep',
            'Ağırlık': '200g'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Navy', 'Bright Green', 'Orange', 'Black'] },
            { id: 'size', name: 'Beden', options: ['S', 'M', 'L', 'XL', 'XXL'] }
          ],
          tags: ['outdoor', 'rüzgarlık', 'su-geçirmez', 'hafif', 'paketlenebilir'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 26,
          name: 'Marks & Spencer Yün Kazak',
          slug: 'marks-spencer-yun-kazak',
          price: 699,
          originalPrice: 899,
          discount: 22,
          category: 'clothing',
          subcategory: 'sweaters',
          brand: 'Marks & Spencer',
          rating: 4.3,
          reviewCount: 756,
          stock: 35,
          images: [
            'https://picsum.photos/500/500?random=151',
            'https://picsum.photos/500/500?random=152',
            'https://picsum.photos/500/500?random=153'
          ],
          description: 'Merino yün kazak, sıcak ve şık kış seçimi',
          shortDescription: 'Merino yün triko, V yaka',
          features: [
            '100% Merino yün',
            'V yaka',
            'Ince örme',
            'Sıcak tutan',
            'Yumuşak dokum'
          ],
          specifications: {
            'Kumaş': '100% Merino Yün',
            'Yaka': 'V yaka',
            'Kol': 'Uzun kol',
            'Örme': 'İnce gauge',
            'Bakım': 'El yıkama'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Camel', 'Navy', 'Charcoal', 'Cream', 'Burgundy'] },
            { id: 'size', name: 'Beden', options: ['S', 'M', 'L', 'XL'] }
          ],
          tags: ['kazak', 'yün', 'merino', 'kış', 'şık'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 27,
          name: 'Converse Chuck Taylor All Star',
          slug: 'converse-chuck-taylor-all-star',
          price: 1999,
          originalPrice: 2299,
          discount: 13,
          category: 'clothing',
          subcategory: 'shoes',
          brand: 'Converse',
          rating: 4.6,
          reviewCount: 4521,
          stock: 40,
          images: [
            'https://picsum.photos/500/500?random=154',
            'https://picsum.photos/500/500?random=155',
            'https://picsum.photos/500/500?random=156'
          ],
          description: 'Efsanevi canvas sneaker, sokak stilinin ikonu',
          shortDescription: 'Klasik high-top canvas ayakkabı',
          features: [
            'Canvas üst malzeme',
            'High-top tasarım',
            'İkonik yıldız logosu',
            'Kauçuk taban',
            'Zamansız stil'
          ],
          specifications: {
            'Üst Malzeme': 'Canvas',
            'Taban': 'Vulkanize kauçuk',
            'Astar': 'Tekstil',
            'Kapama': 'Bağcıklı',
            'Stil': 'High-top'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Optical White', 'Black', 'Red', 'Navy', 'Pink', 'Yellow'] },
            { id: 'size', name: 'Numara', options: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44'] }
          ],
          tags: ['converse', 'canvas', 'high-top', 'klasik', 'streetwear'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 28,
          name: 'Pull & Bear Crop Top',
          slug: 'pull-bear-crop-top',
          price: 179,
          originalPrice: 229,
          discount: 22,
          category: 'clothing',
          subcategory: 'tops',
          brand: 'Pull & Bear',
          rating: 3.9,
          reviewCount: 634,
          stock: 65,
          images: [
            'https://picsum.photos/500/500?random=157',
            'https://picsum.photos/500/500?random=158',
            'https://picsum.photos/500/500?random=159'
          ],
          description: 'Trendy crop top, yaz için ideal kısa üst',
          shortDescription: 'Kısa kesim üst, genç tarz',
          features: [
            'Crop kesim',
            'Pamuk karışımı',
            'Kısa kollu',
            'Rahat fit',
            'Trend renklerde'
          ],
          specifications: {
            'Kumaş': '60% Pamuk, 40% Polyester',
            'Kesim': 'Crop',
            'Kol': 'Kısa kol',
            'Fit': 'Regular',
            'Bakım': 'Makine yıkama 30°C'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['White', 'Black', 'Pink', 'Mint Green', 'Lilac', 'Orange'] },
            { id: 'size', name: 'Beden', options: ['XS', 'S', 'M', 'L'] }
          ],
          tags: ['crop-top', 'trend', 'yaz', 'genç', 'kısa'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 29,
          name: 'Mavi Erkek Chino Pantolon',
          slug: 'mavi-erkek-chino-pantolon',
          price: 449,
          originalPrice: 599,
          discount: 25,
          category: 'clothing',
          subcategory: 'pants',
          brand: 'Mavi',
          rating: 4.2,
          reviewCount: 987,
          stock: 45,
          images: [
            'https://picsum.photos/500/500?random=160',
            'https://picsum.photos/500/500?random=161',
            'https://picsum.photos/500/500?random=162'
          ],
          description: 'Klasik chino pantolon, iş ve günlük kullanım için uygun',
          shortDescription: 'Düz paça chino, çok amaçlı kullanım',
          features: [
            'Pamuk twill kumaş',
            'Düz paça',
            'Normal bel',
            'Klasik kesim',
            'Çok renkli seçenek'
          ],
          specifications: {
            'Kumaş': '97% Pamuk, 3% Elastan',
            'Kesim': 'Regular Fit',
            'Yükselti': 'Normal bel',
            'Kapama': 'Fermuarlı',
            'Bakım': 'Makine yıkama 40°C'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Khaki', 'Navy', 'Black', 'Olive', 'Stone', 'Burgundy'] },
            { id: 'size', name: 'Beden', options: ['30', '32', '34', '36', '38', '40'] }
          ],
          tags: ['chino', 'pamuk', 'klasik', 'iş', 'günlük'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 30,
          name: 'Bershka Denim Ceket',
          slug: 'bershka-denim-ceket',
          price: 399,
          originalPrice: 499,
          discount: 20,
          category: 'clothing',
          subcategory: 'jackets',
          brand: 'Bershka',
          rating: 4.1,
          reviewCount: 1245,
          stock: 30,
          images: [
            'https://picsum.photos/500/500?random=163',
            'https://picsum.photos/500/500?random=164',
            'https://picsum.photos/500/500?random=165'
          ],
          description: 'Vintage tarz denim ceket, her mevsim kullanılabilir',
          shortDescription: 'Klasik kot ceket, vintage yıkama',
          features: [
            '100% pamuk denim',
            'Klasik kesim',
            'Düğmeli ön',
            'Göğüs cepleri',
            'Vintage yıkama'
          ],
          specifications: {
            'Kumaş': '100% Pamuk Denim',
            'Yıkama': 'Vintage stonewash',
            'Kapama': 'Düğmeli',
            'Cep': '4 cep',
            'Bakım': 'Makine yıkama 30°C'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Light Blue', 'Dark Blue', 'Black', 'White'] },
            { id: 'size', name: 'Beden', options: ['XS', 'S', 'M', 'L', 'XL'] }
          ],
          tags: ['denim', 'kot-ceket', 'vintage', 'klasik', 'pamuk'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 31,
          name: 'Vans Old Skool',
          slug: 'vans-old-skool',
          price: 2499,
          originalPrice: 2899,
          discount: 14,
          category: 'clothing',
          subcategory: 'shoes',
          brand: 'Vans',
          rating: 4.5,
          reviewCount: 2876,
          stock: 35,
          images: [
            'https://picsum.photos/500/500?random=166',
            'https://picsum.photos/500/500?random=167',
            'https://picsum.photos/500/500?random=168'
          ],
          description: 'Skate kültürünün ikonu, yan şerit detaylı sneaker',
          shortDescription: 'Klasik skate ayakkabısı, yan şerit',
          features: [
            'Suede ve canvas kombinasyonu',
            'İkonik yan şerit',
            'Waffle taban',
            'Skate performansı',
            'Dayanıklı yapı'
          ],
          specifications: {
            'Üst Malzeme': 'Suede/Canvas',
            'Taban': 'Waffle rubber',
            'Kapama': 'Bağcıklı',
            'Stil': 'Low-top skate',
            'Özellik': 'Yan şerit detayı'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Black/White', 'Navy/White', 'Burgundy/White', 'Green/White', 'Grey/White'] },
            { id: 'size', name: 'Numara', options: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'] }
          ],
          tags: ['vans', 'skate', 'streetwear', 'yan-şerit', 'klasik'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        },
        {
          id: 32,
          name: 'Reserved Kadın Trençkot',
          slug: 'reserved-kadin-trenckot',
          price: 1299,
          originalPrice: 1699,
          discount: 24,
          category: 'clothing',
          subcategory: 'coats',
          brand: 'Reserved',
          rating: 4.4,
          reviewCount: 567,
          stock: 18,
          images: [
            'https://picsum.photos/500/500?random=169',
            'https://picsum.photos/500/500?random=170',
            'https://picsum.photos/500/500?random=171'
          ],
          description: 'Klasik trençkot, zamansız şıklık ve fonksiyonellik',
          shortDescription: 'Double-breasted trençkot, klasik kesim',
          features: [
            'Double-breasted',
            'Su itici kumaş',
            'Kemerli',
            'Omuzda detay',
            'Midi boy'
          ],
          specifications: {
            'Kumaş': 'Polyester blend',
            'Boy': 'Midi',
            'Kapama': 'Double-breasted',
            'Kemer': 'Kuşak kemer',
            'Bakım': 'Kuru temizleme'
          },
          variants: [
            { id: 'color', name: 'Renk', options: ['Beige', 'Navy', 'Black', 'Khaki'] },
            { id: 'size', name: 'Beden', options: ['S', 'M', 'L', 'XL'] }
          ],
          tags: ['trençkot', 'klasik', 'şık', 'kemer', 'midi'],
          aiGenerated: {
            description: true,
            tags: true,
            recommendations: true
          }
        }
      ];

      // Add each additional product to Firebase
      for (const product of additionalProducts) {
        try {
          const firebaseProduct = {
            ...product,
            firebaseId: product.id.toString(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await FirebaseService.createProduct(firebaseProduct);
          console.log(`Added product: ${product.name}`);
        } catch (error) {
          console.error(`Error adding product ${product.name}:`, error);
        }
      }
      
      console.log('Additional products added successfully');
    } catch (error) {
      console.error('Error adding additional products:', error);
      throw error;
    }
  }

  // Get all products from Firebase
  static async getAllProducts(filters = {}) {
    try {
      console.log('ProductFirebaseService: Getting products with filters:', filters);
      const products = await FirebaseService.getProducts(filters);
      console.log('ProductFirebaseService: Fetched unique products:', products.length);
      if (products.length > 0) {
        console.log('First product example:', products[0]);
      }
      return products;
    } catch (error) {
      console.error('Error getting products from Firebase:', error);
      // Return empty array instead of throwing error to allow fallback
      return [];
    }
  }

  // Get single product from Firebase
  static async getProduct(productId) {
    try {
      return await FirebaseService.getProduct(productId);
    } catch (error) {
      console.error('Error getting product from Firebase:', error);
      throw error;
    }
  }

  // Search products in Firebase
  static async searchProducts(query, filters = {}) {
    try {
      const allProducts = await FirebaseService.getProducts(filters);
      
      if (!query || query.trim().length < 2) {
        return allProducts;
      }

      const searchLower = query.toLowerCase();
      return allProducts.filter(product =>
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  // Get products by category from Firebase
  static async getProductsByCategory(category, limit) {
    try {
      const filters = { category };
      if (limit) filters.limit = limit;
      
      const products = await FirebaseService.getProducts(filters);
      return products; // Already deduplicated in FirebaseService
    } catch (error) {
      console.error('Error getting products by category:', error);
      return [];
    }
  }

  // Get featured products from Firebase
  static async getFeaturedProducts(limit = 6) {
    try {
      const allProducts = await FirebaseService.getProducts();
      
      return allProducts
        .filter(product => 
          (product.tags && product.tags.includes('popüler')) || 
          product.rating >= 4.5
        )
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting featured products:', error);
      return [];
    }
  }

  // Get discounted products from Firebase
  static async getDiscountedProducts(limit = 6) {
    try {
      const allProducts = await FirebaseService.getProducts();
      
      return allProducts
        .filter(product => product.discount > 0)
        .sort((a, b) => b.discount - a.discount)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting discounted products:', error);
      return [];
    }
  }
}

export default ProductFirebaseService;