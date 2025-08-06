import { PRODUCT_CATEGORIES } from '../utils/constants';

// Sample product data for the e-commerce platform
export const SAMPLE_PRODUCTS = [
  {
    id: 1,
    name: 'iPhone 15 Pro Max',
    slug: 'iphone-15-pro-max',
    price: 52999,
    originalPrice: 55999,
    discount: 5,
    category: PRODUCT_CATEGORIES.ELECTRONICS,
    subcategory: 'smartphones',
    brand: 'Apple',
    rating: 4.8,
    reviewCount: 1247,
    stock: 15,
    images: [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
      'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=500'
    ],
    description: 'AI-enhanced smartphone with advanced camera system',
    shortDescription: 'Latest iPhone with Pro camera system and A17 Pro chip',
    features: [
      'A17 Pro chip with 6-core GPU',
      'Pro camera system with 5x Telephoto',
      'Action Button',
      'USB-C connector',
      'Up to 29 hours video playback'
    ],
    specifications: {
      'Display': '6.7-inch Super Retina XDR',
      'Chip': 'A17 Pro',
      'Camera': '48MP Main, 12MP Ultra Wide, 12MP Telephoto',
      'Storage': '256GB',
      'Battery': 'Up to 29 hours video playback',
      'Operating System': 'iOS 17'
    },
    variants: [
      { id: 'color', name: 'Renk', options: ['Doğal Titanyum', 'Mavi Titanyum', 'Beyaz Titanyum', 'Siyah Titanyum'] },
      { id: 'storage', name: 'Depolama', options: ['256GB', '512GB', '1TB'] }
    ],
    tags: ['yeni', 'popüler', 'premium', 'ai-powered'],
    aiGenerated: {
      description: true,
      tags: true,
      recommendations: true
    }
  },
  {
    id: 2,
    name: 'MacBook Air M3',
    slug: 'macbook-air-m3',
    price: 42999,
    originalPrice: 45999,
    discount: 7,
    category: PRODUCT_CATEGORIES.ELECTRONICS,
    subcategory: 'laptops',
    brand: 'Apple',
    rating: 4.9,
    reviewCount: 892,
    stock: 8,
    images: [
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500',
      'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=500',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500'
    ],
    description: 'Ultra-thin laptop with M3 chip and exceptional battery life',
    shortDescription: 'Lightweight laptop with M3 chip and all-day battery',
    features: [
      'Apple M3 chip with 8-core CPU',
      '13.6-inch Liquid Retina display',
      'Up to 18 hours battery life',
      'MagSafe 3 charging',
      'Two Thunderbolt ports'
    ],
    specifications: {
      'Display': '13.6-inch Liquid Retina',
      'Chip': 'Apple M3',
      'Memory': '8GB unified memory',
      'Storage': '256GB SSD',
      'Battery': 'Up to 18 hours',
      'Weight': '1.24 kg'
    },
    variants: [
      { id: 'color', name: 'Renk', options: ['Gece Yarısı', 'Yıldız Işığı', 'Gümüş', 'Uzay Grisi'] },
      { id: 'memory', name: 'Bellek', options: ['8GB', '16GB', '24GB'] },
      { id: 'storage', name: 'Depolama', options: ['256GB', '512GB', '1TB', '2TB'] }
    ],
    tags: ['yeni', 'hafif', 'güçlü', 'uzun-batarya'],
    aiGenerated: {
      description: true,
      tags: true,
      recommendations: true
    }
  },
  {
    id: 3,
    name: 'Nike Air Force 1',
    slug: 'nike-air-force-1',
    price: 3499,
    originalPrice: 3999,
    discount: 13,
    category: PRODUCT_CATEGORIES.CLOTHING,
    subcategory: 'shoes',
    brand: 'Nike',
    rating: 4.6,
    reviewCount: 2156,
    stock: 25,
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500'
    ],
    description: 'Iconic basketball shoe with timeless design and superior comfort',
    shortDescription: 'Classic basketball sneaker with leather upper and Air cushioning',
    features: [
      'Full-grain leather upper',
      'Nike Air cushioning',
      'Rubber sole with pivot points',
      'Perforated toe box',
      'Classic basketball style'
    ],
    specifications: {
      'Upper': 'Full-grain leather',
      'Sole': 'Rubber with Air cushioning',
      'Closure': 'Lace-up',
      'Style': 'Low-top',
      'Origin': 'Basketball'
    },
    variants: [
      { id: 'color', name: 'Renk', options: ['Beyaz', 'Siyah', 'Kırmızı', 'Mavi'] },
      { id: 'size', name: 'Numara', options: ['38', '39', '40', '41', '42', '43', '44', '45'] }
    ],
    tags: ['klasik', 'rahat', 'basketbol', 'günlük'],
    aiGenerated: {
      description: true,
      tags: true,
      recommendations: true
    }
  },
  {
    id: 4,
    name: 'Sony WH-1000XM5',
    slug: 'sony-wh-1000xm5',
    price: 9999,
    originalPrice: 11999,
    discount: 17,
    category: PRODUCT_CATEGORIES.ELECTRONICS,
    subcategory: 'audio',
    brand: 'Sony',
    rating: 4.7,
    reviewCount: 756,
    stock: 12,
    images: [
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500'
    ],
    description: 'Premium noise-canceling headphones with exceptional sound quality',
    shortDescription: 'Wireless noise-canceling headphones with 30-hour battery',
    features: [
      'Industry-leading noise canceling',
      '30-hour battery life',
      'Quick Charge (3 min = 3 hours)',
      'Touch sensor controls',
      'Multipoint connection'
    ],
    specifications: {
      'Driver': '30mm',
      'Frequency Response': '4Hz-40,000Hz',
      'Battery': 'Up to 30 hours',
      'Charging': 'USB-C',
      'Weight': '250g'
    },
    variants: [
      { id: 'color', name: 'Renk', options: ['Siyah', 'Gümüş'] }
    ],
    tags: ['premium', 'noise-canceling', 'wireless', 'uzun-batarya'],
    aiGenerated: {
      description: true,
      tags: true,
      recommendations: true
    }
  },
  {
    id: 5,
    name: 'Philips Hue Smart Bulb',
    slug: 'philips-hue-smart-bulb',
    price: 299,
    originalPrice: 349,
    discount: 14,
    category: PRODUCT_CATEGORIES.HOME_GARDEN,
    subcategory: 'lighting',
    brand: 'Philips',
    rating: 4.5,
    reviewCount: 1834,
    stock: 50,
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500'
    ],
    description: 'Smart LED bulb with 16 million colors and voice control',
    shortDescription: 'Wi-Fi enabled smart bulb with color changing capabilities',
    features: [
      '16 million colors',
      'Voice control compatible',
      'App-controlled',
      'Energy efficient LED',
      'Schedule and automation'
    ],
    specifications: {
      'Wattage': '9W (60W equivalent)',
      'Brightness': '800 lumens',
      'Color Temperature': '2000K-6500K',
      'Connectivity': 'Wi-Fi',
      'Lifespan': '25,000 hours'
    },
    variants: [
      { id: 'type', name: 'Tip', options: ['E27', 'E14', 'GU10'] }
    ],
    tags: ['akıllı', 'renkli', 'ses-kontrol', 'enerji-tasarruflu'],
    aiGenerated: {
      description: true,
      tags: true,
      recommendations: true
    }
  },
  {
    id: 6,
    name: 'The Art of War',
    slug: 'the-art-of-war',
    price: 49,
    originalPrice: 59,
    discount: 17,
    category: PRODUCT_CATEGORIES.BOOKS,
    subcategory: 'philosophy',
    brand: 'Penguin Classics',
    rating: 4.4,
    reviewCount: 3247,
    stock: 100,
    images: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
      'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=500'
    ],
    description: 'Ancient Chinese military treatise on strategy and tactics',
    shortDescription: 'Classic strategy guide with timeless wisdom for modern applications',
    features: [
      'Complete original text',
      'Modern translation',
      'Historical context',
      'Study guide included',
      'Paperback edition'
    ],
    specifications: {
      'Pages': '256',
      'Language': 'Turkish',
      'Publisher': 'Penguin Classics',
      'ISBN': '978-0140439991',
      'Format': 'Paperback'
    },
    variants: [
      { id: 'format', name: 'Format', options: ['Paperback', 'Hardcover', 'E-book'] }
    ],
    tags: ['klasik', 'strateji', 'felsefe', 'tarih'],
    aiGenerated: {
      description: true,
      tags: true,
      recommendations: true
    }
  },
  {
    id: 17,
    firebaseId: '17',
    name: 'Samsung Galaxy Buds 3',
    slug: 'samsung-galaxy-buds-3',
    price: 2499,
    originalPrice: 2999,
    discount: 17,
    currency: 'TRY',
    stock: 45,
    category: 'electronics',
    subCategory: 'audio',
    brand: 'Samsung',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500'],
    rating: 4.4,
    reviewCount: 89,
    description: 'Premium kablosuz kulaklık deneyimi',
    shortDescription: 'Aktif gürültü engelleme ve üstün ses kalitesi',
    features: ['ANC', 'Kablosuz şarj', '6 saat pil ömrü'],
    tags: ['kulaklık', 'samsung', 'kablosuz'],
    aiGenerated: { description: true, tags: true }
  },
  {
    id: 18,
    firebaseId: '18',
    name: 'Dell XPS 15',
    slug: 'dell-xps-15',
    price: 45999,
    originalPrice: 49999,
    discount: 8,
    currency: 'TRY',
    stock: 12,
    category: 'electronics',
    subCategory: 'laptops',
    brand: 'Dell',
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500'],
    rating: 4.7,
    reviewCount: 156,
    description: 'Profesyonel performans laptopları',
    shortDescription: 'Intel i7, 16GB RAM, 512GB SSD',
    features: ['Intel i7', '16GB RAM', '512GB SSD', '15.6" 4K Display'],
    tags: ['laptop', 'dell', 'profesyonel'],
    aiGenerated: { description: true, tags: true }
  },
  {
    id: 19,
    firebaseId: '19',
    name: 'Sony WH-1000XM5',
    slug: 'sony-wh-1000xm5',
    price: 8999,
    originalPrice: 9999,
    discount: 10,
    currency: 'TRY',
    stock: 28,
    category: 'electronics',
    subCategory: 'audio',
    brand: 'Sony',
    images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500'],
    rating: 4.8,
    reviewCount: 203,
    description: 'Dünya standartında gürültü engelleme',
    shortDescription: 'Premium over-ear kulaklık',
    features: ['Aktif gürültü engelleme', '30 saat pil', 'Hızlı şarj'],
    tags: ['kulaklık', 'sony', 'premium'],
    aiGenerated: { description: true, tags: true }
  },
  {
    id: 20,
    firebaseId: '20',
    name: 'LG OLED C3 55"',
    slug: 'lg-oled-c3-55',
    price: 34999,
    originalPrice: 39999,
    discount: 13,
    currency: 'TRY',
    stock: 8,
    category: 'electronics',
    subCategory: 'tv',
    brand: 'LG',
    images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500'],
    rating: 4.9,
    reviewCount: 67,
    description: 'OLED teknolojisi ile mükemmel görüntü',
    shortDescription: '55" 4K OLED Smart TV',
    features: ['4K OLED', 'webOS', 'Dolby Vision', 'Gaming Mode'],
    tags: ['tv', 'lg', 'oled', '4k'],
    aiGenerated: { description: true, tags: true }
  },
  {
    id: 21,
    firebaseId: '21',
    name: 'Dyson V15 Detect',
    slug: 'dyson-v15-detect',
    price: 15999,
    originalPrice: 17999,
    discount: 11,
    currency: 'TRY',
    stock: 22,
    category: 'home',
    subCategory: 'cleaning',
    brand: 'Dyson',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'],
    rating: 4.6,
    reviewCount: 134,
    description: 'Kablosuz süpürge teknolojisinin zirvesi',
    shortDescription: 'Laser toz algılama özelliği',
    features: ['Laser algılama', '60 dk pil', 'HEPA filtre'],
    tags: ['süpürge', 'dyson', 'kablosuz'],
    aiGenerated: { description: true, tags: true }
  },
  {
    id: 22,
    firebaseId: '22',
    name: 'Bose QuietComfort 45',
    slug: 'bose-quietcomfort-45',
    price: 7499,
    originalPrice: 8499,
    discount: 12,
    currency: 'TRY',
    stock: 35,
    category: 'electronics',
    subCategory: 'audio',
    brand: 'Bose',
    images: ['https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500'],
    rating: 4.5,
    reviewCount: 178,
    description: 'Sessizliğin tadını çıkarın',
    shortDescription: 'Aktif gürültü engelleme kulaklık',
    features: ['ANC', '24 saat pil', 'Konforlu tasarım'],
    tags: ['kulaklık', 'bose', 'anc'],
    aiGenerated: { description: true, tags: true }
  },
  {
    id: 23,
    firebaseId: '23',
    name: 'Nintendo Switch OLED',
    slug: 'nintendo-switch-oled',
    price: 8999,
    originalPrice: 9999,
    discount: 10,
    currency: 'TRY',
    stock: 18,
    category: 'electronics',
    subCategory: 'gaming',
    brand: 'Nintendo',
    images: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500'],
    rating: 4.7,
    reviewCount: 245,
    description: 'Oyun dünyasına adım atın',
    shortDescription: '7" OLED ekranlı oyun konsolu',
    features: ['7" OLED ekran', 'Dock modlu', 'Joy-Con kontrolcü'],
    tags: ['oyun', 'nintendo switch', 'konsol'],
    aiGenerated: { description: true, tags: true }
  },
  {
    id: 24,
    firebaseId: '24',
    name: 'Philips Hue Starter Kit',
    slug: 'philips-hue-starter-kit',
    price: 3499,
    originalPrice: 3999,
    discount: 13,
    currency: 'TRY',
    stock: 41,
    category: 'home',
    subCategory: 'lighting',
    brand: 'Philips',
    images: ['https://images.unsplash.com/photo-1558002038-bb4237b54485?w=500'],
    rating: 4.4,
    reviewCount: 89,
    description: 'Akıllı aydınlatma sistemi',
    shortDescription: 'Renkli LED ampul seti',
    features: ['16 milyon renk', 'Uygulama kontrolü', '3lü set'],
    tags: ['akıllı ev', 'philips', 'led'],
    aiGenerated: { description: true, tags: true }
  },
  {
    id: 25,
    firebaseId: '25',
    name: 'Levi\'s 501 Original Jeans',
    slug: 'levis-501-original-jeans',
    price: 899,
    originalPrice: 1199,
    discount: 25,
    category: PRODUCT_CATEGORIES.CLOTHING,
    subcategory: 'pants',
    brand: 'Levi\'s',
    rating: 4.7,
    reviewCount: 1456,
    stock: 35,
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500',
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500'
    ],
    description: 'Klasik kesim orijinal jean pantolon',
    shortDescription: 'İkonik 501 modeli orijinal kesim',
    features: ['100% pamuk', 'Straight fit', 'Button fly', 'Klasik 5 cep'],
    tags: ['jean', 'klasik', 'günlük'],
    aiGenerated: { description: true, tags: true }
  },
  {
    id: 26,
    firebaseId: '26',
    name: 'Adidas Ultraboost 22',
    slug: 'adidas-ultraboost-22',
    price: 2299,
    originalPrice: 2799,
    discount: 18,
    category: PRODUCT_CATEGORIES.CLOTHING,
    subcategory: 'shoes',
    brand: 'Adidas',
    rating: 4.8,
    reviewCount: 892,
    stock: 28,
    images: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?w=500',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500'
    ],
    description: 'Yüksek performanslı koşu ayakkabısı',
    shortDescription: 'Boost teknolojili performans ayakkabı',
    features: ['Boost orta taban', 'Primeknit üst', 'Continental kauçuk taban', 'Responsive cushioning'],
    tags: ['spor', 'koşu', 'adidas'],
    aiGenerated: { description: true, tags: true }
  },
  {
    id: 27,
    firebaseId: '27',
    name: 'Zara Basic T-Shirt',
    slug: 'zara-basic-tshirt',
    price: 149,
    originalPrice: 199,
    discount: 25,
    category: PRODUCT_CATEGORIES.CLOTHING,
    subcategory: 'shirts',
    brand: 'Zara',
    rating: 4.3,
    reviewCount: 567,
    stock: 85,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500'
    ],
    description: 'Günlük kullanım için temel t-shirt',
    shortDescription: 'Pamuklu basic t-shirt',
    features: ['100% pamuk', 'Regular fit', 'Yuvarlak yaka', 'Çok renkli seçenek'],
    tags: ['basic', 'günlük', 'pamuk'],
    aiGenerated: { description: true, tags: true }
  },
  {
    id: 28,
    firebaseId: '28',
    name: 'H&M Denim Jacket',
    slug: 'hm-denim-jacket',
    price: 399,
    originalPrice: 499,
    discount: 20,
    category: PRODUCT_CATEGORIES.CLOTHING,
    subcategory: 'jackets',
    brand: 'H&M',
    rating: 4.4,
    reviewCount: 234,
    stock: 22,
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
      'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=500'
    ],
    description: 'Klasik kot ceket',
    shortDescription: 'Vintage tarzı denim ceket',
    features: ['Denim kumaş', 'Metal düğmeler', 'Chest pockets', 'Regular fit'],
    tags: ['kot', 'ceket', 'vintage'],
    aiGenerated: { description: true, tags: true }
  },
  {
    id: 29,
    firebaseId: '29',
    name: 'Mango Dress',
    slug: 'mango-dress',
    price: 599,
    originalPrice: 799,
    discount: 25,
    category: PRODUCT_CATEGORIES.CLOTHING,
    subcategory: 'dresses',
    brand: 'Mango',
    rating: 4.6,
    reviewCount: 345,
    stock: 18,
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500',
      'https://images.unsplash.com/photo-1583496661160-fb5886a13d36?w=500'
    ],
    description: 'Şık günlük elbise',
    shortDescription: 'Midi boy günlük elbise',
    features: ['Midi boy', 'A kesim', 'Desenli kumaş', 'Kısa kollu'],
    tags: ['elbise', 'şık', 'günlük'],
    aiGenerated: { description: true, tags: true }
  },
  {
    id: 30,
    firebaseId: '30',
    name: 'Nike Hoodie',
    slug: 'nike-hoodie',
    price: 799,
    originalPrice: 999,
    discount: 20,
    category: PRODUCT_CATEGORIES.CLOTHING,
    subcategory: 'hoodies',
    brand: 'Nike',
    rating: 4.5,
    reviewCount: 678,
    stock: 42,
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500',
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500'
    ],
    description: 'Spor kapüşonlu sweatshirt',
    shortDescription: 'Nike swoosh logolu hoodie',
    features: ['Kapüşonlu', 'Pamuk karışım', 'Nike logosu', 'Kanguru cep'],
    tags: ['hoodie', 'spor', 'nike'],
    aiGenerated: { description: true, tags: true }
  }
];

