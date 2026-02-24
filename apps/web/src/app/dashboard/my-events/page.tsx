'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Users, Edit, Trash2, Eye, Plus, Lock, Copy, Check, ExternalLink } from 'lucide-react';
import { Event } from 'shared';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Navbar from '@/components/Navbar';
import DeleteModal from '@/components/DeleteModal';

export default function MyEventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
    const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; eventId: string | null; eventTitle: string }>({
        isOpen: false,
        eventId: null,
        eventTitle: '',
    });
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/events');
            const data = await response.json();
            setEvents(data.map((e: any) => ({ ...e, date: new Date(e.date) })));
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const openDeleteModal = (id: string, title: string) => {
        setDeleteModal({ isOpen: true, eventId: id, eventTitle: title });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, eventId: null, eventTitle: '' });
    };

    const handleDelete = async () => {
        if (!deleteModal.eventId) return;

        setDeleting(true);
        try {
            const response = await fetch(`/api/events/${deleteModal.eventId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setEvents(events.filter(e => e.id !== deleteModal.eventId));
                closeDeleteModal();
            } else {
                alert('Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Erreur lors de la suppression');
        } finally {
            setDeleting(false);
        }
    };

    const filteredEvents = events.filter(event => {
        const now = new Date();
        const eventDate = new Date(event.date);

        // Filtre par date
        if (filter === 'upcoming' && eventDate <= now) return false;
        if (filter === 'past' && eventDate > now) return false;

        // Filtre par visibilité
        if (visibilityFilter === 'public' && event.isPrivate) return false;
        if (visibilityFilter === 'private' && !event.isPrivate) return false;

        return true;
    });

    const stats = {
        total: events.length,
        upcoming: events.filter(e => new Date(e.date) > new Date()).length,
        past: events.filter(e => new Date(e.date) <= new Date()).length,
        private: events.filter(e => e.isPrivate).length,
        public: events.filter(e => !e.isPrivate).length,
    };

    const copyPrivateLink = (token: string) => {
        const link = `${window.location.origin}/events/private/${token}`;
        navigator.clipboard.writeText(link);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <Link href="/dashboard" className="inline-flex items-center text-sky-600 hover:text-sky-700 mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour au tableau de bord
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Mes Événements</h1>
                            <p className="text-gray-600 mt-1">Gérez tous vos événements créés</p>
                        </div>
                        <Link href="/events/create" className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl">
                            <Plus className="h-5 w-5" />
                            Créer un événement
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-sky-500">
                        <p className="text-sm font-medium text-gray-600">Total</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                        <p className="text-sm font-medium text-gray-600">À venir</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.upcoming}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-500">
                        <p className="text-sm font-medium text-gray-600">Passés</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.past}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-600">Publics</p>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.public}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
                        <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-red-600" />
                            <p className="text-sm font-medium text-gray-600">Privés</p>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.private}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-4 mb-6 space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Filtrer par date :</p>
                        <div className="flex gap-2">
                            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'all' ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                Tous ({stats.total})
                            </button>
                            <button onClick={() => setFilter('upcoming')} className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'upcoming' ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                À venir ({stats.upcoming})
                            </button>
                            <button onClick={() => setFilter('past')} className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'past' ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                Passés ({stats.past})
                            </button>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Filtrer par visibilité :</p>
                        <div className="flex gap-2">
                            <button onClick={() => setVisibilityFilter('all')} className={`px-4 py-2 rounded-lg font-medium transition ${visibilityFilter === 'all' ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                Tous
                            </button>
                            <button onClick={() => setVisibilityFilter('public')} className={`px-4 py-2 rounded-lg font-medium transition ${visibilityFilter === 'public' ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                Publics ({stats.public})
                            </button>
                            <button onClick={() => setVisibilityFilter('private')} className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${visibilityFilter === 'private' ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                <Lock className="h-4 w-4" />
                                Privés ({stats.private})
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun événement</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {filter === 'all' ? 'Commencez par créer votre premier événement' : `Aucun événement ${filter === 'upcoming' ? 'à venir' : 'passé'}`}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Événement</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lieu</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visibilité</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredEvents.map((event) => {
                                        const isPast = new Date(event.date) <= new Date();
                                        return (
                                            <tr key={event.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="h-10 w-10 rounded-lg object-cover mr-3" />}
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{event.title}</div>
                                                            <div className="text-sm text-gray-500 truncate max-w-xs">{event.description}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{format(new Date(event.date), 'dd MMM yyyy', { locale: fr })}</div>
                                                    <div className="text-sm text-gray-500">{format(new Date(event.date), 'HH:mm')}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-900">
                                                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                                                        {event.location}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-900">
                                                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                                                        {event.currentAttendees}{event.maxAttendees && ` / ${event.maxAttendees}`}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${event.type === 'free' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                        {event.type === 'free' ? 'Gratuit' : `${event.price}€`}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {event.isPrivate ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                                <Lock className="h-3 w-3" />
                                                                Privé
                                                            </span>
                                                            {event.accessToken && (
                                                                <button
                                                                    onClick={() => copyPrivateLink(event.accessToken!)}
                                                                    className="p-1 hover:bg-gray-100 rounded transition"
                                                                    title="Copier le lien privé"
                                                                >
                                                                    {copiedToken === event.accessToken ? (
                                                                        <Check className="h-4 w-4 text-green-600" />
                                                                    ) : (
                                                                        <Copy className="h-4 w-4 text-gray-600" />
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                            Public
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isPast ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                                                        {isPast ? 'Terminé' : 'Actif'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {event.isPrivate && event.accessToken ? (
                                                            <a
                                                                href={`/events/private/${event.accessToken}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sky-600 hover:text-sky-900 p-2 hover:bg-sky-50 rounded-lg transition"
                                                                title="Voir (lien privé)"
                                                            >
                                                                <ExternalLink className="h-4 w-4" />
                                                            </a>
                                                        ) : (
                                                            <Link href={`/events/${event.id}`} className="text-sky-600 hover:text-sky-900 p-2 hover:bg-sky-50 rounded-lg transition" title="Voir">
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        )}
                                                        <button onClick={() => alert('Fonctionnalité à venir')} className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-50 rounded-lg transition" title="Modifier">
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => openDeleteModal(event.id, event.title)} className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <DeleteModal isOpen={deleteModal.isOpen} onClose={closeDeleteModal} onConfirm={handleDelete} title="Supprimer l'événement" message={`Êtes-vous sûr de vouloir supprimer "${deleteModal.eventTitle}" ? Cette action est irréversible.`} loading={deleting} />
            </div>
        </div>
    );
}
