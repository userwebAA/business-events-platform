'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import {
    ArrowLeft, Euro, Users, Calendar, TrendingUp,
    Loader2, ChevronDown, ChevronUp, User, CreditCard,
    Clock, CheckCircle, AlertCircle, ArrowDownRight, ArrowUpRight, Banknote
} from 'lucide-react';

interface StripeMovement {
    id: string;
    type: 'payment';
    stripePaymentId: string;
    amount: number;
    platformFee: number;
    creatorAmount: number;
    currency: string;
    status: string;
    eventId: string;
    eventTitle: string;
    eventDate: string;
    eventImage: string | null;
    organizerId: string;
    organizerName: string;
    organizerEmail: string;
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
    organizerId: string;
    organizerName: string;
    organizerEmail: string;
    createdAt: string;
}

interface PayoutItem {
    id: string;
    type: 'payout';
    stripeTransferId: string | null;
    amount: number;
    currency: string;
    status: string;
    organizerId: string;
    organizerName: string;
    organizerEmail: string;
    processedAt: string | null;
    failureReason: string | null;
    createdAt: string;
}

interface OrganizerStat {
    id: string;
    name: string;
    email: string;
    totalRevenue: number;
    platformFees: number;
    creatorAmount: number;
    paymentCount: number;
    stripeReady: boolean;
}

interface Summary {
    totalRevenue: number;
    totalStripeRevenue: number;
    totalLegacyRevenue: number;
    totalPlatformFees: number;
    totalCreatorAmount: number;
    totalPayments: number;
    totalPayouts: number;
    pendingPayoutAmount: number;
    waitingPayoutAmount: number;
    pendingPayoutCount: number;
    waitingPayoutCount: number;
}

