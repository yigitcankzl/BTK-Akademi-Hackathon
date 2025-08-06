# ShopSmart - Akıllı Alışverişin Yeni Adresi

AI destekli modern e-ticaret platformu. Google Gemini AI entegrasyonu, görsel arama, tamamlayıcı ürün önerileri ve offline mod desteği ile akıllı alışveriş deneyimi sunar.

![React](https://img.shields.io/badge/React-18+-blue.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-green.svg)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-Integrated-orange.svg)
![E-ticaret](https://img.shields.io/badge/E--ticaret-Platform-purple.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## 🛒 E-ticaret Özellikleri

### Temel Alışveriş Fonksiyonları
- 🛍️ **Ürün Kataloğu** - Kategorilere ayrılmış zengin ürün koleksiyonu
- 🛒 **Akıllı Sepet** - AI destekli sepet yönetimi ve öneriler
- 💳 **Güvenli Ödeme** - Çoklu ödeme seçenekleri ve güvenli checkout
- 📦 **Sipariş Takibi** - Gerçek zamanlı sipariş durumu ve teslimat bilgileri
- 👤 **Kullanıcı Profili** - Kişisel hesap yönetimi ve sipariş geçmişi
- ⭐ **Favoriler & Wishlist** - Beğenilen ürünleri kaydetme ve listeler

### AI Destekli Özellikler
- 🤖 **AI Görsel Analiz** - Ürün görsellerini analiz ederek detaylı açıklamalar
- 📸 **Görsel Arama** - Fotoğraf yükleyerek benzer ürün bulma
- 🔗 **Tamamlayıcı Ürün Önerileri** - AI ile analiz edilen uyumlu ürün önerileri
- 📡 **Offline Mod** - API erişimi olmadığında yerel AI benzeri deneyim
- ⚡ **Akıllı Önbellek** - Gelişmiş caching sistemi ile hızlı yanıtlar
- 🎯 **Rate Limit Koruması** - Otomatik API limiti yönetimi ve offline geçiş

### Kullanıcı Deneyimi
- 🌓 **Dark/Light Mode** - Sistem tercihi ile otomatik tema
- 📱 **Tam Responsive** - Mobil-öncelikli tasarım
- ⚡ **Hızlı Yükleme** - Optimizasyon ve code splitting
- 🔔 **Bildirim Sistemi** - Sipariş güncellemeleri ve kampanyalar
- 🎨 **Modern Tasarım** - Glassmorphism efektleri ve animasyonlar

## 🏗️ Proje Yapısı

```
src/
├── components/
│   ├── common/           # Ortak UI componentleri
│   │   ├── ErrorBoundary.jsx    # Hata yakalama bileşenleri
│   │   ├── OfflineStatus.jsx    # AI durumu göstergesi
│   │   └── RateLimitWarning.jsx # API limit uyarıları
│   └── ecommerce/        # E-ticaret componentleri
│       ├── ProductGrid.jsx
│       ├── ProductCard.jsx
│       └── EnhancedReviewsWithVisualAnalysis.jsx
├── services/
│   ├── geminiAPI.js      # Ana AI API servisi
│   ├── geminiCache.js    # Akıllı önbellek sistemi
│   ├── geminiOfflineMode.js # Offline mod desteği
│   ├── visualSearchService.js # Görsel arama servisi
│   └── ecommerce/        # E-ticaret servisleri
├── data/
│   └── products.js       # Ürün veritabanı
├── contexts/             # State yönetimi
├── hooks/               # Özel React hooks
├── utils/              # Yardımcı fonksiyonlar
└── pages/              # Ana sayfalar
    ├── Home.jsx         # Ana sayfa
    ├── Products.jsx     # Ürün listesi
    ├── ProductDetail.jsx # Ürün detayı
    ├── VisualSearch.jsx # Görsel arama sayfası
    ├── ComplementaryProducts.jsx # Tamamlayıcı ürünler
    ├── Cart.jsx         # Sepet
    ├── Checkout.jsx     # Ödeme
    ├── Orders.jsx       # Sipariş takibi
    └── Profile.jsx      # Kullanıcı profili
```

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 16+ 
- npm veya yarn
- Google Gemini API anahtarı

### Kurulum

1. **Projeyi klonla**
   ```bash
   git clone <repository-url>
   cd ai-eticaret
   ```

2. **Bağımlılıkları yükle**
   ```bash
   npm install
   ```

3. **API anahtarını yapılandır**
   
   Gemini API anahtarınızı ayarlardan veya doğrudan kod içinde değiştirebilirsiniz:
   ```javascript
   // src/contexts/AppContext.jsx içinde API anahtarını güncelleyin
   settings: {
     geminiApiKey: 'AIzaSyBWw-Vy9VKIDDZ-7D4Qq738Fcc2_2eSBWA', // Mevcut
     selectedModel: 'gemini-pro-vision'
   }
   ```

4. **Geliştirme sunucusunu başlat**
   ```bash
   npm run dev
   ```

5. **Tarayıcıda aç**
   `http://localhost:3001` adresine git

## 🛍️ E-ticaret Özellikleri Detayı

### Ürün Yönetimi
- **Kategoriler**: Elektronik, Giyim, Ev&Bahçe, Kitap, Spor, Güzellik
- **Filtreleme**: Fiyat, marka, kategori, rating
- **Sıralama**: Popülerlik, fiyat, yenilik
- **Arama**: AI destekli doğal dil arama

### Sepet ve Ödeme
- **Akıllı Sepet**: Ürün önerileri ve indirim hesaplamaları
- **Çoklu Ödeme**: Kredi kartı, online bankacılık
- **Kargo Seçenekleri**: Standard ve hızlı teslimat
- **AI Teslimat Tahmini**: Gerçek zamanlı teslimat süresi tahmini

### Kullanıcı Hesabı
- **Profil Yönetimi**: Kişisel bilgiler ve tercihler
- **Adres Defteri**: Birden fazla teslimat adresi
- **Sipariş Geçmişi**: Detaylı sipariş takibi
- **Favoriler**: Beğenilen ürünlerin kaydedilmesi

### AI Özellikler
- **Görsel Analiz**: Ürün fotoğraflarını analiz ederek detaylı açıklamalar
- **Tamamlayıcı Ürünler**: AI ile uyumlu ürün önerileri bulma
- **Offline Mod**: İnternet bağlantısı olmadığında yerel AI deneyimi
- **Akıllı Önbellek**: 5 dakika TTL ile hızlandırılmış API yanıtları
- **Rate Limit Yönetimi**: Otomatik API limiti koruması ve offline geçiş

## 📊 Analitik ve Raporlama

### E-ticaret Metrikleri
- **Satış Performansı**: Gelir, sipariş sayısı, ortalama sepet
- **Ürün Analitiği**: En çok satanlar, kategori performansı
- **Kullanıcı Davranışı**: Sepet terk oranı, dönüşüm oranları
- **Kampanya Etkinliği**: İndirim ve promosyon analitiği

### AI Performans Metrikleri
- **API Başarı Oranı**: Gemini API başarı/hata oranları
- **Offline Mod Kullanımı**: Offline moda geçiş sıklığı ve süreleri  
- **Önbellek Etkinliği**: Cache hit/miss oranları ve performans kazancı
- **Görsel Analiz Performansı**: Başarılı görsel analiz oranları
- **Rate Limit Koruması**: API limitine yaklaşma sıklığı


## 🚀 Deployment

### Build İşlemi
```bash
npm run build
```

### Deployment Seçenekleri
- **GitHub Pages** - Ücretsiz static hosting
- **Vercel** - React uygulamaları için önerilen
- **Netlify** - Form işleme ile
- **Firebase Hosting** - Google ekosistemi entegrasyonu

### Production Ortam Değişkenleri
```
REACT_APP_GEMINI_API_KEY=production_api_key
REACT_APP_ENVIRONMENT=production
REACT_APP_ANALYTICS_ID=analytics_id
```

## 🧪 Test Etme

```bash
npm test
```

### Test Kapsamı
- **Unit testler**: Servisler ve yardımcı fonksiyonlar
- **Component testleri**: React Testing Library ile
- **E2E testler**: Alışveriş akışı testleri
- **API testleri**: E-ticaret servis testleri

## 🛠️ Geliştirme

### Kod Kalitesi
- **ESLint**: React ve accessibility kuralları
- **Prettier**: Tutarlı kod formatlama
- **TypeScript**: İsteğe bağlı tip güvenliği
- **Git Hooks**: Pre-commit kontrolleri

### NPM Scripts
```bash
npm run dev          # Geliştirme sunucusu
npm run build        # Production build
npm test             # Testleri çalıştır
npm run lint         # ESLint kontrolü
npm run format       # Prettier formatlama
```

## 🔐 Güvenlik

### E-ticaret Güvenlik
- **Payment Security**: Güvenli ödeme işlemleri
- **Data Protection**: Kullanıcı verilerinin korunması
- **Input Validation**: Form girdi doğrulaması
- **Session Management**: Güvenli oturum yönetimi

### AI & API Güvenliği
- **Rate Limiting**: Akıllı API çağrı sınırlaması ve önbellek sistemi
- **Offline Fallback**: API erişimi olmadığında güvenli offline mod
- **Error Boundary**: AI hatalarının yakalanması ve kullanıcı dostu mesajlar
- **API Key Protection**: Güvenli anahtar yönetimi ve şifreleme
- **Request Validation**: AI isteklerinin doğrulanması ve filtrelenmesi




## 📄 Lisans

Bu proje MIT Lisansı ile lisanslanmıştır - detaylar için LICENSE dosyasına bakın.

---

**ShopSmart ile Akıllı Alışverişin Yeni Adresi!**