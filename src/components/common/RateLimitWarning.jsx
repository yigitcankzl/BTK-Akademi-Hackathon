import React from 'react';
import { Clock, AlertTriangle, Info } from 'lucide-react';

const RateLimitWarning = ({ message, onRetry, showTips = true }) => {
  const isRateLimit = message?.includes('Rate limit') || message?.includes('aşıldı');
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {isRateLimit ? (
            <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            {isRateLimit ? 'API Limit Uyarısı' : 'AI Servis Uyarısı'}
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>{message}</p>
          </div>
          
          {showTips && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                </div>
                <div className="ml-2">
                  <h4 className="text-xs font-medium text-blue-800 mb-1">
                    API Limitlerini Aşmamak İçin İpuçları:
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Aynı soruları kısa sürede tekrarlamayın</li>
                    <li>• Görsel arama yaparken 4-5 saniye bekleyin</li>
                    <li>• Çok uzun metinler yerine özet sorular sorun</li>
                    <li>• Sayfayı yenilemeyin, önceki sonuçlar hatırlanır</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="text-sm bg-yellow-100 text-yellow-800 px-3 py-2 rounded-md hover:bg-yellow-200 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RateLimitWarning;