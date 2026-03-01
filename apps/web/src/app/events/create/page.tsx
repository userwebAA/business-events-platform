'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ArrowLeft, Plus, Trash2, Clock, Lock, Copy, Check, MapPin, Image, Users, Euro, Type, FileText, Sparkles, ChevronRight, Upload, Shield, Loader2, RefreshCw, AlertTriangle, X } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema, EventInput } from 'shared';
import { defaultRegistrationFields, RegistrationField } from 'shared';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateEventPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [identityStatus, setIdentityStatus] = useState<string | null>(null);
    const [checkingIdentity, setCheckingIdentity] = useState(true);
    const [eventType, setEventType] = useState<'free' | 'paid'>('free');
    const [isPrivate, setIsPrivate] = useState(false);
    const [registrationFields, setRegistrationFields] = useState<RegistrationField[]>(defaultRegistrationFields);
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [createdEvent, setCreatedEvent] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const [myPastEvents, setMyPastEvents] = useState<any[]>([]);
    const [showDuplicateSelector, setShowDuplicateSelector] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Vérifier le statut d'identité
    useEffect(() => {
        const checkIdentity = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { setCheckingIdentity(false); return; }
                if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
                    setIdentityStatus('verified');
                    setCheckingIdentity(false);
                    return;
                }
                const res = await fetch('/api/user/identity', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setIdentityStatus(data.identityStatus);
                }
            } catch (e) { /* silently fail */ }
            finally { setCheckingIdentity(false); }
        };
        checkIdentity();
    }, [user]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        control,
        setValue,
    } = useForm<EventInput>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            type: 'free',
            currency: 'EUR',
            registrationFields: defaultRegistrationFields,
        },
    });


    // Charger les événements existants pour la duplication
    useEffect(() => {
        const fetchMyEvents = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await fetch('/api/events/my-events', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setMyPastEvents(data);
                }
            } catch (e) { /* silently fail */ }
        };
        fetchMyEvents();
    }, []);

    const handleDuplicate = (event: any) => {
        setValue('title', event.title);
        setValue('description', event.description);
        setValue('location', event.location);
        setValue('address', event.address || '');
        if (event.maxAttendees) setValue('maxAttendees', event.maxAttendees);
        if (event.price) setValue('price', event.price);
        setEventType(event.type || 'free');
        setIsPrivate(event.isPrivate || false);
        if (event.registrationFields?.length > 0) {
            setRegistrationFields(event.registrationFields.map((f: any) => ({
                id: Date.now().toString() + '_' + f.name,
                name: f.name,
                label: f.label,
                type: f.type,
                required: f.required,
                options: f.options || [],
                placeholder: f.placeholder || '',
            })));
        }
        if (event.imageUrl) {
            setImagePreview(event.imageUrl);
        }
        setShowDuplicateSelector(false);
    };

    const onSubmit = async (data: EventInput) => {
        console.log('🚀 onSubmit appelé !');
        console.log('📝 Données du formulaire:', data);

        setLoading(true);
        try {
            const eventData = {
                ...data,
                type: eventType,
                isPrivate,
                registrationFields,
                endDate: data.date,
                imageUrl: imagePreview || undefined,
            };

            console.log('📦 Données à envoyer:', eventData);

            const token = localStorage.getItem('token');
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(eventData),
            });

            console.log('📡 Réponse API:', response.status);

            if (response.ok) {
                const event = await response.json();
                console.log('✅ Événement créé:', event);

                if (event.isPrivate && event.accessToken) {
                    setCreatedEvent(event);
                } else {
                    router.push(`/events/${event.id}`);
                }
            } else {
                const errorData = await response.json();
                console.error('❌ Erreur API:', errorData);
                setFormError('Erreur lors de la création : ' + (errorData.error || 'Erreur inconnue'));
                setTimeout(() => setFormError(null), 5000);
            }
        } catch (error) {
            console.error('💥 Error creating event:', error);
            setFormError('Erreur lors de la création de l\'événement');
            setTimeout(() => setFormError(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    const copyPrivateLink = () => {
        if (createdEvent?.accessToken) {
            const link = `${window.location.origin}/events/private/${createdEvent.accessToken}`;
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (createdEvent?.isPrivate) {
        const privateLink = `${window.location.origin}/events/private/${createdEvent.accessToken}`;

        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-10">
                    <div className="text-center mb-8">
                        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                            <Check className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3">
                            Événement privé créé !
                        </h1>
                        <p className="text-gray-500 text-lg">
                            Votre événement a été créé avec succès
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-rose-50 to-red-50 border-2 border-rose-200 rounded-2xl p-6 mb-8">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="bg-rose-100 p-2.5 rounded-xl shrink-0">
                                <Lock className="h-5 w-5 text-rose-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-rose-900 mb-1">
                                    Lien d'accès privé
                                </h2>
                                <p className="text-sm text-rose-700">
                                    Cet événement n'est pas visible publiquement. Partagez ce lien uniquement avec les personnes invitées.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 mb-4 border border-rose-100">
                            <p className="text-sm text-gray-600 mb-2 font-bold">Lien d'invitation :</p>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <input
                                    type="text"
                                    value={privateLink}
                                    readOnly
                                    className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm text-gray-900 font-mono truncate"
                                />
                                <button
                                    onClick={copyPrivateLink}
                                    className={`px-5 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shrink-0 ${copied
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 shadow-lg'
                                        }`}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Copié !
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4" />
                                            Copier
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <p className="text-sm text-amber-800">
                                ⚠️ <strong>Important :</strong> Conservez ce lien précieusement. Il ne sera plus affiché après avoir quitté cette page.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => window.open(privateLink, '_blank')}
                            className="w-full py-4 px-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            Voir l'événement
                        </button>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-full py-4 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                        >
                            Retour au tableau de bord
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Écran de blocage si identité non vérifiée
    if (!checkingIdentity && identityStatus !== 'verified') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
                <Navbar />
                <div className="flex items-center justify-center py-20 px-4">
                    <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-10 text-center">
                        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                            <Shield className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                            Vérification d&apos;identité requise
                        </h1>
                        <p className="text-gray-500 mb-6 leading-relaxed">
                            Pour organiser un événement, vous devez d&apos;abord vérifier votre identité en soumettant une pièce d&apos;identité valide.
                        </p>

                        {identityStatus === 'pending' && (
                            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <div className="flex items-center justify-center gap-2 text-amber-700 font-semibold">
                                    <Clock className="h-5 w-5" />
                                    Votre demande est en cours d&apos;examen (24-48h)
                                </div>
                            </div>
                        )}

                        {identityStatus === 'rejected' && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-left">
                                <p className="text-sm text-red-700 font-medium">Votre demande précédente a été refusée. Veuillez soumettre un nouveau document.</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Link
                                href="/dashboard/settings"
                                className="block w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg"
                            >
                                {identityStatus === 'pending' ? 'Voir le statut' : 'Vérifier mon identité'}
                            </Link>
                            <button
                                onClick={() => router.back()}
                                className="block w-full py-3.5 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
                            >
                                Retour
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Loading identity check
    if (checkingIdentity) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                </div>
            </div>
        );
    }

    const addCustomField = () => {
        const newField: RegistrationField = {
            id: Date.now().toString(),
            name: `custom_${Date.now()}`,
            label: 'Nouveau champ',
            type: 'text',
            required: false,
        };
        setRegistrationFields([...registrationFields, newField]);
    };

    const removeField = (id: string) => {
        setRegistrationFields(registrationFields.filter(f => f.id !== id));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
            <Navbar />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link href="/events" className="inline-flex items-center gap-2 text-gray-500 hover:text-sky-600 mb-6 font-medium transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Retour aux événements
                </Link>

                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-2.5 rounded-xl shadow-lg">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Créer un événement</h1>
                    </div>
                    <p className="text-gray-500 text-lg">Remplissez les informations pour créer votre événement</p>
                </div>

                {/* Dupliquer un événement existant */}
                {myPastEvents.length > 0 && (
                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={() => setShowDuplicateSelector(!showDuplicateSelector)}
                            className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl hover:border-amber-300 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-100 p-2 rounded-xl group-hover:bg-amber-200 transition-colors">
                                    <RefreshCw className="h-5 w-5 text-amber-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-amber-900">Dupliquer un événement existant</p>
                                    <p className="text-xs text-amber-600">Pré-remplir le formulaire à partir d'un ancien événement</p>
                                </div>
                            </div>
                            <ChevronRight className={`h-5 w-5 text-amber-400 transition-transform ${showDuplicateSelector ? 'rotate-90' : ''}`} />
                        </button>

                        {showDuplicateSelector && (
                            <div className="mt-3 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-80 overflow-y-auto divide-y divide-gray-100">
                                {myPastEvents.map((event) => (
                                    <button
                                        key={event.id}
                                        type="button"
                                        onClick={() => handleDuplicate(event)}
                                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-sky-50 transition-colors text-left"
                                    >
                                        {event.imageUrl ? (
                                            <img src={event.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-200" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center shrink-0">
                                                <Calendar className="h-5 w-5 text-sky-500" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-gray-900 truncate">{event.title}</p>
                                            <p className="text-xs text-gray-500">{event.location} · {event.type === 'paid' ? `${event.price}€` : 'Gratuit'}</p>
                                        </div>
                                        <Copy className="h-4 w-4 text-gray-400 shrink-0" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit, (errors) => {
                    const messages: string[] = [];
                    if (errors.title) messages.push('Titre');
                    if (errors.description) messages.push('Description');
                    if (errors.date) messages.push('Date et heure');
                    if (errors.location) messages.push('Ville');
                    if (errors.address) messages.push('Adresse');
                    if (errors.price) messages.push('Prix');
                    setFormError(messages.length > 0 ? `Champs manquants : ${messages.join(', ')}` : 'Veuillez remplir tous les champs obligatoires');
                    setTimeout(() => setFormError(null), 5000);
                })} className="space-y-6">

                    {/* Toast d'erreur */}
                    {formError && (
                        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border-2 border-red-200 rounded-2xl shadow-2xl max-w-lg">
                                <div className="bg-red-100 p-2 rounded-xl shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                                <p className="text-sm font-semibold text-red-800 flex-1">{formError}</p>
                                <button
                                    type="button"
                                    onClick={() => setFormError(null)}
                                    className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Section 1 - Informations générales */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7 space-y-5 sm:space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-sky-50 p-2 rounded-lg">
                                <Type className="h-5 w-5 text-sky-600" />
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Informations générales</h2>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Titre de l'événement *
                            </label>
                            <input
                                {...register('title')}
                                type="text"
                                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 font-medium placeholder-gray-400 transition-all hover:border-gray-300"
                                placeholder="Ex: Networking Tech & Innovation"
                            />
                            {errors.title && (
                                <p className="mt-2 text-sm text-red-600 font-medium">{errors.title.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                {...register('description')}
                                rows={4}
                                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 font-medium placeholder-gray-400 transition-all hover:border-gray-300 resize-none"
                                placeholder="Décrivez votre événement..."
                            />
                            {errors.description && (
                                <p className="mt-2 text-sm text-red-600 font-medium">{errors.description.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-sky-500" />
                                Date et heure *
                            </label>
                            <Controller
                                control={control}
                                name="date"
                                render={({ field }) => (
                                    <DatePicker
                                        selected={field.value}
                                        onChange={(date: Date | null) => field.onChange(date)}
                                        showTimeSelect
                                        timeFormat="HH:mm"
                                        timeIntervals={15}
                                        dateFormat="EEEE d MMMM yyyy 'à' HH:mm"
                                        locale={fr}
                                        minDate={new Date()}
                                        placeholderText="Sélectionner une date et heure"
                                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 font-medium placeholder-gray-400 transition-all hover:border-gray-300"
                                        calendarClassName="custom-datepicker"
                                        wrapperClassName="w-full"
                                    />
                                )}
                            />
                            {errors.date && (
                                <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                                    ⚠️ {errors.date.message}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-purple-500" />
                                    Ville + Code Postal *
                                </label>
                                <input
                                    {...register('location')}
                                    type="text"
                                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 font-medium placeholder-gray-400 transition-all hover:border-gray-300"
                                    placeholder="Ex: Toulouse 31000"
                                />
                                <p className="mt-1.5 text-xs text-gray-400">
                                    Visible publiquement
                                </p>
                                {errors.location && (
                                    <p className="mt-1 text-sm text-red-600 font-medium">{errors.location.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-emerald-500" />
                                    Adresse complète *
                                </label>
                                <input
                                    {...register('address')}
                                    type="text"
                                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 font-medium placeholder-gray-400 transition-all hover:border-gray-300"
                                    placeholder="123 Rue de la République"
                                />
                                <p className="mt-1.5 text-xs text-gray-400">
                                    Révélée après inscription (payant)
                                </p>
                                {errors.address && (
                                    <p className="mt-1 text-sm text-red-600 font-medium">{errors.address.message}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Users className="h-4 w-4 text-orange-500" />
                                Nombre maximum de participants
                            </label>
                            <input
                                {...register('maxAttendees', { valueAsNumber: true })}
                                type="number"
                                min="1"
                                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 font-medium placeholder-gray-400 transition-all hover:border-gray-300"
                                placeholder="Laisser vide pour illimité"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Upload className="h-4 w-4 text-pink-500" />
                                Image de l'événement
                                <span className="text-xs font-normal text-gray-400">(optionnel)</span>
                            </label>
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-200 border-dashed rounded-2xl cursor-pointer bg-gray-50 hover:bg-sky-50 hover:border-sky-300 transition-all">
                                    {imagePreview ? (
                                        <div className="relative w-full h-full">
                                            <img
                                                src={imagePreview}
                                                alt="Aperçu"
                                                className="w-full h-full object-cover rounded-2xl"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setImagePreview(null);
                                                    setImageFile(null);
                                                }}
                                                className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-xl hover:bg-red-600 transition shadow-lg"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6">
                                            <div className="bg-sky-100 p-3 rounded-xl mb-3">
                                                <Upload className="h-8 w-8 text-sky-500" />
                                            </div>
                                            <p className="text-sm text-gray-600 mb-1">
                                                <span className="font-bold text-sky-600">Cliquez pour télécharger</span> ou glissez-déposez
                                            </p>
                                            <p className="text-xs text-gray-400">PNG, JPG, JPEG (MAX. 5MB)</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/png,image/jpeg,image/jpg"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.size > 5 * 1024 * 1024) {
                                                    setFormError('L\'image ne doit pas dépasser 5MB');
                                                    setTimeout(() => setFormError(null), 5000);
                                                    return;
                                                }
                                                setImageFile(file);
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setImagePreview(reader.result as string);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Section 2 - Visibilité et Tarification */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7 space-y-5 sm:space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-purple-50 p-2 rounded-lg">
                                <Euro className="h-5 w-5 text-purple-600" />
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Visibilité et Tarification</h2>
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-rose-100 p-2.5 rounded-xl">
                                        <Lock className="h-5 w-5 text-rose-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Événement privé</p>
                                        <p className="text-sm text-gray-500">Accessible uniquement par lien d'invitation</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsPrivate(!isPrivate)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isPrivate ? 'bg-sky-500' : 'bg-gray-300'}`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${isPrivate ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                            {isPrivate && (
                                <div className="mt-4 p-4 bg-sky-50 border border-sky-200 rounded-xl">
                                    <p className="text-sm text-sky-800">
                                        ℹ️ Cet événement ne sera pas visible sur la plateforme. Vous recevrez un lien privé à partager avec vos invités.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setEventType('free')}
                                className={`flex-1 py-4 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${eventType === 'free'
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                                    }`}
                            >
                                <Check className="h-5 w-5" />
                                Gratuit
                            </button>
                            <button
                                type="button"
                                onClick={() => setEventType('paid')}
                                className={`flex-1 py-4 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${eventType === 'paid'
                                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                                    }`}
                            >
                                <Euro className="h-5 w-5" />
                                Payant
                            </button>
                        </div>

                        {eventType === 'paid' && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <Euro className="h-4 w-4 text-amber-500" />
                                    Prix TTC (€) *
                                </label>
                                <input
                                    {...register('price', { valueAsNumber: true })}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 font-medium placeholder-gray-400 transition-all hover:border-gray-300"
                                    placeholder="49.99"
                                />
                                {errors.price && (
                                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.price.message}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Section 3 - Formulaire d'inscription */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7 space-y-5 sm:space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-50 p-2 rounded-lg">
                                    <FileText className="h-5 w-5 text-emerald-600" />
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Formulaire d'inscription</h2>
                            </div>
                            <button
                                type="button"
                                onClick={addCustomField}
                                className="flex items-center gap-2 bg-sky-50 text-sky-600 hover:bg-sky-100 px-4 py-2 rounded-lg font-bold text-sm transition-all"
                            >
                                <Plus className="h-4 w-4" />
                                Ajouter un champ
                            </button>
                        </div>

                        <div className="space-y-3">
                            {registrationFields.map((field) => (
                                <div key={field.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 shrink-0">
                                        <Type className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">{field.label}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-medium">{field.type}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${field.required ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {field.required ? 'Obligatoire' : 'Optionnel'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeField(field.id)}
                                        className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pb-8">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="sm:flex-1 py-4 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all order-2 sm:order-1"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="sm:flex-[2] py-4 px-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Création en cours...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-5 w-5" />
                                    Créer l'événement
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
