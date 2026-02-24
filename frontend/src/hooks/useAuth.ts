/**
 * useAuth — centralises authentication state for the entire app.
 *
 * Reads JWT from localStorage, exposes user profile, and provides
 * login / logout / register helpers that call the backend API.
 */
import { useState, useCallback, useEffect } from 'react';
import { authService } from '../services/api';

export interface AuthUser {
    id: string;
    username: string;
    email: string;
    display_name?: string;
    role: string;
    is_active: boolean;
}

interface UseAuthReturn {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: { username: string; email: string; password: string; display_name?: string }) => Promise<void>;
    logout: () => void;
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // On mount: try to restore session from existing token
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsLoading(false);
            return;
        }

        authService.me()
            .then(res => setUser(res.data as AuthUser))
            .catch(() => {
                // Token invalid/expired — clear it
                localStorage.removeItem('token');
                localStorage.removeItem('refresh_token');
            })
            .finally(() => setIsLoading(false));
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await authService.login(email, password);
        const { access_token, refresh_token, ...profile } = res.data;
        localStorage.setItem('token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        setUser({
            id: profile.user_id,
            username: profile.username,
            email,
            role: profile.role,
            is_active: true,
        });
    }, []);

    const register = useCallback(async (data: Parameters<typeof authService.register>[0]) => {
        const res = await authService.register(data);
        const { access_token, refresh_token, ...profile } = res.data;
        localStorage.setItem('token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        setUser({
            id: profile.user_id,
            username: profile.username,
            email: data.email,
            role: profile.role,
            is_active: true,
        });
    }, []);

    const logout = useCallback(() => {
        authService.logout().catch(() => {});
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    }, []);

    return {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
    };
}
