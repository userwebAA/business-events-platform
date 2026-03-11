'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Calendar, Euro, Eye, MapPin, BarChart3, TrendingUp, Clock, ArrowRight, Trophy } from 'lucide-react';
import { Event } from 'shared';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [registeredEvents, setRegisteredEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [revenueData, setRevenueData] = useState({ totalRevenue: 0, paidEvents: 0 });

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const eventsResponse = await fetch('/api/events');
                const eventsData = await eventsResponse.json();
                setEvents(eventsData.map((e: any) => ({ ...e, date: new Date(e.date) })));

                const registeredIds = JSON.parse(sessionStorage.getItem('registeredEvents') || '[]');
                if (registeredIds.length > 0) {
                    const eventsPromises = registeredIds.map((id: string) =>
                        fetch(`/api/events/${id}`).then(res => res.ok ? res.json() : null)
                    );
                    const regEventsData = (await Promise.all(eventsPromises)).filter(Boolean);
                    setRegisteredEvents(regEventsData.map((e: any) => ({ ...e, date: new Date(e.date) })));
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (isAdmin && events.length > 0) {
            const fetchRevenueData = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch('/api/stats/revenue', {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setRevenueData({ totalRevenue: data.totalRevenue, paidEvents: data.paidEvents });
                    }
                } catch (error) {
                    console.error('Error fetching revenue:', error);
                }
            };
            fetchRevenueData();
        }
    }, [isAdmin, events]);

    const now = new Date();
    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => new Date(e.date) > now).length;
    const pastEventsCount = events.filter(e => new Date(e.date) <= now).length;
    const totalParticipants = events.reduce((sum, e) => sum + e.currentAttendees, 0);
    const averageParticipants = totalEvents > 0 ? Math.round(totalParticipants / totalEvents) : 0;
    const freeEvents = events.filter(e => e.type === 'free').length;
    const paidEventsCount = events.filter(e => e.type === 'paid').length;
    const freePercent = totalEvents > 0 ? Math.round((freeEvents / totalEvents) * 100) : 0;
    const paidPercent = totalEvents > 0 ? Math.round((paidEventsCount / totalEvents) * 100) : 0;

    const topEvents = [...events]
        .sort((a, b) => b.currentAttendees - a.currentAttendees)
        .slice(0, 5);

    const eventsByCity = events.reduce((acc, event) => {
        const city = event.location;
        acc[city] = (acc[city] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topCities = Object.entries(eventsByCity)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
    const maxCityCount = topCities.length > 0 ? topCities[0][1] : 1;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-400 hover:text-sky-600 transition-colors mb-5 group">
                        <ArrowLeft className="h-4 w-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
                        Tableau de bord
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-sky-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Statistiques</h1>
                            <p className="text-gray-400 text-sm mt-0.5">Performances de la plateforme</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="w-12 h-12 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin"></div>
                        <p className="text-gray-400 mt-4 text-sm">Chargement...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Stats row */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                            {[
                                { label: 'Événements', value: totalEvents, icon: Calendar, color: 'sky', sub: `${upcomingEvents} à venir` },
                                { label: 'Participants', value: totalParticipants, icon: Users, color: 'emerald', sub: `~${averageParticipants}/évnt` },
                                { label: 'Revenus', value: `${revenueData.totalRevenue.toFixed(0)}€`, icon: Euro, color: 'amber', sub: `${revenueData.paidEvents} payants` },
                                { label: 'À venir', value: upcomingEvents, icon: Clock, color: 'violet', sub: '' },
                                { label: 'Terminés', value: pastEventsCount, icon: Eye, color: 'gray', sub: '' },
                                { label: 'Inscriptions', value: registeredEvents.length, icon: TrendingUp, color: 'rose', sub: 'perso' },
                            ].map((stat) => {
                                const colorMap: Record<string, string> = {
                                    sky: 'bg-sky-50 text-sky-600',
                                    emerald: 'bg-emerald-50 text-emerald-600',
                                    amber: 'bg-amber-50 text-amber-600',
                                    violet: 'bg-violet-50 text-violet-600',
                                    gray: 'bg-gray-100 text-gray-500',
                                    rose: 'bg-rose-50 text-rose-600',
                                };
                                const Icon = stat.icon;
                                return (
                                    <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
                                        <div className="flex items-center gap-2.5 mb-3">
                                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ${colorMap[stat.color]}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <p className="text-[11px] sm:text-xs text-gray-400 font-medium leading-tight">{stat.label}</p>
                                        </div>
                                        <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">{stat.value}</p>
                                        {stat.sub && <p className="text-[10px] sm:text-xs text-gray-300 mt-1">{stat.sub}</p>}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Répartition + Villes */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* Répartition */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-5">Répartition des événements</h2>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden flex">
                                        {freePercent > 0 && (
                                            <div className="bg-emerald-400 h-full transition-all" style={{ width: `${freePercent}%`, borderRadius: paidPercent > 0 ? '9999px 0 0 9999px' : '9999px' }} />
                                        )}
                                        {paidPercent > 0 && (
                                            <div className="bg-sky-400 h-full transition-all" style={{ width: `${paidPercent}%`, borderRadius: freePercent > 0 ? '0 9999px 9999px 0' : '9999px' }} />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                                            <span className="text-sm font-medium text-gray-700">Gratuits</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-gray-900">{freeEvents}</span>
                                            <span className="text-xs text-gray-400">({freePercent}%)</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-sky-50/50 rounded-xl">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-sky-400"></div>
                                            <span className="text-sm font-medium text-gray-700">Payants</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-gray-900">{paidEventsCount}</span>
                                            <span className="text-xs text-gray-400">({paidPercent}%)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Villes */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-5">Top villes</h2>
                                {topCities.length > 0 ? (
                                    <div className="space-y-3">
                                        {topCities.map(([city, count], index) => (
                                            <div key={city} className="flex items-center gap-3">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-sm font-medium text-gray-700 truncate">{city}</span>
                                                        <span className="text-xs font-bold text-gray-900 ml-2 shrink-0">{count} évnt{count > 1 ? 's' : ''}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                        <div className="bg-sky-400 h-1.5 rounded-full transition-all" style={{ width: `${(count / maxCityCount) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <MapPin className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                                        <p className="text-sm text-gray-400">Aucune donnée</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top événements */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <Trophy className="h-4 w-4 text-amber-500" />
                                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Top événements</h2>
                            </div>
                            {topEvents.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {topEvents.map((event, index) => {
                                        const isPast = new Date(event.date) <= now;
                                        const maxAttendees = topEvents[0].currentAttendees || 1;
                                        return (
                                            <Link
                                                key={event.id}
                                                href={`/events/${event.id}`}
                                                className="flex items-center gap-3 sm:gap-4 py-3 sm:py-4 first:pt-0 last:pb-0 group hover:bg-gray-50 -mx-2 px-2 rounded-xl transition-colors"
                                            >
                                                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${index === 0 ? 'bg-amber-100 text-amber-700' :
                                                    index === 1 ? 'bg-gray-200 text-gray-600' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-gray-100 text-gray-400'
                                                    }`}>
                                                    #{index + 1}
                                                </div>

                                                {event.imageUrl ? (
                                                    <img src={event.imageUrl} alt="" className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover shrink-0 ${isPast ? 'opacity-50 grayscale' : ''}`} />
                                                ) : (
                                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${isPast ? 'bg-gray-100' : 'bg-sky-50'}`}>
                                                        <Calendar className={`h-5 w-5 ${isPast ? 'text-gray-300' : 'text-sky-400'}`} />
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-semibold text-gray-900 truncate">{event.title}</h3>
                                                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                                                        <span>{format(new Date(event.date), 'd MMM yyyy', { locale: fr })}</span>
                                                        <span className="truncate">{event.location}</span>
                                                    </div>
                                                    <div className="mt-1.5 w-full bg-gray-100 rounded-full h-1">
                                                        <div className="bg-sky-400 h-1 rounded-full transition-all" style={{ width: `${(event.currentAttendees / maxAttendees) * 100}%` }} />
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <div className="flex items-center gap-1.5 text-sky-600">
                                                        <Users className="h-4 w-4" />
                                                        <span className="text-lg sm:text-xl font-bold">{event.currentAttendees}</span>
                                                    </div>
                                                </div>

                                                <ArrowRight className="h-4 w-4 text-gray-200 group-hover:text-sky-400 transition-colors shrink-0 hidden sm:block" />
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Calendar className="mx-auto h-8 w-8 text-gray-200" />
                                    <p className="mt-2 text-sm text-gray-400">Aucun événement</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
