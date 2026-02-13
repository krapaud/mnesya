/**
 * Custom hook for managing authentication state and operations.
 * 
 * Provides centralized authentication logic including login, register, logout,
 * and authentication status checking. Handles loading states and error management.
 * 
 * @module useAuth
 */

import { useState, useCallback } from 'react';
import { login as loginService, register as registerService, logout as logoutService } from '../services/authService';
import { getToken } from '../services/tokenService';
import type { LoginData, RegisterData } from '../types/interfaces';

/**
 * Return type for useAuth hook.
 */
interface UseAuthResult {
  /** Authenticates user with email and password */
  login: (credentials: LoginData) => Promise<boolean>;
  /** Registers new caregiver account */
  register: (data: RegisterData) => Promise<boolean>;
  /** Logs out current user */
  logout: () => Promise<void>;
  /** Checks if user has valid authentication token */
  checkAuthStatus: () => Promise<boolean>;
  /** Current loading state for auth operations */
  loading: boolean;
  /** Current error message, null if no error */
  error: string | null;
  /** Clears current error message */
  clearError: () => void;
}

/**
 * Hook to manage authentication operations and state.
 * 
 * Provides functions for login, register, logout and authentication checking.
 * Automatically handles loading states and error messages for all operations.
 * 
 * @returns Authentication functions, loading state, and error state
 * 
 * @example
 * ```tsx
 * const LoginScreen = () => {
 *   const { login, loading, error } = useAuth();
 *   
 *   const handleLogin = async () => {
 *     const success = await login({ email, password });
 *     if (success) {
 *       navigation.navigate('Dashboard');
 *     }
 *   };
 *   
 *   return (
 *     <View>
 *       {error && <ErrorMessage>{error}</ErrorMessage>}
 *       <Button onPress={handleLogin} loading={loading}>
 *         Login
 *       </Button>
 *     </View>
 *   );
 * };
 * ```
 */
export const useAuth = (): UseAuthResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Authenticates user with email and password.
   * 
   * Calls login service, manages loading state, and handles errors.
   * Returns true on success, false on failure.
   * 
   * @param credentials - User email and password
   * @returns Promise resolving to true if login successful, false otherwise
   */
  const login = useCallback(async (credentials: LoginData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await loginService(credentials);
      
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Extract error message from response
      const errorMessage = err.response?.data?.detail || 
                          err.message || 
                          'Login failed. Please try again.';
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Registers new caregiver account.
   * 
   * Calls register service, manages loading state, and handles errors.
   * Returns true on success, false on failure.
   * 
   * @param data - Registration data (first name, last name, email, password)
   * @returns Promise resolving to true if registration successful, false otherwise
   */
  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await registerService(data);
      
      return true;
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Extract error message from response
      const errorMessage = err.response?.data?.detail || 
                          err.message || 
                          'Registration failed. Please try again.';
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logs out current user.
   * 
   * Calls logout service to clear authentication token.
   * Always succeeds as logout is handled client-side.
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await logoutService();
    } catch (err) {
      console.error('Logout error:', err);
      // Don't set error for logout, it should always succeed
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Checks if user is currently authenticated.
   * 
   * Verifies presence of valid authentication token.
   * 
   * @returns Promise resolving to true if authenticated, false otherwise
   */
  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    try {
      const token = await getToken();
      return token !== null;
    } catch (err) {
      console.error('Auth check error:', err);
      return false;
    }
  }, []);

  /**
   * Clears current error message.
   * Useful for dismissing error alerts.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    login,
    register,
    logout,
    checkAuthStatus,
    loading,
    error,
    clearError,
  };
};
