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

    useEffect(() => {
        fetchEvent();
    }, [eventId]);

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
