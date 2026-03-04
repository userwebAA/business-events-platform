'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Mail, Lock, LogIn, Calendar, ArrowRight } from 'lucide-react';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            const redirectTo = searchParams.get('redirect') || '/dashboard';
            router.push(redirectTo);
        } catch (err) {
            setError('Email ou mot de passe incorrect');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Panneau gauche - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-sky-300 opacity-10 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400 opacity-10 rounded-full blur-2xl"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                            <Calendar className="h-10 w-10 text-white" />
                        </div>
                        <span className="text-3xl font-bold">TAFF Events</span>
                    </div>

                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        Bienvenue sur votre plateforme d'événements
                    </h1>
                    <p className="text-xl text-blue-100 leading-relaxed mb-12">
                        Organisez, gérez et participez à des événements professionnels en toute simplicité.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <span className="text-lg">🎫</span>
                            </div>
                            <span className="text-blue-100">Billets avec QR code automatiques</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <span className="text-lg">📊</span>
                            </div>
                            <span className="text-blue-100">Statistiques avancées en temps réel</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <span className="text-lg">🔔</span>
                            </div>
                            <span className="text-blue-100">Notifications push instantanées</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Panneau droit - Formulaire */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-sky-50 px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Logo mobile */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-3 rounded-xl">
                            <Calendar className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">TAFF Events</span>
                    </div>

                    <div className="text-center mb-10">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                            Connexion
                        </h2>
                        <p className="text-gray-500 text-lg">
                            Accédez à votre espace personnel
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-5 py-4 rounded-xl flex items-center gap-3">
                                <span className="text-xl">⚠️</span>
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                                    Adresse email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all hover:border-gray-300"
                                        placeholder="votre@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                                    Mot de passe
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all hover:border-gray-300"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Link
                                href="/forgot-password"
                                className="text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors"
                            >
                                Mot de passe oublié ?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-4 rounded-xl text-lg font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Connexion en cours...
                                </>
                            ) : (
                                <>
                                    <LogIn className="h-5 w-5" />
                                    Se connecter
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500">
                            Pas encore de compte ?{' '}
                            <Link
                                href="/register"
                                className="font-bold text-sky-600 hover:text-sky-700 transition-colors inline-flex items-center gap-1"
                            >
                                Créer un compte
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </p>
                    </div>

                    <div className="mt-6 text-center">
                        <Link
                            href="/"
                            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            ← Retour à l'accueil
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-sky-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
