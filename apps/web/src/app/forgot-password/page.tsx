'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Calendar, Send, CheckCircle, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Veuillez entrer votre adresse email');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erreur serveur');
            }

            setSent(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Panneau gauche - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-300 opacity-10 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-400 opacity-10 rounded-full blur-2xl"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                            <Calendar className="h-10 w-10 text-white" />
                        </div>
                        <span className="text-3xl font-bold">TAFF Events</span>
                    </div>

                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        Pas de panique, on s'en occupe !
                    </h1>
                    <p className="text-xl text-amber-100 leading-relaxed mb-12">
                        Entrez votre adresse email et nous vous enverrons un nouveau mot de passe temporaire.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <span className="text-lg">📧</span>
                            </div>
                            <span className="text-amber-100">Recevez un mot de passe temporaire par email</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <span className="text-lg">🔑</span>
                            </div>
                            <span className="text-amber-100">Connectez-vous avec le nouveau mot de passe</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <span className="text-lg">🔒</span>
                            </div>
                            <span className="text-amber-100">Modifiez-le dans Paramètres → Sécurité</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Panneau droit - Formulaire */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-amber-50 px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Logo mobile */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl">
                            <Calendar className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">TAFF Events</span>
                    </div>

                    {sent ? (
                        <div className="text-center">
                            <div className="bg-emerald-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="h-10 w-10 text-emerald-500" />
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                                Email envoyé !
                            </h2>
                            <p className="text-gray-500 text-lg mb-2">
                                Si un compte existe avec l'adresse <strong className="text-gray-700">{email}</strong>, vous recevrez un email avec votre nouveau mot de passe temporaire.
                            </p>
                            <p className="text-gray-400 text-sm mb-8">
                                Pensez à vérifier vos spams si vous ne le trouvez pas.
                            </p>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 text-left">
                                <p className="text-amber-800 text-sm font-medium mb-2">📌 Étapes suivantes :</p>
                                <ol className="text-amber-700 text-sm space-y-1.5 list-decimal list-inside">
                                    <li>Consultez votre boîte mail</li>
                                    <li>Connectez-vous avec le mot de passe temporaire</li>
                                    <li>Changez-le dans <strong>Paramètres → Sécurité</strong></li>
                                </ol>
                            </div>

                            <Link
                                href="/login"
                                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white py-4 rounded-xl text-lg font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                Retour à la connexion
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-10">
                                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                                    Mot de passe oublié
                                </h2>
                                <p className="text-gray-500 text-lg">
                                    Entrez votre email pour recevoir un nouveau mot de passe
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-5 py-4 rounded-xl flex items-center gap-3">
                                        <span className="text-xl">⚠️</span>
                                        <span className="font-medium">{error}</span>
                                    </div>
                                )}

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
                                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all hover:border-gray-300"
                                            placeholder="votre@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-4 rounded-xl text-lg font-bold hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Envoi en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-5 w-5" />
                                            Envoyer un nouveau mot de passe
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <Link
                                    href="/login"
                                    className="text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center gap-2 font-medium"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Retour à la connexion
                                </Link>
                            </div>
                        </>
                    )}

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
