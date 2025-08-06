import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from './contexts/AppContext';
import { useAuth } from './hooks/useAuth';

/**
 * Firebase Database initialization module
 * - Establishes connection to Firebase Realtime Database
 * - Configures authentication state persistence
 * - Sets up database rules and security protocols
 * - Handles offline data synchronization capabilities
 * - Initializes Firebase Analytics for user behavior tracking
 * This import must be executed before any Firebase operations
 */
import './utils/initializeFirebase';
import { initializeOptimizedServices } from './services/optimizedServiceIntegration';
import './utils/errorLogger'; // Initialize global error logging



/**
 * Core Layout Architecture Components
 * These components form the structural foundation of the application:
 * - Header: Navigation bar with user authentication status, search functionality, and theme toggle
 * - Sidebar: Main navigation menu with collapsible design for responsive layouts
 * - Footer: Application metadata, links, and legal information
 * - BottomNavigation: Mobile-optimized navigation with touch-friendly interface
 * All components support dark/light theme switching and responsive breakpoints
 */
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';
import BottomNavigation from './components/common/BottomNavigation';

/**
 * Application Page Components & Routing Structure
 * Each component represents a distinct application view with specific business logic:
 * - Welcome: Onboarding experience with feature introduction and setup guidance
 * - Login/Register: Authentication flow with input validation and error handling
 * - Home: Dashboard with personalized content and quick action buttons
 * - Products/ProductDetail: E-commerce catalog with filtering, sorting, and detailed views
 * - Categories: Product categorization with hierarchical navigation
 * - Cart/Checkout: Shopping cart management and payment processing workflow
 * - VisualSearch: AI-powered image recognition for product discovery
 * - Recommendations: Machine learning-based product suggestions
 * - ProfileQuestionnaire: User preference collection for personalization algorithms
 */
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Categories from './pages/Categories';
import Cart from './pages/Cart';
import VisualSearch from './pages/VisualSearch';
import Recommendations from './pages/Recommendations';
import ComplementaryProducts from './pages/ComplementaryProducts';
import ProfileQuestionnaire from './pages/ProfileQuestionnaire';
import Checkout from './pages/Checkout';
import Register from './pages/Register';

// Admin components
import ReviewManagement from './components/admin/ReviewManagement';

// Common components
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import NotificationContainer from './components/common/NotificationContainer';

/**
 * Framer Motion Page Transition Configuration
 * Defines smooth animation states for enhanced user experience:
 * - initial: Entry state with subtle scaling and horizontal offset for depth perception
 * - in: Active state with full opacity and natural positioning
 * - out: Exit state with opposite directional movement to indicate navigation flow
 * 
 * Animation Parameters:
 * - opacity: Controls fade in/out effect for smooth visual transitions
 * - x: Horizontal movement creates directional flow (left-to-right navigation feel)
 * - scale: Subtle zoom effect adds depth and modern feel to page changes
 * 
 * Performance Considerations:
 * - Uses GPU-accelerated transforms for 60fps animations
 * - Minimal duration (0.4s) prevents user interface lag
 * - Anticipate easing creates natural, organic motion curves
 */
const pageVariants = {
  initial: { 
    opacity: 0, 
    x: -20,
    scale: 0.98
  },
  in: { 
    opacity: 1, 
    x: 0,
    scale: 1
  },
  out: { 
    opacity: 0, 
    x: 20,
    scale: 0.98
  }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
};

