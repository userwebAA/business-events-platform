'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Mail, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Event } from 'shared';

export default function RegistrationSuccessPage() {
    const params = useParams();
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [userEmail, setUserEmail] = useState<string>('');
    const [fullAddress, setFullAddress] = useState<string>('');
    const [loadingAddress, setLoadingAddress] = useState(false);
    const [registrationId, setRegistrationId] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            // Récupérer l'email depuis sessionStorage
            const email = sessionStorage.getItem('registrationEmail');
            if (email) {
                setUserEmail(email);
                sessionStorage.removeItem('registrationEmail');
            }

            // Récupérer l'ID d'inscription depuis sessionStorage
            const registrationId = sessionStorage.getItem('registrationId');

            // Récupérer les détails de l'événement
            try {
                const response = await fetch(`/api/events/${params.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setEvent({ ...data, date: new Date(data.date) });

                    // Récupérer l'adresse complète si c'est un événement payant et qu'on a un registrationId
                    if (data.type === 'paid' && registrationId) {
                        setLoadingAddress(true);
                        try {
                            const addressResponse = await fetch(`/api/events/${params.id}/address`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ registrationId }),
                            });

                            if (addressResponse.ok) {
                                const addressData = await addressResponse.json();
                                setFullAddress(addressData.address);
                                sessionStorage.removeItem('registrationId');
                            }
                        } catch (error) {
                            console.error('Error fetching address:', error);
                        } finally {
                            setLoadingAddress(false);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching event:', error);
            }
        };

        fetchData();
    }, [params.id]);

    if (!event) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-sky-50">
                <Navbar />
                <div className="container mx-auto px-4 py-16 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-sky-50">
            <Navbar />

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-2xl mx-auto">
                    {/* Card de confirmation */}
                    <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 transform animate-scaleIn">
                        {/* Icône de succès */}
                        <div className="flex justify-center mb-6">
                            <div className="bg-green-100 rounded-full p-6">
                                <CheckCircle className="w-16 h-16 text-green-600" />
                            </div>
                        </div>

                        {/* Titre */}
                        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
                            🎉 Inscription confirmée !
                        </h1>

                        <p className="text-center text-gray-600 mb-8 text-lg">
                            Votre inscription à l'événement a été enregistrée avec succès.
                        </p>

                        {/* Email de confirmation */}
                        <div className="bg-sky-50 rounded-2xl p-6 mb-8 border-2 border-sky-100">
                            <div className="flex items-start gap-4">
                                <div className="bg-sky-100 rounded-full p-3 flex-shrink-0">
                                    <Mail className="w-6 h-6 text-sky-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">
                                        📧 Email de confirmation envoyé
                                    </h3>
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                        Un email de confirmation a été envoyé à <strong className="text-sky-600">{userEmail}</strong> avec tous les détails de votre inscription.
                                    </p>
                                    <p className="text-gray-500 text-xs mt-2">
                                        Vérifiez également votre dossier spam si vous ne le trouvez pas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Détails de l'événement */}
                        <div className="space-y-6">
                            {event?.type === 'paid' && event?.price && registrationId && (
                                <div className="bg-green-50 border-2 border-green-200 p-6 rounded-xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-green-900">Paiement confirmé</h3>
                                            <p className="text-green-700">Montant: {event.price} {event.currency || 'EUR'}</p>
                                        </div>
                                    </div>
                                    <a
                                        href={`/api/registrations/${registrationId}/invoice`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Télécharger la facture
                                    </a>
                                </div>
                            )}

                            <div className="bg-sky-50 p-6 rounded-lg">
                                <h2 className="text-xl font-bold text-sky-900 mb-4">Détails de l'événement</h2>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-5 h-5 text-sky-600 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-gray-900">Date et heure</p>
                                            <p className="text-gray-600">
                                                {event.date.toLocaleDateString('fr-FR', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-sky-600 mt-1 flex-shrink-0" />
                                        <div className="w-full">
                                            <p className="font-medium text-gray-900">{event.location}</p>
                                            {event.type === 'paid' ? (
                                                loadingAddress ? (
                                                    <div className="mt-2 bg-sky-50 border border-sky-200 rounded-lg p-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-600"></div>
                                                            <p className="text-xs text-sky-800">Récupération de l'adresse sécurisée...</p>
                                                        </div>
                                                    </div>
                                                ) : fullAddress ? (
                                                    <div className="mt-2">
                                                        <p className="text-sm text-gray-600 mb-2">{fullAddress}</p>
                                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                            <p className="text-xs text-green-800 font-medium">
                                                                ✅ Adresse complète révélée après inscription
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-600">{event.address}</p>
                                                )
                                            ) : (
                                                <p className="text-sm text-gray-600">{event.address}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    href={`/events/${params.id}`}
                                    className="flex-1 bg-sky-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-sky-700 transition-all text-center shadow-lg hover:shadow-xl"
                                >
                                    Voir l'événement
                                </Link>
                                <Link
                                    href="/events"
                                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all text-center flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Tous les événements
                                </Link>
                            </div>
                        </div>

                        {/* Message additionnel */}
                        <div className="text-center mt-8 text-gray-600">
                            <p className="text-sm">
                                Vous recevrez un rappel 24h avant l'événement.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
