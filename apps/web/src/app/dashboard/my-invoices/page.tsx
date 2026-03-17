'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Calendar, Euro, Download, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

interface Invoice {
    registrationId: string;
    eventTitle: string;
    eventDate: Date;
    amount: number;
    currency: string;
    createdAt: Date;
    participantName: string;
}

export default function MyInvoicesPage() {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch('/api/user/registrations', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (res.ok) {
                const registrations = await res.json();
                const invoiceList = registrations
                    .filter((r: any) => r.event.type === 'paid' && r.event.price)
                    .map((r: any) => ({
                        registrationId: r.id,
                        eventTitle: r.event.title,
                        eventDate: new Date(r.event.date),
                        amount: r.event.price,
                        currency: r.event.currency || 'EUR',
                        createdAt: new Date(r.createdAt),
                        participantName: r.formData?.name || r.formData?.firstName || 'Participant',
                    }))
                    .sort((a: Invoice, b: Invoice) => b.createdAt.getTime() - a.createdAt.getTime());

                setInvoices(invoiceList);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (registrationId: string) => {
        setDownloadingId(registrationId);
        window.open(`/api/registrations/${registrationId}/invoice`, '_blank');
        setTimeout(() => setDownloadingId(null), 2000);
    };

    const isExpired = (createdAt: Date) => {
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        return createdAt < twoMonthsAgo;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold mb-4 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour au tableau de bord
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mes Factures</h1>
                    <p className="text-gray-500 mt-1">Téléchargez vos factures d'inscription aux événements payants</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="bg-gray-100 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <FileText className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Aucune facture disponible</h3>
                        <p className="text-gray-500 mb-6">
                            Vous n'avez pas encore d'inscription à un événement payant.
                        </p>
                        <Link
                            href="/events"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all"
                        >
                            Découvrir les événements
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Événement
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Date événement
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Montant
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Date achat
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Facture
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {invoices.map((invoice) => {
                                        const expired = isExpired(invoice.createdAt);
                                        return (
                                            <tr key={invoice.registrationId} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900">{invoice.eventTitle}</div>
                                                    <div className="text-sm text-gray-500">{invoice.participantName}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Calendar className="h-4 w-4" />
                                                        {format(invoice.eventDate, 'd MMM yyyy', { locale: fr })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1 font-bold text-gray-900">
                                                        {invoice.amount.toFixed(2)}
                                                        <Euro className="h-4 w-4" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-600">
                                                        {format(invoice.createdAt, 'd MMM yyyy', { locale: fr })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {expired ? (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 bg-gray-100 cursor-not-allowed">
                                                            <AlertCircle className="h-3.5 w-3.5" />
                                                            Expirée (2 mois)
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleDownload(invoice.registrationId)}
                                                            disabled={downloadingId === invoice.registrationId}
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all disabled:opacity-50"
                                                        >
                                                            {downloadingId === invoice.registrationId ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Download className="h-4 w-4" />
                                                            )}
                                                            Télécharger
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-blue-50 border-t border-blue-200 px-6 py-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-blue-700">
                                    <p className="font-semibold mb-1">Information importante</p>
                                    <p>Les factures sont disponibles pendant 2 mois après votre inscription. Passé ce délai, elles ne seront plus accessibles.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
