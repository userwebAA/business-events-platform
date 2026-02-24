'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Building, Users, Briefcase, Linkedin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Badge from '@/components/Badge';
import { Event, Registration, BadgeType } from 'shared';

export default function EventParticipantsPage() {
    const params = useParams();
    const eventId = params.id as string;
    const [event, setEvent] = useState<Event | null>(null);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const [canAccessList, setCanAccessList] = useState(false);
    const [timeUntilAccess, setTimeUntilAccess] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Vérifier si l'utilisateur est inscrit
                const registeredIds = JSON.parse(sessionStorage.getItem('registeredEvents') || '[]');
                const userIsRegistered = registeredIds.includes(eventId);
                setIsRegistered(userIsRegistered);

                // Récupérer l'événement
                const eventRes = await fetch(`/api/events/${eventId}`);
                const eventData = await eventRes.json();
                const eventWithDate = {
                    ...eventData,
                    date: new Date(eventData.date)
                };
                setEvent(eventWithDate);

                // Vérifier si on est à 30 minutes ou moins de l'événement
                const now = new Date();
                const eventDate = new Date(eventData.date);
                const thirtyMinutesBefore = new Date(eventDate.getTime() - 30 * 60 * 1000);
                const canAccess = now >= thirtyMinutesBefore;
                setCanAccessList(canAccess);

                // Calculer le temps restant
                if (!canAccess) {
                    const msUntilAccess = thirtyMinutesBefore.getTime() - now.getTime();
                    const hoursUntil = Math.floor(msUntilAccess / (1000 * 60 * 60));
                    const minutesUntil = Math.floor((msUntilAccess % (1000 * 60 * 60)) / (1000 * 60));

                    if (hoursUntil > 24) {
                        const daysUntil = Math.floor(hoursUntil / 24);
                        setTimeUntilAccess(`${daysUntil} jour${daysUntil > 1 ? 's' : ''}`);
                    } else if (hoursUntil > 0) {
                        setTimeUntilAccess(`${hoursUntil}h ${minutesUntil}min`);
                    } else {
                        setTimeUntilAccess(`${minutesUntil} minute${minutesUntil > 1 ? 's' : ''}`);
                    }
                }

                // Si inscrit ET accès autorisé, récupérer la liste des participants
                if (userIsRegistered && canAccess) {
                    const registrationsRes = await fetch(`/api/registrations?eventId=${eventId}`);
                    const registrationsData = await registrationsRes.json();
                    setRegistrations(registrationsData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Événement non trouvé</h2>
                    <Link href="/events" className="mt-4 text-sky-500 hover:text-sky-600">
                        Retour aux événements
                    </Link>
                </div>
            </div>
        );
    }

    if (!isRegistered) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                        <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès restreint</h2>
                        <p className="text-gray-600 mb-6">
                            Vous devez être inscrit à cet événement pour voir la liste des participants.
                        </p>
                        <Link
                            href={`/events/${eventId}`}
                            className="inline-block bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 transition"
                        >
                            Voir l'événement
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!canAccessList) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                        <div className="mx-auto h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Liste bientôt disponible</h2>
                        <p className="text-gray-600 mb-4">
                            La liste des participants avec leurs coordonnées sera accessible <strong>30 minutes avant l'événement</strong>.
                        </p>
                        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-sky-800">
                                <strong>Disponible dans :</strong> {timeUntilAccess}
                            </p>
                            {event && (
                                <p className="text-xs text-sky-600 mt-1">
                                    Événement le {event.date.toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            )}
                        </div>
                        <Link
                            href={`/events/${eventId}`}
                            className="inline-block bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 transition"
                        >
                            Retour à l'événement
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <Link
                        href={`/events/${eventId}`}
                        className="flex items-center gap-2 text-sky-500 hover:text-sky-600 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour à l'événement
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                        <p className="text-gray-600 mt-2">
                            {registrations.length} participant{registrations.length > 1 ? 's' : ''} inscrit
                            {registrations.length > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {registrations.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun participant</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Les participants apparaîtront ici une fois qu'ils se seront inscrits.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {registrations.map((registration) => (
                            <div
                                key={registration.id}
                                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                            >
                                {/* Avatar et nom */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {registration.attendeeName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 text-lg">
                                            {registration.attendeeName}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Inscrit le {new Date(registration.createdAt).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                </div>

                                {/* Badges */}
                                {registration.formData.badges && registration.formData.badges.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {registration.formData.badges.map((badgeType: BadgeType) => (
                                            <Badge key={badgeType} type={badgeType} size="sm" />
                                        ))}
                                    </div>
                                )}

                                {/* Informations */}
                                <div className="space-y-3 border-t pt-4">
                                    {registration.formData.company && (
                                        <div className="flex items-start gap-3">
                                            <Building className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">Entreprise</p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {registration.formData.company}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {registration.formData.position && (
                                        <div className="flex items-start gap-3">
                                            <Briefcase className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">Poste</p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {registration.formData.position}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {registration.attendeeEmail && (
                                        <div className="flex items-start gap-3">
                                            <Mail className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                                                <a
                                                    href={`mailto:${registration.attendeeEmail}`}
                                                    className="text-sm text-sky-600 hover:text-sky-700 break-all"
                                                >
                                                    {registration.attendeeEmail}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {registration.formData.phone && (
                                        <div className="flex items-start gap-3">
                                            <Phone className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">Téléphone</p>
                                                <a
                                                    href={`tel:${registration.formData.phone}`}
                                                    className="text-sm text-sky-600 hover:text-sky-700"
                                                >
                                                    {registration.formData.phone}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {registration.formData.linkedin && (
                                        <div className="flex items-start gap-3">
                                            <Linkedin className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">LinkedIn</p>
                                                <a
                                                    href={registration.formData.linkedin}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-sky-600 hover:text-sky-700 break-all"
                                                >
                                                    Voir le profil
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
