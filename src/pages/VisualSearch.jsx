import React, { useState, useCallback } from 'react';
import { Camera, Upload, Sparkles, ArrowRight, CloudUpload, CheckCircle, Search, Eye, Zap, ShoppingBag, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { createGeminiService } from '../services/geminiAPI';
import { getVisualSearchService } from '../services/visualSearchService';
import ProductCard from '../components/ecommerce/ProductCard';
import { searchProducts } from '../data/products';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const VisualSearch = () => {
  const { state } = useApp();
  const { settings } = state;
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [matchingProducts, setMatchingProducts] = useState([]);
  const [isGettingRecommendations, setIsGettingRecommendations] = useState(false);
  const [matchingMethod, setMatchingMethod] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      await processImageFile(imageFile);
    }
  }, []);

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      await processImageFile(file);
    }
  }, []);

  const processImageFile = async (file) => {
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage({
        file,
        preview: e.target.result,
        name: file.name,
        size: file.size
      });
    };
    reader.readAsDataURL(file);

    // Analyze with AI
    if (settings.geminiApiKey) {
      await analyzeImage(file);
    }
  };

  const analyzeImage = async (file) => {
    setIsAnalyzing(true);
    try {
      const geminiService = createGeminiService(settings.geminiApiKey, settings.selectedModel);
      
      // Convert image to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.readAsDataURL(file);
      });

      const prompt = `Analyze this image and describe the product(s) you see. Focus on:
      1. Product type/category 
      2. Key visual features (color, style, design)
      3. Material or texture if visible
      4. Brand or distinctive characteristics
      5. Suggested search keywords for e-commerce

      Provide a detailed but concise analysis that would help find similar products.`;

      const response = await geminiService.generateContentWithImage(
        prompt,
        base64,
        {
          mimeType: file.type
        }
      );

      const analysis = response.text;
      setAnalysisResults(analysis);

      // Get matching products based on analysis
      await getMatchingProducts(analysis);

      // Extract keywords and search for similar products
      const keywords = extractSearchKeywords(analysis);
      const results = searchProducts(keywords.join(' '));
      setSearchResults(results);

    } catch (error) {
      console.error('Error analyzing image:', error);
      setAnalysisResults('Görsel analizi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMatchingProducts = async (analysisResult) => {
    if (!analysisResult) return;
    
    setIsGettingRecommendations(true);
    try {
      console.log('🔍 Starting visual search matching...');
      
      const visualSearchService = getVisualSearchService();
      const result = await visualSearchService.getMatchingProducts(
        analysisResult,
        settings.geminiApiKey,
        {
          maxRecommendations: 6,
          includeComplementary: true
        }
      );
      
      console.log('🎯 Visual search matching completed:', {
        method: result.matchingMethod,
        confidence: result.confidence,
        products: result.products.length
      });
      
      setMatchingProducts(result.products || []);
      setMatchingMethod(result.matchingMethod);
      
    } catch (error) {
      console.error('Error getting matching products:', error);
      setMatchingProducts([]);
      setMatchingMethod('error');
    } finally {
      setIsGettingRecommendations(false);
    }
  };

  const testWithSampleAnalysis = async () => {
    const testAnalysis = "Bu görselde bej renkli, casual bir gömlek görüyorum. Modern tasarımı ve rahat kesimiyle günlük kullanım için ideal.";
    setAnalysisResults(testAnalysis);
    await getMatchingProducts(testAnalysis);
    
    // Also run the old keyword search for comparison
    const keywords = extractSearchKeywords(testAnalysis);
    const results = searchProducts(keywords.join(' '));
    setSearchResults(results);
  };

  const extractSearchKeywords = (analysis) => {
    // Simple keyword extraction - in a real app, this would be more sophisticated
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'this', 'that', 'these', 'those'];
    const words = analysis.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .slice(0, 5); // Take first 5 meaningful words
    
    return words;
  };

  if (!settings.geminiApiKey) {
    return (
      <motion.div 
        className="max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="text-center py-12" variants={itemVariants}>
          <motion.div 
            className="mx-auto flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 mb-8 shadow-xl"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            <Camera className="h-10 w-10 text-white" />
          </motion.div>
          
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            variants={itemVariants}
          >
            AI Görsel Arama
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            Fotoğraf yükleyerek benzer ürünleri bulmak için önce API anahtarınızı yapılandırmanız gerekiyor.
          </motion.p>

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="inline-flex items-center px-8 py-4 bg-gray-400 text-white font-semibold rounded-2xl opacity-50 cursor-not-allowed">
                API Yapılandırma Devre Dışı
              </div>
              
              <motion.button
                onClick={testWithSampleAnalysis}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Eye className="w-5 h-5 mr-3" />
                Demo: Bej Gömlek Analizi
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="text-center py-12 mb-8" variants={itemVariants}>
        <motion.div 
          className="mx-auto flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 mb-8 shadow-xl relative"
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ duration: 0.3 }}
        >
          <Camera className="h-10 w-10 text-white" />
          <motion.div
            className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-3 h-3 text-white" />
          </motion.div>
        </motion.div>
        
        <motion.h1 
          className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          variants={itemVariants}
        >
          AI Görsel Arama
        </motion.h1>
        
        <motion.p 
          className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed"
          variants={itemVariants}
        >
          ShopSmart - Akıllı Alışverişin Yeni Adresi'nde fotoğraf yükleyerek benzer ürünleri keşfedin. AI destekli görsel analiz ile istediğiniz ürünü hızlıca bulun.
        </motion.p>
      </motion.div>

      {/* Upload Area */}
      <motion.div 
        className="mb-12"
        variants={itemVariants}
      >
        <motion.div
          className={`relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300 ${
            isDragOver 
              ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20 scale-105' 
              : 'border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 hover:border-purple-400 dark:hover:border-purple-500'
          } backdrop-blur-sm`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ scale: 1.01 }}
          animate={{ 
            scale: isDragOver ? 1.02 : 1,
            borderColor: isDragOver ? '#a855f7' : undefined
          }}
        >
          <div className="relative z-10 text-center">
            <motion.div
              className="mx-auto w-16 h-16 mb-6"
              animate={{ 
                y: isDragOver ? -10 : 0,
                rotate: isDragOver ? 5 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <CloudUpload className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            
            <motion.h3 
              className="text-2xl font-bold text-gray-900 dark:text-white mb-4"
              animate={{ 
                color: isDragOver ? '#a855f7' : undefined
              }}
            >
              {isDragOver ? 'Fotoğrafı Bırakın!' : 'Fotoğraf Yükle'}
            </motion.h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              JPG, PNG, WEBP formatlarında ürün fotoğrafları desteklenir
            </p>
            
            <motion.label
              className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Fotoğraf Seç
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </motion.label>
          </div>
        </motion.div>
      </motion.div>

      {/* Uploaded Image Analysis */}
      <AnimatePresence>
        {uploadedImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-12"
          >
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-6">
                <motion.div
                  className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Eye className="w-4 h-4 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Görsel Analizi
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Image Preview */}
                <div className="space-y-4">
                  <img
                    src={uploadedImage.preview}
                    alt="Uploaded"
                    className="w-full h-64 object-cover rounded-2xl shadow-lg"
                  />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium">{uploadedImage.name}</p>
                    <p>{(uploadedImage.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>

                {/* Analysis Results */}
                <div className="space-y-4">
                  {isAnalyzing ? (
                    <div className="flex items-center space-x-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Zap className="w-6 h-6 text-purple-500" />
                      </motion.div>
                      <p className="text-gray-600 dark:text-gray-400">AI analizi yapılıyor...</p>
                    </div>
                  ) : analysisResults ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <p className="font-semibold text-gray-900 dark:text-white">Analiz Tamamlandı</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {analysisResults}
                        </p>
                      </div>
                      
                      {/* Manual recommendation trigger for testing */}
                      {analysisResults && matchingProducts.length === 0 && !isGettingRecommendations && (
                        <motion.button
                          onClick={() => getMatchingProducts(analysisResults)}
                          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl mt-4"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>Uyumlu Ürünleri Bul</span>
                        </motion.button>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Matching Products */}
      <AnimatePresence>
        {matchingProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-12"
          >
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-blue-900/20 rounded-3xl p-8 border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <motion.div
                    className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <ShoppingBag className="w-4 h-4 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Uyumlu Ürün Önerileri ({matchingProducts.length})
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {matchingMethod === 'ai' ? '🤖 AI destekli akıllı eşleştirme' : 
                       matchingMethod === 'algorithm' ? '🔧 Akıllı algoritma ile eşleştirme' : 
                       '📊 Popüler ürünler'}
                    </p>
                  </div>
                </div>
                
                {isGettingRecommendations && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-6 h-6 text-purple-500" />
                  </motion.div>
                )}
              </div>
              
              {isGettingRecommendations ? (
                <div className="text-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4"
                  >
                    <Heart className="w-6 h-6 text-white" />
                  </motion.div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Görselinize uygun ürünler bulunuyor...
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matchingProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-12"
          >
            <div className="flex items-center space-x-3 mb-6">
              <motion.div
                className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Search className="w-4 h-4 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Benzer Ürünler ({searchResults.length})
              </h3>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Banner */}
      <motion.div 
        className="text-center"
        variants={itemVariants}
      >
        <motion.div
          className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-50 via-pink-50/50 to-purple-50 dark:from-purple-900/20 dark:via-pink-900/10 dark:to-purple-900/20 rounded-3xl border border-purple-200/50 dark:border-purple-800/50 backdrop-blur-sm"
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-6 h-6 text-purple-500" />
          </motion.div>
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            AI destekli görsel arama aktif!
          </span>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Camera className="w-6 h-6 text-pink-500" />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default VisualSearch;