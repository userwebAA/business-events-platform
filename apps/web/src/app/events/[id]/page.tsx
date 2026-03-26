'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, ArrowLeft, Clock, Check, Lock, Euro, Share2, ArrowRight, Ticket, AlertTriangle, XCircle, Loader2, User as UserIcon, FileText, Heart, QrCode, ScanLine, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import EventMap from '@/components/EventMap';
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
    const [goodEveningDone, setGoodEveningDone] = useState(false);
    const [goodEveningLoading, setGoodEveningLoading] = useState(false);
    const [goodEveningCount, setGoodEveningCount] = useState(0);
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [qrTicketStatus, setQrTicketStatus] = useState<string>('');
    const [allTickets, setAllTickets] = useState<any[]>([]);
    const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [followUpTargetType, setFollowUpTargetType] = useState<'registered' | 'contactLists'>('registered');
    const [followUpMessage, setFollowUpMessage] = useState('');
    const [followUpLoading, setFollowUpLoading] = useState(false);
    const [contactLists, setContactLists] = useState<any[]>([]);
    const [selectedContactLists, setSelectedContactLists] = useState<string[]>([]);
    const [showFollowUpSuccess, setShowFollowUpSuccess] = useState(false);
    const [followUpResult, setFollowUpResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

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
    }, [params.id, user]);

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

    const fetchQrCode = useCallback(async () => {
        if (!registrationId) return;
        setQrLoading(true);
        try {
            const res = await fetch(`/api/tickets/${registrationId}/qrcode`);
            if (res.ok) {
                const data = await res.json();
                setQrCodeImage(data.qrCodeImage);
                setQrTicketStatus(data.status);
                if (data.tickets && data.tickets.length > 0) {
                    setAllTickets(data.tickets);
                } else {
                    setAllTickets([{ qrCodeImage: data.qrCodeImage, status: data.status, ticketId: data.ticketId, index: 1 }]);
                }
                setCurrentTicketIndex(0);
            }
        } catch (error) {
            console.error('Erreur chargement QR code:', error);
        } finally {
            setQrLoading(false);
        }
    }, [registrationId]);

    const handleShowQr = useCallback(() => {
        setShowQrModal(true);
        if (!qrCodeImage) {
            fetchQrCode();
        }
    }, [qrCodeImage, fetchQrCode]);

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
                                    ) : isOrganizer ? (
                                        <div className="mt-1">
                                            <p className="text-sm text-gray-500">{event.address}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address + ', ' + event.location)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                                >
                                                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                                                    <span className="text-xs text-blue-700 font-bold">Ouvrir dans Google Maps</span>
                                                </a>
                                            </div>
                                        </div>
                                    ) : isRegistered ? (
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

                            {/* Carte Google Maps */}
                            <div className="mt-6">
                                <EventMap
                                    address={
                                        event.type === 'free' || isOrganizer || isRegistered
                                            ? event.address
                                            : '🔒 Adresse révélée après inscription'
                                    }
                                    latitude={(event as any).latitude}
                                    longitude={(event as any).longitude}
                                    radius={(event as any).radius}
                                    showExactLocation={isOrganizer || isRegistered || event.type === 'free'}
                                />
                            </div>

                            {/* Bouton Ajouter à Google Agenda */}
                            {!isCancelled && event.date && new Date(event.date) > new Date() && (
                                <a
                                    href={(() => {
                                        const start = new Date(event.date);
                                        const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
                                        const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
                                        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${fmt(start)}/${fmt(end)}&location=${encodeURIComponent(event.location || '')}&details=${encodeURIComponent(event.description?.substring(0, 500) || '')}`;
                                    })()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-200 rounded-xl hover:from-sky-100 hover:to-blue-100 hover:border-sky-300 transition-all group"
                                >
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-sky-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-sky-900">Ajouter à mon agenda</p>
                                        <p className="text-xs text-sky-600">Google Calendar</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-sky-400 group-hover:translate-x-1 transition-transform" />
                                </a>
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
                                        href={`/dashboard/events/${event.id}/scan`}
                                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3.5 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2 shadow-md"
                                    >
                                        <ScanLine className="h-4 w-4" />
                                        Scanner les billets
                                    </Link>
                                    <Link
                                        href={`/events/${event.id}/participants`}
                                        className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3.5 rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2 shadow-md"
                                    >
                                        <Users className="h-4 w-4" />
                                        Voir les participants ({event.currentAttendees})
                                    </Link>
                                    <Link
                                        href="/dashboard/my-payments"
                                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3.5 rounded-xl font-bold hover:from-amber-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 shadow-md"
                                    >
                                        <Euro className="h-4 w-4" />
                                        Tableau de bord paiements
                                    </Link>
                                    <button
                                        onClick={() => setShowFollowUpModal(true)}
                                        className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white py-3.5 rounded-xl font-bold hover:from-pink-600 hover:to-rose-700 transition-all flex items-center justify-center gap-2 shadow-md"
                                    >
                                        <Share2 className="h-4 w-4" />
                                        Envoyer une relance
                                    </button>
                                </div>
                            ) : isRegistered ? (
                                <div className="space-y-3">
                                    <div className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-lg">
                                        <Check className="h-5 w-5" />
                                        Inscrit
                                    </div>
                                    {registrationId && (
                                        <button
                                            onClick={handleShowQr}
                                            className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-3.5 rounded-xl font-bold hover:from-violet-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-md"
                                        >
                                            <QrCode className="h-4 w-4" />
                                            Mon billet QR
                                        </button>
                                    )}
                                    {event.type === 'paid' && event.price && registrationId && (
                                        <a
                                            href={`/api/registrations/${registrationId}/invoice`}
                                            download
                                            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-3.5 rounded-xl font-bold hover:bg-emerald-100 transition-all border border-emerald-200 text-sm text-center"
                                        >
                                            <FileText className="h-4 w-4 flex-shrink-0" />
                                            Télécharger la facture
                                        </a>
                                    )}
                                    <Link
                                        href={`/events/${event.id}/participants`}
                                        className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3.5 rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2 shadow-md"
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

                            {/* Bouton "Bonne soirée" (événement passé, inscrit ou organisateur) */}
                            {(isRegistered || isOrganizer) && !isCancelled && event?.date && new Date(event.date) < new Date() && (
                                <button
                                    onClick={async () => {
                                        if (!user) return;
                                        setGoodEveningLoading(true);
                                        try {
                                            const token = localStorage.getItem('token');
                                            const res = await fetch(`/api/events/${event.id}/good-evening`, {
                                                method: 'POST',
                                                headers: { 'Authorization': `Bearer ${token}` },
                                            });
                                            if (res.ok) {
                                                const data = await res.json();
                                                setGoodEveningDone(true);
                                                setGoodEveningCount(data.followedCount);
                                            }
                                        } catch (e) {
                                            console.error('Erreur bonne soirée:', e);
                                        } finally {
                                            setGoodEveningLoading(false);
                                        }
                                    }}
                                    disabled={goodEveningDone || goodEveningLoading}
                                    className={`w-full mt-3 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border-2 ${goodEveningDone
                                        ? 'bg-pink-50 border-pink-200 text-pink-700'
                                        : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent hover:from-pink-600 hover:to-rose-600 shadow-md'
                                        } disabled:opacity-70`}
                                >
                                    {goodEveningLoading ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Connexion en cours...</>
                                    ) : goodEveningDone ? (
                                        <><Heart className="h-4 w-4 fill-current" /> {goodEveningCount} personne{goodEveningCount > 1 ? 's' : ''} suivie{goodEveningCount > 1 ? 's' : ''} !</>
                                    ) : (
                                        <><Heart className="h-4 w-4" /> Bonne soirée ! Suivre tous les participants</>
                                    )}
                                </button>
                            )}

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

            {/* Modal QR Code */}
            {showQrModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setShowQrModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <button
                            onClick={() => setShowQrModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XCircle className="h-6 w-6" />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <QrCode className="h-7 w-7 text-violet-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {allTickets.length > 1 ? `Mes billets (${allTickets.length})` : 'Mon billet'}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Présentez ce QR code à l'entrée</p>
                        </div>

                        {qrLoading ? (
                            <div className="flex flex-col items-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mb-4"></div>
                                <p className="text-gray-500 text-sm">Chargement du QR code...</p>
                            </div>
                        ) : allTickets.length > 0 ? (
                            <div className="flex flex-col items-center">
                                {allTickets.length > 1 && (
                                    <div className="flex items-center gap-4 mb-3 w-full justify-center">
                                        <button
                                            onClick={() => setCurrentTicketIndex(prev => Math.max(0, prev - 1))}
                                            disabled={currentTicketIndex === 0}
                                            className="p-2 rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        <span className="text-sm font-bold text-gray-700">
                                            Billet {currentTicketIndex + 1} / {allTickets.length}
                                        </span>
                                        <button
                                            onClick={() => setCurrentTicketIndex(prev => Math.min(allTickets.length - 1, prev + 1))}
                                            disabled={currentTicketIndex === allTickets.length - 1}
                                            className="p-2 rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </div>
                                )}

                                <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-inner mb-4">
                                    <img src={allTickets[currentTicketIndex]?.qrCodeImage} alt={`QR Code billet ${currentTicketIndex + 1}`} className="w-56 h-56" />
                                </div>

                                {allTickets[currentTicketIndex]?.status === 'VALID' && (
                                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold mb-4">
                                        <Check className="h-4 w-4" />
                                        Billet valide
                                    </div>
                                )}
                                {allTickets[currentTicketIndex]?.status === 'USED' && (
                                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold mb-4">
                                        <Check className="h-4 w-4" />
                                        Billet déjà utilisé
                                    </div>
                                )}
                                {allTickets[currentTicketIndex]?.status === 'CANCELLED' && (
                                    <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-bold mb-4">
                                        <XCircle className="h-4 w-4" />
                                        Billet annulé
                                    </div>
                                )}

                                {allTickets.length > 1 && (
                                    <div className="flex justify-center gap-1.5 mb-4">
                                        {allTickets.map((_: any, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentTicketIndex(idx)}
                                                className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentTicketIndex ? 'bg-violet-500 scale-110' : 'bg-gray-300 hover:bg-gray-400'}`}
                                            />
                                        ))}
                                    </div>
                                )}

                                <p className="text-xs text-gray-400 text-center mb-4">
                                    {event?.title}
                                </p>

                                <div className="flex gap-2 w-full">
                                    <a
                                        href={`/api/tickets/${registrationId}`}
                                        download
                                        className="flex-1 flex items-center justify-center gap-2 bg-violet-50 text-violet-700 py-3 rounded-xl font-bold hover:bg-violet-100 transition-all text-sm border border-violet-200"
                                    >
                                        <Download className="h-4 w-4 flex-shrink-0" />
                                        Billet PDF
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500 text-sm">Impossible de charger le QR code</p>
                                <button
                                    onClick={fetchQrCode}
                                    className="mt-3 text-violet-600 font-bold text-sm hover:underline"
                                >
                                    Réessayer
                                </button>
                            </div>
                        )}
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

            {/* Modal Relance */}
            {showFollowUpModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-rose-600 text-white p-6 rounded-t-2xl">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Share2 className="h-6 w-6" />
                                Envoyer une relance
                            </h2>
                            <p className="text-pink-100 text-sm mt-1">Relancez vos participants ou contactez de nouvelles personnes</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Choix des destinataires */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">
                                    Destinataires
                                </label>
                                <div className="space-y-3">
                                    <label className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                                        <input
                                            type="radio"
                                            name="targetType"
                                            value="registered"
                                            checked={followUpTargetType === 'registered'}
                                            onChange={(e) => setFollowUpTargetType(e.target.value as 'registered')}
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">Participants inscrits</p>
                                            <p className="text-sm text-gray-500">Envoyer aux {event?.currentAttendees || 0} personnes déjà inscrites</p>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                                        <input
                                            type="radio"
                                            name="targetType"
                                            value="contactLists"
                                            checked={followUpTargetType === 'contactLists'}
                                            onChange={(e) => {
                                                setFollowUpTargetType(e.target.value as 'contactLists');
                                                // Charger les listes de contacts
                                                if (contactLists.length === 0) {
                                                    const token = localStorage.getItem('token');
                                                    fetch('/api/contacts', {
                                                        headers: { 'Authorization': `Bearer ${token}` }
                                                    })
                                                        .then(res => res.json())
                                                        .then(data => setContactLists(data))
                                                        .catch(err => console.error(err));
                                                }
                                            }}
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">Listes de contacts</p>
                                            <p className="text-sm text-gray-500">Envoyer à vos listes de contacts personnalisées</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Sélection des listes de contacts */}
                            {followUpTargetType === 'contactLists' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">
                                        Sélectionner les listes
                                    </label>
                                    {contactLists.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">Aucune liste de contacts disponible</p>
                                    ) : (
                                        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3">
                                            {contactLists.map((list: any) => (
                                                <label key={list.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedContactLists.includes(list.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedContactLists([...selectedContactLists, list.id]);
                                                            } else {
                                                                setSelectedContactLists(selectedContactLists.filter(id => id !== list.id));
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{list.name}</p>
                                                        <p className="text-xs text-gray-500">{list.emails.length} contacts</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Message personnalisé */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Message personnalisé (optionnel)
                                </label>
                                <textarea
                                    value={followUpMessage}
                                    onChange={(e) => setFollowUpMessage(e.target.value)}
                                    placeholder="Ex: N'oubliez pas de venir ! Nous avons préparé une surprise..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                                    rows={4}
                                />
                                <p className="text-xs text-gray-500 mt-1">Ce message sera ajouté à l'email de relance</p>
                            </div>

                            {/* Boutons d'action */}
                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    onClick={() => {
                                        setShowFollowUpModal(false);
                                        setFollowUpMessage('');
                                        setSelectedContactLists([]);
                                    }}
                                    disabled={followUpLoading}
                                    className="flex-1 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={async () => {
                                        if (followUpTargetType === 'contactLists' && selectedContactLists.length === 0) {
                                            alert('Veuillez sélectionner au moins une liste de contacts');
                                            return;
                                        }

                                        setFollowUpLoading(true);
                                        try {
                                            const token = localStorage.getItem('token');
                                            const res = await fetch(`/api/events/${event?.id}/follow-up`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${token}`
                                                },
                                                body: JSON.stringify({
                                                    targetType: followUpTargetType,
                                                    contactListIds: followUpTargetType === 'contactLists' ? selectedContactLists : undefined,
                                                    customMessage: followUpMessage || undefined,
                                                }),
                                            });

                                            if (res.ok) {
                                                const data = await res.json();
                                                setFollowUpResult(data);
                                                setShowFollowUpModal(false);
                                                setShowFollowUpSuccess(true);
                                                setFollowUpMessage('');
                                                setSelectedContactLists([]);
                                            } else {
                                                const error = await res.json();
                                                alert(`Erreur : ${error.error || 'Impossible d\'envoyer les relances'}`);
                                            }
                                        } catch (error) {
                                            console.error('Erreur:', error);
                                            alert('Une erreur est survenue lors de l\'envoi des relances');
                                        } finally {
                                            setFollowUpLoading(false);
                                        }
                                    }}
                                    disabled={followUpLoading}
                                    className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {followUpLoading ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours...</>
                                    ) : (
                                        <>Envoyer la relance</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Succès Relance */}
            {showFollowUpSuccess && followUpResult && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-t-2xl text-center">
                            <div className="bg-white/20 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <Check className="h-10 w-10" />
                            </div>
                            <h2 className="text-2xl font-bold">Relance envoyée !</h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="text-center">
                                <p className="text-gray-600 mb-6">Vos emails de relance ont été envoyés avec succès</p>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                        <div className="text-3xl font-bold text-emerald-600">{followUpResult.sent}</div>
                                        <div className="text-sm text-emerald-700 font-medium mt-1">Envoyés</div>
                                    </div>
                                    {followUpResult.failed > 0 && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                            <div className="text-3xl font-bold text-red-600">{followUpResult.failed}</div>
                                            <div className="text-sm text-red-700 font-medium mt-1">Échecs</div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-bold text-gray-900">{followUpResult.total}</span> destinataire{followUpResult.total > 1 ? 's' : ''} au total
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setShowFollowUpSuccess(false);
                                    setFollowUpResult(null);
                                }}
                                className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 transition-all"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
