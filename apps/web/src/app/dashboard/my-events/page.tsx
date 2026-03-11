'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Users, Eye, Plus, Lock, Copy, Check, ExternalLink, Clock, Euro, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Event } from 'shared';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Navbar from '@/components/Navbar';

export default function MyEventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [showAllPast, setShowAllPast] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const token = sessionStorage.getItem('token');
                if (!token) return;
                const response = await fetch('/api/events/my-events', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setEvents(data.map((e: any) => ({ ...e, date: new Date(e.date) })));
                }
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);


    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.date) > now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const pastEvents = events.filter(e => new Date(e.date) <= now).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const displayedPast = showAllPast ? pastEvents : pastEvents.slice(0, 6);
    const displayedEvents = tab === 'upcoming' ? upcomingEvents : displayedPast;

    const totalParticipants = events.reduce((sum, e) => sum + (e.currentAttendees || 0), 0);
    const totalRevenue = events.filter(e => e.type === 'paid' && e.price).reduce((sum, e) => sum + ((e.price || 0) * (e.currentAttendees || 0)), 0);

    const copyPrivateLink = (token: string) => {
        const link = `${window.location.origin}/events/private/${token}`;
        navigator.clipboard.writeText(link);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-sky-600 transition-colors mb-4">
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Retour au tableau de bord
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mes Événements</h1>
                            <p className="text-gray-500 mt-1">Gérez tous vos événements créés</p>
                        </div>
                        <Link href="/events/create" className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base">
                            <Plus className="h-5 w-5" />
                            Créer un événement
                        </Link>
                    </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center shrink-0">
                                <Calendar className="h-5 w-5 text-sky-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{events.length}</p>
                                <p className="text-xs sm:text-sm text-gray-500 font-medium">Total</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                                <Clock className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{upcomingEvents.length}</p>
                                <p className="text-xs sm:text-sm text-gray-500 font-medium">À venir</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                                <Users className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalParticipants}</p>
                                <p className="text-xs sm:text-sm text-gray-500 font-medium">Participants</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                                <Euro className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalRevenue}€</p>
                                <p className="text-xs sm:text-sm text-gray-500 font-medium">Revenus brut</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 mb-6 grid grid-cols-2 gap-1.5">
                    <button
                        onClick={() => setTab('upcoming')}
                        className={`px-4 py-3 rounded-xl font-semibold transition-all text-sm ${tab === 'upcoming'
                            ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>À venir</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-700'}`}>
                                {upcomingEvents.length}
                            </span>
                        </div>
                    </button>
                    <button
                        onClick={() => setTab('past')}
                        className={`px-4 py-3 rounded-xl font-semibold transition-all text-sm ${tab === 'past'
                            ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Passés</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tab === 'past' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                {pastEvents.length}
                            </span>
                        </div>
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                        <p className="text-gray-500 mt-4">Chargement...</p>
                    </div>
                ) : displayedEvents.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 ${tab === 'upcoming' ? 'bg-sky-100' : 'bg-gray-100'}`}>
                            <Calendar className={`h-10 w-10 ${tab === 'upcoming' ? 'text-sky-400' : 'text-gray-400'}`} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {tab === 'upcoming' ? 'Aucun événement à venir' : 'Aucun événement passé'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {tab === 'upcoming' ? 'Créez votre premier événement !' : 'Vos événements passés apparaîtront ici.'}
                        </p>
                        {tab === 'upcoming' && (
                            <Link href="/events/create" className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg">
                                <Plus className="h-4 w-4" />
                                Créer un événement
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {displayedEvents.map((event) => {
                                const isPast = new Date(event.date) <= now;
                                const isCancelled = event.status === 'cancelled';
                                return (
                                    <div
                                        key={event.id}
                                        className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-200 ${isPast ? 'border-gray-200 opacity-80' : 'border-gray-100 hover:shadow-xl hover:border-sky-200 hover:-translate-y-1'}`}
                                    >
                                        {/* Image */}
                                        <Link href={event.isPrivate && event.accessToken ? `/events/private/${event.accessToken}` : `/events/${event.id}`}>
                                            {event.imageUrl ? (
                                                <div className="h-40 sm:h-44 bg-gray-200 overflow-hidden relative">
                                                    <img src={event.imageUrl} alt={event.title} className={`w-full h-full object-cover ${isPast ? 'grayscale' : ''}`} />
                                                    <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-md backdrop-blur-sm ${event.type === 'free' ? 'bg-emerald-500/90 text-white' : 'bg-blue-500/90 text-white'}`}>
                                                            {event.type === 'free' ? 'Gratuit' : `${event.price}€`}
                                                        </span>
                                                        {event.isPrivate && (
                                                            <span className="px-3 py-1 rounded-lg text-xs font-bold shadow-md backdrop-blur-sm bg-rose-500/90 text-white flex items-center gap-1">
                                                                <Lock className="h-3 w-3" /> Privé
                                                            </span>
                                                        )}
                                                        {isCancelled && (
                                                            <span className="px-3 py-1 rounded-lg text-xs font-bold shadow-md backdrop-blur-sm bg-red-600/90 text-white flex items-center gap-1">
                                                                <XCircle className="h-3 w-3" /> Annulé
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isPast && (
                                                        <div className="absolute top-3 right-3">
                                                            <span className="px-3 py-1 rounded-lg text-xs font-bold shadow-md backdrop-blur-sm bg-gray-800/80 text-white">Terminé</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className={`h-40 sm:h-44 flex items-center justify-center relative ${isPast ? 'bg-gray-100' : 'bg-gradient-to-br from-sky-100 to-blue-100'}`}>
                                                    <Calendar className={`h-16 w-16 ${isPast ? 'text-gray-300' : 'text-sky-300'}`} />
                                                    <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-md ${event.type === 'free' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                                                            {event.type === 'free' ? 'Gratuit' : `${event.price}€`}
                                                        </span>
                                                        {event.isPrivate && (
                                                            <span className="px-3 py-1 rounded-lg text-xs font-bold shadow-md bg-rose-500 text-white flex items-center gap-1">
                                                                <Lock className="h-3 w-3" /> Privé
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isPast && (
                                                        <div className="absolute top-3 right-3">
                                                            <span className="px-3 py-1 rounded-lg text-xs font-bold shadow-md bg-gray-800/80 text-white">Terminé</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Link>

                                        {/* Content */}
                                        <div className="p-4 sm:p-5">
                                            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-1">{event.title}</h3>
                                            <p className="text-gray-500 text-sm mb-3 line-clamp-2 leading-relaxed">{event.description}</p>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                                                    <div className="w-7 h-7 bg-sky-50 rounded-lg flex items-center justify-center shrink-0">
                                                        <Clock className="h-3.5 w-3.5 text-sky-500" />
                                                    </div>
                                                    <span className="font-medium text-xs sm:text-sm">{format(new Date(event.date), 'EEEE d MMM yyyy · HH:mm', { locale: fr })}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                                                    <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                                                        <MapPin className="h-3.5 w-3.5 text-purple-500" />
                                                    </div>
                                                    <span className="font-medium text-xs sm:text-sm truncate">{event.location}</span>
                                                </div>
                                            </div>

                                            {/* Participants bar */}
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <div className="flex items-center justify-between text-sm mb-1.5">
                                                    <span className="text-gray-500 font-medium text-xs">Participants</span>
                                                    <span className="font-bold text-sky-600 text-xs">{event.currentAttendees}{event.maxAttendees ? ` / ${event.maxAttendees}` : ''}</span>
                                                </div>
                                                {event.maxAttendees && event.maxAttendees > 0 && (
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                        <div
                                                            className={`h-1.5 rounded-full transition-all ${isPast ? 'bg-gray-400' : 'bg-gradient-to-r from-sky-500 to-blue-600'}`}
                                                            style={{ width: `${Math.min((event.currentAttendees / event.maxAttendees) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                                                {event.isPrivate && event.accessToken ? (
                                                    <a href={`/events/private/${event.accessToken}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-50 text-sky-600 rounded-xl text-xs sm:text-sm font-semibold hover:bg-sky-100 transition-all">
                                                        <ExternalLink className="h-3.5 w-3.5" /> Voir
                                                    </a>
                                                ) : (
                                                    <Link href={`/events/${event.id}`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-50 text-sky-600 rounded-xl text-xs sm:text-sm font-semibold hover:bg-sky-100 transition-all">
                                                        <Eye className="h-3.5 w-3.5" /> Voir
                                                    </Link>
                                                )}
                                                {event.isPrivate && event.accessToken && (
                                                    <button
                                                        onClick={() => copyPrivateLink(event.accessToken!)}
                                                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-600 rounded-xl text-xs sm:text-sm font-semibold hover:bg-purple-100 transition-all"
                                                        title="Copier le lien privé"
                                                    >
                                                        {copiedToken === event.accessToken ? <><Check className="h-3.5 w-3.5" /> Copié</> : <><Copy className="h-3.5 w-3.5" /> Lien</>}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Show more button for past events */}
                        {tab === 'past' && pastEvents.length > 6 && (
                            <div className="text-center mt-6">
                                <button
                                    onClick={() => setShowAllPast(!showAllPast)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm"
                                >
                                    {showAllPast ? (
                                        <><ChevronUp className="h-4 w-4" /> Voir moins</>
                                    ) : (
                                        <><ChevronDown className="h-4 w-4" /> Voir les {pastEvents.length - 6} autres</>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}
