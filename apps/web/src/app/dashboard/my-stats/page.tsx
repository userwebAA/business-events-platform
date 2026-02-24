'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Eye, MapPin, Users, Clock } from 'lucide-react';
import { Event } from 'shared';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

export default function MyStatsPage() {
    const { user } = useAuth();
    const [registeredEvents, setRegisteredEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRegisteredEvents();
    }, []);

    const fetchRegisteredEvents = async () => {
        setLoading(true);
        try {
            const registeredIds = JSON.parse(sessionStorage.getItem('registeredEvents') || '[]');
            if (registeredIds.length > 0) {
                const eventsPromises = registeredIds.map((id: string) =>
                    fetch(`/api/events/${id}`).then(res => res.json())
                );
                const eventsData = await Promise.all(eventsPromises);
                setRegisteredEvents(eventsData.map((e: any) => ({ ...e, date: new Date(e.date) })));
            }
        } catch (error) {
            console.error('Error fetching registered events:', error);
        } finally {
            setLoading(false);
        }
    };

    // Statistiques personnelles
    const now = new Date();
    const totalRegistrations = registeredEvents.length;
    const upcomingEvents = registeredEvents.filter(e => new Date(e.date) > now).length;
    const pastEvents = registeredEvents.filter(e => new Date(e.date) <= now).length;
    const freeEvents = registeredEvents.filter(e => e.type === 'free').length;
    const paidEvents = registeredEvents.filter(e => e.type === 'paid').length;

    // Événements par ville
    const eventsByCity = registeredEvents.reduce((acc, event) => {
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
                        <h1 className="text-3xl font-bold text-gray-900">Mes Statistiques</h1>
                        <p className="text-gray-600 mt-1">Suivez vos inscriptions et participations</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                    </div>
                ) : (
                    <>
                        {/* Statistiques personnelles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <Eye className="h-8 w-8 opacity-80" />
                                </div>
                                <p className="text-sm opacity-90">Mes Inscriptions</p>
                                <p className="text-4xl font-bold mt-2">{totalRegistrations}</p>
                                <p className="text-xs opacity-75 mt-2">
                                    Événements suivis
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <Clock className="h-8 w-8 opacity-80" />
                                </div>
                                <p className="text-sm opacity-90">À venir</p>
                                <p className="text-4xl font-bold mt-2">{upcomingEvents}</p>
                                <p className="text-xs opacity-75 mt-2">
                                    Événements futurs
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <Calendar className="h-8 w-8 opacity-80" />
                                </div>
                                <p className="text-sm opacity-90">Passés</p>
                                <p className="text-4xl font-bold mt-2">{pastEvents}</p>
                                <p className="text-xs opacity-75 mt-2">
                                    Événements terminés
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <Users className="h-8 w-8 opacity-80" />
                                </div>
                                <p className="text-sm opacity-90">Événements payants</p>
                                <p className="text-4xl font-bold mt-2">{paidEvents}</p>
                                <p className="text-xs opacity-75 mt-2">
                                    Sur {totalRegistrations} total
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Répartition Gratuit/Payant */}
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Mes inscriptions par type</h2>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Événements gratuits</span>
                                            <span className="text-sm font-bold text-green-600">{freeEvents}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-green-500 h-3 rounded-full transition-all"
                                                style={{ width: `${totalRegistrations > 0 ? (freeEvents / totalRegistrations) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {totalRegistrations > 0 ? Math.round((freeEvents / totalRegistrations) * 100) : 0}% du total
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
                                                style={{ width: `${totalRegistrations > 0 ? (paidEvents / totalRegistrations) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {totalRegistrations > 0 ? Math.round((paidEvents / totalRegistrations) * 100) : 0}% du total
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Villes visitées */}
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Mes villes favorites</h2>
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
                                                        style={{ width: `${(count / totalRegistrations) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 text-center py-4">Aucune inscription pour le moment</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Liste des événements inscrits */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Mes événements</h2>
                            {registeredEvents.length > 0 ? (
                                <div className="space-y-4">
                                    {registeredEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-sky-300 hover:bg-sky-50 transition-all"
                                        >
                                            {event.imageUrl && (
                                                <img
                                                    src={event.imageUrl}
                                                    alt={event.title}
                                                    className="w-20 h-20 object-cover rounded-lg"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-bold text-gray-900">{event.title}</h3>
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                            event.type === 'free'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-blue-100 text-blue-800'
                                                        }`}
                                                    >
                                                        {event.type === 'free' ? 'Gratuit' : `${event.price}€`}
                                                    </span>
                                                    {new Date(event.date) > now && (
                                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                                                            À venir
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        {new Date(event.date).toLocaleDateString('fr-FR')}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-4 w-4" />
                                                        {event.location}
                                                    </div>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/events/${event.id}`}
                                                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium text-sm"
                                            >
                                                Voir
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune inscription</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Inscrivez-vous à des événements pour voir vos statistiques.
                                    </p>
                                    <Link
                                        href="/events"
                                        className="mt-4 inline-flex items-center px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium"
                                    >
                                        Découvrir les événements
                                    </Link>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
