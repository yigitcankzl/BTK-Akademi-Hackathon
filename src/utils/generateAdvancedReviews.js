import { db } from '../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import productService from '../services/ecommerce/productService';

// Gelişmiş yorum şablonları
const ADVANCED_REVIEW_TEMPLATES = {
  electronics: [
    {
      rating: 5,
      userName: 'TeknoSever_42',
      comment: 'Harika bir ürün! Performansı beklentilerimin çok üzerinde. Özellikle hız konusunda çok memnunum.',
      pros: ['Yüksek performans', 'Şık tasarım', 'Kullanım kolaylığı', 'Dayanıklı yapı'],
      cons: ['Fiyat biraz yüksek', 'Kutu içeriği sınırlı'],
      usageContext: '6 aydır günlük olarak kullanıyorum. İş ve eğlence için mükemmel.',
      recommendation: 'Bu fiyat aralığında kesinlikle tavsiye ederim. Kalite/fiyat oranı çok iyi.',
      enhanced: true,
      verified: true,
      helpful: Math.floor(Math.random() * 25) + 10
    },
    {
      rating: 4,
      userName: 'DigitalExpert',
      comment: 'Genel olarak memnun kaldım. Bazı küçük eksikleri var ama işimi görüyor.',
      pros: ['İyi performans', 'Kompakt boyut', 'Sessiz çalışma'],
      cons: ['Batarya ömrü kısa', 'Aksesuar pahalı', 'Manuel yetersiz'],
      usageContext: 'Çoğunlukla ofis işleri için kullanıyorum. Günde 6-8 saat aktif kullanım.',
      recommendation: 'Bütçeniz varsa bir üst model alın, yoksa bu da idare eder.',
      enhanced: true,
      verified: false,
      helpful: Math.floor(Math.random() * 20) + 5
    }
  ],
  clothing: [
    {
      rating: 5,
      userName: 'ModaAşığı_23',
      comment: 'Kumaşı çok kaliteli, rengi fotoğraftaki gibi. Tam beden aldım, mükemmel oturdu.',
      pros: ['Kaliteli kumaş', 'Renk harikası', 'Konforlu', 'Şık tasarım'],
      cons: ['Kargo uzun sürdü', 'Ütü istiyor'],
      usageContext: 'Hem günlük hem de özel davetlerde giyiyorum. Çok rahat.',
      recommendation: 'Bu markayı herkese tavsiye ederim. Kalite garantili.',
      enhanced: true,
      verified: true,
      helpful: Math.floor(Math.random() * 30) + 15
    },
    {
      rating: 4,
      userName: 'StilSahibi',
      comment: 'Güzel bir ürün ama beden konusunda dikkatli olun. Biraz dar geliyor.',
      pros: ['Modern tasarım', 'Kaliteli dikim', 'Renkler canlı'],
      cons: ['Dar kesim', 'Pahalı', 'Leke tutuyor'],
      usageContext: 'Çoğunlukla iş toplantılarında giyiyorum. Profesyonel görünüm veriyor.',
      recommendation: 'Bir beden büyük almanızı tavsiye ederim.',
      enhanced: true,
      verified: true,
      helpful: Math.floor(Math.random() * 18) + 8
    }
  ],
  home_garden: [
    {
      rating: 5,
      userName: 'EvHanımı_Pro',
      comment: 'Bu ürün evimizin vazgeçilmezi oldu! Hem pratik hem de çok kullanışlı.',
      pros: ['Çok fonksiyonlu', 'Dayanıklı malzeme', 'Kolay temizlik', 'Şık görünüm'],
      cons: ['Kurulum zor', 'Ağır'],
      usageContext: 'Her gün kullanıyorum. 1 yıldır sorunsuz çalışıyor.',
      recommendation: 'Ev ihtiyaçları için mükemmel bir yatırım.',
      enhanced: true,
      verified: true,
      helpful: Math.floor(Math.random() * 22) + 12
    }
  ],
  sports: [
    {
      rating: 5,
      userName: 'SporFanatigi',
      comment: 'Antrenmanlarımda harika sonuçlar alıyorum. Kalitesi gerçekten yüksek.',
      pros: ['Dayanıklı', 'Konforlu', 'Performans artırıcı', 'Ergonomik'],
      cons: ['Pahalı', 'Renk seçeneği az'],
      usageContext: 'Haftada 4-5 kez antrenman yapıyorum. 8 aydır kullanıyorum.',
      recommendation: 'Ciddi sporcular için kesinlikle alın.',
      enhanced: true,
      verified: true,
      helpful: Math.floor(Math.random() * 28) + 15
    }
  ],
  beauty: [
    {
      rating: 4,
      userName: 'GüzellikGuru',
      comment: 'Ciltime çok iyi geldi. Doğal içeriği sayesinde alerjim olmadı.',
      pros: ['Doğal içerik', 'Etkili sonuç', 'Güzel koku', 'Ekonomik'],
      cons: ['Ambalaj zayıf', 'Hızla bitiyor'],
      usageContext: 'Sabah akşam kullanıyorum. 2 aydır düzenli kullanımda.',
      recommendation: 'Hassas ciltler için ideal.',
      enhanced: true,
      verified: true,
      helpful: Math.floor(Math.random() * 25) + 10
    }
  ]
};

