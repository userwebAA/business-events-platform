'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Building, Users, Briefcase, Linkedin, ChevronRight, FileDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Badge from '@/components/Badge';
import { Event, Registration, BadgeType } from 'shared';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
    id: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
    photo: string | null;
    company: string | null;
    position: string | null;
}

export default function EventParticipantsPage() {
    const params = useParams();
    const { user } = useAuth();
    const eventId = params.id as string;
    const [event, setEvent] = useState<Event | null>(null);
    const [registrations, setRegistrations] = useState<(Registration & { userProfile?: UserProfile | null })[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [isEventEnded, setIsEventEnded] = useState(false);
    const [isOrganizer, setIsOrganizer] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Récupérer l'événement
                const eventRes = await fetch(`/api/events/${eventId}`);
                const eventData = await eventRes.json();
                const eventWithDate = {
                    ...eventData,
                    date: new Date(eventData.date),
                    endDate: eventData.endDate ? new Date(eventData.endDate) : undefined
                };
                setEvent(eventWithDate);

                // Vérifier si l'événement est terminé
                const eventEndDate = eventWithDate.endDate || eventWithDate.date;
                const hasEnded = new Date(eventEndDate) < new Date();
                setIsEventEnded(hasEnded);

                // Vérifier si organisateur
                const isOrganizerCheck = !!(user && (eventData.organizerId === user.id || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'));
                setIsOrganizer(isOrganizerCheck);

                // Vérifier si inscrit (DB puis sessionStorage)
                let userIsRegistered = false;
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const regRes = await fetch('/api/user/registrations', {
                            headers: { 'Authorization': `Bearer ${token}` },
                        });
                        if (regRes.ok) {
                            const regs = await regRes.json();
                            userIsRegistered = regs.some((r: any) => r.eventId === eventId);
                        }
                    } catch { }
                }
                if (!userIsRegistered) {
                    const registeredIds = JSON.parse(sessionStorage.getItem('registeredEvents') || '[]');
                    userIsRegistered = registeredIds.includes(eventId);
                }

                const canAccess = isOrganizerCheck || userIsRegistered;
                setHasAccess(canAccess);

                // Si accès autorisé, récupérer la liste des participants
                if (canAccess) {
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
    }, [eventId, user]);

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

    if (!hasAccess) {
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
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                        <p className="text-gray-600 mt-2">
                            {registrations.length} participant{registrations.length > 1 ? 's' : ''} inscrit
                            {registrations.length > 1 ? 's' : ''}
                        </p>
                    </div>
                    {isOrganizer && registrations.length > 0 && (
                        <button
                            onClick={() => {
                                const token = localStorage.getItem('token');
                                window.open(`/api/events/${eventId}/labels?token=${token}`, '_blank');
                            }}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2 shadow-sm text-sm"
                        >
                            <FileDown className="h-4 w-4" />
                            Télécharger les étiquettes PDF
                        </button>
                    )}
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
                        {registrations.map((registration) => {
                            const profile = (registration as any).userProfile as UserProfile | null;
                            return (
                                <div
                                    key={registration.id}
                                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                                >
                                    {/* Avatar et nom */}
                                    <div className="flex items-center gap-4 mb-4">
                                        {profile ? (
                                            <Link href={`/profile/${profile.id}`} className="shrink-0">
                                                {profile.photo ? (
                                                    <img
                                                        src={profile.photo}
                                                        alt={profile.firstName || profile.name}
                                                        className="w-16 h-16 rounded-full object-cover ring-2 ring-sky-100 hover:ring-sky-300 transition-all"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-sky-100 hover:ring-sky-300 transition-all">
                                                        {(profile.firstName || profile.name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </Link>
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                                                {((registration.formData as any).name || (registration.formData as any).firstName || 'U').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            {profile ? (
                                                <Link href={`/profile/${profile.id}`} className="group">
                                                    <h3 className="font-semibold text-gray-900 text-lg group-hover:text-sky-600 transition-colors truncate">
                                                        {profile.firstName && profile.lastName
                                                            ? `${profile.firstName} ${profile.lastName}`
                                                            : profile.name}
                                                    </h3>
                                                </Link>
                                            ) : (
                                                <h3 className="font-semibold text-gray-900 text-lg truncate">
                                                    {(registration.formData as any).name || (registration.formData as any).firstName || 'Participant'}
                                                </h3>
                                            )}
                                            {profile?.position && (
                                                <p className="text-sm text-gray-500 truncate">
                                                    {profile.position}{profile.company ? ` · ${profile.company}` : ''}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-0.5">
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
                                        {registration.formData.company && !profile?.company && (
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

                                        {registration.formData.position && !profile?.position && (
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

                                        {isEventEnded && (registration.formData as any).email && (
                                            <div className="flex items-start gap-3">
                                                <Mail className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                                                    <a
                                                        href={`mailto:${(registration.formData as any).email}`}
                                                        className="text-sm text-sky-600 hover:text-sky-700 break-all"
                                                    >
                                                        {(registration.formData as any).email}
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {isEventEnded && registration.formData.phone && (
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

                                        {isEventEnded && registration.formData.linkedin && (
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
                                                        Voir le profil LinkedIn
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bouton profil */}
                                    {profile && (
                                        <Link
                                            href={`/profile/${profile.id}`}
                                            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-sky-50 text-sky-600 rounded-xl text-sm font-semibold hover:bg-sky-100 transition-all border border-sky-100"
                                        >
                                            Voir le profil
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
