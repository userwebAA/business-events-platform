'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, Plus, CheckCircle, Settings, TrendingUp, Euro, Clock, Lock, ChevronRight, ArrowUpRight, Eye, X, User, Shield, Sparkles, Trash2, Flame, Database, Mail, FileText } from 'lucide-react';
import { Event } from 'shared';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [registeredEvents, setRegisteredEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    // Vérifier si l'utilisateur est admin ou super_admin
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    const [revenue, setRevenue] = useState(0);
    const [seedLoading, setSeedLoading] = useState(false);
    const [featureLoading, setFeatureLoading] = useState<string | null>(null);
    const [seedMessage, setSeedMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSeedCreate = async () => {
        setSeedLoading(true);
        setSeedMessage(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/seed', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setSeedMessage({ type: 'success', text: data.message });
                fetchEvents();
            } else {
                setSeedMessage({ type: 'error', text: data.error });
            }
        } catch {
            setSeedMessage({ type: 'error', text: 'Erreur réseau' });
        } finally {
            setSeedLoading(false);
        }
    };

    const handleSeedDelete = async () => {
        setSeedLoading(true);
        setSeedMessage(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/seed', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setSeedMessage({ type: 'success', text: data.message });
                fetchEvents();
            } else {
                setSeedMessage({ type: 'error', text: data.error });
            }
        } catch {
            setSeedMessage({ type: 'error', text: 'Erreur réseau' });
        } finally {
            setSeedLoading(false);
        }
    };

    const handleToggleFeatured = async (eventId: string) => {
        setFeatureLoading(eventId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/featured', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ eventId }),
            });
            if (res.ok) {
                const data = await res.json();
                setEvents(prev => prev.map(e =>
                    e.id === eventId ? { ...e, isFeatured: data.isFeatured } as any : e
                ));
            }
        } catch (e) {
            console.error('Erreur toggle featured:', e);
        } finally {
            setFeatureLoading(null);
        }
    };

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/events');
            const data = await response.json();
            setEvents(data.map((e: any) => ({ ...e, date: new Date(e.date) })));
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRegisteredEvents = useCallback(async () => {
        try {
            // Priorité : charger depuis la DB si connecté
            const token = localStorage.getItem('token');
            if (token) {
                const res = await fetch('/api/user/registrations', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (res.ok) {
                    const registrations = await res.json();
                    const eventsData = registrations.map((r: any) => ({
                        ...r.event,
                        date: new Date(r.event.date),
                        registrationId: r.id,
                    }));
                    setRegisteredEvents(eventsData);
                    return;
                }
            }
            // Fallback : sessionStorage pour les non-connectés
            const registeredIds = JSON.parse(sessionStorage.getItem('registeredEvents') || '[]');
            if (registeredIds.length > 0) {
                const eventsPromises = registeredIds.map((id: string) =>
                    fetch(`/api/events/${id}`).then(res => res.ok ? res.json() : null)
                );
                const eventsData = (await Promise.all(eventsPromises)).filter(Boolean);
                setRegisteredEvents(eventsData.map((e: any) => ({ ...e, date: new Date(e.date) })));
            }
        } catch (error) {
            console.error('Error fetching registered events:', error);
        }
    }, []);

    const fetchRevenue = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/stats/revenue', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setRevenue(data.totalRevenue);
            }
        } catch (error) {
            console.error('Error fetching revenue:', error);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
        fetchRegisteredEvents();
        fetchRevenue();
    }, [fetchEvents, fetchRegisteredEvents, fetchRevenue]);


    // Compute stats with useMemo instead of async useEffect
    const stats = useMemo(() => {
        const now = new Date();
        return {
            totalEvents: events.length,
            totalRegistrations: registeredEvents.length,
            upcomingEvents: events.filter(e => new Date(e.date) > now).length,
            totalRevenue: revenue,
            privateEvents: events.filter(e => e.isPrivate).length,
        };
    }, [events, registeredEvents, revenue]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bonjour';
        if (hour < 18) return 'Bon après-midi';
        return 'Bonsoir';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header avec salutation */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">
                            {getGreeting()}, {user?.name?.split(' ')[0] || 'Utilisateur'} 👋
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg">
                            Voici un aperçu de votre activité
                        </p>
                    </div>
                    <Link
                        href="/events/create"
                        className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <Plus className="h-5 w-5" />
                        Créer un événement
                    </Link>
                </div>


                {/* Actions rapides */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-10">
                    <Link
                        href="/dashboard/my-events"
                        className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-lg hover:border-sky-200 transition-shadow duration-200 hover:-translate-y-1"
                    >
                        <div className="bg-gradient-to-br from-sky-400 to-blue-500 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Mes Événements</h3>
                        <p className="text-xs text-gray-500 hidden sm:block">Gérer et modifier</p>
                    </Link>

                    <Link
                        href={isAdmin ? "/dashboard/analytics" : "/dashboard/my-stats"}
                        className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-lg hover:border-purple-200 transition-shadow duration-200 hover:-translate-y-1"
                    >
                        <div className="bg-gradient-to-br from-purple-400 to-violet-500 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">
                            {isAdmin ? 'Statistiques' : 'Mes Stats'}
                        </h3>
                        <p className="text-xs text-gray-500 hidden sm:block">
                            {isAdmin ? 'Analyser les données' : 'Suivre mes inscriptions'}
                        </p>
                    </Link>

                    {isAdmin ? (
                        <>
                            <Link
                                href="/dashboard/my-invoices"
                                className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-lg hover:border-amber-200 transition-shadow duration-200 hover:-translate-y-1"
                            >
                                <div className="bg-gradient-to-br from-amber-400 to-orange-500 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Mes Factures</h3>
                                <p className="text-xs text-gray-500 hidden sm:block">Télécharger mes factures</p>
                            </Link>
                            <Link
                                href="/dashboard/my-payments"
                                className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-lg hover:border-emerald-200 transition-shadow duration-200 hover:-translate-y-1"
                            >
                                <div className="bg-gradient-to-br from-emerald-400 to-green-500 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                                    <Euro className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Mes Paiements</h3>
                                <p className="text-xs text-gray-500 hidden sm:block">Revenus & remboursements</p>
                            </Link>
                        </>
                    ) : (
                        <Link
                            href="/dashboard/my-payments"
                            className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-lg hover:border-amber-200 transition-shadow duration-200 hover:-translate-y-1"
                        >
                            <div className="bg-gradient-to-br from-amber-400 to-orange-500 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                                <Euro className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Mes Paiements</h3>
                            <p className="text-xs text-gray-500 hidden sm:block">Revenus & remboursements</p>
                        </Link>
                    )}

                    <Link
                        href="/dashboard/contacts"
                        className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-lg hover:border-violet-200 transition-shadow duration-200 hover:-translate-y-1"
                    >
                        <div className="bg-gradient-to-br from-violet-400 to-purple-500 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                            <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Mes Contacts</h3>
                        <p className="text-xs text-gray-500 hidden sm:block">Listes & invitations</p>
                    </Link>

                    <Link
                        href="/dashboard/settings"
                        className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-lg hover:border-gray-300 transition-shadow duration-200 hover:-translate-y-1"
                    >
                        <div className="bg-gradient-to-br from-gray-400 to-gray-500 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                            <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Paramètres</h3>
                        <p className="text-xs text-gray-500 hidden sm:block">Mon compte</p>
                    </Link>
                </div>

                {/* Section Admin */}
                {isAdmin && (
                    <div className="mb-10">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-sky-500" />
                            Administration
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            <Link
                                href="/dashboard/admin/system"
                                className="group bg-white rounded-2xl shadow-sm border-2 border-red-200 p-4 sm:p-6 hover:shadow-lg hover:border-red-300 transition-shadow duration-200 hover:-translate-y-1"
                            >
                                <div className="bg-gradient-to-br from-red-400 to-rose-500 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                                    <Database className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Système</h3>
                                <p className="text-xs text-gray-500 hidden sm:block">Monitoring BDD</p>
                            </Link>

                            <Link
                                href="/dashboard/admin/identity"
                                className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-lg hover:border-sky-200 transition-shadow duration-200 hover:-translate-y-1"
                            >
                                <div className="bg-gradient-to-br from-sky-400 to-cyan-500 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Vérification ID</h3>
                                <p className="text-xs text-gray-500 hidden sm:block">Valider les identités</p>
                            </Link>

                            <Link
                                href="/dashboard/admin/users"
                                className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-lg hover:border-indigo-200 transition-shadow duration-200 hover:-translate-y-1"
                            >
                                <div className="bg-gradient-to-br from-indigo-400 to-purple-500 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Utilisateurs</h3>
                                <p className="text-xs text-gray-500 hidden sm:block">Gérer les comptes</p>
                            </Link>

                            <Link
                                href="/dashboard/admin/treasury"
                                className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-lg hover:border-amber-200 transition-shadow duration-200 hover:-translate-y-1"
                            >
                                <div className="bg-gradient-to-br from-amber-400 to-orange-500 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                                    <Euro className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Trésorerie</h3>
                                <p className="text-xs text-gray-500 hidden sm:block">Mouvements financiers</p>
                            </Link>

                            {/* Bouton Seed Démo */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                                <div className="bg-gradient-to-br from-emerald-400 to-teal-500 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
                                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Événements démo</h3>
                                <p className="text-xs text-gray-500 hidden sm:block mb-3">Créer ou supprimer</p>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={handleSeedCreate}
                                        disabled={seedLoading}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all disabled:opacity-50"
                                    >
                                        {seedLoading ? (
                                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                                        ) : (
                                            <>
                                                <Plus className="h-3.5 w-3.5" />
                                                Créer
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleSeedDelete}
                                        disabled={seedLoading}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-all disabled:opacity-50"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Suppr.
                                    </button>
                                </div>
                                {seedMessage && (
                                    <p className={`text-xs mt-2 font-medium ${seedMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {seedMessage.text}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Cartes de statistiques */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-10 lg:grid-cols-5">
                    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-200 group">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="bg-gradient-to-br from-sky-400 to-blue-500 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 group-hover:text-sky-500 transition-colors" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Total Événements</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-200 group">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="bg-gradient-to-br from-emerald-400 to-green-500 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalRegistrations}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Mes Inscriptions</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-200 group">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="bg-gradient-to-br from-purple-400 to-violet-500 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.upcomingEvents}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">À venir</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-200 group">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="bg-gradient-to-br from-rose-400 to-red-500 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                                <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 group-hover:text-rose-500 transition-colors" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.privateEvents}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Événements Privés</p>
                    </div>

                    <Link href={isAdmin ? '/dashboard/admin/treasury' : '/dashboard/my-revenue'} className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg p-4 sm:p-6 text-white col-span-2 lg:col-span-1 group hover:shadow-xl transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-white bg-opacity-20 w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <Euro className="h-6 w-6 text-white" />
                            </div>
                            <ArrowUpRight className="h-5 w-5 text-white text-opacity-50 group-hover:text-opacity-100 transition-colors" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold">{stats.totalRevenue.toFixed(2)}€</p>
                        <p className="text-sm text-amber-100 mt-1">Recette</p>
                    </Link>
                </div>

                {/* Événements récents */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Événements récents</h2>
                            <p className="text-sm text-gray-500 mt-1">Les derniers événements sur la plateforme</p>
                        </div>
                        <Link
                            href="/events"
                            className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-semibold text-sm bg-sky-50 px-4 py-2 rounded-lg hover:bg-sky-100 transition-all"
                        >
                            Voir tout
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="text-center py-16">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                            <p className="text-gray-500 mt-4">Chargement des événements...</p>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-16 px-8">
                            <div className="bg-gray-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Calendar className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun événement</h3>
                            <p className="text-gray-500 mb-6">
                                Commencez par créer votre premier événement.
                            </p>
                            <Link
                                href="/events/create"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg"
                            >
                                <Plus className="h-5 w-5" />
                                Créer un événement
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {[...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((event, index) => (
                                <Link
                                    key={event.id}
                                    href={`/events/${event.id}`}
                                    className="flex items-center gap-3 sm:gap-5 px-4 sm:px-8 py-4 sm:py-5 hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 transition-all group"
                                >
                                    {event.imageUrl ? (
                                        <img
                                            src={event.imageUrl}
                                            alt={event.title}
                                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-xl shadow-sm shrink-0"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-sky-100 to-blue-100 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                            <Calendar className="h-5 w-5 sm:h-7 sm:w-7 text-sky-500" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 sm:mb-1.5 flex-wrap">
                                            <h3 className="font-bold text-gray-900 truncate group-hover:text-sky-700 transition-colors text-sm sm:text-base">
                                                {event.title}
                                            </h3>
                                            {event.isPrivate && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 hidden sm:flex items-center gap-1 shrink-0">
                                                    <Lock className="h-3 w-3" />
                                                    Privé
                                                </span>
                                            )}
                                            <span
                                                className={`px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${event.type === 'free'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                    }`}
                                            >
                                                {event.type === 'free' ? 'Gratuit' : `${event.price}€`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 flex-wrap">
                                            <span className="flex items-center gap-1 sm:gap-1.5">
                                                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                            </span>
                                            <span className="flex items-center gap-1 sm:gap-1.5">
                                                <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                <span className="truncate max-w-[80px] sm:max-w-none">{event.location}</span>
                                            </span>
                                            <span className="hidden sm:flex items-center gap-1.5">
                                                <Users className="h-3.5 w-3.5" />
                                                {event.currentAttendees} participants
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {isAdmin && (
                                            <button
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFeatured(event.id); }}
                                                disabled={featureLoading === event.id}
                                                className={`p-2 rounded-lg transition-all ${(event as any).isFeatured
                                                    ? 'bg-orange-100 text-orange-500 hover:bg-orange-200'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-orange-400'
                                                    }`}
                                                title={(event as any).isFeatured ? 'Retirer la mise en avant' : 'Mettre en avant 🔥'}
                                            >
                                                {featureLoading === event.id ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                                                ) : (
                                                    <Flame className={`h-4 w-4 ${(event as any).isFeatured ? 'animate-pulse' : ''}`} />
                                                )}
                                            </button>
                                        )}
                                        <span className="hidden sm:flex bg-sky-50 text-sky-600 px-4 py-2 rounded-lg font-semibold text-sm group-hover:bg-sky-500 group-hover:text-white transition-all items-center gap-1.5">
                                            <Eye className="h-4 w-4" />
                                            Voir
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
