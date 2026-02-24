'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Users, Calendar, Euro, Eye, MapPin, Clock } from 'lucide-react';
import { Event } from 'shared';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [registeredEvents, setRegisteredEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    // Vérifier si l'utilisateur est admin ou super_admin
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Récupérer tous les événements
            const eventsResponse = await fetch('/api/events');
            const eventsData = await eventsResponse.json();
            setEvents(eventsData.map((e: any) => ({ ...e, date: new Date(e.date) })));

            // Récupérer les inscriptions
            const registeredIds = JSON.parse(sessionStorage.getItem('registeredEvents') || '[]');
            if (registeredIds.length > 0) {
                const eventsPromises = registeredIds.map((id: string) =>
                    fetch(`/api/events/${id}`).then(res => res.json())
                );
                const regEventsData = await Promise.all(eventsPromises);
                setRegisteredEvents(regEventsData.map((e: any) => ({ ...e, date: new Date(e.date) })));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const [revenueData, setRevenueData] = useState({ totalRevenue: 0, paidEvents: 0 });

    // Calculs des statistiques
    const now = new Date();
    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => new Date(e.date) > now).length;
    const pastEvents = events.filter(e => new Date(e.date) <= now).length;
    const totalParticipants = events.reduce((sum, e) => sum + e.currentAttendees, 0);
    const averageParticipants = totalEvents > 0 ? Math.round(totalParticipants / totalEvents) : 0;
    const freeEvents = events.filter(e => e.type === 'free').length;
    const paidEvents = events.filter(e => e.type === 'paid').length;

    useEffect(() => {
        if (isAdmin && events.length > 0) {
            fetchRevenueData();
        }
    }, [isAdmin, events]);

    const fetchRevenueData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/stats/revenue', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setRevenueData({
                    totalRevenue: data.totalRevenue,
                    paidEvents: data.paidEvents,
                });
            }
        } catch (error) {
            console.error('Error fetching revenue:', error);
        }
    };

    // Top événements par participants
    const topEvents = [...events]
        .sort((a, b) => b.currentAttendees - a.currentAttendees)
        .slice(0, 5);

    // Événements par ville
    const eventsByCity = events.reduce((acc, event) => {
        const city = event.location;
        acc[city] = (acc[city] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topCities = Object.entries(eventsByCity)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/dashboard" className="inline-flex items-center text-sky-600 hover:text-sky-700 mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour au tableau de bord
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
                        <p className="text-gray-600 mt-1">Analysez les performances de vos événements</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                    </div>
                ) : (
                    <>
                        {/* Statistiques principales */}
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
                            <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <Calendar className="h-8 w-8 opacity-80" />
                                    <TrendingUp className="h-5 w-5 opacity-60" />
                                </div>
                                <p className="text-sm opacity-90">Total Événements</p>
                                <p className="text-4xl font-bold mt-2">{totalEvents}</p>
                                <p className="text-xs opacity-75 mt-2">
                                    {upcomingEvents} à venir · {pastEvents} passés
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <Users className="h-8 w-8 opacity-80" />
                                    <TrendingUp className="h-5 w-5 opacity-60" />
                                </div>
                                <p className="text-sm opacity-90">Total Participants</p>
                                <p className="text-4xl font-bold mt-2">{totalParticipants}</p>
                                <p className="text-xs opacity-75 mt-2">
                                    Moyenne: {averageParticipants} par événement
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <Euro className="h-8 w-8 opacity-80" />
                                    <TrendingUp className="h-5 w-5 opacity-60" />
                                </div>
                                <p className="text-sm opacity-90">Revenus Totaux</p>
                                <p className="text-4xl font-bold mt-2">{revenueData.totalRevenue.toFixed(0)}€</p>
                                <p className="text-xs opacity-75 mt-2">
                                    {revenueData.paidEvents} événements payants
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <Eye className="h-8 w-8 opacity-80" />
                                    <TrendingUp className="h-5 w-5 opacity-60" />
                                </div>
                                <p className="text-sm opacity-90">Mes Inscriptions</p>
                                <p className="text-4xl font-bold mt-2">{registeredEvents.length}</p>
                                <p className="text-xs opacity-75 mt-2">
                                    Événements suivis
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Répartition Gratuit/Payant */}
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Répartition des événements</h2>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Événements gratuits</span>
                                            <span className="text-sm font-bold text-green-600">{freeEvents}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-green-500 h-3 rounded-full transition-all"
                                                style={{ width: `${totalEvents > 0 ? (freeEvents / totalEvents) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {totalEvents > 0 ? Math.round((freeEvents / totalEvents) * 100) : 0}% du total
                                        </p>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Événements payants</span>
                                            <span className="text-sm font-bold text-blue-600">{paidEvents}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-blue-500 h-3 rounded-full transition-all"
                                                style={{ width: `${totalEvents > 0 ? (paidEvents / totalEvents) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {totalEvents > 0 ? Math.round((paidEvents / totalEvents) * 100) : 0}% du total
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Top villes */}
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Top villes</h2>
                                <div className="space-y-4">
                                    {topCities.length > 0 ? (
                                        topCities.map(([city, count], index) => (
                                            <div key={city}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                                                        <MapPin className="h-4 w-4 text-sky-500" />
                                                        <span className="text-sm font-medium text-gray-700">{city}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-sky-600">{count}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-sky-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${(count / totalEvents) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 text-center py-4">Aucune donnée disponible</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Top événements */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Top événements par participants</h2>
                            {topEvents.length > 0 ? (
                                <div className="space-y-4">
                                    {topEvents.map((event, index) => (
                                        <div
                                            key={event.id}
                                            className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-sky-300 hover:bg-sky-50 transition-all"
                                        >
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                                    #{index + 1}
                                                </div>
                                            </div>
                                            {event.imageUrl && (
                                                <img
                                                    src={event.imageUrl}
                                                    alt={event.title}
                                                    className="w-16 h-16 object-cover rounded-lg"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900">{event.title}</h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-4 w-4" />
                                                        {event.location}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        {new Date(event.date).toLocaleDateString('fr-FR')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-2 text-sky-600">
                                                    <Users className="h-5 w-5" />
                                                    <span className="text-2xl font-bold">{event.currentAttendees}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">participants</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="mt-2 text-sm text-gray-500">Aucun événement disponible</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
