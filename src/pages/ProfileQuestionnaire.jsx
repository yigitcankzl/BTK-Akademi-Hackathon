import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Brain, ShoppingBag, Heart, Palette, Clock, DollarSign, Star, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { getGeminiService } from '../services/geminiAPI';
import { getUserProfileService } from '../services/userProfileService';

const ProfileQuestionnaire = () => {
  const { state, dispatch, actionTypes } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profileResult, setProfileResult] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [existingProfile, setExistingProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const questionSections = [
    {
      id: 'lifestyle',
      title: 'Yaşam Tarzınız',
      icon: User,
      color: 'from-blue-500 to-indigo-600',
      questions: [
        {
          id: 'daily_routine',
          type: 'single',
          question: 'Günlük rutininizi nasıl tanımlarsınız?',
          options: [
            { value: 'structured', label: 'Planlı ve düzenli', emoji: '📅' },
            { value: 'flexible', label: 'Esnek ve spontane', emoji: '🌊' },
            { value: 'busy', label: 'Yoğun ve hızlı tempolu', emoji: '⚡' },
            { value: 'relaxed', label: 'Rahat ve sakin', emoji: '😌' }
          ]
        },
        {
          id: 'social_preference',
          type: 'single',
          question: 'Sosyal aktiviteleri nasıl tercih edersiniz?',
          options: [
            { value: 'extrovert', label: 'Kalabalık ortamları severim', emoji: '🎉' },
            { value: 'introvert', label: 'Küçük grup aktivitelerini tercih ederim', emoji: '👥' },
            { value: 'balanced', label: 'Duruma göre değişir', emoji: '⚖️' },
            { value: 'solo', label: 'Genellikle tek başıma vakit geçiririm', emoji: '🧘' }
          ]
        },
        {
          id: 'work_style',
          type: 'single',
          question: 'Çalışma/okul hayatınızda hangi rol size daha uygun?',
          options: [
            { value: 'leader', label: 'Lider/Yönetici', emoji: '👑' },
            { value: 'creative', label: 'Yaratıcı/Tasarımcı', emoji: '🎨' },
            { value: 'analytical', label: 'Analitik/Stratejist', emoji: '🧠' },
            { value: 'supportive', label: 'Destekleyici/Yardımcı', emoji: '🤝' }
          ]
        }
      ]
    },
    {
      id: 'shopping_habits',
      title: 'Alışveriş Alışkanlıklarınız',
      icon: ShoppingBag,
      color: 'from-green-500 to-emerald-600',
      questions: [
        {
          id: 'shopping_frequency',
          type: 'single',
          question: 'Giyim alışverişi ne sıklıkla yaparsınız?',
          options: [
            { value: 'weekly', label: 'Haftada bir veya daha sık', emoji: '🛍️' },
            { value: 'monthly', label: 'Ayda bir', emoji: '📅' },
            { value: 'seasonal', label: 'Mevsimlik (3-4 ayda bir)', emoji: '🍂' },
            { value: 'rare', label: 'Çok nadir (yılda 1-2 kez)', emoji: '⏰' }
          ]
        },
        {
          id: 'decision_speed',
          type: 'single',
          question: 'Satın alma kararlarınızı nasıl verirsiniz?',
          options: [
            { value: 'instant', label: 'Hemen karar veririm', emoji: '⚡' },
            { value: 'quick', label: 'Kısa sürede karar veririm', emoji: '💨' },
            { value: 'research', label: 'Araştırma yapar, karşılaştırırım', emoji: '🔍' },
            { value: 'long_think', label: 'Uzun süre düşünürüm', emoji: '🤔' }
          ]
        },
        {
          id: 'shopping_motivation',
          type: 'multiple',
          question: 'Alışveriş yaparken sizi motive eden faktörler nelerdir?',
          options: [
            { value: 'need', label: 'İhtiyaç', emoji: '✅' },
            { value: 'fashion', label: 'Moda ve trend', emoji: '👗' },
            { value: 'mood', label: 'Ruh halim', emoji: '💝' },
            { value: 'discount', label: 'İndirim ve fırsatlar', emoji: '💰' },
            { value: 'quality', label: 'Kalite', emoji: '⭐' },
            { value: 'comfort', label: 'Konfor', emoji: '😌' }
          ]
        }
      ]
    },
    {
      id: 'style_preferences',
      title: 'Stil Tercihleri',
      icon: Palette,
      color: 'from-purple-500 to-pink-600',
      questions: [
        {
          id: 'style_type',
          type: 'single',
          question: 'Hangi stil kategorisi size daha yakın?',
          options: [
            { value: 'classic', label: 'Klasik ve zarif', emoji: '👔' },
            { value: 'casual', label: 'Günlük ve rahat', emoji: '👕' },
            { value: 'trendy', label: 'Modaya uygun ve çağdaş', emoji: '✨' },
            { value: 'unique', label: 'Özgün ve farklı', emoji: '🦄' }
          ]
        },
        {
          id: 'color_preference',
          type: 'multiple',
          question: 'Hangi renk paletlerini tercih edersiniz?',
          options: [
            { value: 'neutral', label: 'Nötr renkler (bej, gri, siyah)', emoji: '⚫' },
            { value: 'earth', label: 'Toprak tonları (kahverengi, haki)', emoji: '🤎' },
            { value: 'bright', label: 'Canlı renkler (kırmızı, mavi)', emoji: '🔴' },
            { value: 'pastel', label: 'Pastel tonlar (pembe, mint)', emoji: '🌸' },
            { value: 'dark', label: 'Koyu tonlar (lacivert, bordo)', emoji: '🖤' },
            { value: 'mixed', label: 'Karışık, deneyime açığım', emoji: '🌈' }
          ]
        },
        {
          id: 'comfort_vs_style',
          type: 'scale',
          question: 'Konfor mu stil mi daha önemli?',
          scale: {
            min: 1,
            max: 5,
            minLabel: 'Tamamen konfor',
            maxLabel: 'Tamamen stil',
            emoji: ['😴', '😌', '⚖️', '✨', '👑']
          }
        }
      ]
    },
    {
      id: 'personality_psychology',
      title: 'Kişilik ve Psikoloji',
      icon: Brain,
      color: 'from-indigo-500 to-purple-600',
      questions: [
        {
          id: 'risk_taking',
          type: 'scale',
          question: 'Yeni şeyler deneme konusunda ne kadar risk alırsınız?',
          scale: {
            min: 1,
            max: 5,
            minLabel: 'Güvenli seçimler',
            maxLabel: 'Yeni deneyimler',
            emoji: ['🛡️', '🤷', '⚖️', '🚀', '🦋']
          }
        },
        {
          id: 'social_influence',
          type: 'scale',
          question: 'Başkalarının görüşleri ne kadar önemli?',
          scale: {
            min: 1,
            max: 5,
            minLabel: 'Sadece kendi zevkim',
            maxLabel: 'Sosyal onay önemli',
            emoji: ['🙋', '😊', '👥', '👀', '📸']
          }
        },
        {
          id: 'mood_impact',
          type: 'single',
          question: 'Ruh haliniz alışveriş tercihlerinizi nasıl etkiler?',
          options: [
            { value: 'high_impact', label: 'Çok etkiler, mood\'uma göre alışveriş yaparım', emoji: '🎭' },
            { value: 'moderate', label: 'Orta düzeyde etkiler', emoji: '🌊' },
            { value: 'low_impact', label: 'Az etkiler, genellikle aynı tarzda alışveriş yaparım', emoji: '🎯' },
            { value: 'no_impact', label: 'Hiç etkilemez, plan dahilinde hareket ederim', emoji: '📋' }
          ]
        }
      ]
    },
    {
      id: 'budget_priorities',
      title: 'Bütçe ve Öncelikler',
      icon: DollarSign,
      color: 'from-yellow-500 to-orange-600',
      questions: [
        {
          id: 'price_sensitivity',
          type: 'scale',
          question: 'Fiyat konusunda ne kadar hassassınız?',
          scale: {
            min: 1,
            max: 5,
            minLabel: 'Fiyat önemli değil',
            maxLabel: 'Fiyat çok önemli',
            emoji: ['💎', '💰', '⚖️', '💵', '🪙']
          }
        },
        {
          id: 'quality_vs_price',
          type: 'single',
          question: 'Kalite ve fiyat arasında nasıl bir denge kurarsınız?',
          options: [
            { value: 'premium', label: 'Yüksek kalite için fazla öderim', emoji: '👑' },
            { value: 'balanced', label: 'Kalite-fiyat dengesini ararım', emoji: '⚖️' },
            { value: 'budget', label: 'Bütçe dostu seçenekleri tercih ederim', emoji: '💰' },
            { value: 'bargain', label: 'En ucuz seçenekleri ararım', emoji: '🏷️' }
          ]
        },
        {
          id: 'spending_priorities',
          type: 'multiple',
          question: 'Giyim kategorilerinde hangi alanlara daha çok harcama yaparsınız?',
          options: [
            { value: 'basics', label: 'Temel giyim (t-shirt, pantolon)', emoji: '👕' },
            { value: 'formal', label: 'Resmi kıyafetler', emoji: '👔' },
            { value: 'shoes', label: 'Ayakkabı', emoji: '👟' },
            { value: 'accessories', label: 'Aksesuar', emoji: '👜' },
            { value: 'seasonal', label: 'Mevsimlik özel parçalar', emoji: '🧥' },
            { value: 'underwear', label: 'İç giyim', emoji: '🩲' }
          ]
        }
      ]
    }
  ];

  // Component mount olduğunda mevcut profili kontrol et
  useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    try {
      const userId = state.user?.profile?.id || state.user?.id || state.user?.uid;
      if (!userId) return;

      const userProfileService = getUserProfileService();
      
      // Önce Firebase'den kontrol et
      const result = await userProfileService.getUserProfile(userId);
      
      if (result.success) {
        console.log('📋 Existing profile found in Firebase');
        setExistingProfile(result.profile);
        setResponses(result.profile.responses);
        setProfileResult(result.profile.analysis);
        setIsCompleted(true);
        return;
      }
      
      // Firebase'de yoksa localStorage'dan migrate etmeyi dene
      const migrated = await userProfileService.migrateFromLocalStorage(userId);
      if (migrated) {
        // Migrate edildikten sonra tekrar kontrol et
        const newResult = await userProfileService.getUserProfile(userId);
        if (newResult.success) {
          setExistingProfile(newResult.profile);
          setResponses(newResult.profile.responses);
          setProfileResult(newResult.profile.analysis);
          setIsCompleted(true);
        }
      }
      
    } catch (error) {
      console.error('❌ Error checking existing profile:', error);
      // Hata durumunda sessizce devam et
    }
  };

  const handleResponse = (questionId, value, isMultiple = false) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: isMultiple 
        ? (prev[questionId] ? 
            (prev[questionId].includes(value) 
              ? prev[questionId].filter(v => v !== value)
              : [...prev[questionId], value]
            )
            : [value]
          )
        : value
    }));
  };

  const canProceed = () => {
    const currentSection = questionSections[currentStep];
    return currentSection.questions.every(q => {
      const response = responses[q.id];
      if (q.type === 'multiple') {
        return response && response.length > 0;
      }
      return response !== undefined && response !== null && response !== '';
    });
  };

  const handleNext = () => {
    if (currentStep < questionSections.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      analyzeProfile();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const analyzeProfile = async () => {
    setIsAnalyzing(true);
    
    try {
      if (!state.settings.geminiApiKey) {
        throw new Error('Gemini API key bulunamadı. Lütfen ayarlardan API anahtarınızı girin.');
      }

      const geminiService = getGeminiService();
      geminiService.setApiKey(state.settings.geminiApiKey);

      const prompt = `Sen uzman bir kullanıcı davranış analisti ve kişiselleştirme uzmanısın. Bu kullanıcının profil anketinden çıkan detaylı kişilik analizini yap.

KULLANICI ANKETİ SONUÇLARI:
${JSON.stringify(responses, null, 2)}

GÖREV: Bu kullanıcı için kapsamlı bir AI profili oluştur:

1. KİŞİLİK ANALİZİ (personalityAnalysis):
   - Ana kişilik özellikleri
   - Karar verme tarzı
   - Sosyal eğilimler
   - Risk alma düzeyi

2. ALISVERIS PSİKOLOJİSİ (shoppingPsychology):
   - Satın alma motivasyonları
   - Karar verme süreci
   - Fiyat hassasiyeti
   - Kalite algısı

3. STİL PROFİLİ (styleProfile):
   - Temel stil karakteristiği
   - Renk tercihleri
   - Konfor vs stil dengesi
   - Moda takip etme düzeyi

4. ÖNERİ STRATEJİSİ (recommendationStrategy):
   - Ürün önerilerinde odaklanılacak faktörler
   - Pazarlama mesajı tonu
   - Sezonallik duyarlılığı
   - Sosyal etki düzeyi

5. AI PARAMETRELER (aiParameters):
   - purchaseIntent: "düşük"/"orta"/"yüksek"
   - priceSensitivity: "düşük"/"orta"/"yüksek"
   - explorationPreference: "güvenli_seçimler"/"kısmi_keşif"/"yeni_deneyimler"
   - socialInfluence: "düşük"/"orta"/"yüksek"
   - lifestylePriority: "konfor"/"stil"/"fonksiyonellik"/"statü"/"sürdürülebilirlik"
   - emotionalState: "sakin"/"heyecanlı"/"motivli"/"stresli"
   - timeConstraint: "acil"/"normal"/"bol_zamanım_var"

6. KİŞİSELLEŞTİRME NOTLARI (personalizationNotes):
   - Özel dikkat edilecek noktalar
   - Kaçınılması gereken yaklaşımlar
   - Güçlü motivasyon tetikleyicileri

YANIT FORMATI (sadece JSON):
{
  "personalityAnalysis": {
    "mainTraits": ["trait1", "trait2", ...],
    "decisionMakingStyle": "açıklama",
    "socialTendency": "açıklama", 
    "riskLevel": "açıklama"
  },
  "shoppingPsychology": {
    "primaryMotivators": ["motivator1", "motivator2", ...],
    "decisionProcess": "açıklama",
    "priceAttitude": "açıklama",
    "qualityExpectation": "açıklama"
  },
  "styleProfile": {
    "coreStyle": "açıklama",
    "colorPreferences": ["color1", "color2", ...],
    "comfortStyleBalance": "açıklama",
    "fashionFollowing": "açıklama"
  },
  "recommendationStrategy": {
    "focusFactors": ["factor1", "factor2", ...],
    "messagingTone": "açıklama",
    "seasonalSensitivity": "açıklama",
    "socialInfluenceLevel": "açıklama"
  },
  "aiParameters": {
    "purchaseIntent": "orta",
    "priceSensitivity": "orta", 
    "explorationPreference": "kısmi_keşif",
    "socialInfluence": "orta",
    "lifestylePriority": "konfor",
    "emotionalState": "sakin",
    "timeConstraint": "normal"
  },
  "personalizationNotes": {
    "strengths": ["strength1", "strength2", ...],
    "avoidances": ["avoid1", "avoid2", ...],
    "triggers": ["trigger1", "trigger2", ...]
  },
  "confidence": 0.85,
  "profileScore": 92
}`;

      const response = await geminiService.generateContent(prompt, {
        temperature: 0.8,
        maxOutputTokens: 1500
      });

      const cleanText = response.text.trim().replace(/```json|```/g, '');
      const analysis = JSON.parse(cleanText);

      // Store user profile in Firebase
      const userId = state.user?.profile?.id || state.user?.id || state.user?.uid || 'anonymous';
      const userProfileService = getUserProfileService();
      
      const profileData = {
        responses,
        analysis
      };

      try {
        if (isEditing && existingProfile) {
          // Güncelleme
          await userProfileService.updateUserProfile(userId, {
            responses,
            analysis
          });
          console.log('✅ Profile updated in Firebase');
        } else {
          // Yeni kayıt
          await userProfileService.saveUserProfile(userId, profileData);
          console.log('✅ Profile saved to Firebase');
        }
      } catch (error) {
        console.error('❌ Firebase save failed, using localStorage as fallback');
        // Fallback olarak localStorage kullan
        const userProfile = {
          responses,
          analysis,
          createdAt: new Date().toISOString(),
          userId
        };
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
      }
      
      setProfileResult(analysis);
      setIsCompleted(true);
      setIsEditing(false);

      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'success',
          message: '🧠 AI profil analizi tamamlandı! Artık size özel öneriler alabilirsiniz.',
          duration: 6000,
        }
      });

    } catch (error) {
      console.error('❌ Profile analysis failed:', error);
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'error',
          message: error.message || 'Profil analizi sırasında hata oluştu',
          duration: 5000,
        }
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderQuestion = (question) => {
    const response = responses[question.id];

    switch (question.type) {
      case 'single':
        return (
          <div className="space-y-3">
            {question.options.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => handleResponse(question.id, option.value)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  response === option.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </span>
                  {response === option.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto"
                    >
                      <Check className="w-5 h-5 text-primary-600" />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        );

      case 'multiple':
        return (
          <div className="space-y-3">
            {question.options.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => handleResponse(question.id, option.value, true)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  response && response.includes(option.value)
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </span>
                  {response && response.includes(option.value) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto"
                    >
                      <Check className="w-5 h-5 text-primary-600" />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        );

      case 'scale':
        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{question.scale.minLabel}</span>
              <span>{question.scale.maxLabel}</span>
            </div>
            <div className="flex justify-between space-x-2">
              {Array.from({ length: question.scale.max - question.scale.min + 1 }, (_, i) => (
                <motion.button
                  key={i + question.scale.min}
                  onClick={() => handleResponse(question.id, i + question.scale.min)}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    response === i + question.scale.min
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">{question.scale.emoji[i]}</div>
                    <div className="text-sm font-medium">{i + question.scale.min}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setIsCompleted(false);
    setCurrentStep(0);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    if (existingProfile) {
      setResponses(existingProfile.responses);
      setProfileResult(existingProfile.analysis);
      setIsCompleted(true);
    } else {
      setResponses({});
      setProfileResult(null);
      setIsCompleted(false);
      setCurrentStep(0);
    }
  };

  // Mevcut profil varsa ve düzenleme modunda değilse, önce seçenek sun
  if (isCompleted && profileResult && !isEditing) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🎉 {existingProfile ? 'AI Profil Analiziniz' : 'AI Profil Analizi Tamamlandı!'}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Profiliniz %{profileResult.profileScore} uyumluluk ile oluşturuldu
          </p>
          
          {existingProfile && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Son güncelleme: {new Date(existingProfile.updatedAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${profileResult.profileScore}%` }}
              transition={{ delay: 0.5, duration: 1.5 }}
            />
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Personality Analysis */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="w-6 h-6 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Kişilik Analizi
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ana Özellikler:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {profileResult.personalityAnalysis.mainTraits.map((trait, i) => (
                    <span key={i} className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded text-sm">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Karar Verme:</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {profileResult.personalityAnalysis.decisionMakingStyle}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Style Profile */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Palette className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Stil Profili
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ana Stil:</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {profileResult.styleProfile.coreStyle}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Renk Tercihleri:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {profileResult.styleProfile.colorPreferences.map((color, i) => (
                    <span key={i} className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-sm">
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Shopping Psychology */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center space-x-2 mb-4">
              <ShoppingBag className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Alışveriş Psikolojisi
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Motivasyonlar:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {profileResult.shoppingPsychology.primaryMotivators.map((motivator, i) => (
                    <span key={i} className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded text-sm">
                      {motivator}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Fiyat Yaklaşımı:</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {profileResult.shoppingPsychology.priceAttitude}
                </p>
              </div>
            </div>
          </motion.div>

          {/* AI Parameters */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Star className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Parametreleri
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Satın Alma:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {profileResult.aiParameters.purchaseIntent}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Fiyat Hassasiyet:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {profileResult.aiParameters.priceSensitivity}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Keşif:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {profileResult.aiParameters.explorationPreference}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Yaşam Tarzı:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {profileResult.aiParameters.lifestylePriority}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 mt-8 justify-center"
        >
          {existingProfile && (
            <motion.button
              onClick={startEditing}
              className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <User className="w-5 h-5" />
              <span>Profili Düzenle</span>
            </motion.button>
          )}
          <motion.a
            href="/recommendations"
            className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Brain className="w-5 h-5" />
            <span>AI Önerilerimi Gör</span>
          </motion.a>
          
          <motion.a
            href="/products"
            className="inline-flex items-center justify-center space-x-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl font-semibold transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Ürünleri İncele</span>
          </motion.a>
        </motion.div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            💡 {existingProfile ? 'Profiliniz güncel ve AI önerileriniz kişisel!' : 'Profiliniz güncellendi ve AI önerileriniz artık daha kişisel olacak!'}
          </p>
        </div>
      </div>
    );
  }

  const currentSection = questionSections[currentStep];
  const IconComponent = currentSection.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Editing Mode Header */}
      {isEditing && (
        <div className="text-center mb-6">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <User className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-orange-800 dark:text-orange-200">Profil Düzenleme Modu</span>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Mevcut cevaplarınızı değiştirerek profilinizi güncelleyebilirsiniz
            </p>
            <button
              onClick={cancelEditing}
              className="mt-2 text-sm text-orange-600 hover:text-orange-700 underline"
            >
              İptal et ve geri dön
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          className={`mx-auto w-16 h-16 bg-gradient-to-br ${currentSection.color} rounded-full flex items-center justify-center mb-4`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          key={currentStep}
        >
          <IconComponent className="w-8 h-8 text-white" />
        </motion.div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          AI Profil Questionnaire
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          Size özel öneriler için kişiliğinizi tanıyalım
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
          <motion.div
            className={`bg-gradient-to-r ${currentSection.color} h-2 rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / questionSections.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {currentStep + 1} / {questionSections.length} - {currentSection.title}
        </p>
      </div>

      {/* Question Section */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
        >
          <div className="space-y-8">
            {currentSection.questions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {question.question}
                </h3>
                {question.type === 'multiple' && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Birden fazla seçenek işaretleyebilirsiniz
                  </p>
                )}
                {renderQuestion(question)}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <motion.button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          whileHover={{ scale: currentStep === 0 ? 1 : 1.05 }}
          whileTap={{ scale: currentStep === 0 ? 1 : 0.95 }}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Önceki</span>
        </motion.button>

        <motion.button
          onClick={handleNext}
          disabled={!canProceed() || isAnalyzing}
          className={`flex items-center space-x-2 bg-gradient-to-r ${currentSection.color} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300`}
          whileHover={{ scale: (!canProceed() || isAnalyzing) ? 1 :  1.05 }}
          whileTap={{ scale: (!canProceed() || isAnalyzing) ? 1 : 0.95 }}
        >
          {isAnalyzing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="w-5 h-5" />
              </motion.div>
              <span>Analiz Ediliyor...</span>
            </>
          ) : currentStep === questionSections.length - 1 ? (
            <>
              <span>{isEditing ? 'Profili Güncelle' : 'Profili Oluştur'}</span>
              <Sparkles className="w-5 h-5" />
            </>
          ) : (
            <>
              <span>Sonraki</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>

      {/* Help Text */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          🤖 Verdiğiniz cevaplar AI tarafından analiz edilecek ve size özel öneriler oluşturulacak
        </p>
      </div>
    </div>
  );
};

export default ProfileQuestionnaire;