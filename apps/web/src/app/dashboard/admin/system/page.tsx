'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, HardDrive, Cpu, Clock, AlertTriangle, TrendingUp, Activity } from 'lucide-react';

interface DatabaseStats {
    storage: {
        used: number;
        limit: number;
        percentage: number;
    };
    computeHours: {
        used: number;
        limit: number;
        percentage: number;
    };
    connections: {
        current: number;
        max: number;
    };
    tables: {
        users: number;
        events: number;
        registrations: number;
        payments: number;
    };
}

export default function SystemMonitoringPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DatabaseStats | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/system-stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setStats(data);
            } else if (res.status === 403) {
                router.push('/dashboard');
            } else {
                setError('Erreur lors de la récupération des statistiques');
            }
        } catch (err) {
            setError('Erreur de connexion');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (percentage: number) => {
        if (percentage >= 90) return 'text-red-600 bg-red-50 border-red-200';
        if (percentage >= 70) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-green-600 bg-green-50 border-green-200';
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 70) return 'bg-orange-500';
        return 'bg-green-500';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des statistiques système...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Monitoring Système</h1>
                    <p className="text-gray-600">Surveillance de l'utilisation de la base de données Neon (Free Plan)</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {stats && (
                    <div className="space-y-6">
                        {/* Plan Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-blue-100 p-3 rounded-lg">
                                    <Database className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Neon Free Plan</h2>
                                    <p className="text-sm text-gray-500">$0 / mois</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Stockage</p>
                                    <p className="font-semibold text-gray-900">0.5 GB</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Compute</p>
                                    <p className="font-semibold text-gray-900">2 CU</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Heures compute</p>
                                    <p className="font-semibold text-gray-900">100h / mois</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Branches</p>
                                    <p className="font-semibold text-gray-900">10 max</p>
                                </div>
                            </div>
                        </div>

                        {/* Storage Usage */}
                        <div className={`bg-white rounded-xl shadow-sm border-2 p-6 ${getStatusColor(stats.storage.percentage)}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-lg ${stats.storage.percentage >= 90 ? 'bg-red-100' : stats.storage.percentage >= 70 ? 'bg-orange-100' : 'bg-green-100'}`}>
                                        <HardDrive className={`h-6 w-6 ${stats.storage.percentage >= 90 ? 'text-red-600' : stats.storage.percentage >= 70 ? 'text-orange-600' : 'text-green-600'}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Stockage Base de Données</h3>
                                        <p className="text-sm opacity-75">{stats.storage.used.toFixed(2)} MB / {stats.storage.limit} MB</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold">{stats.storage.percentage.toFixed(1)}%</p>
                                    {stats.storage.percentage >= 90 && (
                                        <div className="flex items-center gap-1 text-sm mt-1">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span>Critique</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${getProgressColor(stats.storage.percentage)}`}
                                    style={{ width: `${Math.min(stats.storage.percentage, 100)}%` }}
                                ></div>
                            </div>
                            {stats.storage.percentage >= 80 && (
                                <p className="mt-3 text-sm font-medium">
                                    ⚠️ Attention : Vous approchez de la limite de stockage. Considérez un upgrade ou un nettoyage des données.
                                </p>
                            )}
                        </div>

                        {/* Compute Hours */}
                        <div className={`bg-white rounded-xl shadow-sm border-2 p-6 ${getStatusColor(stats.computeHours.percentage)}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-lg ${stats.computeHours.percentage >= 90 ? 'bg-red-100' : stats.computeHours.percentage >= 70 ? 'bg-orange-100' : 'bg-green-100'}`}>
                                        <Clock className={`h-6 w-6 ${stats.computeHours.percentage >= 90 ? 'text-red-600' : stats.computeHours.percentage >= 70 ? 'text-orange-600' : 'text-green-600'}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Heures de Compute</h3>
                                        <p className="text-sm opacity-75">{stats.computeHours.used.toFixed(1)}h / {stats.computeHours.limit}h ce mois</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold">{stats.computeHours.percentage.toFixed(1)}%</p>
                                    {stats.computeHours.percentage >= 90 && (
                                        <div className="flex items-center gap-1 text-sm mt-1">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span>Critique</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${getProgressColor(stats.computeHours.percentage)}`}
                                    style={{ width: `${Math.min(stats.computeHours.percentage, 100)}%` }}
                                ></div>
                            </div>
                            {stats.computeHours.percentage >= 80 && (
                                <p className="mt-3 text-sm font-medium">
                                    ⚠️ Attention : Vous approchez de la limite mensuelle. Le service pourrait être interrompu.
                                </p>
                            )}
                        </div>

                        {/* Connections */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-purple-100 p-3 rounded-lg">
                                    <Activity className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Connexions Actives</h3>
                                    <p className="text-sm text-gray-500">{stats.connections.current} / {stats.connections.max} connexions</p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 transition-all duration-500"
                                    style={{ width: `${(stats.connections.current / stats.connections.max) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Database Tables Stats */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-indigo-100 p-3 rounded-lg">
                                    <TrendingUp className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Statistiques des Tables</h3>
                                    <p className="text-sm text-gray-500">Nombre d'enregistrements par table</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-600 font-medium mb-1">Utilisateurs</p>
                                    <p className="text-2xl font-bold text-blue-900">{stats.tables.users.toLocaleString()}</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                                    <p className="text-sm text-green-600 font-medium mb-1">Événements</p>
                                    <p className="text-2xl font-bold text-green-900">{stats.tables.events.toLocaleString()}</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                                    <p className="text-sm text-purple-600 font-medium mb-1">Inscriptions</p>
                                    <p className="text-2xl font-bold text-purple-900">{stats.tables.registrations.toLocaleString()}</p>
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                                    <p className="text-sm text-orange-600 font-medium mb-1">Paiements</p>
                                    <p className="text-2xl font-bold text-orange-900">{stats.tables.payments.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Recommendations */}
                        {(stats.storage.percentage >= 70 || stats.computeHours.percentage >= 70) && (
                            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className="text-lg font-bold text-yellow-900 mb-2">Recommandations</h3>
                                        <ul className="space-y-2 text-sm text-yellow-800">
                                            {stats.storage.percentage >= 70 && (
                                                <li>• Envisagez de nettoyer les anciennes données ou de passer au plan payant</li>
                                            )}
                                            {stats.computeHours.percentage >= 70 && (
                                                <li>• Optimisez vos requêtes pour réduire la consommation de compute</li>
                                            )}
                                            <li>• Surveillez régulièrement ces métriques pour éviter les interruptions de service</li>
                                            <li>• Contactez le support Neon pour discuter d'un upgrade si nécessaire</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
