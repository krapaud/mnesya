/**
 * Hook for handling login, registration, and logout.
 *
 * @module useAuth
 */
import { useState, useCallback } from 'react';
import {
    login as loginService,
    register as registerService,
    logout as logoutService,
} from '../services/authService';
import { getToken } from '../services/tokenService';
import type { LoginData, RegisterData } from '../types/interfaces';

interface UseAuthResult {
    login: (credentials: LoginData) => Promise<boolean>;
    register: (data: RegisterData) => Promise<boolean>;
    logout: () => Promise<void>;
    checkAuthStatus: () => Promise<boolean>;
    loading: boolean;
    error: string | null;
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
        } catch (err: unknown) {
            // Try to get the error from the server response
            const error = err as {
                response?: { status?: number; data?: { detail?: string } };
                message?: string;
            };
            if (error.response?.status === 429) {
                setError('TOO_MANY_REQUESTS');
            } else {
                const errorMessage =
                    error.response?.data?.detail ||
                    error.message ||
                    'Login failed. Please try again.';
                setError(errorMessage);
            }
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
        } catch (err: unknown) {
            // Try to get the error from the server response
            const error = err as {
                response?: { status?: number; data?: { detail?: string } };
                message?: string;
            };
            if (error.response?.status === 429) {
                setError('TOO_MANY_REQUESTS');
            } else {
                const errorMessage =
                    error.response?.data?.detail ||
                    error.message ||
                    'Registration failed. Please try again.';
                setError(errorMessage);
            }
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
        } catch (_err) {
            // Don't set error for logout, it should always succeed
        } finally {
            setLoading(false);
        }
    }, []);

    const checkAuthStatus = useCallback(async (): Promise<boolean> => {
        try {
            const token = await getToken();
            return token !== null;
        } catch (_err) {
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
