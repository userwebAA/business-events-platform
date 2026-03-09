'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, Users, Euro, Lock, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    endDate?: string;
    location: string;
    address: string;
    type: string;
    price?: number;
    currency: string;
    maxAttendees?: number;
    currentAttendees: number;
    imageUrl?: string;
    isPrivate: boolean;
    accessToken: string;
    registrationFields: any[];
}

export default function PrivateEventPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await fetch(`/api/events/private/${token}`);

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Événement introuvable');
                }

                const data = await response.json();
                setEvent(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchEvent();
        }
    }, [token]);

    const handleRegister = () => {
        if (event) {
            router.push(`/events/${event.id}/register?token=${token}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Chargement de l'événement privé...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <div className="text-center px-4">
                        <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Lock className="h-10 w-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Accès refusé
                        </h1>
                        <p className="text-gray-600 mb-6">
                            {error || 'Cet événement privé est introuvable ou le lien est invalide.'}
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour à l'accueil
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const formattedTime = eventDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const isFull = event.maxAttendees ? event.currentAttendees >= event.maxAttendees : false;
    const spotsLeft = event.maxAttendees ? event.maxAttendees - event.currentAttendees : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="relative h-64 sm:h-80">
                        <img
                            src={event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg">
                            <Lock className="h-4 w-4" />
                            <span className="font-bold">Événement Privé</span>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8">
                        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6">
                            {event.title}
                        </h1>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-100">
                                <div className="flex items-start gap-3">
                                    <div className="bg-sky-100 p-2 rounded-lg">
                                        <Calendar className="h-5 w-5 text-sky-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-sky-600 font-medium mb-1">Date & Heure</p>
                                        <p className="font-bold text-gray-900">{formattedDate}</p>
                                        <p className="text-gray-600 text-sm">{formattedTime}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                                <div className="flex items-start gap-3">
                                    <div className="bg-purple-100 p-2 rounded-lg">
                                        <MapPin className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-purple-600 font-medium mb-1">Lieu</p>
                                        <p className="font-bold text-gray-900">{event.location}</p>
                                        <p className="text-gray-600 text-sm">{event.address}</p>
                                    </div>
                                </div>
                            </div>

                            {event.maxAttendees && (
                                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-emerald-100 p-2 rounded-lg">
                                            <Users className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-emerald-600 font-medium mb-1">Participants</p>
                                            <p className="font-bold text-gray-900">
                                                {event.currentAttendees} / {event.maxAttendees}
                                            </p>
                                            {spotsLeft !== null && spotsLeft > 0 && (
                                                <p className="text-gray-600 text-sm">
                                                    {spotsLeft} place{spotsLeft > 1 ? 's' : ''} restante{spotsLeft > 1 ? 's' : ''}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {event.type === 'paid' && event.price && (
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-amber-100 p-2 rounded-lg">
                                            <Euro className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-amber-600 font-medium mb-1">Tarif</p>
                                            <p className="font-bold text-gray-900">
                                                {event.price} {event.currency}
                                            </p>
                                            <p className="text-gray-600 text-sm">Par personne</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Description
                            </h2>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {event.description}
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 rounded-xl p-5 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="bg-rose-100 p-2 rounded-lg">
                                    <Lock className="h-5 w-5 text-rose-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-rose-900 mb-2">
                                        Événement sur invitation
                                    </p>
                                    <p className="text-rose-700 text-sm">
                                        Cet événement est privé et accessible uniquement via ce lien d'invitation.
                                        Ne le partagez qu'avec les personnes autorisées.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleRegister}
                            disabled={isFull}
                            className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all shadow-lg ${isFull
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 hover:shadow-xl'
                                }`}
                        >
                            {isFull ? 'Événement complet' : 'S\'inscrire à cet événement'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