export default function AdminTreasuryPage() {
    const { user } = useAuth();
    const [stripeMovements, setStripeMovements] = useState<StripeMovement[]>([]);
    const [legacyMovements, setLegacyMovements] = useState<LegacyMovement[]>([]);
    const [payouts, setPayouts] = useState<PayoutItem[]>([]);
    const [organizerStats, setOrganizerStats] = useState<OrganizerStat[]>([]);
    const [summary, setSummary] = useState<Summary>({ totalRevenue: 0, totalStripeRevenue: 0, totalLegacyRevenue: 0, totalPlatformFees: 0, totalCreatorAmount: 0, totalPayments: 0, totalPayouts: 0, pendingPayoutAmount: 0, waitingPayoutAmount: 0, pendingPayoutCount: 0, waitingPayoutCount: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'payments' | 'payouts' | 'organizers'>('payments');
    const [expandedOrganizer, setExpandedOrganizer] = useState<string | null>(null);

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    useEffect(() => {
        if (!isAdmin) return;
        fetchTreasury();
    }, [isAdmin]);

    const fetchTreasury = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/stats/treasury', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setStripeMovements(data.stripeMovements || []);
                setLegacyMovements(data.legacyMovements || []);
                setPayouts(data.payouts || []);
                setOrganizerStats(data.organizerStats || []);
                setSummary(data.summary || {});
            }
        } catch (error) {
            console.error('Error fetching treasury:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPayoutStatus = (m: StripeMovement) => {
        if (m.payoutId) return { label: 'Viré', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle };
        const eligible = new Date(m.payoutEligibleAt) <= new Date();
        if (eligible) return { label: 'Éligible', color: 'text-amber-600 bg-amber-50', icon: Clock };
        return { label: 'En transit', color: 'text-sky-600 bg-sky-50', icon: Clock };
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <p className="text-gray-500">Accès réservé aux administrateurs.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/dashboard" className="inline-flex items-center text-sky-600 hover:text-sky-700 mb-4 text-sm font-medium">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour au tableau de bord
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Trésorerie</h1>
                    <p className="text-gray-500 mt-1">Mouvements bancaires et virements aux créateurs</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 text-sky-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Résumé global */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
                            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg p-4 sm:p-5 text-white">
                                <Euro className="h-6 w-6 opacity-80 mb-2" />
                                <p className="text-xs opacity-80">Recette totale</p>
                                <p className="text-xl sm:text-2xl font-bold">{summary.totalRevenue.toFixed(2)}€</p>
                            </div>
                            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg p-4 sm:p-5 text-white">
                                <Banknote className="h-6 w-6 opacity-80 mb-2" />
                                <p className="text-xs opacity-80">Commission plateforme</p>
                                <p className="text-xl sm:text-2xl font-bold">{summary.totalPlatformFees.toFixed(2)}€</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg p-4 sm:p-5 text-white">
                                <ArrowUpRight className="h-6 w-6 opacity-80 mb-2" />
                                <p className="text-xs opacity-80">Versé aux créateurs</p>
                                <p className="text-xl sm:text-2xl font-bold">{summary.totalCreatorAmount.toFixed(2)}€</p>
                            </div>
                            <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl shadow-lg p-4 sm:p-5 text-white">
                                <CreditCard className="h-6 w-6 opacity-80 mb-2" />
                                <p className="text-xs opacity-80">Paiements Stripe</p>
                                <p className="text-xl sm:text-2xl font-bold">{summary.totalPayments}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-4 sm:p-5">
                                <Clock className="h-6 w-6 text-amber-500 mb-2" />
                                <p className="text-xs text-gray-500">En transit (7j)</p>
                                <p className="text-xl sm:text-2xl font-bold text-amber-600">{summary.waitingPayoutAmount.toFixed(2)}€</p>
                                <p className="text-xs text-gray-400">{summary.waitingPayoutCount} paiement{summary.waitingPayoutCount > 1 ? 's' : ''}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-4 sm:p-5">
                                <CheckCircle className="h-6 w-6 text-emerald-500 mb-2" />
                                <p className="text-xs text-gray-500">Prêt à virer</p>
                                <p className="text-xl sm:text-2xl font-bold text-emerald-600">{summary.pendingPayoutAmount.toFixed(2)}€</p>
                                <p className="text-xs text-gray-400">{summary.pendingPayoutCount} paiement{summary.pendingPayoutCount > 1 ? 's' : ''}</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
                            {[
                                { key: 'payments', label: 'Paiements', count: stripeMovements.length + legacyMovements.length },
                                { key: 'payouts', label: 'Virements', count: payouts.length },
                                { key: 'organizers', label: 'Organisateurs', count: organizerStats.length },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {tab.label} <span className="text-xs opacity-60">({tab.count})</span>
                                </button>
                            ))}
                        </div>

                        {/* Tab: Paiements */}
                        {activeTab === 'payments' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-5 sm:p-6 border-b border-gray-100">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-sky-500" />
                                        Paiements reçus
                                    </h2>
                                </div>
                                {stripeMovements.length === 0 && legacyMovements.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500 text-sm">Aucun paiement enregistré</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                                <tr>
                                                    <th className="text-left px-5 py-3 font-semibold">Événement</th>
                                                    <th className="text-left px-5 py-3 font-semibold hidden sm:table-cell">Organisateur</th>
                                                    <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Date</th>
                                                    <th className="text-right px-5 py-3 font-semibold">Total</th>
                                                    <th className="text-right px-5 py-3 font-semibold hidden lg:table-cell">Commission</th>
                                                    <th className="text-right px-5 py-3 font-semibold hidden lg:table-cell">Créateur</th>
                                                    <th className="text-center px-5 py-3 font-semibold">Statut</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {stripeMovements.map((m) => {
                                                    const status = getPayoutStatus(m);
                                                    const StatusIcon = status.icon;
                                                    return (
                                                        <tr key={m.id} className="hover:bg-sky-50/30 transition-colors">
                                                            <td className="px-5 py-3">
                                                                <Link href={`/events/${m.eventId}`} className="font-semibold text-gray-900 hover:text-sky-600 transition-colors text-sm">
                                                                    {m.eventTitle}
                                                                </Link>
                                                            </td>
                                                            <td className="px-5 py-3 text-gray-600 hidden sm:table-cell text-sm">{m.organizerName}</td>
                                                            <td className="px-5 py-3 text-gray-500 hidden md:table-cell text-sm">{new Date(m.createdAt).toLocaleDateString('fr-FR')}</td>
                                                            <td className="px-5 py-3 text-right font-bold text-gray-900">{m.amount.toFixed(2)}€</td>
                                                            <td className="px-5 py-3 text-right text-violet-600 font-medium hidden lg:table-cell">{m.platformFee.toFixed(2)}€</td>
                                                            <td className="px-5 py-3 text-right text-emerald-600 font-medium hidden lg:table-cell">{m.creatorAmount.toFixed(2)}€</td>
                                                            <td className="px-5 py-3 text-center">
                                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${status.color}`}>
                                                                    <StatusIcon className="h-3 w-3" />
                                                                    {status.label}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {legacyMovements.map((m) => (
                                                    <tr key={`legacy-${m.id}`} className="hover:bg-sky-50/30 transition-colors bg-gray-50/50">
                                                        <td className="px-5 py-3">
                                                            <Link href={`/events/${m.id}`} className="font-semibold text-gray-900 hover:text-sky-600 transition-colors text-sm">
                                                                {m.eventTitle}
                                                            </Link>
                                                            <span className="ml-2 text-xs text-gray-400">(avant Stripe)</span>
                                                        </td>
                                                        <td className="px-5 py-3 text-gray-600 hidden sm:table-cell text-sm">{m.organizerName}</td>
                                                        <td className="px-5 py-3 text-gray-500 hidden md:table-cell text-sm">{new Date(m.eventDate).toLocaleDateString('fr-FR')}</td>
                                                        <td className="px-5 py-3 text-right font-bold text-gray-700">{m.revenue.toFixed(2)}€</td>
                                                        <td className="px-5 py-3 text-right text-gray-400 hidden lg:table-cell">—</td>
                                                        <td className="px-5 py-3 text-right text-gray-400 hidden lg:table-cell">—</td>
                                                        <td className="px-5 py-3 text-center">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-500 bg-gray-100">
                                                                Legacy
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab: Virements */}
                        {activeTab === 'payouts' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-5 sm:p-6 border-b border-gray-100">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Banknote className="h-5 w-5 text-emerald-500" />
                                        Virements aux créateurs
                                    </h2>
                                </div>
                                {payouts.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500 text-sm">Aucun virement effectué</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                                <tr>
                                                    <th className="text-left px-5 py-3 font-semibold">Organisateur</th>
                                                    <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Date</th>
                                                    <th className="text-right px-5 py-3 font-semibold">Montant</th>
                                                    <th className="text-center px-5 py-3 font-semibold">Statut</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {payouts.map((p) => (
                                                    <tr key={p.id} className="hover:bg-sky-50/30 transition-colors">
                                                        <td className="px-5 py-3">
                                                            <p className="font-semibold text-gray-900">{p.organizerName}</p>
                                                            <p className="text-xs text-gray-500">{p.organizerEmail}</p>
                                                        </td>
                                                        <td className="px-5 py-3 text-gray-500 hidden md:table-cell">
                                                            {p.processedAt ? new Date(p.processedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                                        </td>
                                                        <td className="px-5 py-3 text-right font-bold text-emerald-600">{p.amount.toFixed(2)}€</td>
                                                        <td className="px-5 py-3 text-center">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${p.status === 'COMPLETED' ? 'text-emerald-600 bg-emerald-50' :
                                                                    p.status === 'PROCESSING' ? 'text-sky-600 bg-sky-50' :
                                                                        p.status === 'FAILED' ? 'text-red-600 bg-red-50' :
                                                                            'text-amber-600 bg-amber-50'
                                                                }`}>
                                                                {p.status === 'COMPLETED' ? <CheckCircle className="h-3 w-3" /> :
                                                                    p.status === 'FAILED' ? <AlertCircle className="h-3 w-3" /> :
                                                                        <Clock className="h-3 w-3" />}
                                                                {p.status === 'COMPLETED' ? 'Viré' : p.status === 'PROCESSING' ? 'En cours' : p.status === 'FAILED' ? 'Échoué' : 'En attente'}
                                                            </span>
                                                            {p.failureReason && <p className="text-xs text-red-500 mt-1">{p.failureReason}</p>}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab: Organisateurs */}
                        {activeTab === 'organizers' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-5 sm:p-6 border-b border-gray-100">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <User className="h-5 w-5 text-sky-500" />
                                        Recettes par organisateur
                                    </h2>
                                </div>
                                {organizerStats.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500 text-sm">Aucun organisateur</div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {organizerStats.map((org) => (
                                            <div key={org.id}>
                                                <button
                                                    onClick={() => setExpandedOrganizer(expandedOrganizer === org.id ? null : org.id)}
                                                    className="w-full flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-sky-50/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                            {org.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold text-gray-900 text-sm">{org.name}</p>
                                                                {org.stripeReady ? (
                                                                    <span className="text-xs px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded font-medium">Stripe ✓</span>
                                                                ) : (
                                                                    <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-500 rounded font-medium">Pas Stripe</span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500">{org.email} · {org.paymentCount} paiement{org.paymentCount > 1 ? 's' : ''}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right hidden sm:block">
                                                            <p className="text-xs text-gray-400">Commission</p>
                                                            <p className="text-sm font-bold text-violet-600">{org.platformFees.toFixed(2)}€</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-400">Créateur</p>
                                                            <p className="text-lg font-bold text-emerald-600">{org.creatorAmount.toFixed(2)}€</p>
                                                        </div>
                                                        {expandedOrganizer === org.id ? (
                                                            <ChevronUp className="h-4 w-4 text-gray-400" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                </button>
                                                {expandedOrganizer === org.id && (
                                                    <div className="bg-gray-50 px-5 sm:px-6 py-3 space-y-2">
                                                        {stripeMovements
                                                            .filter(m => m.organizerId === org.id)
                                                            .map(m => {
                                                                const status = getPayoutStatus(m);
                                                                const StatusIcon = status.icon;
                                                                return (
                                                                    <div key={m.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                                                                        {m.eventImage ? (
                                                                            <img src={m.eventImage} alt={m.eventTitle} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                                                        ) : (
                                                                            <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center shrink-0">
                                                                                <Calendar className="h-5 w-5 text-sky-500" />
                                                                            </div>
                                                                        )}
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-semibold text-gray-900 truncate">{m.eventTitle}</p>
                                                                            <p className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleDateString('fr-FR')} · {m.amount.toFixed(2)}€</p>
                                                                        </div>
                                                                        <div className="text-right shrink-0">
                                                                            <p className="text-sm font-bold text-emerald-600">{m.creatorAmount.toFixed(2)}€</p>
                                                                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${status.color} px-1.5 py-0.5 rounded`}>
                                                                                <StatusIcon className="h-3 w-3" />{status.label}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
