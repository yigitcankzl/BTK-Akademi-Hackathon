/**
 * Enhanced Review Display Component
 * 
 * Geliştirilmiş yorumları modern ve kullanıcı dostu bir arayüzle gösterir:
 * - Detaylı yorum metni
 * - Avantaj/dezavantaj listeleri
 * - Kullanım senaryoları
 * - Tavsiye bilgileri
 * - Görsel rating gösterimi
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  User, 
  Calendar, 
  Badge,
  ChevronDown,
  ChevronUp,
  Quote,
  Target,
  Users,
  CheckCircle2,
  XCircle,
  Award
} from 'lucide-react';

const EnhancedReviewDisplay = ({ reviews, productName }) => {
  const [expandedReviews, setExpandedReviews] = useState(new Set());
  const [sortBy, setSortBy] = useState('date'); // date, rating, helpful

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Quote className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Henüz yorum bulunmuyor.</p>
      </div>
    );
  }

  const toggleExpanded = (reviewId) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'helpful':
        return (b.helpful || 0) - (a.helpful || 0);
      case 'date':
      default:
        return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
    }
  });

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: (reviews.filter(r => r.rating === rating).length / reviews.length) * 100
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Review Summary Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Müşteri Yorumları
          </h3>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(averageRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {reviews.length} değerlendirme
              </p>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {ratingDistribution.reverse().map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center space-x-2 text-sm">
              <span className="w-4 text-gray-600 dark:text-gray-400">{rating}</span>
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-xs text-gray-500 dark:text-gray-400">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          <strong>{productName}</strong> için {reviews.length} detaylı değerlendirme
        </p>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Sırala:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="date">En Yeni</option>
            <option value="rating">En Yüksek Puan</option>
            <option value="helpful">En Faydalı</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {sortedReviews.map((review, index) => {
          const isExpanded = expandedReviews.has(review.id || index);
          const isEnhanced = review.enhanced && (review.pros || review.cons);
          
          return (
            <motion.div
              key={review.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {review.userAvatar ? (
                    <img
                      src={review.userAvatar}
                      alt={review.userName}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {review.userName}
                      </h4>
                      {review.verified && (
                        <Badge className="w-4 h-4 text-green-500" title="Doğrulanmış Alıcı" />
                      )}
                      {isEnhanced && (
                        <Award className="w-4 h-4 text-blue-500" title="Detaylı İnceleme" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{review.date || new Date(review.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {review.rating}/5
                  </span>
                </div>
              </div>

              {/* Review Content */}
              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {review.comment}
                </p>
              </div>

              {/* Enhanced Content */}
              {isEnhanced && (
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4"
                    >

                      {/* Usage Context */}
                      {review.usageContext && (
                        <div className="mt-4">
                          <h5 className="flex items-center space-x-2 font-semibold text-blue-700 dark:text-blue-400 mb-2">
                            <Target className="w-4 h-4" />
                            <span>Kullanım Deneyimi</span>
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                            {review.usageContext}
                          </p>
                        </div>
                      )}

                      {/* Recommendation */}
                      {review.recommendation && (
                        <div className="mt-4">
                          <h5 className="flex items-center space-x-2 font-semibold text-purple-700 dark:text-purple-400 mb-2">
                            <Users className="w-4 h-4" />
                            <span>Tavsiye</span>
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                            {review.recommendation}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              {/* Review Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{review.helpful || 0}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors">
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>

                {isEnhanced && (
                  <button
                    onClick={() => toggleExpanded(review.id || index)}
                    className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                  >
                    <span>{isExpanded ? 'Daha Az' : 'Detayları Göster'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Enhanced Reviews Notice */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
          <Award className="w-5 h-5" />
          <span className="font-semibold">Geliştirilmiş Yorum Sistemi</span>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
          Yorumlarımız AI teknolojisi ile detaylandırılarak avantaj/dezavantaj analizi, 
          kullanım senaryoları ve tavsiyeler içeriyor. Bu sayede daha bilinçli alışveriş 
          kararları verebilirsiniz.
        </p>
      </div>
    </div>
  );
};

export default EnhancedReviewDisplay;