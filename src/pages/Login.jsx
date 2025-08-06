import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

function Login() {
  const { dispatch, actionTypes } = useApp();
  const { login, register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    firstName: '',
    lastName: '',
    rememberMe: false,
  });
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      if (isSignUp) {
        // Register new user
        await register({
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          firstName: formData.firstName,
          lastName: formData.lastName,
        });

        dispatch({
          type: actionTypes.ADD_NOTIFICATION,
          payload: {
            id: Date.now(),
            type: 'success',
            message: 'Hesap başarıyla oluşturuldu! E-posta doğrulama linki gönderildi.',
            duration: 5000,
          },
        });

        // Wait a bit for authentication state to update, then redirect
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        // Login existing user
        await login(formData.email, formData.password);

        dispatch({
          type: actionTypes.ADD_NOTIFICATION,
          payload: {
            id: Date.now(),
            type: 'success',
            message: 'Başarıyla giriş yapıldı!',
            duration: 3000,
          },
        });

        // Wait a bit for authentication state to update, then redirect
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (err) {
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          id: Date.now(),
          type: 'error',
          message: err.message,
          duration: 5000,
        },
      });
    }
  };



  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/3 left-1/4 w-40 h-40 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${4 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6 relative shadow-2xl transform hover:scale-110 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-ping opacity-20"></div>
            <svg className="w-8 h-8 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white animate-fade-in-up animation-delay-200">
            {isSignUp ? 'Hesap Oluşturun' : 'Tekrar Hoş Geldiniz'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 animate-fade-in-up animation-delay-300">
            {isSignUp 
              ? 'AI destekli alışveriş deneyiminizi başlatın' 
              : 'Hesabınıza giriş yapın'
            }
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-3xl transition-all duration-300 animate-fade-in-up animation-delay-400">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Ad
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-300 backdrop-blur-sm hover:border-blue-400 dark:hover:border-blue-400"
                    placeholder="Adınızı girin"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Soyad
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-300 backdrop-blur-sm hover:border-blue-400 dark:hover:border-blue-400"
                    placeholder="Soyadınızı girin"
                  />
                </div>

                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Görünen Ad
                  </label>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-300 backdrop-blur-sm hover:border-blue-400 dark:hover:border-blue-400"
                    placeholder="Görünen adınızı girin"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                E-posta Adresi
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-300 backdrop-blur-sm hover:border-blue-400 dark:hover:border-blue-400"
                placeholder="E-posta adresinizi girin"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-300 backdrop-blur-sm hover:border-blue-400 dark:hover:border-blue-400"
                placeholder={isSignUp ? "En az 6 karakter" : "Şifrenizi girin"}
              />
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-300 hover:shadow-xl relative overflow-hidden"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isSignUp ? 'Hesap oluşturuluyor...' : 'Giriş yapılıyor...'}
                </div>
              ) : (
                isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'
              )}
            </button>

          </form>

          {/* Toggle Sign Up/Sign In */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                clearError();
                setFormData({ 
                  email: '', 
                  password: '', 
                  displayName: '',
                  firstName: '',
                  lastName: '',
                  rememberMe: false 
                });
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
            >
              {isSignUp 
                ? 'Zaten hesabınız var mı? Giriş yapın' 
                : "Hesabınız yok mu? Kayıt olun"
              }
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          By continuing, you agree to our{' '}
          <button className="text-blue-600 dark:text-blue-400 hover:underline">
            Terms of Service
          </button>{' '}
          and{' '}
          <button className="text-blue-600 dark:text-blue-400 hover:underline">
            Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