// Basit yorumlar da ekleyelim
const SIMPLE_REVIEWS = [
  { rating: 5, userName: 'MemnunMüşteri', comment: 'Çok beğendim, herkese tavsiye ederim!' },
  { rating: 4, userName: 'AlicanK', comment: 'İyi bir ürün, fiyatına göre değerli.' },
  { rating: 5, userName: 'SevgihanımEfe', comment: 'Mükemmel kalite, tekrar alırım.' },
  { rating: 3, userName: 'OrtalamaBir_User', comment: 'İdare eder, çok da kötü değil.' },
  { rating: 4, userName: 'TecrubeliAlici', comment: 'Kaliteli ama biraz pahalı geldi.' },
  { rating: 5, userName: 'HızlıTeslimat', comment: 'Hızlı geldi, kalitesi de güzel.' },
  { rating: 4, userName: 'DetayciMüşteri', comment: 'Genel olarak memnunum, küçük eksikler var.' }
];

// Random kullanıcı avatarları
const USER_AVATARS = [
  'https://i.pravatar.cc/100?img=1',
  'https://i.pravatar.cc/100?img=2',
  'https://i.pravatar.cc/100?img=3',
  'https://i.pravatar.cc/100?img=4',
  'https://i.pravatar.cc/100?img=5',
  'https://i.pravatar.cc/100?img=6',
  'https://i.pravatar.cc/100?img=7',
  'https://i.pravatar.cc/100?img=8',
  'https://i.pravatar.cc/100?img=9',
  'https://i.pravatar.cc/100?img=10'
];

// Random tarih üretme
const getRandomDate = () => {
  const now = new Date();
  const pastDate = new Date(now.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000); // Son 180 gün
  return pastDate;
};

// Kategoriyi Türkçe'den İngilizce'ye çevir
const mapCategoryToTemplate = (category) => {
  const categoryMap = {
    'Elektronik': 'electronics',
    'Giyim': 'clothing', 
    'Erkek Giyim': 'clothing',
    'Kadın Giyim': 'clothing',
    'Çocuk Giyim': 'clothing',
    'Ayakkabı': 'clothing',
    'Ev & Yaşam': 'home_garden',
    'Spor': 'sports',
    'Güzellik': 'beauty'
  };
  
  return categoryMap[category] || 'electronics';
};

// Her ürün için yorum oluştur
const generateReviewsForProduct = (product) => {
  const templateKey = mapCategoryToTemplate(product.category);
  const templates = ADVANCED_REVIEW_TEMPLATES[templateKey] || ADVANCED_REVIEW_TEMPLATES.electronics;
  
  const reviewCount = Math.floor(Math.random() * 8) + 3; // 3-10 arası yorum
  const reviews = [];
  
  // Gelişmiş yorumlardan 1-2 tane ekle
  const advancedCount = Math.min(2, Math.floor(reviewCount * 0.3));
  for (let i = 0; i < advancedCount; i++) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    reviews.push({
      ...template,
      productId: product.id,
      userAvatar: USER_AVATARS[Math.floor(Math.random() * USER_AVATARS.length)],
      date: getRandomDate().toLocaleDateString('tr-TR'),
      createdAt: serverTimestamp()
    });
  }
  
  // Basit yorumları ekle
  const simpleCount = reviewCount - advancedCount;
  for (let i = 0; i < simpleCount; i++) {
    const template = SIMPLE_REVIEWS[Math.floor(Math.random() * SIMPLE_REVIEWS.length)];
    reviews.push({
      ...template,
      productId: product.id,
      userAvatar: USER_AVATARS[Math.floor(Math.random() * USER_AVATARS.length)],
      date: getRandomDate().toLocaleDateString('tr-TR'),
      createdAt: serverTimestamp(),
      enhanced: false,
      verified: Math.random() > 0.7, // %30 doğrulanmış
      helpful: Math.floor(Math.random() * 15) + 1
    });
  }
  
  return reviews;
};

// Firebase'deki mevcut yorumları sil
export const clearExistingReviews = async () => {
  try {
    console.log('🗑️  Mevcut yorumlar siliniyor...');
    const reviewsRef = collection(db, 'reviews');
    const snapshot = await getDocs(reviewsRef);
    
    const deletePromises = snapshot.docs.map(docSnap => 
      deleteDoc(doc(db, 'reviews', docSnap.id))
    );
    
    await Promise.all(deletePromises);
    console.log(`✅ ${snapshot.docs.length} yorum silindi`);
  } catch (error) {
    console.error('❌ Yorumlar silinirken hata:', error);
    throw error;
  }
};

// Tüm ürünler için gelişmiş yorumlar oluştur
export const generateAdvancedReviews = async () => {
  try {
    console.log('🚀 Gelişmiş yorumlar oluşturuluyor...');
    
    // Önce mevcut yorumları sil
    await clearExistingReviews();
    
    // Ürünleri al - sadece ilk 10 ürünü kullan hızlı test için
    const result = await productService.getProducts({ limit: 10 });
    const products = (result.products || []).slice(0, 10);
    
    console.log(`📦 ${products.length} ürün için yorum oluşturuluyor...`);
    
    const reviewsRef = collection(db, 'reviews');
    let totalReviews = 0;
    
    // Her ürün için yorum oluştur
    for (const product of products) {
      const reviews = generateReviewsForProduct(product);
      
      // Firebase'e kaydet
      const savePromises = reviews.map(review => addDoc(reviewsRef, review));
      await Promise.all(savePromises);
      
      totalReviews += reviews.length;
      console.log(`✅ ${product.name} için ${reviews.length} yorum eklendi`);
    }
    
    console.log(`🎉 Toplam ${totalReviews} gelişmiş yorum oluşturuldu!`);
    return { success: true, totalReviews, productsCount: products.length };
    
  } catch (error) {
    console.error('❌ Yorumlar oluşturulurken hata:', error);
    throw error;
  }
};

// Tek bir fonksiyon olarak export et
export default generateAdvancedReviews;