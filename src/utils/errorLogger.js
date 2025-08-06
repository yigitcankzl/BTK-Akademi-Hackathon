// Global error handling and debugging utilities

class ErrorLogger {
  constructor() {
    this.errors = [];
    this.maxErrors = 50;
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        reason: event.reason,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });

    // Catch React errors (if not caught by ErrorBoundary)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Look for React errors
      const errorString = args.join(' ');
      if (errorString.includes('React') || errorString.includes('Warning:') || errorString.includes('Error:')) {
        this.logError({
          type: 'react',
          message: errorString,
          args: args,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          stack: new Error().stack
        });
      }
      originalConsoleError.apply(console, args);
    };
  }

  logError(errorInfo) {
    // Add to in-memory log
    this.errors.unshift(errorInfo);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Console log with formatting
    console.group(`🚨 ERROR LOGGED [${errorInfo.type.toUpperCase()}]`);
    console.error('Message:', errorInfo.message);
    console.error('Timestamp:', errorInfo.timestamp);
    console.error('URL:', errorInfo.url);
    if (errorInfo.stack) {
      console.error('Stack trace:', errorInfo.stack);
    }
    if (errorInfo.filename) {
      console.error('File:', `${errorInfo.filename}:${errorInfo.lineno}:${errorInfo.colno}`);
    }
    console.groupEnd();

    // Store in localStorage for debugging
    try {
      localStorage.setItem('app-errors', JSON.stringify(this.errors.slice(0, 10)));
    } catch (e) {
      // Ignore localStorage errors
    }

    // Send to external service in production (optional)
    if (process.env.NODE_ENV === 'production' && this.shouldReport(errorInfo)) {
      this.reportError(errorInfo);
    }
  }

  shouldReport(errorInfo) {
    // Filter out noise and development-only errors
    const ignoreMessages = [
      'Script error',
      'Network request failed',
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded'
    ];

    return !ignoreMessages.some(ignore => 
      errorInfo.message?.toLowerCase().includes(ignore.toLowerCase())
    );
  }

  async reportError(errorInfo) {
    // This would send to a service like Sentry, LogRocket, etc.
    // For now, just log that we would report it
    console.log('📊 Would report error to monitoring service:', errorInfo.message);
  }

  getRecentErrors(limit = 10) {
    return this.errors.slice(0, limit);
  }

  clearErrors() {
    this.errors = [];
    localStorage.removeItem('app-errors');
  }

  // Debug function to display errors in a modal
  showErrorDebugModal() {
    if (process.env.NODE_ENV !== 'development') return;

    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
      padding: 20px;
      overflow: auto;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 800px;
      margin: 0 auto;
      font-family: monospace;
      font-size: 12px;
    `;

    const recentErrors = this.getRecentErrors(5);
    
    content.innerHTML = `
      <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #dc2626;">Recent Errors (${recentErrors.length})</h2>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                style="background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          Close
        </button>
      </div>
      ${recentErrors.length === 0 ? 
        '<p style="color: #16a34a;">✅ No recent errors!</p>' :
        recentErrors.map((error, index) => `
          <div style="margin-bottom: 20px; padding: 15px; background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px;">
            <div style="color: #dc2626; font-weight: bold; margin-bottom: 8px;">
              ${error.type.toUpperCase()} ERROR #${index + 1}
            </div>
            <div style="margin-bottom: 5px;"><strong>Message:</strong> ${error.message}</div>
            <div style="margin-bottom: 5px;"><strong>Time:</strong> ${error.timestamp}</div>
            <div style="margin-bottom: 5px;"><strong>URL:</strong> ${error.url}</div>
            ${error.filename ? `<div style="margin-bottom: 5px;"><strong>File:</strong> ${error.filename}:${error.lineno}</div>` : ''}
            ${error.stack ? `
              <details style="margin-top: 10px;">
                <summary style="cursor: pointer; font-weight: bold; color: #7c2d12;">Stack Trace</summary>
                <pre style="margin-top: 10px; background: #f7fafc; padding: 10px; border-radius: 4px; overflow: auto; font-size: 10px;">${error.stack}</pre>
              </details>
            ` : ''}
          </div>
        `).join('')
      }
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <button onclick="errorLogger.clearErrors(); this.parentElement.parentElement.parentElement.remove();" 
                style="background: #16a34a; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
          Clear All Errors
        </button>
        <span style="color: #6b7280; font-size: 10px;">
          Press F12 → Console for detailed logs
        </span>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);
  }
}

// Create global instance
export const errorLogger = new ErrorLogger();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.errorLogger = errorLogger;
  
  // Add keyboard shortcut for error modal in development
  if (process.env.NODE_ENV === 'development') {
    window.addEventListener('keydown', (e) => {
      // Ctrl+Shift+E to show error modal
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        errorLogger.showErrorDebugModal();
      }
    });
    
    console.log('🛠️ Error Logger initialized. Press Ctrl+Shift+E to see recent errors.');
  }
}

export default errorLogger;