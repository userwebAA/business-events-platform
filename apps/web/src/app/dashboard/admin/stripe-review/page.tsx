'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { TrendingUp, DollarSign, CreditCard, RefreshCw, Users, ArrowUpRight, ArrowDownRight, Loader2, Euro, BarChart3 } from 'lucide-react';

interface StripeStats {
    overview: {
        totalPayments: number;
        succeededPayments: number;
        refundedPayments: number;
        failedPayments: number;
        totalRevenue: number;
        totalPlatformFees: number;
        totalCreatorAmount: number;
        totalRefunded: number;
        totalPayouts: number;
        averageTransactionValue: number;
        platformFeePercentage: number;
    };
    monthlyStats: Array<{
        month: string;
        revenue: number;
        fees: number;
        count: number;
    }>;
    recentTransactions: Array<{
        id: string;
        amount: number;
        platformFee: number;
        status: string;
        createdAt: string;
        userName: string;
        userEmail: string;
    }>;
    topOrganizers: Array<{
        organizerId: string;
        name: string;
        email: string;
        totalRevenue: number;
        totalFees: number;
        count: number;
    }>;
}

export default function StripeReviewPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [stats, setStats] = useState<StripeStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            router.push('/dashboard');
            return;
        }

        fetchStats();
    }, [user, router]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/stripe-stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-500">Chargement des statistiques...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <p className="text-gray-500">Erreur lors du chargement des données</p>
                </div>
            </div>
        );
    }

    const { overview, monthlyStats, recentTransactions, topOrganizers } = stats;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
            <Navbar />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        📊 Statistiques Stripe
                    </h1>
                    <p className="text-gray-600">
                        Vue d'ensemble des transactions et commissions de la plateforme
                    </p>
                </div>

                {/* Cartes de statistiques principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Revenus totaux */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                                <ArrowUpRight className="h-4 w-4" />
                                {overview.succeededPayments}
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Revenus totaux</p>
                        <p className="text-2xl font-bold text-gray-900">{overview.totalRevenue.toFixed(2)} €</p>
                    </div>

                    {/* Commissions plateforme */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex items-center gap-1 text-blue-600 text-sm font-semibold">
                                {overview.platformFeePercentage.toFixed(1)}%
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Commissions</p>
                        <p className="text-2xl font-bold text-gray-900">{overview.totalPlatformFees.toFixed(2)} €</p>
                    </div>

                    {/* Montant créateurs */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl flex items-center justify-center">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex items-center gap-1 text-purple-600 text-sm font-semibold">
                                {topOrganizers.length} orga.
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Montant créateurs</p>
                        <p className="text-2xl font-bold text-gray-900">{overview.totalCreatorAmount.toFixed(2)} €</p>
                    </div>

                    {/* Remboursements */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-600 rounded-xl flex items-center justify-center">
                                <RefreshCw className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex items-center gap-1 text-red-600 text-sm font-semibold">
                                <ArrowDownRight className="h-4 w-4" />
                                {overview.refundedPayments}
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Remboursements</p>
                        <p className="text-2xl font-bold text-gray-900">{overview.totalRefunded.toFixed(2)} €</p>
                    </div>
                </div>

                {/* Statistiques supplémentaires */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            <p className="text-sm font-semibold text-blue-900">Transactions totales</p>
                        </div>
                        <p className="text-3xl font-bold text-blue-900">{overview.totalPayments}</p>
                        <p className="text-xs text-blue-700 mt-1">
                            {overview.succeededPayments} réussies • {overview.failedPayments} échouées
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Euro className="h-5 w-5 text-emerald-600" />
                            <p className="text-sm font-semibold text-emerald-900">Valeur moyenne</p>
                        </div>
                        <p className="text-3xl font-bold text-emerald-900">{overview.averageTransactionValue.toFixed(2)} €</p>
                        <p className="text-xs text-emerald-700 mt-1">Par transaction réussie</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <BarChart3 className="h-5 w-5 text-purple-600" />
                            <p className="text-sm font-semibold text-purple-900">Payouts effectués</p>
                        </div>
                        <p className="text-3xl font-bold text-purple-900">{overview.totalPayouts.toFixed(2)} €</p>
                        <p className="text-xs text-purple-700 mt-1">Virés aux créateurs</p>
                    </div>
                </div>

                {/* Graphique mensuel */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">📈 Évolution mensuelle</h2>
                    <div className="space-y-4">
                        {monthlyStats.map((month, index) => {
                            const maxRevenue = Math.max(...monthlyStats.map(m => m.revenue));
                            const widthPercentage = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                            
                            return (
                                <div key={index}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-gray-700">{month.month}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-gray-500">{month.count} transactions</span>
                                            <span className="text-sm font-bold text-emerald-600">{month.revenue.toFixed(2)} €</span>
                                        </div>
                                    </div>
                                    <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                                        <div 
                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-green-600 rounded-lg transition-all duration-500"
                                            style={{ width: `${widthPercentage}%` }}
                                        />
                                        <div className="absolute inset-0 flex items-center px-3">
                                            <span className="text-xs font-semibold text-gray-700">
                                                Commission: {month.fees.toFixed(2)} €
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top organisateurs */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">🏆 Top Organisateurs</h2>
                        <div className="space-y-3">
                            {topOrganizers.slice(0, 5).map((org, index) => (
                                <div key={org.organizerId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                                        index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white' :
                                        'bg-gray-200 text-gray-600'
                                    }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{org.name}</p>
                                        <p className="text-xs text-gray-500">{org.count} événements</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-600">{org.totalRevenue.toFixed(2)} €</p>
                                        <p className="text-xs text-gray-500">-{org.totalFees.toFixed(2)} € comm.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Transactions récentes */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">💳 Transactions récentes</h2>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {recentTransactions.slice(0, 10).map((transaction) => (
                                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{transaction.userName}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
                                                day: '2-digit',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${
                                            transaction.status === 'SUCCEEDED' ? 'text-emerald-600' :
                                            transaction.status === 'REFUNDED' ? 'text-orange-600' :
                                            transaction.status === 'FAILED' ? 'text-red-600' :
                                            'text-gray-600'
                                        }`}>
                                            {transaction.amount.toFixed(2)} €
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {transaction.status === 'SUCCEEDED' && `+${transaction.platformFee.toFixed(2)} € comm.`}
                                            {transaction.status === 'REFUNDED' && 'Remboursé'}
                                            {transaction.status === 'FAILED' && 'Échoué'}
                                            {transaction.status === 'PENDING' && 'En attente'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
