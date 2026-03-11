'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import {
    ArrowLeft, Euro, Users, Calendar, TrendingUp, Loader2,
    Clock, CheckCircle, CreditCard, Banknote
} from 'lucide-react';

interface StripeMovement {
    id: string;
    type: 'payment';
    amount: number;
    platformFee: number;
    creatorAmount: number;
    status: string;
    eventId: string;
    eventTitle: string;
    eventDate: string;
    eventImage: string | null;
    payoutEligibleAt: string;
    payoutId: string | null;
    createdAt: string;
}

interface LegacyMovement {
    id: string;
    type: 'legacy';
    eventTitle: string;
    eventDate: string;
    eventImage: string | null;
    price: number;
    attendees: number;
    revenue: number;
    createdAt: string;
}

interface Summary {
    totalRevenue: number;
    totalCreatorAmount: number;
    totalLegacyRevenue: number;
    totalPaidOut: number;
    pendingAmount: number;
    waitingAmount: number;
    totalPayments: number;
}

export default function MyRevenuePage() {
    const { user } = useAuth();
    const [stripeMovements, setStripeMovements] = useState<StripeMovement[]>([]);
    const [legacyMovements, setLegacyMovements] = useState<LegacyMovement[]>([]);
    const [summary, setSummary] = useState<Summary>({ totalRevenue: 0, totalCreatorAmount: 0, totalLegacyRevenue: 0, totalPaidOut: 0, pendingAmount: 0, waitingAmount: 0, totalPayments: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRevenue();
    }, []);

    const fetchRevenue = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('/api/stats/treasury', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setStripeMovements(data.stripeMovements || []);
                setLegacyMovements(data.legacyMovements || []);
                setSummary(data.summary || {});
            }
        } catch (error) {
            console.error('Error fetching revenue:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPayoutLabel = (m: StripeMovement) => {
        if (m.payoutId) return { label: 'Viré', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle };
        const eligible = new Date(m.payoutEligibleAt) <= new Date();
        if (eligible) return { label: 'Prêt', color: 'text-amber-600 bg-amber-50', icon: Clock };
        const daysLeft = Math.ceil((new Date(m.payoutEligibleAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return { label: `${daysLeft}j`, color: 'text-sky-600 bg-sky-50', icon: Clock };
    };

    const hasData = stripeMovements.length > 0 || legacyMovements.length > 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/dashboard" className="inline-flex items-center text-sky-600 hover:text-sky-700 mb-4 text-sm font-medium">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour au tableau de bord
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Mes Recettes</h1>
                    <p className="text-gray-500 mt-1">Détail des recettes de vos événements payants</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 text-sky-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Résumé */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
                            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg p-4 sm:p-5 text-white">
                                <Euro className="h-6 w-6 opacity-80 mb-2" />
                                <p className="text-xs opacity-80">Recette totale</p>
                                <p className="text-xl sm:text-2xl font-bold">{summary.totalRevenue.toFixed(2)}€</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg p-4 sm:p-5 text-white">
                                <CheckCircle className="h-6 w-6 opacity-80 mb-2" />
                                <p className="text-xs opacity-80">Déjà viré</p>
                                <p className="text-xl sm:text-2xl font-bold">{summary.totalPaidOut.toFixed(2)}€</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-sky-200 p-4 sm:p-5">
                                <Clock className="h-6 w-6 text-sky-500 mb-2" />
                                <p className="text-xs text-gray-500">En transit</p>
                                <p className="text-xl sm:text-2xl font-bold text-sky-600">{summary.waitingAmount.toFixed(2)}€</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-4 sm:p-5">
                                <Banknote className="h-6 w-6 text-amber-500 mb-2" />
                                <p className="text-xs text-gray-500">Prêt à virer</p>
                                <p className="text-xl sm:text-2xl font-bold text-amber-600">{summary.pendingAmount.toFixed(2)}€</p>
                            </div>
                        </div>

                        {/* Liste */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-5 sm:p-6 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-sky-500" />
                                    Paiements reçus
                                </h2>
                            </div>

                            {!hasData ? (
                                <div className="text-center py-16 px-6">
                                    <div className="bg-gray-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Euro className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">Aucune recette</h3>
                                    <p className="text-gray-500 text-sm mb-4">Vous n&apos;avez pas encore d&apos;événement payant.</p>
                                    <Link
                                        href="/events/create"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-all text-sm"
                                    >
                                        Créer un événement
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {/* Paiements Stripe */}
                                    {stripeMovements.map((m) => {
                                        const status = getPayoutLabel(m);
                                        const StatusIcon = status.icon;
                                        return (
                                            <Link
                                                key={m.id}
                                                href={`/events/${m.eventId}`}
                                                className="flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-4 hover:bg-sky-50/50 transition-colors group"
                                            >
                                                {m.eventImage ? (
                                                    <img src={m.eventImage} alt={m.eventTitle} className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shadow-sm shrink-0" />
                                                ) : (
                                                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-sky-100 to-blue-100 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-sky-500" />
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-gray-900 truncate group-hover:text-sky-600 transition-colors text-sm sm:text-base">
                                                        {m.eventTitle}
                                                    </h3>
                                                    <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500 mt-0.5">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(m.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                        <span>{m.amount.toFixed(2)}€ payé</span>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <p className="text-lg font-bold text-emerald-600">{m.creatorAmount.toFixed(2)}€</p>
                                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg ${status.color}`}>
                                                        <StatusIcon className="h-3 w-3" />
                                                        {status.label}
                                                    </span>
                                                </div>
                                            </Link>
                                        );
                                    })}

                                    {/* Legacy */}
                                    {legacyMovements.map((m) => (
                                        <Link
                                            key={`legacy-${m.id}`}
                                            href={`/events/${m.id}`}
                                            className="flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-4 hover:bg-sky-50/50 transition-colors group bg-gray-50/50"
                                        >
                                            {m.eventImage ? (
                                                <img src={m.eventImage} alt={m.eventTitle} className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shadow-sm shrink-0" />
                                            ) : (
                                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 truncate group-hover:text-sky-600 transition-colors text-sm sm:text-base">
                                                    {m.eventTitle}
                                                </h3>
                                                <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500 mt-0.5">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(m.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {m.attendees}
                                                    </span>
                                                    <span className="text-xs text-gray-400">(avant Stripe)</span>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <p className="text-lg font-bold text-gray-600">{m.revenue.toFixed(2)}€</p>
                                                <span className="text-xs text-gray-400">estimé</span>
                                            </div>
                                        </Link>
                                    ))}

                                    {/* Total */}
                                    <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50">
                                        <p className="font-bold text-gray-900">Total recettes</p>
                                        <p className="text-xl font-bold text-amber-600">{summary.totalRevenue.toFixed(2)}€</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
