'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import {
    ArrowLeft, Shield, Check, X, Loader2, User, Clock, FileCheck,
    ChevronDown, AlertTriangle, Eye, Mail, Calendar
} from 'lucide-react';

interface IdentityRequest {
    id: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    photo: string | null;
    identityStatus: string;
    identityDocument: string | null;
    identitySubmittedAt: string | null;
    identityReviewedAt: string | null;
    identityRejectReason: string | null;
    createdAt: string;
}

export default function AdminIdentityPage() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<IdentityRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [selectedRequest, setSelectedRequest] = useState<IdentityRequest | null>(null);
    const [showDocument, setShowDocument] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [actionMessage, setActionMessage] = useState('');

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/identity?status=${filter}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests);
            }
        } catch (error) {
            console.error('Erreur chargement demandes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            setLoading(true);
            fetchRequests();
        }
    }, [filter, isAdmin]);

    const handleAction = async (userId: string, action: 'approve' | 'reject') => {
        setProcessing(true);
        setActionMessage('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/identity', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId, action, reason: rejectReason }),
            });
            const data = await res.json();
            if (res.ok) {
                setActionMessage(action === 'approve' ? 'Identité validée avec succès' : 'Demande refusée');
                setSelectedRequest(null);
                setShowRejectForm(false);
                setRejectReason('');
                fetchRequests();
            } else {
                setActionMessage(data.error || 'Erreur');
            }
        } catch {
            setActionMessage('Erreur de connexion');
        } finally {
            setProcessing(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                        <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900">Accès refusé</h2>
                        <p className="text-gray-500 mt-1">Cette page est réservée aux administrateurs.</p>
                    </div>
                </div>
            </div>
        );
    }

    const displayName = (r: IdentityRequest) =>
        r.firstName && r.lastName ? `${r.firstName} ${r.lastName}` : r.name;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-sky-600 transition-colors mb-4">
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Retour au tableau de bord
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vérification d&apos;identité</h1>
                            <p className="text-gray-500 text-sm">Gérer les demandes de vérification des utilisateurs</p>
                        </div>
                    </div>
                </div>

                {/* Badge compte vérifié pour admin */}
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <FileCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-emerald-900">Votre compte est vérifié</h3>
                        <p className="text-sm text-emerald-700">En tant qu&apos;administrateur, votre compte est automatiquement vérifié.</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                    {[
                        { value: 'pending', label: 'En attente', icon: Clock, color: 'amber' },
                        { value: 'verified', label: 'Vérifiés', icon: FileCheck, color: 'emerald' },
                        { value: 'rejected', label: 'Refusés', icon: X, color: 'red' },
                    ].map((f) => {
                        const Icon = f.icon;
                        const isActive = filter === f.value;
                        return (
                            <button
                                key={f.value}
                                onClick={() => setFilter(f.value)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${isActive
                                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-sky-200 hover:bg-sky-50'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {f.label}
                            </button>
                        );
                    })}
                </div>

                {actionMessage && (
                    <div className="mb-4 p-3 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-800 font-medium">
                        {actionMessage}
                    </div>
                )}

                {/* List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Shield className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Aucune demande</h3>
                        <p className="text-gray-500 text-sm">
                            {filter === 'pending' ? 'Aucune demande en attente de vérification.' :
                                filter === 'verified' ? 'Aucun utilisateur vérifié.' :
                                    'Aucune demande refusée.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.map((req) => (
                            <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div
                                    className="flex items-center gap-4 p-4 sm:p-5 cursor-pointer hover:bg-gray-50 transition-all"
                                    onClick={() => setSelectedRequest(selectedRequest?.id === req.id ? null : req)}
                                >
                                    {/* Avatar */}
                                    {req.photo ? (
                                        <img src={req.photo} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                                    ) : (
                                        <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
                                            {displayName(req).charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate">{displayName(req)}</h3>
                                        <p className="text-sm text-gray-500 truncate flex items-center gap-1.5">
                                            <Mail className="h-3 w-3" />
                                            {req.email}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        {req.identitySubmittedAt && (
                                            <span className="text-xs text-gray-400 hidden sm:flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(req.identitySubmittedAt).toLocaleDateString('fr-FR')}
                                            </span>
                                        )}
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${req.identityStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                req.identityStatus === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {req.identityStatus === 'pending' ? 'En attente' :
                                                req.identityStatus === 'verified' ? 'Vérifié' : 'Refusé'}
                                        </span>
                                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${selectedRequest?.id === req.id ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>

                                {/* Expanded details */}
                                {selectedRequest?.id === req.id && (
                                    <div className="border-t border-gray-100 p-4 sm:p-5 bg-gray-50">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Document */}
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-700 mb-2">Document soumis</h4>
                                                {req.identityDocument ? (
                                                    <div>
                                                        <img
                                                            src={req.identityDocument}
                                                            alt="Pièce d'identité"
                                                            className="w-full max-w-sm rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={() => setShowDocument(true)}
                                                        />
                                                        <button
                                                            onClick={() => setShowDocument(true)}
                                                            className="mt-2 text-sm text-sky-600 font-medium flex items-center gap-1 hover:text-sky-700"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            Voir en grand
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic">Document non disponible</p>
                                                )}
                                            </div>

                                            {/* Info + Actions */}
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-700 mb-2">Informations</h4>
                                                <div className="space-y-2 text-sm">
                                                    <p><span className="text-gray-500">Nom :</span> <span className="font-medium text-gray-900">{displayName(req)}</span></p>
                                                    <p><span className="text-gray-500">Email :</span> <span className="font-medium text-gray-900">{req.email}</span></p>
                                                    <p><span className="text-gray-500">Inscrit le :</span> <span className="font-medium text-gray-900">{new Date(req.createdAt).toLocaleDateString('fr-FR')}</span></p>
                                                    {req.identitySubmittedAt && (
                                                        <p><span className="text-gray-500">Soumis le :</span> <span className="font-medium text-gray-900">{new Date(req.identitySubmittedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></p>
                                                    )}
                                                    {req.identityRejectReason && (
                                                        <div className="p-2 bg-red-100 border border-red-200 rounded-lg mt-2">
                                                            <p className="text-red-800"><strong>Motif de refus :</strong> {req.identityRejectReason}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions (only for pending) */}
                                                {req.identityStatus === 'pending' && (
                                                    <div className="mt-5 space-y-3">
                                                        {!showRejectForm ? (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleAction(req.id, 'approve')}
                                                                    disabled={processing}
                                                                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-all disabled:opacity-60"
                                                                >
                                                                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                                    Valider
                                                                </button>
                                                                <button
                                                                    onClick={() => setShowRejectForm(true)}
                                                                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                    Refuser
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                <textarea
                                                                    value={rejectReason}
                                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                                    rows={3}
                                                                    className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none placeholder:text-gray-400"
                                                                    placeholder="Motif du refus (obligatoire)..."
                                                                />
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleAction(req.id, 'reject')}
                                                                        disabled={processing || !rejectReason.trim()}
                                                                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-60"
                                                                    >
                                                                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                                                        Confirmer le refus
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                                                                        className="px-4 py-2 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-all"
                                                                    >
                                                                        Annuler
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Document fullscreen modal */}
            {showDocument && selectedRequest?.identityDocument && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowDocument(false)}>
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button
                            onClick={() => setShowDocument(false)}
                            className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-all z-10"
                        >
                            <X className="h-4 w-4 text-gray-700" />
                        </button>
                        <img
                            src={selectedRequest.identityDocument}
                            alt="Pièce d'identité"
                            className="max-w-full max-h-[85vh] rounded-xl object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
