import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react';
import { geminiOfflineMode } from '../../services/geminiOfflineMode';

const OfflineStatus = ({ className = '' }) => {
  const [status, setStatus] = useState(geminiOfflineMode.getStatus());
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Her 5 saniyede status'u güncelle
    const interval = setInterval(() => {
      setStatus(geminiOfflineMode.getStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleForceOnline = () => {
    geminiOfflineMode.forceOnlineMode();
    setStatus(geminiOfflineMode.getStatus());
  };

  const formatTime = (ms) => {
    if (ms <= 0) return 'Şimdi';
    const minutes = Math.ceil(ms / (1000 * 60));
    return `${minutes} dakika`;
  };

  if (!status.isOffline) {
    return (
      <div className={`flex items-center text-green-600 text-xs ${className}`}>
        <Wifi size={14} className="mr-1" />
        <span>AI Aktif</span>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div 
        className="flex items-center text-orange-600 text-xs cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <WifiOff size={14} className="mr-1" />
        <span>AI Offline</span>
        {status.canRetryIn > 0 && (
          <Clock size={12} className="ml-1" />
        )}
      </div>

      {showDetails && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 min-w-64">
          <div className="text-xs text-gray-700 space-y-2">
            <div className="flex items-center text-orange-600 font-medium">
              <WifiOff size={14} className="mr-2" />
              AI Servisi Geçici Olarak Kullanılamıyor
            </div>
            
            <div className="text-gray-600">
              <p>• Ardışık {status.consecutiveFailures} hata nedeniyle offline mode aktif</p>
              {status.canRetryIn > 0 ? (
                <p>• Otomatik yeniden deneme: {formatTime(status.canRetryIn)}</p>
              ) : (
                <p className="text-green-600">• Yeniden deneme için hazır</p>
              )}
            </div>

            <div className="bg-blue-50 p-2 rounded text-xs">
              <p className="text-blue-800 font-medium">Bu sürada:</p>
              <p className="text-blue-700">• Yerel AI benzeri özellikler kullanılıyor</p>
              <p className="text-blue-700">• Önbellekteki veriler gösteriliyor</p>
            </div>

            <button
              onClick={handleForceOnline}
              className="flex items-center w-full px-3 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-xs"
            >
              <RefreshCw size={12} className="mr-1" />
              Manuel Yeniden Dene
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineStatus;