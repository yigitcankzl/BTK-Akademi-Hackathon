import { SUPPORTED_FILE_TYPES, FILE_SIZE_LIMITS, ERROR_MESSAGES, SUCCESS_MESSAGES } from './constants';

// Format file size in human readable format
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format date in human readable format
export function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

// Format time in human readable format (for response times)
export function formatTime(milliseconds) {
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`;
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

// Generate unique ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Validate file type
export function validateFileType(file) {
  return SUPPORTED_FILE_TYPES.ALL.includes(file.type);
}

// Validate file size
export function validateFileSize(file) {
  const fileType = file.type;
  let maxSize = FILE_SIZE_LIMITS.DOCUMENT; // Default
  
  if (SUPPORTED_FILE_TYPES.IMAGES.includes(fileType)) {
    maxSize = FILE_SIZE_LIMITS.IMAGE;
  } else if (SUPPORTED_FILE_TYPES.SPREADSHEETS.includes(fileType)) {
    maxSize = FILE_SIZE_LIMITS.SPREADSHEET;
  } else if (SUPPORTED_FILE_TYPES.PRESENTATIONS.includes(fileType)) {
    maxSize = FILE_SIZE_LIMITS.PRESENTATION;
  }
  
  return file.size <= maxSize;
}

// Get file type category
export function getFileTypeCategory(file) {
  const fileType = file.type;
  
  if (SUPPORTED_FILE_TYPES.IMAGES.includes(fileType)) {
    return 'image';
  } else if (SUPPORTED_FILE_TYPES.DOCUMENTS.includes(fileType)) {
    return 'document';
  } else if (SUPPORTED_FILE_TYPES.SPREADSHEETS.includes(fileType)) {
    return 'spreadsheet';
  } else if (SUPPORTED_FILE_TYPES.PRESENTATIONS.includes(fileType)) {
    return 'presentation';
  }
  
  return 'unknown';
}

// Truncate text with ellipsis
export function truncateText(text, maxLength = 50) {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength - 3) + '...';
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Deep clone object
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

// Convert file to base64
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

// Create download link
export function downloadFile(data, filename, type = 'application/json') {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Format number with commas
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Calculate percentage
export function calculatePercentage(value, total) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Validate email
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Sanitize HTML to prevent XSS
export function sanitizeHtml(html) {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
}

// Parse markdown-style formatting
export function parseMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

// Extract text from HTML
export function extractTextFromHtml(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

// Check if string is JSON
export function isJsonString(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

// Get error message
export function getErrorMessage(error, fallback = ERROR_MESSAGES.GENERIC_ERROR) {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  return fallback;
}

// Check if dark mode is preferred
export function prefersDarkMode() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Copy text to clipboard
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        return result;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (err) {
    return false;
  }
}

// Sleep/delay function
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry function with exponential backoff
export async function retry(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      await sleep(delay * Math.pow(2, i));
    }
  }
}

// Local storage helpers with error handling
export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading from localStorage (${key}):`, error);
      return defaultValue;
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  },
  
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
      return false;
    }
  }
};

// URL helpers
export const url = {
  // Build URL with query parameters
  build(base, params = {}) {
    const url = new URL(base);
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.append(key, params[key]);
      }
    });
    return url.toString();
  },
  
  // Parse query parameters from current URL
  parseParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  },
  
  // Check if URL is valid
  isValid(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
};

// Array helpers
export const array = {
  // Remove item by value
  remove(arr, item) {
    const index = arr.indexOf(item);
    if (index > -1) {
      arr.splice(index, 1);
    }
    return arr;
  },
  
  // Remove item by index
  removeAt(arr, index) {
    if (index > -1 && index < arr.length) {
      arr.splice(index, 1);
    }
    return arr;
  },
  
  // Move item from one index to another
  move(arr, fromIndex, toIndex) {
    const element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
    return arr;
  },
  
  // Shuffle array
  shuffle(arr) {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  },
  
  // Get unique values
  unique(arr) {
    return [...new Set(arr)];
  },
  
  // Group by key
  groupBy(arr, key) {
    return arr.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) {
        result[group] = [];
      }
      result[group].push(item);
      return result;
    }, {});
  }
};

// Object helpers
export const object = {
  // Check if object is empty
  isEmpty(obj) {
    return Object.keys(obj).length === 0;
  },
  
  // Pick specific keys from object
  pick(obj, keys) {
    const result = {};
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },
  
  // Omit specific keys from object
  omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  }
};

export default {
  formatFileSize,
  formatDate,
  formatTime,
  generateId,
  validateFileType,
  validateFileSize,
  getFileTypeCategory,
  truncateText,
  debounce,
  throttle,
  deepClone,
  fileToBase64,
  downloadFile,
  formatNumber,
  calculatePercentage,
  validateEmail,
  sanitizeHtml,
  parseMarkdown,
  extractTextFromHtml,
  isJsonString,
  getErrorMessage,
  prefersDarkMode,
  copyToClipboard,
  sleep,
  retry,
  storage,
  url,
  array,
  object,
};
