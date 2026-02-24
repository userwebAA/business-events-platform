'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ArrowLeft, CreditCard, User, Mail, Phone, Building } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Event, RegistrationField } from 'shared';
import { useForm } from 'react-hook-form';

export default function RegisterPage() {
    const params = useParams();
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    useEffect(() => {
        fetchEvent();
    }, [params.id]);

    const fetchEvent = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/events/${params.id}`);
            if (response.ok) {
                const data = await response.json();
                setEvent({ ...data, date: new Date(data.date) });
            }
        } catch (error) {
            console.error('Error fetching event:', error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');

            // Événement payant → Stripe Checkout
            if (event?.type === 'paid' && event?.price) {
                if (!token) {
                    alert('Vous devez être connecté pour vous inscrire à un événement payant');
                    router.push('/login');
                    return;
                }

                const checkoutRes = await fetch('/api/stripe/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        eventId: params.id,
                        formData: data,
                    }),
                });

                if (checkoutRes.ok) {
                    const { url } = await checkoutRes.json();
                    if (url) {
                        // Sauvegarder les infos avant la redirection Stripe
                        if (data.email) {
                            sessionStorage.setItem('registrationEmail', data.email);
                        }
                        const registeredIds = JSON.parse(sessionStorage.getItem('registeredEvents') || '[]');
                        if (!registeredIds.includes(params.id)) {
                            registeredIds.push(params.id);
                            sessionStorage.setItem('registeredEvents', JSON.stringify(registeredIds));
                        }
                        window.location.href = url;
                        return;
                    }
                } else {
                    const errData = await checkoutRes.json();
                    alert(errData.error || 'Erreur lors de la création du paiement');
                }
                setSubmitting(false);
                return;
            }

            // Événement gratuit → inscription directe
            const response = await fetch('/api/registrations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    eventId: params.id,
                    formData: data,
                }),
            });

            if (response.ok) {
                const registration = await response.json();

                // Incrémenter le nombre de participants
                await fetch(`/api/events/${params.id}/increment`, {
                    method: 'POST',
                });

                // Sauvegarder l'email pour la page de confirmation
                if (data.email) {
                    sessionStorage.setItem('registrationEmail', data.email);
                }

                // Sauvegarder l'ID d'inscription pour accéder à l'adresse de manière sécurisée
                if (registration.id) {
                    sessionStorage.setItem('registrationId', registration.id);
                    // Sauvegarder aussi avec l'ID de l'événement pour la page de détail
                    sessionStorage.setItem(`registration_${params.id}`, registration.id);
                }

                // Sauvegarder l'ID de l'événement dans les inscriptions
                const registeredIds = JSON.parse(sessionStorage.getItem('registeredEvents') || '[]');
                if (!registeredIds.includes(params.id)) {
                    registeredIds.push(params.id);
                    sessionStorage.setItem('registeredEvents', JSON.stringify(registeredIds));
                }

                // Rediriger vers la page de confirmation
                router.push(`/events/${params.id}/register/success`);
            } else {
                alert('Erreur lors de l\'inscription');
            }
        } catch (error) {
            console.error('Error submitting registration:', error);
            alert('Erreur lors de l\'inscription');
        } finally {
            setSubmitting(false);
        }
    };

    const renderField = (field: RegistrationField) => {
        const commonProps = {
            ...register(field.name, { required: field.required }),
            className: 'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-black font-medium transition-all hover:border-gray-300',
            placeholder: field.placeholder,
        };

        switch (field.type) {
            case 'textarea':
                return <textarea {...commonProps} rows={4} />;
            case 'select':
                return (
                    <select {...commonProps}>
                        <option value="">Sélectionner...</option>
                        {field.options?.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                );
            default:
                return <input {...commonProps} type={field.type} />;
        }
    };

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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Événement introuvable</h2>
                    <Link href="/events" className="text-sky-500 hover:text-sky-600">
                        Retour aux événements
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-sky-50">
            <Navbar />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link
                    href={`/events/${params.id}`}
                    className="inline-flex items-center text-sky-500 hover:text-sky-600 mb-6 font-medium"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à l'événement
                </Link>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-sky-100">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent mb-3">✨ Inscription à l'événement</h1>
                        <p className="text-xl text-gray-700 font-medium">{event.title}</p>
                    </div>

                    {event.type === 'paid' && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5 mb-8 flex items-center gap-4 shadow-sm">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <CreditCard className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-bold text-blue-900 text-lg">💳 Événement payant</p>
                                <p className="text-blue-700 font-semibold">Prix: {event.price}€</p>
                            </div>
                        </div>
                    )}

                    {event.type === 'free' && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 mb-8 flex items-center gap-4 shadow-sm">
                            <div className="bg-green-100 p-3 rounded-lg">
                                <span className="text-2xl">🎉</span>
                            </div>
                            <div>
                                <p className="font-bold text-green-900 text-lg">Événement gratuit</p>
                                <p className="text-green-700">Inscription sans frais</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="bg-sky-50 rounded-xl p-6 mb-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="h-5 w-5 text-sky-600" />
                                Vos informations
                            </h2>
                            <div className="space-y-5">
                                {/* Champ email obligatoire */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-sky-600" />
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        {...register('email', {
                                            required: true,
                                            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                                        })}
                                        type="email"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-black font-medium transition-all hover:border-gray-300"
                                        placeholder="votre.email@example.com"
                                    />
                                    {errors.email && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                            <span>⚠️</span> Email valide requis
                                        </p>
                                    )}
                                </div>

                                {event.registrationFields.map((field) => (
                                    <div key={field.id}>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </label>
                                        {renderField(field)}
                                        {errors[field.name] && (
                                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                                <span>⚠️</span> Ce champ est requis
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t-2 border-gray-100">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-4 rounded-xl text-lg font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Inscription en cours...
                                    </>
                                ) : event.type === 'paid' ? (
                                    <>
                                        💳 Payer {event.price}€ et s'inscrire
                                    </>
                                ) : (
                                    <>
                                        ✨ Confirmer l'inscription
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
