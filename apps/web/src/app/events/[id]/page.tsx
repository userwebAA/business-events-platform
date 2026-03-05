'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, ArrowLeft, Clock, Check, Lock, Euro, Share2, ArrowRight, Ticket, AlertTriangle, XCircle, Loader2, User as UserIcon, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Event } from 'shared';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const [fullAddress, setFullAddress] = useState<string>('');
    const [loadingAddress, setLoadingAddress] = useState(false);
    const [shared, setShared] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState('');
    const [registrationId, setRegistrationId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Récupérer l'événement
                const response = await fetch(`/api/events/${params.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setEvent({
                        ...data,
                        date: new Date(data.date),
                        endDate: data.endDate ? new Date(data.endDate) : undefined
                    });

                    // Vérifier si l'utilisateur est inscrit (DB puis sessionStorage)
                    let isUserRegistered = false;
                    let foundRegId: string | null = null;

                    const token = localStorage.getItem('token');
                    if (token) {
                        try {
                            const regRes = await fetch('/api/user/registrations', {
                                headers: { 'Authorization': `Bearer ${token}` },
                            });
                            if (regRes.ok) {
                                const registrations = await regRes.json();
                                const match = registrations.find((r: any) => r.eventId === params.id);
                                if (match) {
                                    isUserRegistered = true;
                                    foundRegId = match.id;
                                }
                            }
                        } catch { }
                    }

                    // Fallback sessionStorage
                    if (!isUserRegistered) {
                        const registeredIds = JSON.parse(sessionStorage.getItem('registeredEvents') || '[]');
                        isUserRegistered = registeredIds.includes(params.id);
                        foundRegId = sessionStorage.getItem(`registration_${params.id}`);
                    }

                    setIsRegistered(isUserRegistered);
                    if (foundRegId) setRegistrationId(foundRegId);

                    // Organisateur : déverrouiller l'adresse directement
                    const isEventOrganizer = user && (data.organizerId === user.id || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
                    if (isEventOrganizer && data.address) {
                        setFullAddress(data.address);
                    }

                    // Si inscrit et événement payant, récupérer l'adresse
                    if (!isEventOrganizer && isUserRegistered && data.type === 'paid' && foundRegId) {
                        setLoadingAddress(true);
                        try {
                            const addressResponse = await fetch(`/api/events/${params.id}/address`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ registrationId: foundRegId }),
                            });
                            if (addressResponse.ok) {
                                const addressData = await addressResponse.json();
                                setFullAddress(addressData.address);
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
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.id]);

    const handleShare = useCallback(async () => {
        const url = window.location.href;
        try {
            // Mobile : utiliser l'API Web Share si disponible
            if (navigator.share) {
                await navigator.share({ title: event?.title || 'Événement', url });
                return;
            }
            // Desktop HTTPS : clipboard API
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                setShared(true);
                setTimeout(() => setShared(false), 2000);
                return;
            }
        } catch { }
        // Fallback HTTP : copie via textarea caché
        try {
            const textarea = document.createElement('textarea');
            textarea.value = url;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setShared(true);
            setTimeout(() => setShared(false), 2000);
        } catch { }
    }, [event]);

    const spotsLeft = useMemo(() => event?.maxAttendees ? event.maxAttendees - event.currentAttendees : null, [event]);
    const isFull = useMemo(() => spotsLeft !== null && spotsLeft <= 0, [spotsLeft]);
    const isOrganizer = useMemo(() => {
        if (!user || !event) return false;
        return (event as any).organizerId === user.id || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    }, [user, event]);
    const isCancelled = event?.status === 'cancelled';

    const handleCancelEvent = async () => {
        setCancelling(true);
        setCancelError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/events/${params.id}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: cancelReason }),
            });
            if (res.ok) {
                const data = await res.json();
                setEvent(prev => prev ? { ...prev, status: 'cancelled' } : null);
                setShowCancelModal(false);
                setCancelReason('');
            } else {
                const data = await res.json();
                setCancelError(data.error || 'Erreur lors de l\'annulation');
            }
        } catch (error) {
            setCancelError('Erreur réseau');
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mb-4"></div>
                        <p className="text-gray-500">Chargement de l'événement...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                        <div className="bg-gray-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Calendar className="h-10 w-10 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Événement introuvable</h2>
                        <p className="text-gray-500 mb-6">Cet événement n'existe pas ou a été supprimé.</p>
                        <Link href="/events" className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg">
                            <ArrowLeft className="h-4 w-4" />
                            Retour aux événements
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                <Link href="/events" className="inline-flex items-center gap-2 text-gray-500 hover:text-sky-600 mb-6 font-medium transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Retour aux événements
                </Link>

                {/* Image Hero */}
                {event.imageUrl ? (
                    <div className="rounded-2xl overflow-hidden mb-6 sm:mb-8 h-52 sm:h-80 md:h-96 relative shadow-lg">
                        <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-4 left-4 flex gap-2">
                            <span className={`px-4 py-1.5 rounded-lg text-sm font-bold shadow-lg backdrop-blur-sm ${event.type === 'free' ? 'bg-emerald-500 bg-opacity-90 text-white' : 'bg-blue-500 bg-opacity-90 text-white'
                                }`}>
                                {event.type === 'free' ? 'Gratuit' : `${event.price}€`}
                            </span>
                            {event.isPrivate && (
                                <span className="px-4 py-1.5 rounded-lg text-sm font-bold shadow-lg backdrop-blur-sm bg-rose-500 bg-opacity-90 text-white flex items-center gap-1.5">
                                    <Lock className="h-3.5 w-3.5" />
                                    Privé
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl overflow-hidden mb-6 sm:mb-8 h-36 sm:h-48 bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-100 flex items-center justify-center relative shadow-sm">
                        <Calendar className="h-20 w-20 text-sky-300" />
                        <div className="absolute bottom-4 left-4 flex gap-2">
                            <span className={`px-4 py-1.5 rounded-lg text-sm font-bold shadow-md ${event.type === 'free' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
                                }`}>
                                {event.type === 'free' ? 'Gratuit' : `${event.price}€`}
                            </span>
                            {event.isPrivate && (
                                <span className="px-4 py-1.5 rounded-lg text-sm font-bold shadow-md bg-rose-500 text-white flex items-center gap-1.5">
                                    <Lock className="h-3.5 w-3.5" />
                                    Privé
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Colonne principale */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Titre et description */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">{event.title}</h1>

                            <div className="border-t border-gray-100 pt-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center">
                                        <Ticket className="h-4 w-4 text-sky-600" />
                                    </div>
                                    Description
                                </h2>
                                <p className="text-gray-600 whitespace-pre-line leading-relaxed">{event.description}</p>
                            </div>
                        </div>

                        {/* Infos détaillées */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7 space-y-4 sm:space-y-5">
                            <h2 className="text-lg font-bold text-gray-900 mb-1">Détails de l'événement</h2>

                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
                                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-sky-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Date</p>
                                    <p className="text-gray-900 font-bold">
                                        {event.date && !isNaN(event.date.getTime())
                                            ? format(event.date, 'EEEE d MMMM yyyy', { locale: fr })
                                            : 'Date non disponible'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Horaire</p>
                                    <p className="text-gray-900 font-bold">
                                        {event.date && !isNaN(event.date.getTime())
                                            ? event.endDate && !isNaN(new Date(event.endDate).getTime())
                                                ? `De ${format(event.date, 'HH:mm')} à ${format(new Date(event.endDate), 'HH:mm')}`
                                                : `À ${format(event.date, 'HH:mm')}`
                                            : 'Horaire non disponible'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                                    <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500 font-medium">Lieu</p>
                                    <p className="text-gray-900 font-bold">{event.location}</p>
                                    {event.type === 'free' ? (
                                        <div className="mt-1">
                                            <p className="text-sm text-gray-500">{event.address}</p>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address + ', ' + event.location)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                <MapPin className="h-3.5 w-3.5 text-blue-600" />
                                                <span className="text-xs text-blue-700 font-bold">Ouvrir dans Google Maps</span>
                                            </a>
                                        </div>
                                    ) : (isRegistered || isOrganizer) ? (
                                        loadingAddress ? (
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-sky-600"></div>
                                                <p className="text-xs text-sky-600">Chargement de l'adresse...</p>
                                            </div>
                                        ) : fullAddress ? (
                                            <div className="mt-1">
                                                <p className="text-sm text-gray-500">{fullAddress}</p>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                        <span className="text-xs text-emerald-700 font-bold">Adresse débloquée</span>
                                                    </div>
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress + ', ' + event.location)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                                    >
                                                        <MapPin className="h-3.5 w-3.5 text-blue-600" />
                                                        <span className="text-xs text-blue-700 font-bold">Ouvrir dans Google Maps</span>
                                                    </a>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 mt-0.5">{event.address}</p>
                                        )
                                    ) : (
                                        <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                                            <Lock className="h-3.5 w-3.5 text-amber-600" />
                                            <span className="text-xs text-amber-700 font-bold">Adresse révélée après inscription</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Participants</p>
                                    <p className="text-gray-900 font-bold">
                                        {event.currentAttendees} inscrit{event.currentAttendees > 1 ? 's' : ''}
                                        {event.maxAttendees && ` / ${event.maxAttendees} places`}
                                    </p>
                                    {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 10 && (
                                        <p className="text-xs text-rose-600 font-bold mt-0.5">
                                            Plus que {spotsLeft} place{spotsLeft > 1 ? 's' : ''} !
                                        </p>
                                    )}
                                </div>
                            </div>

                            {event.type === 'paid' && (
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                        <Euro className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Tarif</p>
                                        <p className="text-gray-900 font-bold text-xl">{event.price}€ <span className="text-sm font-medium text-gray-400">TTC</span></p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Organisateur */}
                        {(event as any).organizer && (
                            <Link
                                href={`/profile/${(event as any).organizer.id}`}
                                className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 hover:border-sky-200 hover:shadow-md transition-all group"
                            >
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Organisé par</p>
                                <div className="flex items-center gap-3">
                                    {(event as any).organizer.photo ? (
                                        <img
                                            src={(event as any).organizer.photo}
                                            alt={(event as any).organizer.name}
                                            className="w-12 h-12 rounded-xl object-cover shrink-0 ring-2 ring-gray-100 group-hover:ring-sky-200 transition-all"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center shrink-0 group-hover:from-sky-200 group-hover:to-blue-200 transition-all">
                                            <UserIcon className="h-6 w-6 text-sky-500" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 truncate group-hover:text-sky-600 transition-colors">
                                            {(event as any).organizer.firstName && (event as any).organizer.lastName
                                                ? `${(event as any).organizer.firstName} ${(event as any).organizer.lastName}`
                                                : (event as any).organizer.name}
                                        </p>
                                        {(event as any).organizer.company && (
                                            <p className="text-xs text-gray-400 truncate">{(event as any).organizer.position ? `${(event as any).organizer.position} · ` : ''}{(event as any).organizer.company}</p>
                                        )}
                                        {(event as any).organizer.location && !((event as any).organizer.company) && (
                                            <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {(event as any).organizer.location}
                                            </p>
                                        )}
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-sky-400 transition-colors shrink-0" />
                                </div>
                                <p className="text-[11px] text-sky-500 font-medium mt-3 group-hover:underline">Voir le profil</p>
                            </Link>
                        )}

                        {/* Carte d'action */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 lg:sticky lg:top-24">
                            {/* Jauge de places */}
                            {event.maxAttendees && (
                                <div className="mb-5">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-500 font-medium">Places</span>
                                        <span className="font-bold text-gray-900">{event.currentAttendees}/{event.maxAttendees}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full transition-all ${isFull ? 'bg-red-500' : (spotsLeft && spotsLeft <= 10) ? 'bg-amber-500' : 'bg-gradient-to-r from-sky-500 to-blue-600'
                                                }`}
                                            style={{ width: `${Math.min((event.currentAttendees / event.maxAttendees) * 100, 100)}%` }}
                                        />
                                    </div>
                                    {isFull && (
                                        <p className="text-xs text-red-600 font-bold mt-1.5">Complet</p>
                                    )}
                                </div>
                            )}

                            {/* Prix */}
                            <div className="text-center mb-4 sm:mb-5 pb-4 sm:pb-5 border-b border-gray-100">
                                {event.type === 'free' ? (
                                    <p className="text-2xl sm:text-3xl font-bold text-emerald-600">Gratuit</p>
                                ) : (
                                    <div>
                                        <p className="text-3xl sm:text-4xl font-bold text-gray-900">{event.price}€</p>
                                        <p className="text-sm text-gray-400 font-medium">TTC par personne</p>
                                    </div>
                                )}
                            </div>

                            {/* Bouton inscription / panneau organisateur */}
                            {isOrganizer ? (
                                <div className="space-y-3">
                                    <div className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-lg">
                                        <Calendar className="h-5 w-5" />
                                        Votre événement
                                    </div>
                                    <Link
                                        href={`/events/${event.id}/participants`}
                                        className="w-full bg-sky-50 text-sky-700 py-3.5 rounded-xl font-bold hover:bg-sky-100 transition-all flex items-center justify-center gap-2 border border-sky-200"
                                    >
                                        <Users className="h-4 w-4" />
                                        Voir les participants ({event.currentAttendees})
                                    </Link>
                                    <Link
                                        href="/dashboard/my-payments"
                                        className="w-full bg-amber-50 text-amber-700 py-3.5 rounded-xl font-bold hover:bg-amber-100 transition-all flex items-center justify-center gap-2 border border-amber-200"
                                    >
                                        <Euro className="h-4 w-4" />
                                        Tableau de bord paiements
                                    </Link>
                                </div>
                            ) : isRegistered ? (
                                <div className="space-y-3">
                                    <div className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-lg">
                                        <Check className="h-5 w-5" />
                                        Inscrit
                                    </div>
                                    {event.type === 'paid' && event.price && registrationId && (
                                        <button
                                            onClick={() => window.open(`/api/registrations/${registrationId}/invoice`, '_blank')}
                                            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3.5 rounded-xl font-bold hover:from-emerald-600 hover:to-green-700 transition-all shadow-md border border-emerald-400"
                                        >
                                            <FileText className="h-4 w-4" />
                                            Télécharger la facture
                                        </button>
                                    )}
                                    <Link
                                        href={`/events/${event.id}/participants`}
                                        className="w-full bg-sky-50 text-sky-700 py-3.5 rounded-xl font-bold hover:bg-sky-100 transition-all flex items-center justify-center gap-2 border border-sky-200"
                                    >
                                        <Users className="h-4 w-4" />
                                        Voir les participants ({event.currentAttendees})
                                    </Link>
                                </div>
                            ) : isFull ? (
                                <div className="w-full bg-gray-200 text-gray-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2.5 cursor-not-allowed">
                                    Complet
                                </div>
                            ) : (
                                <button
                                    onClick={() => router.push(`/events/${event.id}/register`)}
                                    className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-4 rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                    S'inscrire
                                    <ArrowRight className="h-5 w-5" />
                                </button>
                            )}

                            {/* Bouton partager */}
                            <button
                                onClick={handleShare}
                                className={`w-full mt-3 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border-2 ${shared
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                                    }`}
                            >
                                {shared ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Lien copié !
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="h-4 w-4" />
                                        Partager
                                    </>
                                )}
                            </button>

                            {/* Bouton annuler (organisateur/admin, seulement si pas passé) */}
                            {isOrganizer && !isCancelled && event?.date && new Date(event.date) > new Date() && (
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="w-full mt-3 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300"
                                >
                                    <XCircle className="h-4 w-4" />
                                    Annuler l'événement
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bannière événement annulé */}
            {isCancelled && (
                <div className="fixed bottom-0 inset-x-0 z-50 bg-red-600 text-white py-3 px-4 text-center font-bold shadow-lg">
                    <div className="flex items-center justify-center gap-2">
                        <XCircle className="h-5 w-5" />
                        Cet événement a été annulé
                    </div>
                </div>
            )}

            {/* Modal d'annulation */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setShowCancelModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Annuler l'événement</h3>
                                <p className="text-sm text-gray-500">Cette action est irréversible</p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Tous les inscrits ({event?.currentAttendees || 0}) recevront un email d'annulation.
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Raison de l'annulation (optionnel)</label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Ex: Problème logistique, météo..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                rows={3}
                            />
                        </div>

                        {cancelError && (
                            <p className="text-sm text-red-600 mb-4 font-medium">{cancelError}</p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-all text-sm"
                            >
                                Retour
                            </button>
                            <button
                                onClick={handleCancelEvent}
                                disabled={cancelling}
                                className="flex-1 py-2.5 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {cancelling ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Annulation...</>
                                ) : (
                                    <>Confirmer l'annulation</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
