import React, { useState, useEffect, useRef } from 'react';
import { Menu, Moon, Sun, Bell, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import OfflineStatus from './OfflineStatus';

const Header = () => {
  const { state, dispatch, actionTypes } = useApp();
  const { isDarkMode, sidebarOpen, notifications, user } = state;
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const toggleSidebar = () => {
    dispatch({ type: actionTypes.TOGGLE_SIDEBAR });
  };

  const toggleTheme = () => {
    dispatch({ type: actionTypes.TOGGLE_DARK_MODE });
  };

  const handleLogout = async () => {
    try {
      await logout();
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'info',
          message: 'Başarıyla çıkış yapıldı.',
          duration: 3000,
        },
      });
      navigate('/login');
    } catch (error) {
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'error',
          message: 'Çıkış yapılırken hata oluştu.',
          duration: 3000,
        },
      });
    }
    setShowUserMenu(false);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 z-40 shadow-sm">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={toggleSidebar}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-700/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: sidebarOpen ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Menu className="w-5 h-5" />
            </motion.div>
          </motion.button>
          
          <Link to="/">
            <motion.h1 
              className="text-xl font-bold bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-clip-text text-transparent hidden sm:block cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              ShopSmart
            </motion.h1>
          </Link>
          
          {/* Mobile title */}
          <Link to="/">
            <motion.h1 
              className="text-lg font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent sm:hidden cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              ShopSmart
            </motion.h1>
          </Link>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* AI Status Indicator */}
          <div className="relative">
            <OfflineStatus />
          </div>
          
          <motion.button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-700/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isDarkMode ? (
                <motion.div
                  key="sun"
                  initial={{ opacity: 0, rotate: -180 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <Sun className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ opacity: 0, rotate: -180 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <Moon className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
          
          <motion.button 
            className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-700/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-5 h-5" />
            <AnimatePresence>
              {notifications.length > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center"
                >
                  <span className="text-[8px] font-bold text-white">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* User Menu */}
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <motion.button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-700/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative">
                  {user?.profile?.photoURL ? (
                    <motion.img
                      src={user.profile.photoURL}
                      alt={user.profile.displayName || user.profile.email}
                      className="w-7 h-7 rounded-full ring-2 ring-primary-200 dark:ring-primary-800"
                      whileHover={{ scale: 1.1 }}
                    />
                  ) : (
                    <motion.div
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center"
                      whileHover={{ scale: 1.1 }}
                    >
                      <User className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
                <span className="hidden lg:block text-sm font-medium max-w-24 truncate">
                  {user?.profile?.displayName || user?.profile?.firstName || 'Kullanıcı'}
                </span>
              </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-56 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 z-50 overflow-hidden"
                >
                  <div className="py-2">
                    <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          {user?.profile?.photoURL ? (
                            <img
                              src={user.profile.photoURL}
                              alt={user.profile.displayName || user.profile.email}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white truncate">
                            {user?.profile?.displayName || `${user?.profile?.firstName} ${user?.profile?.lastName}`.trim() || 'Kullanıcı'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user?.profile?.email || 'user@example.com'}
                          </div>
                          {!user?.profile?.emailVerified && (
                            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                              E-posta doğrulanmadı
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <motion.button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/profile');
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/70 transition-all duration-200"
                      whileHover={{ x: 4 }}
                    >
                      <User className="w-4 h-4 mr-3 text-gray-400" />
                      Profil
                    </motion.button>
                    
                    
                    <motion.button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-900/20 transition-all duration-200"
                      whileHover={{ x: 4 }}
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Çıkış Yap
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          ) : (
            <motion.button
              onClick={handleLogin}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:block">Giriş Yap</span>
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
