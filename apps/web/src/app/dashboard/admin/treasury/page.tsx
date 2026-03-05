'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import {
    ArrowLeft, Euro, Users, Calendar, TrendingUp,
    Loader2, ChevronDown, ChevronUp, User, CreditCard,
    Clock, CheckCircle, AlertCircle, ArrowDownRight, ArrowUpRight, Banknote, RotateCcw, Trash2, Unlink, RefreshCw
} from 'lucide-react';

interface StripeMovement {
    id: string;
    type: 'payment';
    stripePaymentId: string;
    amount: number;
    platformFee: number;
    stripeFee: number;
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
    refundedAt: string | null;
    stripeRefundId: string | null;
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

interface StripeAccount {
    id: string;
    name: string | null;
    displayName: string;
    email: string;
    stripeAccountId: string | null;
    stripeOnboardingComplete: boolean;
    stripeStatus: 'active' | 'pending' | 'rejected' | 'restricted' | 'invalid' | 'unknown';
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    disabledReason: string | null;
}

interface Summary {
    totalRevenue: number;
    totalStripeRevenue: number;
    totalLegacyRevenue: number;
    totalPlatformFees: number;
    totalCreatorAmount: number;
    totalStripeFees: number;
    totalPayments: number;
    totalPayouts: number;
    pendingPayoutAmount: number;
    waitingPayoutAmount: number;
    pendingPayoutCount: number;
    waitingPayoutCount: number;
    totalRefunded: number;
    totalRefundedCount: number;
    totalRefundedStripeFees: number;
}

export default function AdminTreasuryPage() {
    const { user } = useAuth();
    const [stripeMovements, setStripeMovements] = useState<StripeMovement[]>([]);
    const [legacyMovements, setLegacyMovements] = useState<LegacyMovement[]>([]);
    const [payouts, setPayouts] = useState<PayoutItem[]>([]);
    const [organizerStats, setOrganizerStats] = useState<OrganizerStat[]>([]);
    const [summary, setSummary] = useState<Summary>({ totalRevenue: 0, totalStripeRevenue: 0, totalLegacyRevenue: 0, totalPlatformFees: 0, totalCreatorAmount: 0, totalStripeFees: 0, totalPayments: 0, totalPayouts: 0, pendingPayoutAmount: 0, waitingPayoutAmount: 0, pendingPayoutCount: 0, waitingPayoutCount: 0, totalRefunded: 0, totalRefundedCount: 0, totalRefundedStripeFees: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'payments' | 'payouts' | 'organizers'>('payments');
    const [expandedOrganizer, setExpandedOrganizer] = useState<string | null>(null);
    const [refundingId, setRefundingId] = useState<string | null>(null);
    const [refundMessage, setRefundMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [stripeAccounts, setStripeAccounts] = useState<StripeAccount[]>([]);
    const [stripeActionLoading, setStripeActionLoading] = useState<string | null>(null);
    const [stripeMessage, setStripeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; action: 'reset' | 'unlink' | null; userId: string | null; userName: string | null }>({ isOpen: false, action: null, userId: null, userName: null });

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    useEffect(() => {
        if (!isAdmin) return;
        fetchTreasury();
        fetchStripeAccounts();
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

    const fetchStripeAccounts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/stripe-accounts', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setStripeAccounts(data);
            }
        } catch (error) {
            console.error('Error fetching stripe accounts:', error);
        }
    };

    const openConfirmModal = (userId: string, action: 'reset' | 'unlink', userName: string) => {
        setConfirmModal({ isOpen: true, action, userId, userName });
    };

    const closeConfirmModal = () => {
        setConfirmModal({ isOpen: false, action: null, userId: null, userName: null });
    };

    const handleStripeAction = async () => {
        const { userId, action, userName } = confirmModal;
        if (!userId || !action || !userName) return;

        closeConfirmModal();
        setStripeActionLoading(`${userId}-${action}`);
        setStripeMessage(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/stripe-accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId, action }),
            });
            const data = await res.json();
            if (res.ok) {
                setStripeMessage({ type: 'success', text: data.message });
                fetchStripeAccounts();
                fetchTreasury();
            } else {
                setStripeMessage({ type: 'error', text: data.error || 'Erreur' });
            }
        } catch {
            setStripeMessage({ type: 'error', text: 'Erreur de connexion' });
        } finally {
            setStripeActionLoading(null);
        }
    };

    const getStripeStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return { label: 'Actif', color: 'text-emerald-600 bg-emerald-50' };
            case 'pending': return { label: 'En attente', color: 'text-amber-600 bg-amber-50' };
            case 'rejected': return { label: 'Rejeté', color: 'text-red-600 bg-red-50' };
            case 'restricted': return { label: 'Restreint', color: 'text-orange-600 bg-orange-50' };
            case 'invalid': return { label: 'Invalide', color: 'text-gray-600 bg-gray-100' };
            default: return { label: 'Inconnu', color: 'text-gray-500 bg-gray-50' };
        }
    };

    const handleRefund = async (paymentId: string, eventTitle: string, amount: number) => {
        if (!confirm(`Rembourser ${amount.toFixed(2)}€ pour "${eventTitle}" ?\nCette action est irréversible.`)) return;

        setRefundingId(paymentId);
        setRefundMessage(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/stripe/refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ paymentId, reason: 'Remboursement admin' }),
            });
            const data = await res.json();
            if (res.ok) {
                setRefundMessage({ type: 'success', text: `Remboursement de ${amount.toFixed(2)}€ effectué` });
                fetchTreasury();
            } else {
                setRefundMessage({ type: 'error', text: data.error || 'Erreur lors du remboursement' });
            }
        } catch {
            setRefundMessage({ type: 'error', text: 'Erreur de connexion' });
        } finally {
            setRefundingId(null);
        }
    };

    const getPayoutStatus = (m: StripeMovement) => {
        if (m.status === 'REFUNDED') return { label: 'Remboursé', color: 'text-red-600 bg-red-50', icon: ArrowDownRight };
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 mb-8">
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
                            <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-lg p-4 sm:p-5 text-white">
                                <CreditCard className="h-6 w-6 opacity-80 mb-2" />
                                <p className="text-xs opacity-80">Commission Stripe</p>
                                <p className="text-xl sm:text-2xl font-bold">{summary.totalStripeFees.toFixed(2)}€</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg p-4 sm:p-5 text-white">
                                <ArrowUpRight className="h-6 w-6 opacity-80 mb-2" />
                                <p className="text-xs opacity-80">Versé aux créateurs</p>
                                <p className="text-xl sm:text-2xl font-bold">{(summary.totalCreatorAmount - summary.totalStripeFees).toFixed(2)}€</p>
                            </div>
                            <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl shadow-lg p-4 sm:p-5 text-white">
                                <CreditCard className="h-6 w-6 opacity-80 mb-2" />
                                <p className="text-xs opacity-80">Paiements Stripe</p>
                                <p className="text-xl sm:text-2xl font-bold">{summary.totalPayments}</p>
                            </div>
                            {summary.totalRefundedCount > 0 && (
                                <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg p-4 sm:p-5 text-white">
                                    <ArrowDownRight className="h-6 w-6 opacity-80 mb-2" />
                                    <p className="text-xs opacity-80">Remboursements</p>
                                    <p className="text-xl sm:text-2xl font-bold">-{summary.totalRefunded.toFixed(2)}€</p>
                                    <p className="text-xs opacity-70">{summary.totalRefundedCount} remb. · Frais Stripe perdus: {summary.totalRefundedStripeFees.toFixed(2)}€</p>
                                </div>
                            )}
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

                        {/* Message de remboursement */}
                        {refundMessage && (
                            <div className={`mb-4 px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${refundMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {refundMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                {refundMessage.text}
                                <button onClick={() => setRefundMessage(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
                            </div>
                        )}

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
                                                    <th className="text-right px-5 py-3 font-semibold hidden lg:table-cell">Frais Stripe</th>
                                                    <th className="text-right px-5 py-3 font-semibold hidden lg:table-cell">Créateur</th>
                                                    <th className="text-center px-5 py-3 font-semibold">Statut</th>
                                                    <th className="text-center px-5 py-3 font-semibold">Actions</th>
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
                                                            <td className="px-5 py-3 text-right text-rose-500 font-medium hidden lg:table-cell">{m.stripeFee.toFixed(2)}€</td>
                                                            <td className="px-5 py-3 text-right text-emerald-600 font-medium hidden lg:table-cell">{(m.creatorAmount - m.stripeFee).toFixed(2)}€</td>
                                                            <td className="px-5 py-3 text-center">
                                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${status.color}`}>
                                                                    <StatusIcon className="h-3 w-3" />
                                                                    {status.label}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-3 text-center">
                                                                {m.status === 'SUCCEEDED' && !m.refundedAt ? (
                                                                    <button
                                                                        onClick={() => handleRefund(m.id, m.eventTitle, m.amount)}
                                                                        disabled={refundingId === m.id}
                                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                                                                    >
                                                                        {refundingId === m.id ? (
                                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                                        ) : (
                                                                            <RotateCcw className="h-3 w-3" />
                                                                        )}
                                                                        Rembourser
                                                                    </button>
                                                                ) : m.status === 'REFUNDED' ? (
                                                                    <span className="text-xs text-gray-400">Remboursé</span>
                                                                ) : (
                                                                    <span className="text-xs text-gray-300">—</span>
                                                                )}
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
                                                        <td className="px-5 py-3 text-right text-gray-400 hidden lg:table-cell">—</td>
                                                        <td className="px-5 py-3 text-center">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-500 bg-gray-100">
                                                                Legacy
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 text-center">
                                                            <span className="text-xs text-gray-300">—</span>
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
                            <>
                                {/* Gestion comptes Stripe Connect */}
                                {stripeAccounts.length > 0 && (
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                                        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                <CreditCard className="h-5 w-5 text-violet-500" />
                                                Comptes Stripe Connect
                                            </h2>
                                            <button onClick={() => fetchStripeAccounts()} className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1">
                                                <RefreshCw className="h-3 w-3" /> Actualiser
                                            </button>
                                        </div>

                                        {stripeMessage && (
                                            <div className={`mx-5 mt-4 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${stripeMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                                {stripeMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                                {stripeMessage.text}
                                                <button onClick={() => setStripeMessage(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
                                            </div>
                                        )}

                                        <div className="divide-y divide-gray-50">
                                            {stripeAccounts.map((acc) => {
                                                const badge = getStripeStatusBadge(acc.stripeStatus);
                                                return (
                                                    <div key={acc.id} className="px-5 sm:px-6 py-4 flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                                {acc.displayName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <p className="font-semibold text-gray-900 text-sm truncate">{acc.displayName}</p>
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${badge.color}`}>
                                                                        {badge.label}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-500 truncate">{acc.email}</p>
                                                                {acc.stripeAccountId && (
                                                                    <p className="text-xs text-gray-400 font-mono truncate">{acc.stripeAccountId}</p>
                                                                )}
                                                                {acc.disabledReason && (
                                                                    <p className="text-xs text-red-500 mt-0.5">{acc.disabledReason}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <button
                                                                onClick={() => openConfirmModal(acc.id, 'reset', acc.displayName)}
                                                                disabled={stripeActionLoading === `${acc.id}-reset`}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                                                                title="Supprimer le compte sur Stripe + délier"
                                                            >
                                                                {stripeActionLoading === `${acc.id}-reset` ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-3 w-3" />
                                                                )}
                                                                Reset
                                                            </button>
                                                            <button
                                                                onClick={() => openConfirmModal(acc.id, 'unlink', acc.displayName)}
                                                                disabled={stripeActionLoading === `${acc.id}-unlink`}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-50"
                                                                title="Délier le compte sans supprimer sur Stripe"
                                                            >
                                                                {stripeActionLoading === `${acc.id}-unlink` ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <Unlink className="h-3 w-3" />
                                                                )}
                                                                Délier
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Recettes par organisateur */}
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
                                                                <p className="text-xs text-gray-400">Créateur (net)</p>
                                                                <p className="text-lg font-bold text-emerald-600">{(org.creatorAmount - stripeMovements.filter(m => m.organizerId === org.id && m.status === 'SUCCEEDED').reduce((sum, m) => sum + m.stripeFee, 0)).toFixed(2)}€</p>
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
                                                                                <p className="text-sm font-bold text-emerald-600">{(m.creatorAmount - m.stripeFee).toFixed(2)}€</p>
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
                            </>
                        )}
                    </>
                )}

                {/* Modal de confirmation */}
                {confirmModal.isOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeConfirmModal}>
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${confirmModal.action === 'reset' ? 'bg-red-100' : 'bg-amber-100'
                                    }`}>
                                    {confirmModal.action === 'reset' ? (
                                        <Trash2 className="h-6 w-6 text-red-600" />
                                    ) : (
                                        <Unlink className="h-6 w-6 text-amber-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                                        {confirmModal.action === 'reset' ? 'Réinitialiser le compte Stripe' : 'Délier le compte Stripe'}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        {confirmModal.action === 'reset' ? (
                                            <>
                                                Le compte Stripe de <strong>{confirmModal.userName}</strong> sera <strong className="text-red-600">supprimé sur Stripe</strong> et délié de la base de données.
                                                <br /><br />
                                                L'utilisateur pourra recréer un nouveau compte.
                                            </>
                                        ) : (
                                            <>
                                                Le compte Stripe de <strong>{confirmModal.userName}</strong> sera <strong className="text-amber-600">délié</strong> de la base de données mais <strong>restera actif sur Stripe</strong>.
                                            </>
                                        )}
                                    </p>
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={closeConfirmModal}
                                            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleStripeAction}
                                            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${confirmModal.action === 'reset'
                                                    ? 'bg-red-600 hover:bg-red-700'
                                                    : 'bg-amber-600 hover:bg-amber-700'
                                                }`}
                                        >
                                            {confirmModal.action === 'reset' ? 'Réinitialiser' : 'Délier'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
