'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Mail, Lock, User, UserPlus, Calendar, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password || !name) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setLoading(true);
        try {
            await register(email, password, name);
            router.push('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Panneau gauche - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-300 opacity-10 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400 opacity-10 rounded-full blur-2xl"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                            <Calendar className="h-10 w-10 text-white" />
                        </div>
                        <span className="text-3xl font-bold">TAFF Events</span>
                    </div>

                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        Rejoignez la communauté
                    </h1>
                    <p className="text-xl text-emerald-100 leading-relaxed mb-12">
                        Créez votre compte et commencez à organiser des événements professionnels dès maintenant.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <span className="text-lg">✨</span>
                            </div>
                            <span className="text-emerald-100">Inscription gratuite et rapide</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <span className="text-lg">🎯</span>
                            </div>
                            <span className="text-emerald-100">Créez votre premier événement en 2 minutes</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <span className="text-lg">🤝</span>
                            </div>
                            <span className="text-emerald-100">Développez votre réseau professionnel</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Panneau droit - Formulaire */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-emerald-50 px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Logo mobile */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl">
                            <Calendar className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">TAFF Events</span>
                    </div>

                    <div className="text-center mb-10">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                            Créer un compte
                        </h2>
                        <p className="text-gray-500 text-lg">
                            Commencez votre aventure événementielle
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
                                <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">
                                    Nom complet
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all hover:border-gray-300"
                                        placeholder="Jean Dupont"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>

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
                                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all hover:border-gray-300"
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
                                        autoComplete="new-password"
                                        required
                                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all hover:border-gray-300"
                                        placeholder="Minimum 6 caractères"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-gray-400">
                                    Le mot de passe doit contenir au moins 6 caractères
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-xl text-lg font-bold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Création en cours...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-5 w-5" />
                                    Créer mon compte
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500">
                            Déjà un compte ?{' '}
                            <Link
                                href="/login"
                                className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
                            >
                                Se connecter
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
