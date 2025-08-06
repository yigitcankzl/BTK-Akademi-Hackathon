// Gelişmiş örnek yorumlar - Firebase olmadan test için
export const SAMPLE_REVIEWS = [
  // iPhone 15 Pro Max (ID: 1)
  {
    id: 'rev1',
    productId: 1,
    rating: 5,
    userName: 'TeknoGuru_42',
    userAvatar: 'https://i.pravatar.cc/100?img=1',
    comment: 'iPhone 15 Pro Max gerçekten harika! A17 Pro chip ve kamera sistemi beklentilerimin çok üzerinde çıktı.',
    pros: ['A17 Pro performansı', 'Mükemmel kamera kalitesi', 'Premium titanyum tasarım', 'Uzun batarya ömrü', 'USB-C geçiş'],
    cons: ['Çok pahalı', 'Ağırlık fazla', 'Kamera çıkıntısı büyük'],
    usageContext: '4 aydır günlük kullanıyorum. Fotoğraf ve video çekim için profesyonel düzeyde.',
    recommendation: 'Bütçesi olan ve en iyisini isteyenler için kesinlikle değer. Ancak fiyat gerçekten yüksek.',
    enhanced: true,
    verified: true,
    helpful: 67,
    date: '15.01.2025',
    createdAt: new Date('2025-01-15')
  },
  {
    id: 'rev2',
    productId: 1,
    rating: 4,
    userName: 'AppleFan2024',
    userAvatar: 'https://i.pravatar.cc/100?img=2',
    comment: 'Çok iyi bir telefon ama fiyatı gerçekten dudak uçuklatıyor. Kamera ve performans mükemmel.',
    enhanced: false,
    verified: true,
    helpful: 34,
    date: '20.01.2025',
    createdAt: new Date('2025-01-20')
  },
  {
    id: 'rev3',
    productId: 1,
    rating: 5,
    userName: 'MobileTester',
    userAvatar: 'https://i.pravatar.cc/100?img=3',
    comment: 'Profesyonel işler için aldım. Video editing ve fotoğraf için harika!',
    enhanced: false,
    verified: false,
    helpful: 23,
    date: '25.01.2025',
    createdAt: new Date('2025-01-25')
  },
  {
    id: 'rev4',
    productId: 1,
    rating: 3,
    userName: 'EkonomiKullanici',
    userAvatar: 'https://i.pravatar.cc/100?img=4',
    comment: 'Kaliteli ama çok pahalı. Ortalama kullanıcı için gereksiz özellikler var.',
    enhanced: false,
    verified: true,
    helpful: 12,
    date: '28.01.2025',
    createdAt: new Date('2025-01-28')
  },

  // Samsung Galaxy S24 Ultra (ID: 2)
  {
    id: 'rev5',
    productId: 2,
    rating: 5,
    userName: 'AndroidMaster',
    userAvatar: 'https://i.pravatar.cc/100?img=5',
    comment: 'Samsung yine başarılı bir telefon çıkarmış! S Pen ve AI özellikleri gerçekten kullanışlı.',
    pros: ['S Pen desteği', 'Galaxy AI özellikleri', 'Kamera zoom', '200MP ana kamera', 'Hızlı şarj'],
    cons: ['OneUI biraz ağır', 'Batarya günlük kullanımda orta', 'Fiyat yüksek'],
    usageContext: 'İş ve not alma için kullanıyorum. S Pen sayesinde çok verimli çalışıyorum.',
    recommendation: 'iPhone alternatifi arayanlar için mükemmel seçim. S Pen gerçekten fark yaratıyor.',
    enhanced: true,
    verified: true,
    helpful: 89,
    date: '10.01.2025',
    createdAt: new Date('2025-01-10')
  },
  {
    id: 'rev6',
    productId: 2,
    rating: 4,
    userName: 'SamsungUser',
    userAvatar: 'https://i.pravatar.cc/100?img=6',
    comment: 'Güzel telefon ama batarya beklediğim kadar uzun gitmedi.',
    enhanced: false,
    verified: true,
    helpful: 18,
    date: '18.01.2025',
    createdAt: new Date('2025-01-18')
  },
  {
    id: 'rev7',
    productId: 2,
    rating: 5,
    userName: 'NoteTaker',
    userAvatar: 'https://i.pravatar.cc/100?img=7',
    comment: 'S Pen sayesinde dijital not alma deneyimim çok gelişti. Harika telefon!',
    enhanced: false,
    verified: false,
    helpful: 25,
    date: '22.01.2025',
    createdAt: new Date('2025-01-22')
  },

  // MacBook Pro M3 (ID: 3)
  {
    id: 'rev8',
    productId: 3,
    rating: 5,
    userName: 'DesignerPro',
    userAvatar: 'https://i.pravatar.cc/100?img=8',
    comment: 'M3 chip ile performans inanılmaz! Video editing ve 3D modeling hiç takılmadan yapıyorum.',
    pros: ['M3 chip gücü', 'Liquid Retina XDR ekran', 'Sessiz fanlar', 'Uzun batarya', 'macOS Sonoma'],
    cons: ['Çok pahalı', 'Port sayısı az', 'Dongle ihtiyacı', 'RAM upgrade pahalı'],
    usageContext: 'Grafik tasarım ve video prodüksiyon için kullanıyorum. 8 aydır hiç sorun yaşamadım.',
    recommendation: 'Profesyonel çalışanlar için olmazsa olmaz. Pahalı ama değerine değer.',
    enhanced: true,
    verified: true,
    helpful: 156,
    date: '05.01.2025',
    createdAt: new Date('2025-01-05')
  },
  {
    id: 'rev9',
    productId: 3,
    rating: 4,
    userName: 'DevCoder',
    userAvatar: 'https://i.pravatar.cc/100?img=9',
    comment: 'Kod yazmak için harika. Hız ve sessizlik mükemmel.',
    enhanced: false,
    verified: true,
    helpful: 42,
    date: '12.01.2025',
    createdAt: new Date('2025-01-12')
  },
  {
    id: 'rev10',
    productId: 3,
    rating: 5,
    userName: 'VideoEditor',
    userAvatar: 'https://i.pravatar.cc/100?img=10',
    comment: 'Final Cut Pro ile 4K video editing çok hızlı. M3 chip gerçekten fark yaratıyor.',
    enhanced: false,
    verified: true,
    helpful: 67,
    date: '15.01.2025',
    createdAt: new Date('2025-01-15')
  },
  {
    id: 'rev11',
    productId: 3,
    rating: 3,
    userName: 'BudgetUser',
    userAvatar: 'https://i.pravatar.cc/100?img=11',
    comment: 'Performans harika ama fiyat gerçekten çok yüksek. Herkesin bütçesi yetmez.',
    enhanced: false,
    verified: false,
    helpful: 15,
    date: '20.01.2025',
    createdAt: new Date('2025-01-20')
  },

  // Nike Air Max 270 (ID: 4)
  {
    id: 'rev12',
    productId: 4,
    rating: 4,
    userName: 'RunnerGirl',
    userAvatar: 'https://i.pravatar.cc/100?img=12',
    comment: 'Çok rahat ayakkabı! Hem spor hem günlük kullanım için ideal. Air Max yastıklama harika.',
    pros: ['Çok konforlu', 'Şık tasarım', 'Air Max yastıklama', 'Dayanıklı malzeme', 'Kolay temizlik'],
    cons: ['Biraz dar kalıp', 'Fiyat yüksek', 'Renk seçenekleri az'],
    usageContext: 'Koşu ve günlük kullanım için 1 yıldır kullanıyorum. Hala sağlam duruyor.',
    recommendation: 'Kaliteli spor ayakkabısı arayanlar kesinlikle alsın. Rahat ve dayanıklı.',
    enhanced: true,
    verified: true,
    helpful: 78,
    date: '28.12.2024',
    createdAt: new Date('2024-12-28')
  },
  {
    id: 'rev13',
    productId: 4,
    rating: 5,
    userName: 'SportLover',
    userAvatar: 'https://i.pravatar.cc/100?img=13',
    comment: 'Nike kalitesi her zamanki gibi üst düzey. Çok beğendim.',
    enhanced: false,
    verified: false,
    helpful: 25,
    date: '02.01.2025',
    createdAt: new Date('2025-01-02')
  },
  {
    id: 'rev14',
    productId: 4,
    rating: 4,
    userName: 'FitnessCoach',
    userAvatar: 'https://i.pravatar.cc/100?img=14',
    comment: 'Antrenman için mükemmel. Destek ve rahatlık açısından çok iyi.',
    enhanced: false,
    verified: true,
    helpful: 33,
    date: '08.01.2025',
    createdAt: new Date('2025-01-08')
  },

  // Sony WH-1000XM5 (ID: 5)
  {
    id: 'rev15',
    productId: 5,
    rating: 5,
    userName: 'AudioPhile',
    userAvatar: 'https://i.pravatar.cc/100?img=15',
    comment: 'Ses kalitesi ve noise cancelling özelliği inanılmaz! Uzun uçuşlarda vazgeçilmez.',
    pros: ['Mükemmel ses kalitesi', 'ANC teknolojisi', 'Uzun batarya', 'Konforlu', 'Quick Attention'],
    cons: ['Pahalı', 'Büyük boyut', 'Dokunmatik kontroller hassas'],
    usageContext: 'Müzik prodüksiyonu ve seyahat için kullanıyorum. 2 yıldır memnunum.',
    recommendation: 'Ses kalitesine önem verenler için en iyi seçim. Fiyatına değer.',
    enhanced: true,
    verified: true,
    helpful: 134,
    date: '22.12.2024',
    createdAt: new Date('2024-12-22')
  },
  {
    id: 'rev16',
    productId: 5,
    rating: 4,
    userName: 'MusicLover',
    userAvatar: 'https://i.pravatar.cc/100?img=16',
    comment: 'Harika kulaklık ama fiyat biraz yüksek. Ses kalitesi mükemmel.',
    enhanced: false,
    verified: true,
    helpful: 28,
    date: '30.12.2024',
    createdAt: new Date('2024-12-30')
  },

  // Diğer ürünler için daha fazla yorum...
  {
    id: 'rev17',
    productId: 6,
    rating: 4,
    userName: 'FashionGuru',
    userAvatar: 'https://i.pravatar.cc/100?img=17',
    comment: 'Kaliteli kumaş ve güzel kesim. Hem günlük hem iş için uygun.',
    pros: ['Kaliteli kumaş', 'Şık tasarım', 'Konforlu', 'Renk seçenekleri iyi'],
    cons: ['Biraz pahalı', 'Ütü istiyor', 'Dar kalıp'],
    usageContext: 'İş kıyafeti olarak kullanıyorum. 6 aydır memnunum.',
    recommendation: 'Kaliteli gömlek arayanlar için ideal. Bir beden büyük alın.',
    enhanced: true,
    verified: true,
    helpful: 45,
    date: '15.12.2024',
    createdAt: new Date('2024-12-15')
  },
  {
    id: 'rev18',
    productId: 6,
    rating: 5,
    userName: 'BusinessMan',
    userAvatar: 'https://i.pravatar.cc/100?img=18',
    comment: 'İş toplantıları için harika. Şık ve rahat.',
    enhanced: false,
    verified: true,
    helpful: 19,
    date: '20.12.2024',
    createdAt: new Date('2024-12-20')
  },

  {
    id: 'rev19',
    productId: 7,
    rating: 5,
    userName: 'CoffeeAddict',
    userAvatar: 'https://i.pravatar.cc/100?img=19',
    comment: 'Sabah kahvemi mükemmel yapıyor! Otomatik öğütme özelliği harika.',
    pros: ['Otomatik öğütme', 'Programlanabilir', 'Lezzet mükemmel', 'Kolay temizlik'],
    cons: ['Gürültülü', 'Büyük boyut', 'Pahalı filtre'],
    usageContext: 'Her sabah kullanıyorum. 1 yıldır sorunsuz çalışıyor.',
    recommendation: 'Kahve severlere kesinlikle tavsiye ederim.',
    enhanced: true,
    verified: true,
    helpful: 92,
    date: '08.01.2025',
    createdAt: new Date('2025-01-08')
  },
  {
    id: 'rev20',
    productId: 7,
    rating: 4,
    userName: 'HomeCook',
    userAvatar: 'https://i.pravatar.cc/100?img=20',
    comment: 'İyi kahve yapıyor ama biraz gürültülü.',
    enhanced: false,
    verified: false,
    helpful: 16,
    date: '12.01.2025',
    createdAt: new Date('2025-01-12')
  },

  {
    id: 'rev21',
    productId: 8,
    rating: 4,
    userName: 'YogaTeacher',
    userAvatar: 'https://i.pravatar.cc/100?img=21',
    comment: 'Yoga ve pilates için mükemmel. Kalın ve kaymaz taban.',
    pros: ['Kaymaz taban', 'Kalın yapı', 'Kolay taşıma', 'Hijyenik malzeme'],
    cons: ['Koku var ilk başta', 'Ağır', 'Paket küçük'],
    usageContext: 'Yoga dersleri ve ev antrenmanları için kullanıyorum.',
    recommendation: 'Ciddi yoga yapanlar için ideal mat.',
    enhanced: true,
    verified: true,
    helpful: 67,
    date: '30.12.2024',
    createdAt: new Date('2024-12-30')
  },
  {
    id: 'rev22',
    productId: 8,
    rating: 5,
    userName: 'FitnessGuru',
    userAvatar: 'https://i.pravatar.cc/100?img=22',
    comment: 'Ev antrenmanları için mükemmel. Kaliteli ve dayanıklı.',
    enhanced: false,
    verified: true,
    helpful: 31,
    date: '05.01.2025',
    createdAt: new Date('2025-01-05')
  },

  {
    id: 'rev23',
    productId: 9,
    rating: 5,
    userName: 'SkinCareExpert',
    userAvatar: 'https://i.pravatar.cc/100?img=23',
    comment: 'Ciltime çok iyi geldi! Hipoalerjenik ve etkili.',
    pros: ['Hipoalerjenik', 'Hızlı emilim', 'Doğal içerik', 'Ekonomik'],
    cons: ['Koku yok', 'Ambalaj sade', 'Hızla bitiyor'],
    usageContext: 'Hassas cildim için mükemmel. 3 aydır kullanıyorum.',
    recommendation: 'Hassas ciltler için güvenle kullanabilirsiniz.',
    enhanced: true,
    verified: true,
    helpful: 89,
    date: '03.01.2025',
    createdAt: new Date('2025-01-03')
  },
  {
    id: 'rev24',
    productId: 9,
    rating: 4,
    userName: 'BeautyBlogger',
    userAvatar: 'https://i.pravatar.cc/100?img=24',
    comment: 'Doğal içeriği sayesinde cildime zarar vermiyor. Tavsiye ederim.',
    enhanced: false,
    verified: true,
    helpful: 24,
    date: '10.01.2025',
    createdAt: new Date('2025-01-10')
  },

  {
    id: 'rev25',
    productId: 10,
    rating: 4,
    userName: 'BookLover',
    userAvatar: 'https://i.pravatar.cc/100?img=25',
    comment: 'Çok güzel ve öğretici kitap. Herkesin okumasını tavsiye ederim.',
    enhanced: false,
    verified: true,
    helpful: 23,
    date: '27.12.2024',
    createdAt: new Date('2024-12-27')
  },
  {
    id: 'rev26',
    productId: 10,
    rating: 5,
    userName: 'StudentLife',
    userAvatar: 'https://i.pravatar.cc/100?img=26',
    comment: 'Üniversite için aldım. Çok faydalı bilgiler var.',
    enhanced: false,
    verified: false,
    helpful: 14,
    date: '02.01.2025',
    createdAt: new Date('2025-01-02')
  }
];

// Ürün ID'sine göre yorumları getir
export const getReviewsByProductId = (productId) => {
  return SAMPLE_REVIEWS.filter(review => review.productId === parseInt(productId));
};

// Tüm yorumları getir
export const getAllReviews = () => {
  return SAMPLE_REVIEWS;
};

export default SAMPLE_REVIEWS;