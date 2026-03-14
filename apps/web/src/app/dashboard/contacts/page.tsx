'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Upload, Mail, Users, X, FileSpreadsheet, Search, ChevronDown, ChevronUp, Pencil, Check, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import * as XLSX from 'xlsx';

interface ContactList {
    id: string;
    name: string;
    emails: string[];
    createdAt: string;
    updatedAt: string;
}

export default function ContactsPage() {
    const [lists, setLists] = useState<ContactList[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newEmails, setNewEmails] = useState('');
    const [importedEmails, setImportedEmails] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);
    const [expandedList, setExpandedList] = useState<string | null>(null);
    const [editingList, setEditingList] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmails, setEditEmails] = useState('');
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [importError, setImportError] = useState<string | null>(null);

    const fetchLists = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/contacts', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setLists(data);
            }
        } catch (error) {
            console.error('Erreur chargement contacts:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLists();
    }, [fetchLists]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportError(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const emails: string[] = [];

                jsonData.forEach((row) => {
                    row.forEach((cell) => {
                        if (typeof cell === 'string') {
                            const trimmed = cell.trim().toLowerCase();
                            if (emailRegex.test(trimmed)) {
                                emails.push(trimmed);
                            }
                        }
                    });
                });

                const unique = [...new Set(emails)];
                if (unique.length === 0) {
                    setImportError('Aucun email valide trouvé dans le fichier');
                    return;
                }
                setImportedEmails(unique);
                // Pré-remplir le nom si vide
                if (!newListName) {
                    setNewListName(file.name.replace(/\.(xlsx|xls|csv)$/i, ''));
                }
            } catch (err) {
                console.error('Erreur lecture fichier:', err);
                setImportError('Impossible de lire le fichier. Formats acceptés : .xlsx, .xls, .csv');
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleCreate = async () => {
        if (!newListName.trim()) return;

        // Combiner les emails saisis manuellement et importés
        const manualEmails = newEmails
            .split(/[\n,;]+/)
            .map(e => e.trim().toLowerCase())
            .filter(e => e.length > 0);
        const allEmails = [...new Set([...manualEmails, ...importedEmails])];

        if (allEmails.length === 0) {
            setImportError('Ajoutez au moins un email');
            return;
        }

        setCreating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name: newListName.trim(), emails: allEmails }),
            });

            if (res.ok) {
                setShowCreateModal(false);
                setNewListName('');
                setNewEmails('');
                setImportedEmails([]);
                setImportError(null);
                fetchLists();
            } else {
                const err = await res.json();
                setImportError(err.error || 'Erreur lors de la création');
            }
        } catch (error) {
            console.error('Erreur création liste:', error);
            setImportError('Erreur réseau');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer cette liste de contacts ?')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/contacts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            fetchLists();
        } catch (error) {
            console.error('Erreur suppression:', error);
        }
    };

    const handleEdit = (list: ContactList) => {
        setEditingList(list.id);
        setEditName(list.name);
        setEditEmails(list.emails.join('\n'));
    };

    const handleSaveEdit = async (id: string) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const emails = editEmails
                .split(/[\n,;]+/)
                .map(e => e.trim().toLowerCase())
                .filter(e => e.length > 0);

            const res = await fetch(`/api/contacts/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name: editName.trim(), emails }),
            });

            if (res.ok) {
                setEditingList(null);
                fetchLists();
            }
        } catch (error) {
            console.error('Erreur modification:', error);
        } finally {
            setSaving(false);
        }
    };

    const filteredLists = lists.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.emails.some(e => e.includes(searchQuery.toLowerCase()))
    );

    const totalEmails = lists.reduce((acc, l) => acc + l.emails.length, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-sky-600 mb-6 font-medium transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Retour au tableau de bord
                </Link>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-2.5 rounded-xl shadow-lg">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mes contacts</h1>
                        </div>
                        <p className="text-gray-500">
                            {lists.length} liste{lists.length !== 1 ? 's' : ''} · {totalEmails} email{totalEmails !== 1 ? 's' : ''} au total
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                    >
                        <Plus className="h-5 w-5" />
                        Nouvelle liste
                    </button>
                </div>

                {/* Barre de recherche */}
                {lists.length > 0 && (
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher une liste ou un email..."
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 font-medium transition-all"
                        />
                    </div>
                )}

                {/* Liste des contacts */}
                {loading ? (
                    <div className="flex flex-col items-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-sky-500 mb-4" />
                        <p className="text-gray-500">Chargement...</p>
                    </div>
                ) : filteredLists.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Mail className="h-10 w-10 text-sky-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {searchQuery ? 'Aucun résultat' : 'Aucune liste de contacts'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {searchQuery ? 'Essayez avec d\'autres termes' : 'Créez votre première liste pour envoyer des invitations à vos événements'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center gap-2 bg-sky-500 text-white px-5 py-3 rounded-xl font-bold hover:bg-sky-600 transition"
                            >
                                <Plus className="h-5 w-5" />
                                Créer une liste
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredLists.map((list) => (
                            <div key={list.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div
                                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition"
                                    onClick={() => setExpandedList(expandedList === list.id ? null : list.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-sky-100 to-blue-100 rounded-xl flex items-center justify-center">
                                            <Mail className="h-6 w-6 text-sky-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{list.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {list.emails.length} email{list.emails.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(list); }}
                                            className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(list.id); }}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                        {expandedList === list.id ? (
                                            <ChevronUp className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                </div>

                                {expandedList === list.id && (
                                    <div className="px-5 pb-5 border-t border-gray-100">
                                        {editingList === list.id ? (
                                            <div className="pt-4 space-y-3">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 font-medium"
                                                    placeholder="Nom de la liste"
                                                />
                                                <textarea
                                                    value={editEmails}
                                                    onChange={(e) => setEditEmails(e.target.value)}
                                                    rows={6}
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 text-sm font-mono resize-none"
                                                    placeholder="Un email par ligne"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleSaveEdit(list.id)}
                                                        disabled={saving}
                                                        className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-sky-600 transition disabled:opacity-50"
                                                    >
                                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                        Enregistrer
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingList(null)}
                                                        className="px-4 py-2 border border-gray-200 rounded-lg font-bold text-sm text-gray-600 hover:bg-gray-50 transition"
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="pt-4 flex flex-wrap gap-2">
                                                {list.emails.map((email, idx) => (
                                                    <span key={idx} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                                                        <Mail className="h-3 w-3 text-gray-400" />
                                                        {email}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal création */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => { setShowCreateModal(false); setImportError(null); setImportedEmails([]); }} />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => { setShowCreateModal(false); setImportError(null); setImportedEmails([]); }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                                <Users className="h-6 w-6 text-sky-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Nouvelle liste de contacts</h2>
                                <p className="text-sm text-gray-500">Importez un fichier Excel ou saisissez les emails</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Nom de la liste */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Nom de la liste *
                                </label>
                                <input
                                    type="text"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 font-medium"
                                    placeholder="Ex: Clients VIP, Partenaires..."
                                />
                            </div>

                            {/* Import Excel */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                                    Importer depuis un fichier Excel
                                </label>
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all">
                                    <div className="flex flex-col items-center">
                                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-600">
                                            <span className="font-bold text-emerald-600">Cliquez pour importer</span>
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">.xlsx, .xls, .csv</p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileUpload}
                                    />
                                </label>
                                {importedEmails.length > 0 && (
                                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                        <p className="text-sm font-bold text-emerald-700">
                                            {importedEmails.length} email{importedEmails.length !== 1 ? 's' : ''} importé{importedEmails.length !== 1 ? 's' : ''}
                                        </p>
                                        <div className="mt-2 max-h-24 overflow-y-auto">
                                            {importedEmails.slice(0, 10).map((email, idx) => (
                                                <p key={idx} className="text-xs text-emerald-600 font-mono">{email}</p>
                                            ))}
                                            {importedEmails.length > 10 && (
                                                <p className="text-xs text-emerald-500 mt-1">... et {importedEmails.length - 10} de plus</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Saisie manuelle */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-sky-500" />
                                    Ajouter des emails manuellement
                                </label>
                                <textarea
                                    value={newEmails}
                                    onChange={(e) => setNewEmails(e.target.value)}
                                    rows={5}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 text-sm font-mono resize-none"
                                    placeholder={"email1@example.com\nemail2@example.com\nemail3@example.com"}
                                />
                                <p className="text-xs text-gray-400 mt-1">Un email par ligne, ou séparés par des virgules</p>
                            </div>

                            {importError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                                    <p className="text-sm text-red-700 font-medium">{importError}</p>
                                </div>
                            )}

                            {/* Boutons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setShowCreateModal(false); setImportError(null); setImportedEmails([]); }}
                                    className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={creating || !newListName.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {creating ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Plus className="h-5 w-5" />
                                    )}
                                    Créer la liste
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
