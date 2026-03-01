'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Eye, MapPin, Users, Clock, Euro, ArrowRight, BarChart3, TrendingUp } from 'lucide-react';
import { Event } from 'shared';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

export default function MyStatsPage() {
    const { user } = useAuth();
    const [registeredEvents, setRegisteredEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRegisteredEvents = async () => {
            setLoading(true);
            try {
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
            } finally {
                setLoading(false);
            }
        };
        fetchRegisteredEvents();
    }, []);

    const now = new Date();
    const totalRegistrations = registeredEvents.length;
    const upcomingEventsCount = registeredEvents.filter(e => new Date(e.date) > now).length;
    const pastEventsCount = registeredEvents.filter(e => new Date(e.date) <= now).length;
    const freeEvents = registeredEvents.filter(e => e.type === 'free').length;
    const paidEvents = registeredEvents.filter(e => e.type === 'paid').length;
    const totalSpent = registeredEvents.filter(e => e.type === 'paid' && e.price).reduce((sum, e) => sum + (e.price || 0), 0);
    const freePercent = totalRegistrations > 0 ? Math.round((freeEvents / totalRegistrations) * 100) : 0;
    const paidPercent = totalRegistrations > 0 ? Math.round((paidEvents / totalRegistrations) * 100) : 0;

    const eventsByCity = registeredEvents.reduce((acc, event) => {
        const city = event.location;
        acc[city] = (acc[city] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topCities = Object.entries(eventsByCity)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
    const maxCityCount = topCities.length > 0 ? topCities[0][1] : 1;

    const sortedEvents = [...registeredEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-sky-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mes Statistiques</h1>
                            <p className="text-gray-400 text-sm mt-0.5">Vue d&apos;ensemble de vos participations</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="w-12 h-12 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin"></div>
                        <p className="text-gray-400 mt-4 text-sm">Chargement de vos statistiques...</p>
                    </div>
                ) : totalRegistrations === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 text-center py-16 px-6">
                        <div className="w-20 h-20 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <TrendingUp className="h-10 w-10 text-sky-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Pas encore de statistiques</h3>
                        <p className="text-gray-400 mb-6 max-w-sm mx-auto">Inscrivez-vous à des événements pour commencer à suivre vos participations.</p>
                        <Link href="/events" className="inline-flex items-center gap-2 bg-sky-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-sky-600 transition-all">
                            Explorer les événements
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Stat numbers row */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                            {[
                                { label: 'Inscriptions', value: totalRegistrations, icon: Eye, color: 'sky' },
                                { label: 'À venir', value: upcomingEventsCount, icon: Clock, color: 'emerald' },
                                { label: 'Terminés', value: pastEventsCount, icon: Calendar, color: 'gray' },
                                { label: 'Payants', value: paidEvents, icon: Users, color: 'violet' },
                                { label: 'Dépensé', value: `${totalSpent}€`, icon: Euro, color: 'amber' },
                            ].map((stat) => {
                                const colorMap: Record<string, string> = {
                                    sky: 'bg-sky-50 text-sky-600',
                                    emerald: 'bg-emerald-50 text-emerald-600',
                                    gray: 'bg-gray-100 text-gray-500',
                                    violet: 'bg-violet-50 text-violet-600',
                                    amber: 'bg-amber-50 text-amber-600',
                                };
                                const Icon = stat.icon;
                                return (
                                    <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${colorMap[stat.color]}`}>
                                                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">{stat.value}</p>
                                                <p className="text-[11px] sm:text-xs text-gray-400 font-medium mt-1">{stat.label}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Two columns : type repartition + cities */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* Type */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-5">Répartition par type</h2>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden flex">
                                        {freePercent > 0 && (
                                            <div className="bg-emerald-400 h-full rounded-l-full transition-all" style={{ width: `${freePercent}%` }} />
                                        )}
                                        {paidPercent > 0 && (
                                            <div className="bg-sky-400 h-full rounded-r-full transition-all" style={{ width: `${paidPercent}%` }} />
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
                                            <span className="text-sm font-bold text-gray-900">{paidEvents}</span>
                                            <span className="text-xs text-gray-400">({paidPercent}%)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cities */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-5">Lieux les plus visités</h2>
                                {topCities.length > 0 ? (
                                    <div className="space-y-3">
                                        {topCities.map(([city, count], index) => (
                                            <div key={city} className="flex items-center gap-3 group">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-sm font-medium text-gray-700 truncate">{city}</span>
                                                        <span className="text-xs font-bold text-gray-900 ml-2 shrink-0">{count} {count > 1 ? 'fois' : 'fois'}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                        <div
                                                            className="bg-sky-400 h-1.5 rounded-full transition-all"
                                                            style={{ width: `${(count / maxCityCount) * 100}%` }}
                                                        />
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

                        {/* Recent events list */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Événements récents</h2>
                                <Link href="/events" className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1 transition-colors">
                                    Tout voir <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>

                            <div className="divide-y divide-gray-50">
                                {sortedEvents.slice(0, 6).map((event) => {
                                    const isPast = new Date(event.date) <= now;
                                    return (
                                        <Link
                                            key={event.id}
                                            href={`/events/${event.id}`}
                                            className="flex items-center gap-3 sm:gap-4 py-3 sm:py-4 first:pt-0 last:pb-0 group transition-colors hover:bg-gray-50 -mx-2 px-2 rounded-xl"
                                        >
                                            {event.imageUrl ? (
                                                <img src={event.imageUrl} alt="" className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover shrink-0 ${isPast ? 'opacity-50 grayscale' : ''}`} />
                                            ) : (
                                                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${isPast ? 'bg-gray-100' : 'bg-sky-50'}`}>
                                                    <Calendar className={`h-5 w-5 ${isPast ? 'text-gray-300' : 'text-sky-400'}`} />
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h3 className={`text-sm font-semibold truncate ${isPast ? 'text-gray-400' : 'text-gray-900'}`}>{event.title}</h3>
                                                    {isPast ? (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-400 shrink-0">Passé</span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 shrink-0">À venir</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                                    <span>{format(new Date(event.date), 'd MMM yyyy', { locale: fr })}</span>
                                                    <span className="truncate">{event.location}</span>
                                                </div>
                                            </div>

                                            <div className="shrink-0 hidden sm:flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${event.type === 'free' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>
                                                    {event.type === 'free' ? 'Gratuit' : `${event.price}€`}
                                                </span>
                                                <ArrowRight className="h-4 w-4 text-gray-200 group-hover:text-sky-400 transition-colors" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
