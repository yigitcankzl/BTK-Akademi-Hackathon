// Mobile utilities for enhanced UX

export const isMobile = () => {
  return window.innerWidth < 768;
};

export const isTablet = () => {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

export const isDesktop = () => {
  return window.innerWidth >= 1024;
};

// Touch utilities
export const getTouchCoordinates = (event) => {
  if (event.touches && event.touches.length > 0) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    };
  }
  return {
    x: event.clientX,
    y: event.clientY
  };
};

// Debounce utility for resize events
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Safe area utilities for iOS devices
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0', 10),
    right: parseInt(style.getPropertyValue('--sar') || '0', 10),
    bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
    left: parseInt(style.getPropertyValue('--sal') || '0', 10)
  };
};

// Scroll utilities
export const scrollToTop = (smooth = true) => {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
};

export const scrollToElement = (elementId, offset = 0) => {
  const element = document.getElementById(elementId);
  if (element) {
    const top = element.offsetTop - offset;
    window.scrollTo({
      top,
      behavior: 'smooth'
    });
  }
};

// Haptic feedback for mobile devices
export const triggerHapticFeedback = (type = 'light') => {
  if (window.navigator && window.navigator.vibrate) {
    const patterns = {
      light: [10],
      medium: [30],
      heavy: [50],
      success: [10, 50, 10],
      error: [100, 50, 100]
    };
    
    window.navigator.vibrate(patterns[type] || patterns.light);
  }
};

// Network status
export const getNetworkStatus = () => {
  if (navigator.onLine !== undefined) {
    return {
      online: navigator.onLine,
      connection: navigator.connection || null
    };
  }
  return { online: true, connection: null };
};

// Battery status
export const getBatteryStatus = async () => {
  if ('getBattery' in navigator) {
    try {
      const battery = await navigator.getBattery();
      return {
        level: Math.round(battery.level * 100),
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      };
    } catch (error) {
      console.warn('Battery API not available:', error);
      return null;
    }
  }
  return null;
};

// Device orientation
export const getDeviceOrientation = () => {
  if (screen.orientation) {
    return {
      angle: screen.orientation.angle,
      type: screen.orientation.type
    };
  }
  return {
    angle: window.orientation || 0,
    type: window.orientation === 0 || window.orientation === 180 ? 'portrait' : 'landscape'
  };
};

// Performance monitoring
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
};

// Local storage with fallback
export const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage.getItem failed:', error);
      return null;
    }
  },
  
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('localStorage.setItem failed:', error);
      return false;
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('localStorage.removeItem failed:', error);
      return false;
    }
  }
};

// Image optimization for mobile
export const optimizeImageForMobile = (src, width = 400, quality = 0.8) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions
      const ratio = Math.min(width / img.width, width / img.height);
      const newWidth = img.width * ratio;
      const newHeight = img.height * ratio;
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      const optimizedSrc = canvas.toDataURL('image/jpeg', quality);
      
      resolve(optimizedSrc);
    };
    img.src = src;
  });
};

// Lazy loading utility
export const observeElements = (selector, callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { ...defaultOptions, ...options });
  
  document.querySelectorAll(selector).forEach((el) => {
    observer.observe(el);
  });
  
  return observer;
};

// Swipe gesture detection
export const detectSwipe = (element, callbacks = {}) => {
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  
  const handleTouchStart = (e) => {
    const touch = getTouchCoordinates(e);
    startX = touch.x;
    startY = touch.y;
    startTime = Date.now();
  };
  
  const handleTouchEnd = (e) => {
    const touch = getTouchCoordinates(e.changedTouches ? e.changedTouches[0] : e);
    const deltaX = touch.x - startX;
    const deltaY = touch.y - startY;
    const deltaTime = Date.now() - startTime;
    
    // Minimum swipe distance and maximum time
    const minDistance = 50;
    const maxTime = 500;
    
    if (deltaTime < maxTime) {
      if (Math.abs(deltaX) > minDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && callbacks.onSwipeRight) {
          callbacks.onSwipeRight();
        } else if (deltaX < 0 && callbacks.onSwipeLeft) {
          callbacks.onSwipeLeft();
        }
      } else if (Math.abs(deltaY) > minDistance && Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical swipe
        if (deltaY > 0 && callbacks.onSwipeDown) {
          callbacks.onSwipeDown();
        } else if (deltaY < 0 && callbacks.onSwipeUp) {
          callbacks.onSwipeUp();
        }
      }
    }
  };
  
  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });
  
  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchend', handleTouchEnd);
  };
};