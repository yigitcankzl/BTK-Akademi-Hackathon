import React from 'react';
import { ExternalLink } from 'lucide-react';
import { APP_CONFIG } from '../../utils/constants';

const Footer = () => {
  return (
    <footer className="mt-12 py-8 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 ShopSmart - Akıllı E-Ticaret Platformu
            </p>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              BTK Akademi Hackathon 2025 için geliştirildi - Türkiye
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href="https://ai.google.dev/gemini-api"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
            >
              <span>Google Gemini AI ile güçlendirildi</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
