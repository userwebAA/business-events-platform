'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Mail, Phone, Building } from 'lucide-react';
import { Event, Registration } from 'shared';

export default function ParticipantsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;
    const [event, setEvent] = useState<Event | null>(null);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const [eventRes, registrationsRes] = await Promise.all([
                    fetch(`/api/events/${eventId}`),
                    fetch(`/api/registrations?eventId=${eventId}`),
                ]);

                const eventData = await eventRes.json();
                const registrationsData = await registrationsRes.json();

                setEvent(eventData);
                setRegistrations(registrationsData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, router, eventId]);

    const exportToCSV = () => {
        const headers = ['Nom', 'Email', 'Entreprise', 'Poste', 'Téléphone', 'Date d\'inscription'];
        const rows = registrations.map((reg) => [
            reg.attendeeName,
            reg.attendeeEmail,
            reg.formData.company || '',
            reg.formData.position || '',
            reg.formData.phone || '',
            new Date(reg.createdAt).toLocaleDateString('fr-FR'),
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `participants_${event?.title || 'event'}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!user) {
        return null;
    }

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
                    <h2 className="text-2xl font-bold text-gray-900">Événement non trouvé</h2>
                    <Link href="/dashboard" className="mt-4 text-sky-500 hover:text-sky-600">
                        Retour au dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-sky-500 hover:text-sky-600 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour au dashboard
                    </Link>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                            <p className="text-gray-600 mt-2">
                                {registrations.length} participant{registrations.length > 1 ? 's' : ''} inscrit
                                {registrations.length > 1 ? 's' : ''}
                            </p>
                        </div>
                        {registrations.length > 0 && (
                            <button
                                onClick={exportToCSV}
                                className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                Exporter CSV
                            </button>
                        )}
                    </div>
                </div>

                {registrations.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <Mail className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun participant</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Les participants apparaîtront ici une fois qu'ils se seront inscrits.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Participant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Entreprise
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Poste
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Inscription
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {registrations.map((registration) => (
                                    <tr key={registration.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {registration.attendeeName}
                                                </div>
                                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {registration.attendeeEmail}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1 text-sm text-gray-900">
                                                <Building className="h-4 w-4 text-gray-400" />
                                                {registration.formData.company || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {registration.formData.position || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1 text-sm text-gray-900">
                                                <Phone className="h-4 w-4 text-gray-400" />
                                                {registration.formData.phone || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(registration.createdAt).toLocaleDateString('fr-FR')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
