/**
 * Authentication hook for login, registration, and session management.
 *
 * Wraps authentication service calls with loading and error state management.
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

export const useAuth = (): UseAuthResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (credentials: LoginData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await loginService(credentials);
      
      return true;
    } catch (err: any) {
      
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

  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await registerService(data);
      
      return true;
    } catch (err: any) {
      
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

  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await logoutService();
    } catch (err) {
      // Don't set error for logout, it should always succeed
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    try {
      const token = await getToken();
      return token !== null;
    } catch (err) {
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
