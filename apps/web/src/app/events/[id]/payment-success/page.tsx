'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { CheckCircle, Calendar, MapPin, ArrowRight, Loader2 } from 'lucide-react';

export default function PaymentSuccessPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const eventId = params.id as string;
    const sessionId = searchParams.get('session_id');
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [registrationId, setRegistrationId] = useState<string | null>(null);

    useEffect(() => {
        // Marquer immédiatement comme inscrit dans sessionStorage
        const registeredIds = JSON.parse(sessionStorage.getItem('registeredEvents') || '[]');
        if (!registeredIds.includes(eventId)) {
            registeredIds.push(eventId);
            sessionStorage.setItem('registeredEvents', JSON.stringify(registeredIds));
        }
        fetchEvent();
        fetchRegistration();
    }, [eventId, sessionId]);

    const fetchEvent = async () => {
        try {
            const res = await fetch(`/api/events/${eventId}`);
            if (res.ok) {
                const data = await res.json();
                setEvent(data);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRegistration = async () => {
        if (!sessionId) return;
        // Petit délai pour laisser le webhook Stripe créer l'inscription
        const tryFetch = async (attempt: number) => {
            try {
                const res = await fetch(`/api/stripe/session-registration?session_id=${sessionId}`);
                if (res.ok) {
                    const data = await res.json();
                    setRegistrationId(data.registrationId);
                    // Sauvegarder dans sessionStorage pour la page événement
                    sessionStorage.setItem(`registration_${eventId}`, data.registrationId);
                    sessionStorage.setItem(`registration_date_${eventId}`, new Date().toISOString());
                    const registeredIds = JSON.parse(sessionStorage.getItem('registeredEvents') || '[]');
                    if (!registeredIds.includes(eventId)) {
                        registeredIds.push(eventId);
                        sessionStorage.setItem('registeredEvents', JSON.stringify(registeredIds));
                    }
                } else if (attempt < 5) {
                    // Webhook peut ne pas encore avoir été traité, réessayer
                    setTimeout(() => tryFetch(attempt + 1), 2000);
                }
            } catch (error) {
                if (attempt < 5) setTimeout(() => tryFetch(attempt + 1), 2000);
            }
        };
        tryFetch(1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="h-10 w-10 text-sky-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50">
            <Navbar />

            <div className="max-w-lg mx-auto px-4 py-16">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <CheckCircle className="h-10 w-10 text-white" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement confirmé !</h1>
                    <p className="text-gray-500 mb-6">
                        Votre inscription a bien été enregistrée. Vous recevrez un email de confirmation avec votre billet.
                    </p>

                    {event && (
                        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                            <h3 className="font-bold text-gray-900 mb-2">{event.title}</h3>
                            <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-sky-500" />
                                    {new Date(event.date).toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-sky-500" />
                                    {event.location}
                                </div>
                            </div>
                            {event.price && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <span className="text-lg font-bold text-emerald-600">{event.price.toFixed(2)}€</span>
                                    <span className="text-sm text-gray-500 ml-1">payé</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bouton facture */}
                    {event?.type === 'paid' && event?.price && registrationId && (
                        <div className="bg-emerald-50 border-2 border-emerald-200 p-5 rounded-xl mb-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-emerald-900">Paiement de {event.price.toFixed(2)}€</h3>
                                </div>
                            </div>
                            <button
                                onClick={() => window.open(`/api/registrations/${registrationId}/invoice`, '_blank')}
                                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-5 py-3 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all font-bold shadow-md text-sm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Télécharger la facture
                            </button>
                        </div>
                    )}

                    {event?.type === 'paid' && !registrationId && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-700 flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Préparation de votre facture...
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <Link
                            href={`/events/${eventId}`}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all"
                        >
                            Voir l&apos;événement
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/dashboard"
                            className="text-sm text-gray-500 hover:text-sky-600 transition-colors"
                        >
                            Retour au tableau de bord
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
