// React hook for Firebase Authentication
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import authService from '../services/authService';
import { getErrorMessage } from '../utils/helpers';

export function useAuth() {
  const { state, dispatch, actionTypes } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Initialize authentication state listener
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      if (user) {
        dispatch({
          type: actionTypes.LOGIN,
          payload: {
            profile: {
              id: user.uid,
              email: user.email,
              displayName: user.displayName,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              phone: user.phone || '',
              photoURL: user.photoURL || '',
              emailVerified: user.emailVerified
            },
            preferences: user.preferences || {},
            addresses: user.addresses || [],
            orders: user.orders || [],
            wishlist: user.wishlist || []
          }
        });
      } else {
        dispatch({
          type: actionTypes.LOGOUT
        });
      }
      setInitializing(false);
    });

    return unsubscribe;
  }, []); // Empty dependency array to prevent infinite loop

  // Register new user
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const { email, password, ...profileData } = userData;
      const result = await authService.register(email, password, profileData);

      if (result.success) {
        // User will be automatically logged in via auth state listener
        return result;
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login with email and password
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.login(email, password);

      if (result.success) {
        // User will be automatically logged in via auth state listener
        return result;
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login with Google
  const loginWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.loginWithGoogle();

      if (result.success) {
        // User will be automatically logged in via auth state listener
        return result;
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.logout();

      if (result.success) {
        // User will be automatically logged out via auth state listener
        return result;
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.resetPassword(email);
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.updateUserProfile(updates);

      if (result.success) {
        // Update local state
        dispatch({
          type: actionTypes.UPDATE_USER_PROFILE,
          payload: updates
        });
      }

      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dispatch, actionTypes]);

  // Change password
  const changePassword = useCallback(async (newPassword) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.changePassword(newPassword);
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete account
  const deleteAccount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.deleteAccount();

      if (result.success) {
        // User will be automatically logged out via auth state listener
      }

      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Send email verification
  const sendVerificationEmail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.sendVerificationEmail();
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    try {
      const userData = await authService.getCurrentUserData();
      if (userData) {
        dispatch({
          type: actionTypes.SET_USER,
          payload: {
            profile: {
              id: userData.uid,
              email: userData.email,
              displayName: userData.displayName,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              phone: userData.phone || '',
              photoURL: userData.photoURL || '',
              emailVerified: userData.emailVerified
            },
            preferences: userData.preferences || {},
            addresses: userData.addresses || [],
            orders: userData.orders || [],
            wishlist: userData.wishlist || []
          }
        });
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
  }, [dispatch, actionTypes]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get user token
  const getUserToken = useCallback(async () => {
    try {
      const token = await authService.getUserToken();
      return token;
    } catch (err) {
      console.error('Error getting user token:', err);
      return null;
    }
  }, []);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return state.isAuthenticated && state.user?.profile?.id;
  }, [state.isAuthenticated, state.user]);

  // Check if email is verified
  const isEmailVerified = useCallback(() => {
    return state.user?.profile?.emailVerified || false;
  }, [state.user]);

  return {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading,
    error,
    initializing,

    // Methods
    register,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateProfile,
    changePassword,
    deleteAccount,
    sendVerificationEmail,
    refreshUserData,
    getUserToken,
    clearError,

    // Helper methods
    isEmailVerified,
    getCurrentUser: () => state.user,
    getUserId: () => state.user?.profile?.id,
  };
}

export default useAuth;