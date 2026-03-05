'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Euro, TrendingUp, RotateCcw, Loader2, CheckCircle, XCircle, Clock, AlertTriangle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentItem {
    id: string;
    amount: number;
    platformFee: number;
    creatorAmount: number;
    currency: string;
    status: string;
    createdAt: string;
    refundedAt: string | null;
    eventId: string;
    eventTitle: string;
    eventDate: string | null;
    eventStatus: string | null;
    registrationId: string | null;
}

interface FeeInfo {
    fixedFee: number;
    threshold: number;
    percentAbove: number;
    stripeFeePercent: number;
    stripeFeeFixed: number;
    stripeConnectPercent: number;
}

interface Stats {
    totalEarned: number;
    totalRefunded: number;
    totalPlatformFees: number;
    totalPayments: number;
    totalRefunds: number;
}

export default function MyPaymentsPage() {
    const { user } = useAuth();
    const [payments, setPayments] = useState<PaymentItem[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [feeInfo, setFeeInfo] = useState<FeeInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [refunding, setRefunding] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showFeeInfo, setShowFeeInfo] = useState(false);
    const [confirmRefund, setConfirmRefund] = useState<{ isOpen: boolean; paymentId: string | null; eventTitle: string | null; amount: number }>({ isOpen: false, paymentId: null, eventTitle: null, amount: 0 });

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/organizer/payments', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setPayments(data.payments);
                setStats(data.stats);
                setFeeInfo(data.feeInfo);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefund = async () => {
        const { paymentId, eventTitle } = confirmRefund;
        if (!paymentId) return;

        setConfirmRefund({ isOpen: false, paymentId: null, eventTitle: null, amount: 0 });
        setRefunding(paymentId);
        setMessage(null);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/stripe/refund', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ paymentId, reason: 'Remboursement par l\'organisateur' }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: `Remboursement effectué pour "${eventTitle}"` });
                fetchPayments();
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Erreur lors du remboursement' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Erreur réseau' });
        } finally {
            setRefunding(null);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SUCCEEDED':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="h-3 w-3" /> Payé
                    </span>
                );
            case 'REFUNDED':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                        <RotateCcw className="h-3 w-3" /> Remboursé
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="h-3 w-3" /> En attente
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200">
                        {status}
                    </span>
                );
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-sky-500 mx-auto mb-4" />
                        <p className="text-gray-500">Chargement de vos paiements...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-sky-600 transition-colors mb-4">
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Retour au tableau de bord
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mes Paiements Reçus</h1>
                    <p className="text-gray-500 mt-1">Suivez vos revenus et gérez les remboursements</p>
                </div>

                {/* Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        {message.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                                    <Euro className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalEarned.toFixed(2)}€</p>
                                    <p className="text-xs text-gray-500 font-medium">Revenus nets</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center shrink-0">
                                    <TrendingUp className="h-5 w-5 text-sky-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
                                    <p className="text-xs text-gray-500 font-medium">Paiements reçus</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                                    <Euro className="h-5 w-5 text-amber-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalPlatformFees.toFixed(2)}€</p>
                                    <p className="text-xs text-gray-500 font-medium">Frais plateforme</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                                    <RotateCcw className="h-5 w-5 text-red-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalRefunds}</p>
                                    <p className="text-xs text-gray-500 font-medium">Remboursements</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Fee Info Toggle */}
                {feeInfo && (
                    <div className="mb-6">
                        <button
                            onClick={() => setShowFeeInfo(!showFeeInfo)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Info className="h-4 w-4 text-sky-500" />
                            {showFeeInfo ? 'Masquer' : 'Voir'} les tarifs en vigueur
                        </button>
                        {showFeeInfo && (
                            <div className="mt-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                                <h3 className="text-base font-bold text-gray-900 mb-4">Tarifs en vigueur</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
                                        <h4 className="text-sm font-bold text-sky-900 mb-2">Commission plateforme</h4>
                                        <ul className="space-y-1.5 text-sm text-sky-800">
                                            <li>• Ticket ≤ {feeInfo.threshold}€ : <strong>{feeInfo.fixedFee.toFixed(2)}€ fixe</strong></li>
                                            <li>• Ticket &gt; {feeInfo.threshold}€ : <strong>{feeInfo.percentAbove}%</strong> du montant</li>
                                        </ul>
                                    </div>
                                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                        <h4 className="text-sm font-bold text-purple-900 mb-2">Frais Stripe (déduits automatiquement)</h4>
                                        <ul className="space-y-1.5 text-sm text-purple-800">
                                            <li>• Transaction : <strong>{feeInfo.stripeFeePercent}% + {feeInfo.stripeFeeFixed.toFixed(2)}€</strong></li>
                                            <li>• Connect : <strong>{feeInfo.stripeConnectPercent}%</strong> par virement</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="mt-4 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                    <h4 className="text-sm font-bold text-emerald-900 mb-2">Exemple pour un ticket à 50€</h4>
                                    <div className="grid grid-cols-3 gap-2 text-sm text-emerald-800">
                                        <div className="text-center">
                                            <p className="font-bold text-lg">1.70€</p>
                                            <p className="text-xs">Frais Stripe</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-lg">{feeInfo.fixedFee.toFixed(2)}€</p>
                                            <p className="text-xs">Commission plateforme</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-lg text-emerald-700">{(50 - 1.70 - feeInfo.fixedFee).toFixed(2)}€</p>
                                            <p className="text-xs font-bold">Vous recevez</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Payments Table */}
                {payments.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Euro className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun paiement reçu</h3>
                        <p className="text-gray-500 mb-6">Les paiements apparaîtront ici quand des participants s'inscriront à vos événements payants.</p>
                        <Link href="/events/create" className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg">
                            Créer un événement
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="text-left px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wider">Événement</th>
                                        <th className="text-left px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wider">Date</th>
                                        <th className="text-right px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wider">Montant</th>
                                        <th className="text-right px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wider">Frais</th>
                                        <th className="text-right px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wider">Vous recevez</th>
                                        <th className="text-center px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wider">Statut</th>
                                        <th className="text-center px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {payments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <Link href={`/events/${payment.eventId}`} className="font-semibold text-gray-900 hover:text-sky-600 transition-colors">
                                                    {payment.eventTitle}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                                {format(new Date(payment.createdAt), 'd MMM yyyy HH:mm', { locale: fr })}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                                                {payment.amount.toFixed(2)}€
                                            </td>
                                            <td className="px-4 py-3 text-right text-amber-600 font-medium whitespace-nowrap">
                                                -{payment.platformFee.toFixed(2)}€
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                                                {payment.creatorAmount.toFixed(2)}€
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getStatusBadge(payment.status)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {payment.status === 'SUCCEEDED' && (
                                                    <button
                                                        onClick={() => setConfirmRefund({ isOpen: true, paymentId: payment.id, eventTitle: payment.eventTitle, amount: payment.amount })}
                                                        disabled={refunding === payment.id}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                                                    >
                                                        {refunding === payment.id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <RotateCcw className="h-3 w-3" />
                                                        )}
                                                        Rembourser
                                                    </button>
                                                )}
                                                {payment.status === 'REFUNDED' && payment.refundedAt && (
                                                    <span className="text-xs text-gray-400">
                                                        {format(new Date(payment.refundedAt), 'd MMM yyyy', { locale: fr })}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de confirmation de remboursement */}
            {confirmRefund.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmRefund({ isOpen: false, paymentId: null, eventTitle: null, amount: 0 })}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-red-100">
                                <RotateCcw className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmer le remboursement</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Vous allez rembourser <strong>{confirmRefund.amount.toFixed(2)}€</strong> pour l'inscription à <strong>"{confirmRefund.eventTitle}"</strong>.
                                    <br /><br />
                                    <span className="text-red-600 font-medium">Cette action est irréversible.</span> Le participant sera remboursé et son inscription sera annulée.
                                </p>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setConfirmRefund({ isOpen: false, paymentId: null, eventTitle: null, amount: 0 })}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleRefund}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                                    >
                                        Rembourser
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