// Product categories with metadata
export const PRODUCT_CATEGORY_DATA = {
  [PRODUCT_CATEGORIES.ELECTRONICS]: {
    name: 'Elektronik',
    description: 'En yeni teknoloji ürünleri',
    icon: '📱',
    subcategories: ['smartphones', 'laptops', 'tablets', 'audio', 'gaming', 'accessories']
  },
  [PRODUCT_CATEGORIES.CLOTHING]: {
    name: 'Giyim',
    description: 'Moda ve stil ürünleri',
    icon: '👕',
    subcategories: ['shirts', 'pants', 'shoes', 'accessories', 'bags', 'jewelry']
  },
  [PRODUCT_CATEGORIES.HOME_GARDEN]: {
    name: 'Ev & Bahçe',
    description: 'Ev dekorasyonu ve bahçe ürünleri',
    icon: '🏠',
    subcategories: ['furniture', 'lighting', 'decor', 'kitchen', 'garden', 'tools']
  },
  [PRODUCT_CATEGORIES.BOOKS]: {
    name: 'Kitaplar',
    description: 'Bilgi ve eğlence kaynakları',
    icon: '📚',
    subcategories: ['fiction', 'non-fiction', 'textbooks', 'children', 'philosophy', 'science']
  },
  [PRODUCT_CATEGORIES.SPORTS]: {
    name: 'Spor',
    description: 'Spor ve fitness ürünleri',
    icon: '⚽',
    subcategories: ['fitness', 'outdoor', 'team-sports', 'water-sports', 'winter-sports']
  },
  [PRODUCT_CATEGORIES.BEAUTY]: {
    name: 'Güzellik',
    description: 'Kozmetik ve kişisel bakım',
    icon: '💄',
    subcategories: ['skincare', 'makeup', 'hair-care', 'fragrance', 'tools']
  }
};

