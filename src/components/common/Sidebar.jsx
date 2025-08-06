import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package,
  Grid3X3,
  ShoppingCart,
  MessageCircle, 
  Camera,
  Heart,
  Receipt,
  Brain,
  BarChart3, 
  ChevronLeft,
  Plus,
  Settings,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ROUTES } from '../../utils/constants';

const Sidebar = () => {
  const { state, dispatch, actionTypes } = useApp();
  const { sidebarOpen } = state;
  const location = useLocation();

  const navigationItems = [
    {
      id: 'home',
      name: 'Ana Sayfa',
      href: ROUTES.HOME,
      icon: Home,
    },
    {
      id: 'products',
      name: 'Ürünler',
      href: ROUTES.PRODUCTS,
      icon: Package,
    },
    {
      id: 'categories',
      name: 'Kategoriler',
      href: ROUTES.CATEGORIES,
      icon: Grid3X3,
    },
    {
      id: 'cart',
      name: 'Sepet',
      href: ROUTES.CART,
      icon: ShoppingCart,
      badge: state.cart?.items?.length || 0,
    },
    {
      id: 'visual-search',
      name: 'AI Görsel Arama',
      href: ROUTES.VISUAL_SEARCH,
      icon: Camera,
      isAI: true,
    },
    {
      id: 'recommendations',
      name: 'Akıllı Öneriler',
      href: ROUTES.RECOMMENDATIONS,
      icon: Heart,
      isAI: true,
    },
    {
      id: 'complementary-products',
      name: 'Tamamlayıcı Ürünler',
      href: ROUTES.COMPLEMENTARY_PRODUCTS,
      icon: Sparkles,
      isAI: true,
    },
    {
      id: 'profile-questionnaire',
      name: 'AI Profil Anketi',
      href: '/profile/questionnaire',
      icon: Brain,
      isAI: true,
    },
  ];


  const isActive = (href) => {
    if (href === ROUTES.HOME) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Overlay for mobile - only show when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => dispatch({ type: actionTypes.TOGGLE_SIDEBAR })}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 overflow-y-auto transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4">

          {/* Navigation */}
          <nav className="space-y-1 mb-6">
            {navigationItems.map((item) => {
              const isDisabled = false;
              
              return (
                <Link
                  key={item.id}
                  to={isDisabled ? '#' : item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isDisabled
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                      : isActive(item.href)
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={(e) => {
                    if (isDisabled) {
                      e.preventDefault();
                    }
                  }}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                  {item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

        </div>

        {/* Collapse Button */}
        <button
          onClick={() => dispatch({ type: actionTypes.TOGGLE_SIDEBAR })}
          className="absolute top-4 -right-3 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <ChevronLeft className="w-3 h-3 text-gray-600 dark:text-gray-400" />
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
