import React from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Users, MessageCircle } from 'lucide-react';

const ReviewSummary = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">Henüz değerlendirme yok</p>
      </div>
    );
  }

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const totalReviews = reviews.length;
  
  // Rating distribution
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => 
    reviews.filter(review => review.rating === rating).length
  );

  // AI Summary based on reviews
  const generateAISummary = () => {
    const positiveCount = reviews.filter(r => r.rating >= 4).length;
    const negativeCount = reviews.filter(r => r.rating <= 2).length;
    const positiveRatio = (positiveCount / totalReviews) * 100;

    if (positiveRatio >= 80) {
      return {
        sentiment: "Çok Olumlu",
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        summary: "Müşteriler bu ürünü çok beğeniyor. Kalite ve performans övgü topluyor."
      };
    } else if (positiveRatio >= 60) {
      return {
        sentiment: "Olumlu",
        color: "text-blue-600", 
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        summary: "Genel olarak memnun müşteriler. Bazı küçük eksiklikler belirtilmiş."
      };
    } else if (positiveRatio >= 40) {
      return {
        sentiment: "Karışık",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20", 
        summary: "Karışık yorumlar var. Satın almadan önce dikkatli değerlendirin."
      };
    } else {
      return {
        sentiment: "Olumsuz",
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        summary: "Müşteri memnuniyeti düşük. Alternatif ürünlere bakmanızı öneririz."
      };
    }
  };

  const aiSummary = generateAISummary();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Müşteri Değerlendirmeleri
          </h3>
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              ({totalReviews} değerlendirme)
            </span>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating, index) => {
            const count = ratingCounts[index];
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center space-x-3">
                <span className="text-sm w-8">{rating}</span>
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-yellow-400 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Summary */}
      <div className={`p-6 ${aiSummary.bgColor}`}>
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">AI Analizi</h4>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${aiSummary.color} bg-white dark:bg-gray-800`}>
                {aiSummary.sentiment}
              </span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {aiSummary.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Users className="w-4 h-4" />
          <span>Son Değerlendirmeler</span>
        </h4>
        <div className="space-y-4">
          {reviews.slice(0, 3).map((review, index) => (
            <motion.div
              key={index}
              className="border-l-4 border-primary-200 pl-4 py-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {review.userName}
                </span>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < review.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                "{review.comment}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;