// Helper functions
export const getProductById = (id) => {
  return SAMPLE_PRODUCTS.find(product => product.id === parseInt(id));
};

export const getProductBySlug = (slug) => {
  return SAMPLE_PRODUCTS.find(product => product.slug === slug);
};

export const getProductsByCategory = (category) => {
  return SAMPLE_PRODUCTS.filter(product => product.category === category);
};

export const getProductsByBrand = (brand) => {
  return SAMPLE_PRODUCTS.filter(product => product.brand === brand);
};

export const getFeaturedProducts = (limit = 6) => {
  return SAMPLE_PRODUCTS
    .filter(product => product.tags.includes('popüler') || product.rating >= 4.5)
    .slice(0, limit);
};

export const getDiscountedProducts = (limit = 6) => {
  return SAMPLE_PRODUCTS
    .filter(product => product.discount > 0)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, limit);
};

export const searchProducts = (query) => {
  const lowercaseQuery = query.toLowerCase();
  return SAMPLE_PRODUCTS.filter(product => 
    product.name.toLowerCase().includes(lowercaseQuery) ||
    product.description.toLowerCase().includes(lowercaseQuery) ||
    product.brand.toLowerCase().includes(lowercaseQuery) ||
    product.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};

export const getRelatedProducts = (productId, limit = 4) => {
  const product = getProductById(productId);
  if (!product) return [];
  
  return SAMPLE_PRODUCTS
    .filter(p => p.id !== productId && (
      p.category === product.category ||
      p.brand === product.brand ||
      p.tags.some(tag => product.tags.includes(tag))
    ))
    .slice(0, limit);
};

export const getAllProducts = () => {
  return SAMPLE_PRODUCTS;
};