/**
 * Authentication Guard Component for Protected Routes
 * Implements route-level security with the following features:
 * 
 * Security Features:
 * - Validates user authentication status before rendering protected content
 * - Automatically redirects unauthenticated users to login page
 * - Preserves original destination URL for post-login redirection
 * - Prevents unauthorized access to sensitive application areas
 * 
 * User Experience:
 * - Maintains navigation context through location state
 * - Seamless redirect flow without losing user's intended destination
 * - Works with React Router's navigation state management
 * 
 * Implementation Details:
 * - Uses React Router's Navigate component for declarative redirects
 * - Integrates with custom useAuth hook for centralized authentication state
 * - Supports nested routing structures and complex navigation flows
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

/**
 * Public Route Guard Component for Authentication Pages
 * Prevents authenticated users from accessing login/register pages:
 * 
 * Business Logic:
 * - Automatically redirects authenticated users away from auth pages
 * - Respects original navigation intent stored in location state
 * - Defaults to home page when no specific destination is provided
 * - Prevents confusion by avoiding duplicate authentication flows
 * 
 * User Experience Benefits:
 * - Eliminates unnecessary re-authentication steps
 * - Maintains smooth navigation flow for returning users
 * - Supports deep linking while respecting authentication state
 * 
 * Technical Implementation:
 * - Leverages React Router's location state for redirect URL preservation
 * - Integrates with application-wide authentication context
 * - Handles edge cases like direct URL access and browser back/forward navigation
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || '/';
    return <Navigate to={redirectTo} replace />;
  }
  
  return children;
};

// Auth Layout component (no sidebar/header)
const AuthLayout = ({ children }) => {
  const { state } = useApp();
  const { isDarkMode } = state;
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'dark bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full"
      >
        {children}
      </motion.div>
    </div>
  );
};

// Main content component with page transitions
const AnimatedRoutes = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  
  if (isAuthPage) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Auth Routes with special layout */}
          <Route path="/login" element={
            <PublicRoute>
              <AuthLayout>
                <Login />
              </AuthLayout>
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <AuthLayout>
                <Register />
              </AuthLayout>
            </PublicRoute>
          } />
        </Routes>
      </AnimatePresence>
    );
  }
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full"
      >
        <Routes location={location}>
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          
          {/* E-commerce Routes */}
          <Route path="/products" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />
          <Route path="/product/:slug" element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          } />
          <Route path="/categories" element={
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
          } />
          <Route path="/categories/:category" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />
          <Route path="/products/:category" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />
          <Route path="/cart" element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          
          {/* AI Features */}
          <Route path="/visual-search" element={
            <ProtectedRoute>
              <VisualSearch />
            </ProtectedRoute>
          } />
          <Route path="/recommendations" element={
            <ProtectedRoute>
              <Recommendations />
            </ProtectedRoute>
          } />
          <Route path="/complementary-products" element={
            <ProtectedRoute>
              <ComplementaryProducts />
            </ProtectedRoute>
          } />
          
          {/* User Account */}
          <Route path="/profile/questionnaire" element={
            <ProtectedRoute>
              <ProfileQuestionnaire />
            </ProtectedRoute>
          } />
          
          
          {/* Admin Routes */}
          <Route path="/admin/reviews" element={
            <ProtectedRoute>
              <ReviewManagement />
            </ProtectedRoute>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

function App() {
  const { state } = useApp();
  const { isDarkMode, sidebarOpen, isLoading, showWelcome } = state;
  const { initializing } = useAuth();

  // Initialize optimized services when app starts
  React.useEffect(() => {
    const initServices = async () => {
      try {
        console.log('🚀 Initializing optimized Firebase services...');
        const result = await initializeOptimizedServices();
        console.log('✅ Optimized services initialized:', result);
      } catch (error) {
        console.error('❌ Failed to initialize optimized services:', error);
      }
    };

    if (!initializing) {
      initServices();
    }
  }, [initializing]);

  // Show loading screen while Firebase Auth initializes
  if (initializing) {
    return (
      <ErrorBoundary>
        <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'dark bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
          <LoadingSpinner size="large" />
        </div>
      </ErrorBoundary>
    );
  }

  // Show welcome screen if user hasn't been welcomed yet
  if (showWelcome) {
    return (
      <ErrorBoundary>
        <div className={`transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Welcome />
          </motion.div>
          <NotificationContainer />
        </div>
      </ErrorBoundary>
    );
  }

  // Show main app
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
        <NotificationContainer />
      </Router>
    </ErrorBoundary>
  );
};

// App Content component that handles different layouts
const AppContent = () => {
  const { state } = useApp();
  const { isDarkMode, sidebarOpen, isLoading } = state;
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  // Auth pages get full screen layout
  if (isAuthPage) {
    return <AnimatedRoutes />;
  }

  // Regular pages get sidebar + header layout
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'dark bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    }`}>
      {/* Animated Header */}
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Header />
      </motion.div>
      
      <div className="flex">
        {/* Animated Sidebar */}
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <Sidebar />
        </motion.div>
        
        {/* Main Content with enhanced transitions */}
        <main className={`flex-1 transition-all duration-300 ease-out ${
          sidebarOpen ? 'lg:ml-64' : 'ml-0'
        } pt-16 pb-20 lg:pb-0 relative overflow-hidden`}>
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/5 via-accent-400/5 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-primary-400/5 via-accent-400/5 to-transparent rounded-full blur-3xl"></div>
          </div>
          
          <motion.div 
            className="relative z-10 p-4 lg:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {isLoading && (
              <motion.div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <LoadingSpinner size="large" />
              </motion.div>
            )}
            
            <AnimatedRoutes />
          </motion.div>
          
          {/* Animated Footer - Hidden on mobile */}
          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Footer />
          </motion.div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

export default App;
