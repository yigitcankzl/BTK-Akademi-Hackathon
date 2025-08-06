import React from 'react';
import { Loader2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const LoadingSpinner = ({ 
  size = 'medium', 
  text = '', 
  variant = 'primary',
  className = '',
  showText = true 
}) => {
  const { state } = useApp();
  const { isDarkMode } = state;

  // Size mappings
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
    xlarge: 'w-12 h-12'
  };

  // Color variants
  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white',
    gray: 'text-gray-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-600'
  };

  // Text size based on spinner size
  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
    xlarge: 'text-lg'
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 
        className={`${sizeClasses[size]} ${colorClasses[variant]} animate-spin`}
      />
      {showText && text && (
        <span 
          className={`${textSizeClasses[size]} ${colorClasses[variant]} font-medium`}
        >
          {text}
        </span>
      )}
    </div>
  );
};

// Alternative loading spinner with dots
export const LoadingDots = ({ 
  variant = 'primary', 
  size = 'medium',
  className = '' 
}) => {
  const colorClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    white: 'bg-white',
    gray: 'bg-gray-600',
  };

  const sizeClasses = {
    small: 'w-1 h-1',
    medium: 'w-2 h-2',
    large: 'w-3 h-3'
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`${sizeClasses[size]} ${colorClasses[variant]} rounded-full animate-pulse`}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};

// Skeleton loader component
export const SkeletonLoader = ({ 
  lines = 3, 
  className = '',
  variant = 'default' 
}) => {
  const { state } = useApp();
  const { isDarkMode } = state;

  const baseClasses = variant === 'card' 
    ? `animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`
    : `animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded h-4`;

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className={baseClasses}
          style={{
            width: variant === 'card' ? '100%' : `${Math.random() * 40 + 60}%`,
            height: variant === 'card' ? '200px' : undefined
          }}
        />
      ))}
    </div>
  );
};

// Progress bar component
export const ProgressBar = ({ 
  progress = 0, 
  variant = 'primary',
  size = 'medium',
  showPercentage = true,
  className = '' 
}) => {
  const { state } = useApp();
  const { isDarkMode } = state;

  const sizeClasses = {
    small: 'h-1',
    medium: 'h-2',
    large: 'h-3'
  };

  const colorClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    error: 'bg-error-600'
  };

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full ${sizeClasses[size]} overflow-hidden`}>
        <div
          className={`${sizeClasses[size]} ${colorClasses[variant]} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between items-center mt-1">
          <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Progress
          </span>
          <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Pulsing loader for content areas
export const ContentLoader = ({ 
  title = true,
  lines = 3,
  avatar = false,
  className = '' 
}) => {
  const { state } = useApp();
  const { isDarkMode } = state;

  const skeletonColor = isDarkMode ? 'bg-gray-700' : 'bg-gray-200';

  return (
    <div className={`animate-pulse ${className}`}>
      <div className="flex space-x-4">
        {avatar && (
          <div className={`rounded-full ${skeletonColor} h-10 w-10`}></div>
        )}
        <div className="flex-1 space-y-2">
          {title && (
            <div className={`h-4 ${skeletonColor} rounded w-3/4`}></div>
          )}
          {Array.from({ length: lines }, (_, index) => (
            <div
              key={index}
              className={`h-3 ${skeletonColor} rounded`}
              style={{ width: `${Math.random() * 40 + 50}%` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
