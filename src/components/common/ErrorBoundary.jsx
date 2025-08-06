import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and capture details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // You could log to an external service here
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent } = this.props;
      
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            onGoHome={this.handleGoHome}
          />
        );
      }

      return <DefaultErrorFallback 
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        onRetry={this.handleRetry}
        onGoHome={this.handleGoHome}
      />;
    }

    return this.props.children;
  }
}

// Default fallback component
const DefaultErrorFallback = ({ error, errorInfo, onRetry, onGoHome }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Something went wrong
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            We're sorry, but something unexpected happened. Please try refreshing the page or go back to the homepage.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            
            <button
              onClick={onGoHome}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </button>
          </div>

          {isDevelopment && error && (
            <details className="mt-8 text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 mb-4 hover:text-gray-800 dark:hover:text-gray-200">
                Error Details (Development)
              </summary>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-auto">
                <div className="text-xs text-red-600 dark:text-red-400 font-mono whitespace-pre-wrap">
                  {error.toString()}
                  {errorInfo.componentStack}
                </div>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook version for functional components
export const useErrorHandler = () => {
  const { dispatch, actionTypes } = useApp();

  const handleError = React.useCallback((error, errorInfo = {}) => {
    console.error('Error caught by useErrorHandler:', error);
    
    dispatch({
      type: actionTypes.SET_ERROR,
      payload: {
        message: error.message || 'An unexpected error occurred',
        stack: error.stack,
        ...errorInfo,
        timestamp: new Date().toISOString(),
      }
    });
  }, [dispatch, actionTypes]);

  const clearError = React.useCallback(() => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  }, [dispatch, actionTypes]);

  return { handleError, clearError };
};

// Lightweight error boundary for specific components
export const ComponentErrorBoundary = ({ children, fallback, onError }) => {
  return (
    <ErrorBoundary
      fallback={({ error, onRetry }) => (
        <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10">
          <div className="flex items-center space-x-2 text-red-700 dark:text-red-400 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Component Error</span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">
            {error?.message || 'This component failed to render properly.'}
          </p>
          {fallback || (
            <button
              onClick={onRetry}
              className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors duration-200"
            >
              Retry
            </button>
          )}
        </div>
      )}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  );
};

// HOC for wrapping components with error boundary
export const withErrorBoundary = (Component, errorFallback) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary fallback={errorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

export default ErrorBoundary;
