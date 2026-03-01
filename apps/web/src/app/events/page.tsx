'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Euro, Plus, Search, CheckCircle, Lock, ArrowRight, X, Filter, Clock, FileText, Briefcase, XCircle } from 'lucide-react';
import { Event } from 'shared';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

export default function EventsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'all' | 'registered' | 'mine'>('all');
    const [events, setEvents] = useState<Event[]>([]);
    const [registeredEvents, setRegisteredEvents] = useState<Event[]>([]);
    const [myEvents, setMyEvents] = useState<Event[]>([]);
    const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');
    const [locationFilter, setLocationFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const allEventsCache = useRef<Event[]>([]);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/events');
            const data = await response.json();
            const now = new Date();
            const mapped = data
                .map((e: any) => ({ ...e, date: new Date(e.date) }))
                .filter((e: Event) => new Date(e.date) > now);
            allEventsCache.current = mapped;
            setEvents(mapped);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRegisteredEvents = useCallback(async () => {
        try {
            const now = new Date();
            // Priorité : charger depuis la DB si connecté
            const token = localStorage.getItem('token');
            if (token) {
                const res = await fetch('/api/user/registrations', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (res.ok) {
                    const registrations = await res.json();
                    setRegisteredEvents(
                        registrations
                            .map((r: any) => ({ ...r.event, date: new Date(r.event.date), registrationId: r.id }))
                            .filter((e: Event) => new Date(e.date) > now)
                    );
                    return;
                }
            }
            // Fallback : sessionStorage
            const registeredIds = JSON.parse(sessionStorage.getItem('registeredEvents') || '[]');
            if (registeredIds.length > 0) {
                const eventsPromises = registeredIds.map((id: string) =>
                    fetch(`/api/events/${id}`).then(res => res.ok ? res.json() : null)
                );
                const eventsData = (await Promise.all(eventsPromises)).filter(Boolean);
                setRegisteredEvents(
                    eventsData
                        .map((e: any) => ({ ...e, date: new Date(e.date) }))
                        .filter((e: Event) => new Date(e.date) > now)
                );
            }
        } catch (error) {
            console.error('Error fetching registered events:', error);
        }
    }, []);

    const fetchMyEvents = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const response = await fetch('/api/events/my-events', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                const now = new Date();
                setMyEvents(
                    data
                        .map((e: any) => ({ ...e, date: new Date(e.date) }))
                        .filter((e: Event) => new Date(e.date) > now)
                );
            }
        } catch (error) {
            console.error('Error fetching my events:', error);
        }
    }, []);

    // Fetch once on mount
    useEffect(() => {
        fetchEvents();
        fetchRegisteredEvents();
        fetchMyEvents();
    }, [fetchEvents, fetchRegisteredEvents, fetchMyEvents]);

    // Client-side filtering with debounce for search inputs
    const filteredEvents = useMemo(() => {
        let result = allEventsCache.current;
        if (filter !== 'all') result = result.filter(e => e.type === filter);
        if (locationFilter) {
            const loc = locationFilter.toLowerCase();
            result = result.filter(e => e.location?.toLowerCase().includes(loc));
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(e =>
                e.title?.toLowerCase().includes(q) ||
                e.description?.toLowerCase().includes(q)
            );
        }
        return result;
    }, [filter, locationFilter, searchQuery]);

    useEffect(() => {
        if (allEventsCache.current.length > 0) {
            setEvents(filteredEvents);
        }
    }, [filteredEvents]);


    const displayedEvents = activeTab === 'all' ? events : activeTab === 'registered' ? registeredEvents : myEvents;
    const hasActiveFilters = locationFilter || searchQuery || filter !== 'all';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Événements</h1>
                        <p className="text-gray-500 mt-1 text-lg">
                            {activeTab === 'all'
                                ? `${events.length} événement${events.length > 1 ? 's' : ''} à venir`
                                : activeTab === 'registered'
                                    ? `${registeredEvents.length} inscription${registeredEvents.length > 1 ? 's' : ''}`
                                    : `${myEvents.length} événement${myEvents.length > 1 ? 's' : ''} créé${myEvents.length > 1 ? 's' : ''}`
                            }
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

                {/* Onglets */}
                <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 mb-6 grid gap-1.5 ${user ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`${user ? 'col-span-2 sm:col-span-1' : ''} min-w-0 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'all'
                            ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2 min-w-0">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span className="text-sm sm:text-base truncate">Événements</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${activeTab === 'all' ? 'bg-white bg-opacity-20 text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {events.length}
                            </span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('registered')}
                        className={`min-w-0 px-3 sm:px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'registered'
                            ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 min-w-0">
                            <CheckCircle className="h-4 w-4 shrink-0" />
                            <span className="text-xs sm:text-base truncate">Inscriptions</span>
                            {registeredEvents.length > 0 && (
                                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${activeTab === 'registered' ? 'bg-white bg-opacity-20 text-white' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                    {registeredEvents.length}
                                </span>
                            )}
                        </div>
                    </button>
                    {user && (
                        <button
                            onClick={() => setActiveTab('mine')}
                            className={`min-w-0 px-3 sm:px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'mine'
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-1.5 sm:gap-2 min-w-0">
                                <Briefcase className="h-4 w-4 shrink-0" />
                                <span className="text-xs sm:text-base truncate">Mes événements</span>
                                {myEvents.length > 0 && (
                                    <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${activeTab === 'mine' ? 'bg-white bg-opacity-20 text-white' : 'bg-purple-100 text-purple-700'
                                        }`}>
                                        {myEvents.length}
                                    </span>
                                )}
                            </div>
                        </button>
                    )}
                </div>

                {/* Barre de recherche et filtres */}
                {activeTab === 'all' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">
                        <div className="flex flex-col md:flex-row gap-3 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un événement..."
                                    defaultValue={searchQuery}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (debounceRef.current) clearTimeout(debounceRef.current);
                                        debounceRef.current = setTimeout(() => setSearchQuery(val), 200);
                                    }}
                                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 font-medium placeholder-gray-400 transition-all hover:border-gray-300"
                                />
                            </div>
                            <div className="relative md:w-72">
                                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    placeholder="Ville..."
                                    defaultValue={locationFilter}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (debounceRef.current) clearTimeout(debounceRef.current);
                                        debounceRef.current = setTimeout(() => setLocationFilter(val), 200);
                                    }}
                                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 font-medium placeholder-gray-400 transition-all hover:border-gray-300"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Filter className="h-4 w-4 text-gray-400" />
                            {[
                                { key: 'all', label: 'Tous', color: 'sky' },
                                { key: 'free', label: 'Gratuits', color: 'emerald' },
                                { key: 'paid', label: 'Payants', color: 'blue' },
                            ].map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => setFilter(item.key as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === item.key
                                        ? 'bg-sky-500 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}

                            {hasActiveFilters && (
                                <button
                                    onClick={() => {
                                        setLocationFilter('');
                                        setSearchQuery('');
                                        setFilter('all');
                                    }}
                                    className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Réinitialiser
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Contenu */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                        <p className="text-gray-500 mt-4">Chargement des événements...</p>
                    </div>
                ) : displayedEvents.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                        {activeTab === 'all' ? (
                            <>
                                <div className="bg-gray-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Calendar className="h-10 w-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun événement disponible</h3>
                                <p className="text-gray-500 mb-6">
                                    Aucun événement ne correspond à vos critères de recherche.
                                </p>
                                {hasActiveFilters && (
                                    <button
                                        onClick={() => { setLocationFilter(''); setSearchQuery(''); setFilter('all'); }}
                                        className="inline-flex items-center gap-2 bg-sky-50 text-sky-600 px-6 py-3 rounded-xl font-bold hover:bg-sky-100 transition-all"
                                    >
                                        <X className="h-4 w-4" />
                                        Réinitialiser les filtres
                                    </button>
                                )}
                            </>
                        ) : activeTab === 'registered' ? (
                            <>
                                <div className="bg-emerald-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="h-10 w-10 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune inscription</h3>
                                <p className="text-gray-500 mb-6">
                                    Vous n'êtes inscrit à aucun événement pour le moment.
                                </p>
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg"
                                >
                                    Découvrir les événements
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="bg-purple-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Briefcase className="h-10 w-10 text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun événement créé</h3>
                                <p className="text-gray-500 mb-6">
                                    Vous n'avez pas encore créé d'événement.
                                </p>
                                <Link
                                    href="/events/create"
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg"
                                >
                                    <Plus className="h-4 w-4" />
                                    Créer un événement
                                </Link>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedEvents.map((event) => (
                            <div
                                key={event.id}
                                className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-sky-200 transition-shadow transition-[border-color] duration-200 will-change-[transform] hover:-translate-y-1"
                            >
                                <Link href={`/events/${event.id}`}>
                                    {event.imageUrl ? (
                                        <div className="h-48 bg-gray-200 overflow-hidden relative">
                                            <img
                                                src={event.imageUrl}
                                                alt={event.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 will-change-transform"
                                            />
                                            <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                                                <span
                                                    className={`px-3 py-1 rounded-lg text-xs font-bold shadow-md backdrop-blur-sm ${event.type === 'free'
                                                        ? 'bg-emerald-500 bg-opacity-90 text-white'
                                                        : 'bg-blue-500 bg-opacity-90 text-white'
                                                        }`}
                                                >
                                                    {event.type === 'free' ? 'Gratuit' : `${event.price}€`}
                                                </span>
                                                {event.isPrivate && (
                                                    <span className="px-3 py-1 rounded-lg text-xs font-bold shadow-md backdrop-blur-sm bg-rose-500 bg-opacity-90 text-white flex items-center gap-1">
                                                        <Lock className="h-3 w-3" />
                                                        Privé
                                                    </span>
                                                )}
                                                {event.status === 'cancelled' && (
                                                    <span className="px-3 py-1 rounded-lg text-xs font-bold shadow-md backdrop-blur-sm bg-red-600 bg-opacity-90 text-white flex items-center gap-1">
                                                        <XCircle className="h-3 w-3" />
                                                        Annulé
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-48 bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center relative">
                                            <Calendar className="h-16 w-16 text-sky-300" />
                                            <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                                                <span
                                                    className={`px-3 py-1 rounded-lg text-xs font-bold shadow-md ${event.type === 'free'
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-blue-500 text-white'
                                                        }`}
                                                >
                                                    {event.type === 'free' ? 'Gratuit' : `${event.price}€`}
                                                </span>
                                                {event.isPrivate && (
                                                    <span className="px-3 py-1 rounded-lg text-xs font-bold shadow-md bg-rose-500 text-white flex items-center gap-1">
                                                        <Lock className="h-3 w-3" />
                                                        Privé
                                                    </span>
                                                )}
                                                {event.status === 'cancelled' && (
                                                    <span className="px-3 py-1 rounded-lg text-xs font-bold shadow-md bg-red-600 text-white flex items-center gap-1">
                                                        <XCircle className="h-3 w-3" />
                                                        Annulé
                                                    </span>
                                                )}
                                            </div>
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
                                                <span className="font-medium">{format(event.date, 'EEEE d MMMM yyyy', { locale: fr })}</span>
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
                                    </div>
                                </Link>

                                {/* Nombre d'inscrits + bouton supprimer pour mes événements */}
                                {activeTab === 'mine' && (
                                    <div className="px-5 pb-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 font-medium">Inscrits</span>
                                            <span className="font-bold text-purple-600">{event.currentAttendees}{event.maxAttendees ? `/${event.maxAttendees}` : ''}</span>
                                        </div>
                                        {event.maxAttendees && event.maxAttendees > 0 && (
                                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
                                                <div
                                                    className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all"
                                                    style={{ width: `${Math.min((event.currentAttendees / event.maxAttendees) * 100, 100)}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Indicateur événement passé pour les inscriptions */}
                                {activeTab === 'registered' && new Date(event.date) <= new Date() && (
                                    <div className="px-5 pb-2">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                                            <Clock className="h-3.5 w-3.5" />
                                            Événement terminé
                                        </span>
                                    </div>
                                )}

                                {/* Bouton facture pour les inscriptions payantes (disponible 2 mois) */}
                                {activeTab === 'registered' && event.type === 'paid' && event.price && (() => {
                                    const regId = sessionStorage.getItem(`registration_${event.id}`);
                                    const regDate = sessionStorage.getItem(`registration_date_${event.id}`);
                                    const twoMonthsAgo = new Date();
                                    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
                                    const isExpired = regDate && new Date(regDate) < twoMonthsAgo;
                                    if (!regId) return null;
                                    if (isExpired) {
                                        return (
                                            <div className="px-5 pb-5">
                                                <div className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-400 px-4 py-3 rounded-xl text-sm font-medium cursor-not-allowed">
                                                    <FileText className="h-4 w-4" />
                                                    Facture expirée (2 mois)
                                                </div>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="px-5 pb-5">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); window.open(`/api/registrations/${regId}/invoice`, '_blank'); }}
                                                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-3 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all font-bold shadow-md hover:shadow-lg text-sm"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Télécharger la facture
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
