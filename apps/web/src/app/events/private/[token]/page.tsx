'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, Users, Euro, Lock } from 'lucide-react';

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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement de l'événement privé...</p>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center px-4">
                    <Lock className="mx-auto h-16 w-16 text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Accès refusé
                    </h1>
                    <p className="text-gray-600 mb-6">
                        {error || 'Cet événement privé est introuvable ou le lien est invalide.'}
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Retour à l'accueil
                    </button>
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
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="relative h-64 sm:h-80">
                        <img
                            src={event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            <span className="font-semibold">Événement Privé</span>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                            {event.title}
                        </h1>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900">{formattedDate}</p>
                                    <p className="text-gray-600">{formattedTime}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900">{event.location}</p>
                                    <p className="text-gray-600">{event.address}</p>
                                </div>
                            </div>

                            {event.maxAttendees && (
                                <div className="flex items-start gap-3">
                                    <Users className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {event.currentAttendees} / {event.maxAttendees} participants
                                        </p>
                                        {spotsLeft !== null && spotsLeft > 0 && (
                                            <p className="text-gray-600">
                                                {spotsLeft} place{spotsLeft > 1 ? 's' : ''} restante{spotsLeft > 1 ? 's' : ''}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {event.type === 'paid' && event.price && (
                                <div className="flex items-start gap-3">
                                    <Euro className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {event.price} {event.currency}
                                        </p>
                                        <p className="text-gray-600">Par personne</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t pt-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">
                                Description
                            </h2>
                            <p className="text-gray-700 whitespace-pre-wrap">
                                {event.description}
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-blue-900 mb-1">
                                        Événement sur invitation
                                    </p>
                                    <p className="text-blue-700 text-sm">
                                        Cet événement est privé et accessible uniquement via ce lien d'invitation.
                                        Ne le partagez qu'avec les personnes autorisées.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleRegister}
                            disabled={isFull}
                            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${isFull
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
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
