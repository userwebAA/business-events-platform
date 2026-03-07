'use client';

import Link from 'next/link'
import { Calendar, Users, CreditCard, Shield, Download, Smartphone, Zap, Bell, ArrowRight, QrCode, BarChart3, Globe, ChevronRight, X, Share2, MapPin, Clock, Lock, XCircle } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { FRENCH_CITIES } from '@/lib/frenchCities'

// Styles pour l'animation flamme
const flameStyles = `
@keyframes flame {
  0%, 100% { transform: translateY(0) scaleY(1); opacity: 0.8; }
  50% { transform: translateY(-5px) scaleY(1.1); opacity: 1; }
}
@keyframes flameGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(251, 146, 60, 0.4), 0 0 40px rgba(251, 146, 60, 0.2); }
  50% { box-shadow: 0 0 30px rgba(251, 146, 60, 0.6), 0 0 60px rgba(251, 146, 60, 0.3); }
}
`;

export default function Home() {
    // Injecter les styles d'animation
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = flameStyles;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallButton, setShowInstallButton] = useState(false);
    const [showInstallGuide, setShowInstallGuide] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
    const [publicEvents, setPublicEvents] = useState<any[]>([]);
    const [cityFilter, setCityFilter] = useState('');
    const [eventsLoading, setEventsLoading] = useState(true);
    const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
    const cardsRef = useRef<(HTMLElement | null)[]>([]);

    useEffect(() => {
        const fetchPublicEvents = async () => {
            try {
                const res = await fetch('/api/events');
                if (res.ok) {
                    const data = await res.json();
                    const now = new Date();
                    setPublicEvents(
                        data
                            .map((e: any) => ({ ...e, date: new Date(e.date) }))
                            .filter((e: any) => new Date(e.date) > now && !e.isPrivate && e.status !== 'cancelled')
                    );
                }
            } catch (e) {
                console.error('Erreur fetch events:', e);
            } finally {
                setEventsLoading(false);
            }
        };
        fetchPublicEvents();
    }, []);

    const filteredPublicEvents = (cityFilter
        ? publicEvents.filter(e => e.location?.toLowerCase().includes(cityFilter.toLowerCase()))
        : publicEvents
    ).sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

    // Reset animations quand le filtre change
    useEffect(() => {
        setVisibleCards(new Set());
        cardsRef.current = [];
    }, [cityFilter]);

    // IntersectionObserver pour animations au scroll
    useEffect(() => {
        if (eventsLoading) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const idx = Number(entry.target.getAttribute('data-idx'));
                        if (!isNaN(idx)) {
                            setTimeout(() => {
                                setVisibleCards(prev => new Set(prev).add(idx));
                            }, idx * 120);
                        }
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        // Petit délai pour laisser le DOM se rendre
        const timer = setTimeout(() => {
            cardsRef.current.forEach((el) => {
                if (el) observer.observe(el);
            });
        }, 50);

        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, [filteredPublicEvents, eventsLoading]);

    useEffect(() => {
        const ua = navigator.userAgent || '';
        const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isAndroid = /Android/.test(ua);
        setPlatform(isIOS ? 'ios' : isAndroid ? 'android' : 'desktop');

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallButton(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone === true;
        if (isStandalone) {
            setShowInstallButton(false);
        } else {
            setShowInstallButton(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') setShowInstallButton(false);
            setDeferredPrompt(null);
        } else {
            setShowInstallGuide(true);
        }
    };

    return (
        <div className="min-h-screen">
            {/* Hero Section - Full Screen */}
            <div className="relative min-h-screen bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-sky-400 opacity-10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-400 opacity-10 rounded-full blur-2xl"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-300 opacity-5 rounded-full blur-2xl"></div>
                </div>

                {/* Navbar */}
                <nav className="relative z-20 px-4 sm:px-6 lg:px-16 py-4 sm:py-6">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="bg-white bg-opacity-20 p-2 sm:p-2.5 rounded-xl backdrop-blur-sm shrink-0">
                                <Calendar className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                            </div>
                            <span className="text-lg sm:text-2xl font-bold text-white whitespace-nowrap">TAFF Events</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                            <Link
                                href="/login"
                                className="text-white text-xs sm:text-sm font-medium px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all"
                            >
                                Connexion
                            </Link>
                            <Link
                                href="/register"
                                className="bg-white text-blue-700 text-xs sm:text-sm font-bold px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-opacity-90 transition-all shadow-lg"
                            >
                                Inscription
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Hero Content */}
                <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 pt-16 lg:pt-24 pb-32">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left - Text */}
                        <div>
                            <div className="inline-flex items-center gap-2 bg-white bg-opacity-10 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-blue-100 mb-8 border border-white border-opacity-20">
                                <Zap className="h-4 w-4 text-yellow-300" />
                                Plateforme #1 d'événements professionnels
                            </div>

                            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight">
                                Organisez vos
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-200 to-cyan-200">
                                    événements business
                                </span>
                            </h1>

                            <p className="text-base sm:text-xl text-blue-100 mb-8 sm:mb-10 leading-relaxed max-w-lg">
                                Créez des soirées professionnelles, gérez les inscriptions avec QR codes et développez votre réseau en toute simplicité.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    href="/register"
                                    className="bg-white text-blue-700 px-8 py-4 rounded-xl text-lg font-bold hover:bg-opacity-90 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                                >
                                    Commencer gratuitement
                                    <ArrowRight className="h-5 w-5" />
                                </Link>
                                <Link
                                    href="/login"
                                    className="border-2 border-white border-opacity-30 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:bg-opacity-10 transition-all flex items-center justify-center gap-2"
                                >
                                    Se connecter
                                </Link>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-6 sm:gap-10 mt-10 sm:mt-14">
                                <div>
                                    <p className="text-2xl sm:text-3xl font-bold text-white">500+</p>
                                    <p className="text-blue-200 text-xs sm:text-sm">Événements créés</p>
                                </div>
                                <div>
                                    <p className="text-2xl sm:text-3xl font-bold text-white">10K+</p>
                                    <p className="text-blue-200 text-xs sm:text-sm">Participants</p>
                                </div>
                                <div>
                                    <p className="text-2xl sm:text-3xl font-bold text-white">98%</p>
                                    <p className="text-blue-200 text-xs sm:text-sm">Satisfaction</p>
                                </div>
                            </div>
                        </div>

                        {/* Right - Visual Card */}
                        <div className="hidden lg:block">
                            <div className="relative">
                                {/* Main Card */}
                                <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 border border-white border-opacity-20 shadow-2xl">
                                    <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-inner">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="bg-gradient-to-br from-sky-500 to-blue-600 w-12 h-12 rounded-xl flex items-center justify-center">
                                                <Calendar className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">Conférence Tech</h3>
                                                <p className="text-sm text-gray-500">Paris - 25 participants</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                                                    <span>📅</span>
                                                </div>
                                                <span>Vendredi 14 Février, 19h00</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                    <span>📍</span>
                                                </div>
                                                <span>Le Rooftop, Paris 8ème</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                    <span>🎫</span>
                                                </div>
                                                <span>Billet avec QR Code inclus</span>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white text-center py-3 rounded-xl font-bold text-sm">
                                            S'inscrire maintenant
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Badge */}
                                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-emerald-400 to-green-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2">
                                    <QrCode className="h-4 w-4" />
                                    QR Code auto
                                </div>

                                {/* Floating Notification */}
                                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl px-5 py-3 shadow-xl flex items-center gap-3 border border-gray-100">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-lg">✅</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Email envoyé !</p>
                                        <p className="text-xs text-gray-500">Billet PDF avec QR code</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave Separator */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
                    </svg>
                </div>
            </div>

            {/* PWA Install Section */}
            {showInstallButton && (
                <div className="max-w-5xl mx-auto px-6 -mt-8 relative z-20 mb-16">
                    <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="bg-white bg-opacity-20 p-5 rounded-2xl backdrop-blur-sm">
                                <Smartphone className="h-14 w-14 text-white" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-2xl font-bold mb-2">
                                    Installez l'application TAFF Events
                                </h2>
                                <p className="text-purple-100">
                                    Accès instantané, notifications en temps réel et mode hors ligne
                                </p>
                            </div>
                            <button
                                onClick={handleInstallClick}
                                className="bg-white text-purple-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 whitespace-nowrap"
                            >
                                <Download className="h-5 w-5" />
                                Installer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Guide d'installation mobile */}
            {showInstallGuide && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowInstallGuide(false)}>
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 sm:p-8 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowInstallGuide(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X className="h-6 w-6" />
                        </button>
                        <div className="text-center mb-6">
                            <div className="bg-gradient-to-br from-violet-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Smartphone className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Installer TAFF Events</h3>
                            <p className="text-sm text-gray-500 mt-1">Ajoutez l'app sur votre écran d'accueil</p>
                        </div>

                        {platform === 'ios' ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="bg-sky-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">1</div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Appuyez sur le bouton Partager</p>
                                        <p className="text-sm text-gray-500 mt-0.5">L'icône <Share2 className="inline h-4 w-4" /> en bas de Safari</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="bg-sky-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">2</div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Défilez et appuyez sur</p>
                                        <p className="text-sm text-gray-500 mt-0.5">« Sur l'écran d'accueil »</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="bg-sky-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">3</div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Appuyez sur Ajouter</p>
                                        <p className="text-sm text-gray-500 mt-0.5">L'app apparaîtra sur votre écran d'accueil</p>
                                    </div>
                                </div>
                                <p className="text-xs text-center text-amber-600 bg-amber-50 p-3 rounded-xl font-medium">Safari uniquement — cette fonctionnalité n'est pas disponible sur Chrome iOS</p>
                            </div>
                        ) : platform === 'android' ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="bg-sky-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">1</div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Ouvrez le menu Chrome</p>
                                        <p className="text-sm text-gray-500 mt-0.5">Appuyez sur ⋮ (3 points) en haut à droite</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="bg-sky-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">2</div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Appuyez sur</p>
                                        <p className="text-sm text-gray-500 mt-0.5">« Installer l'application » ou « Ajouter à l'écran d'accueil »</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="bg-sky-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">3</div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Confirmez l'installation</p>
                                        <p className="text-sm text-gray-500 mt-0.5">L'app s'installera comme une application native</p>
                                    </div>
                                </div>
                                <p className="text-xs text-center text-sky-600 bg-sky-50 p-3 rounded-xl font-medium">Fonctionne avec Chrome, Edge et Samsung Internet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="bg-sky-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">1</div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Cliquez sur l'icône d'installation</p>
                                        <p className="text-sm text-gray-500 mt-0.5">Dans la barre d'adresse de Chrome</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="bg-sky-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">2</div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Confirmez l'installation</p>
                                        <p className="text-sm text-gray-500 mt-0.5">L'app s'ouvrira dans sa propre fenêtre</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button onClick={() => setShowInstallGuide(false)} className="w-full mt-6 bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition-all">
                            Compris !
                        </button>
                    </div>
                </div>
            )}

            {/* Section Soirées disponibles */}
            <section className="py-16 sm:py-24 bg-gradient-to-br from-gray-50 via-white to-sky-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">
                    <div className="text-center mb-10">
                        <span className="inline-block bg-sky-100 text-sky-700 text-sm font-bold px-4 py-2 rounded-full mb-4">
                            🎉 Événements à venir
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4">
                            Découvrez les prochaines soirées
                        </h2>
                        <p className="text-base sm:text-xl text-gray-500 max-w-2xl mx-auto">
                            Rejoignez des événements professionnels près de chez vous
                        </p>
                    </div>

                    {/* Filtre ville */}
                    <div className="flex justify-center mb-10">
                        <div className="relative w-full max-w-sm">
                            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                            <select
                                value={cityFilter}
                                onChange={(e) => setCityFilter(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 font-medium transition-all hover:border-gray-300 bg-white appearance-none"
                            >
                                <option value="">Toutes les villes</option>
                                {FRENCH_CITIES.map((city) => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Grille d'événements */}
                    {eventsLoading ? (
                        <div className="text-center py-16">
                            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div>
                            <p className="text-gray-500 mt-4">Chargement des événements...</p>
                        </div>
                    ) : filteredPublicEvents.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="bg-gray-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Calendar className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {cityFilter ? 'Aucun événement dans cette ville' : 'Aucun événement à venir'}
                            </h3>
                            <p className="text-gray-500 mb-4">
                                {cityFilter ? 'Essayez une autre ville ou consultez tous les événements.' : 'Revenez bientôt pour découvrir de nouvelles soirées !'}
                            </p>
                            {cityFilter && (
                                <button
                                    onClick={() => setCityFilter('')}
                                    className="inline-flex items-center gap-2 bg-sky-50 text-sky-600 px-5 py-2.5 rounded-xl font-bold hover:bg-sky-100 transition-all"
                                >
                                    <X className="h-4 w-4" />
                                    Voir toutes les villes
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredPublicEvents.slice(0, 6).map((event, idx) => (
                                    <Link
                                        key={event.id}
                                        href={`/register?redirect=/events/${event.id}`}
                                        ref={(el: HTMLAnchorElement | null) => { cardsRef.current[idx] = el; }}
                                        data-idx={idx}
                                        className={`group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-1 relative ${visibleCards.has(idx)
                                            ? 'opacity-100 translate-y-0'
                                            : 'opacity-0 translate-y-8'
                                            } ${event.isFeatured
                                                ? 'border-2 border-orange-300 ring-2 ring-orange-100 shadow-orange-100'
                                                : 'border border-gray-100 hover:border-sky-200'
                                            }`}
                                        style={event.isFeatured ? { animation: 'flameGlow 2s ease-in-out infinite' } : {}}
                                    >
                                        {event.imageUrl ? (
                                            <div className="h-48 bg-gray-200 overflow-hidden relative">
                                                <img
                                                    src={event.imageUrl}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute top-3 left-3 flex gap-2">
                                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-md backdrop-blur-sm ${event.type === 'free' ? 'bg-emerald-500 bg-opacity-90 text-white' : 'bg-blue-500 bg-opacity-90 text-white'}`}>
                                                        {event.type === 'free' ? 'Gratuit' : `${event.price}€`}
                                                    </span>
                                                    {event.isFeatured && (
                                                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold shadow-md backdrop-blur-sm bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center gap-1 animate-pulse">
                                                            🔥 En vedette
                                                        </span>
                                                    )}
                                                </div>
                                                {event.isFeatured && (
                                                    <div className="absolute inset-0 pointer-events-none">
                                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-t from-orange-500/30 via-orange-400/20 to-transparent rounded-full blur-xl" style={{ animation: 'flame 1.5s ease-in-out infinite' }}></div>
                                                        <div className="absolute bottom-0 left-1/3 -translate-x-1/2 w-16 h-16 bg-gradient-to-t from-red-500/30 via-orange-400/20 to-transparent rounded-full blur-lg" style={{ animation: 'flame 1.8s ease-in-out infinite 0.3s' }}></div>
                                                        <div className="absolute bottom-0 right-1/3 translate-x-1/2 w-14 h-14 bg-gradient-to-t from-yellow-500/30 via-orange-400/20 to-transparent rounded-full blur-lg" style={{ animation: 'flame 1.6s ease-in-out infinite 0.6s' }}></div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className={`h-48 flex items-center justify-center relative ${event.isFeatured ? 'bg-gradient-to-br from-orange-50 to-amber-100' : 'bg-gradient-to-br from-sky-100 to-blue-100'}`}>
                                                <Calendar className={`h-16 w-16 ${event.isFeatured ? 'text-orange-300' : 'text-sky-300'}`} />
                                                <div className="absolute top-3 left-3 flex gap-2">
                                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-md ${event.type === 'free' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                                                        {event.type === 'free' ? 'Gratuit' : `${event.price}€`}
                                                    </span>
                                                    {event.isFeatured && (
                                                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold shadow-md bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center gap-1 animate-pulse">
                                                            🔥 En vedette
                                                        </span>
                                                    )}
                                                </div>
                                                {event.isFeatured && (
                                                    <div className="absolute inset-0 pointer-events-none">
                                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-t from-orange-500/30 via-orange-400/20 to-transparent rounded-full blur-xl" style={{ animation: 'flame 1.5s ease-in-out infinite' }}></div>
                                                        <div className="absolute bottom-0 left-1/3 -translate-x-1/2 w-16 h-16 bg-gradient-to-t from-red-500/30 via-orange-400/20 to-transparent rounded-full blur-lg" style={{ animation: 'flame 1.8s ease-in-out infinite 0.3s' }}></div>
                                                        <div className="absolute bottom-0 right-1/3 translate-x-1/2 w-14 h-14 bg-gradient-to-t from-yellow-500/30 via-orange-400/20 to-transparent rounded-full blur-lg" style={{ animation: 'flame 1.6s ease-in-out infinite 0.6s' }}></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-sky-700 transition-colors line-clamp-1">
                                                {event.title}
                                            </h3>
                                            <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">{event.description}</p>

                                            <div className="space-y-2.5">
                                                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                                                    <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center shrink-0">
                                                        <Clock className="h-4 w-4 text-sky-500" />
                                                    </div>
                                                    <span className="font-medium">{format(new Date(event.date), 'EEEE d MMMM yyyy', { locale: fr })}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                                                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                                                        <MapPin className="h-4 w-4 text-purple-500" />
                                                    </div>
                                                    <span className="font-medium">{event.location}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                                                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                                                        <Users className="h-4 w-4 text-emerald-500" />
                                                    </div>
                                                    <span className="font-medium">{event.currentAttendees}/{event.maxAttendees || '∞'} participants</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-center py-2.5 rounded-xl font-bold text-sm group-hover:from-sky-600 group-hover:to-blue-700 transition-all">
                                                S'inscrire →
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {filteredPublicEvents.length > 6 && (
                                <div className="text-center mt-10">
                                    <Link
                                        href="/register"
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        Voir tous les événements
                                        <ArrowRight className="h-5 w-5" />
                                    </Link>
                                </div>
                            )}
                        </>
                    )}

                    {/* CTA inscription */}
                    <div className="mt-12 text-center">
                        <p className="text-gray-500 mb-4">Créez un compte pour vous inscrire aux événements</p>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Créer un compte gratuitement
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-16">
                    <div className="text-center mb-16">
                        <span className="inline-block bg-sky-100 text-sky-700 text-sm font-bold px-4 py-2 rounded-full mb-4">
                            Fonctionnalités
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4">
                            Tout ce dont vous avez besoin
                        </h2>
                        <p className="text-base sm:text-xl text-gray-500 max-w-2xl mx-auto">
                            Une plateforme complète pour gérer vos événements professionnels de A à Z
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="group bg-gradient-to-br from-gray-50 to-sky-50 p-8 rounded-2xl border border-gray-100 hover:shadow-2xl transition-shadow duration-200 hover:-translate-y-1">
                            <div className="bg-gradient-to-br from-sky-400 to-blue-500 w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-200">
                                <Calendar className="h-7 w-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Création intuitive</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">Créez vos événements en quelques clics avec notre interface moderne et intuitive.</p>
                            <span className="text-sky-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                En savoir plus <ChevronRight className="h-4 w-4" />
                            </span>
                        </div>

                        <div className="group bg-gradient-to-br from-gray-50 to-purple-50 p-8 rounded-2xl border border-gray-100 hover:shadow-2xl transition-shadow duration-200 hover:-translate-y-1">
                            <div className="bg-gradient-to-br from-purple-400 to-pink-500 w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-200">
                                <QrCode className="h-7 w-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Billets & QR Codes</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">Billets PDF avec QR code envoyés automatiquement par email à chaque inscription.</p>
                            <span className="text-purple-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                En savoir plus <ChevronRight className="h-4 w-4" />
                            </span>
                        </div>

                        <div className="group bg-gradient-to-br from-gray-50 to-emerald-50 p-8 rounded-2xl border border-gray-100 hover:shadow-2xl transition-shadow duration-200 hover:-translate-y-1">
                            <div className="bg-gradient-to-br from-emerald-400 to-green-500 w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-200">
                                <Users className="h-7 w-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Gestion participants</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">Collectez les informations et gérez vos participants avec des formulaires personnalisés.</p>
                            <span className="text-emerald-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                En savoir plus <ChevronRight className="h-4 w-4" />
                            </span>
                        </div>

                        <div className="group bg-gradient-to-br from-gray-50 to-orange-50 p-8 rounded-2xl border border-gray-100 hover:shadow-2xl transition-shadow duration-200 hover:-translate-y-1">
                            <div className="bg-gradient-to-br from-orange-400 to-red-500 w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-200">
                                <CreditCard className="h-7 w-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Paiements sécurisés</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">Acceptez les paiements en ligne et générez des factures automatiquement.</p>
                            <span className="text-orange-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                En savoir plus <ChevronRight className="h-4 w-4" />
                            </span>
                        </div>

                        <div className="group bg-gradient-to-br from-gray-50 to-cyan-50 p-8 rounded-2xl border border-gray-100 hover:shadow-2xl transition-shadow duration-200 hover:-translate-y-1">
                            <div className="bg-gradient-to-br from-cyan-400 to-teal-500 w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-200">
                                <BarChart3 className="h-7 w-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Statistiques avancées</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">Suivez vos performances avec des tableaux de bord et analytics en temps réel.</p>
                            <span className="text-cyan-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                En savoir plus <ChevronRight className="h-4 w-4" />
                            </span>
                        </div>

                        <div className="group bg-gradient-to-br from-gray-50 to-indigo-50 p-8 rounded-2xl border border-gray-100 hover:shadow-2xl transition-shadow duration-200 hover:-translate-y-1">
                            <div className="bg-gradient-to-br from-indigo-400 to-violet-500 w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-200">
                                <Bell className="h-7 w-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Notifications push</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">Restez informé en temps réel avec les notifications push sur tous vos appareils.</p>
                            <span className="text-indigo-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                En savoir plus <ChevronRight className="h-4 w-4" />
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-16 py-16">
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-12">
                        <div className="sm:col-span-2 md:col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-2.5 rounded-xl">
                                    <Calendar className="h-6 w-6 text-white" />
                                </div>
                                <span className="text-2xl font-bold">TAFF Events</span>
                            </div>
                            <p className="text-gray-400 leading-relaxed max-w-md">
                                La plateforme moderne pour organiser et gérer vos événements professionnels. Billets, QR codes, statistiques et bien plus encore.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-lg font-semibold mb-4">Plateforme</h4>
                            <ul className="space-y-3">
                                <li>
                                    <Link href="/register" className="text-gray-400 hover:text-sky-400 transition flex items-center gap-1">
                                        <ChevronRight className="h-3 w-3" /> Inscription
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/login" className="text-gray-400 hover:text-sky-400 transition flex items-center gap-1">
                                        <ChevronRight className="h-3 w-3" /> Connexion
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-lg font-semibold mb-4">Contact</h4>
                            <ul className="space-y-3">
                                <li className="text-gray-400">
                                    contact@taff-events.com
                                </li>
                                <li className="text-gray-400">
                                    Support 7j/7
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-gray-500 text-sm">
                            &copy; {new Date().getFullYear()} TAFF Events. Tous droits réservés.
                        </p>
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Globe className="h-4 w-4" />
                            Fait avec passion en France
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
