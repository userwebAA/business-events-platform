'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
    profileCompleted?: boolean;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Vérifier si l'utilisateur est déjà connecté
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');

        // Si pas de token, pas connecté
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                // Token invalide/expiré côté serveur
                localStorage.removeItem('token');
                document.cookie = 'token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                setUser(null);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            // En cas d'erreur réseau, garder le token (ne pas déconnecter)
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la connexion');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        // Stocker aussi dans un cookie pour le middleware
        document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 jours
        setUser(data.user);
    };

    const register = async (email: string, password: string, name: string) => {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la création du compte');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        // Stocker aussi dans un cookie pour le middleware
        document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 jours
        setUser(data.user);

        // Rediriger vers le setup du profil uniquement à la création du compte
        window.location.href = '/profile/setup';
    };

    const refreshUser = async () => {
        await checkAuth();
    };

    const logout = async () => {
        // 1. Supprimer le cookie côté serveur d'abord
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            // Ignorer les erreurs réseau
        }
        // 2. Nettoyer le stockage local
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        // 3. Rediriger immédiatement (pas de setUser pour éviter un re-render qui bloque)
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, refreshUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
