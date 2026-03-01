'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie } from 'lucide-react';

export default function CookieBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            setVisible(true);
        }
    }, []);

    const accept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 sm:p-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                        <Cookie className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">Cookies & Confidentialité</h3>
                        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                            Ce site utilise uniquement des cookies strictement nécessaires à son fonctionnement (authentification). Aucun cookie publicitaire ou de tracking n&apos;est utilisé.{' '}
                            <Link href="/privacy" className="text-sky-600 hover:underline font-medium">
                                Politique de confidentialité
                            </Link>
                        </p>
                        <div className="flex items-center gap-3 mt-4">
                            <button
                                onClick={accept}
                                className="px-5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-sm font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-sm"
                            >
                                J&apos;ai compris
                            </button>
                            <Link
                                href="/privacy"
                                className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                            >
                                En savoir plus
                            </Link>
                        </div>
                    </div>
                    <button
                        onClick={accept}
                        className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
