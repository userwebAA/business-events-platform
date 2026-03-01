'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, ShieldCheck, Crown, ArrowLeft, Search, MoreVertical, Trash2, X, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

interface UserItem {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
    createdAt: string;
    photo: string | null;
    firstName: string | null;
    lastName: string | null;
}

const roleBadge = (role: string) => {
    switch (role) {
        case 'SUPER_ADMIN':
            return { label: 'Super Admin', shortLabel: 'S.Admin', bg: 'bg-gradient-to-r from-amber-500 to-orange-500', text: 'text-white', icon: Crown };
        case 'ADMIN':
            return { label: 'Admin', shortLabel: 'Admin', bg: 'bg-gradient-to-r from-sky-500 to-blue-600', text: 'text-white', icon: ShieldCheck };
        default:
            return { label: 'Utilisateur', shortLabel: 'User', bg: 'bg-gray-100', text: 'text-gray-700', icon: Users };
    }
};

export default function AdminUsersPage() {
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<UserItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (currentUser && currentUser.role !== 'SUPER_ADMIN') {
            router.push('/dashboard');
            return;
        }
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await fetch('/api/admin/users', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (res.ok) setUsers(await res.json());
            } catch (e) {
                console.error('Erreur chargement utilisateurs:', e);
            } finally {
                setLoading(false);
            }
        };
        if (currentUser) fetchUsers();
    }, [currentUser, router]);

    // Fermer dropdown au clic extérieur
    useEffect(() => {
        const handleClick = () => setOpenDropdown(null);
        if (openDropdown) document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [openDropdown]);

    const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN') => {
        setUpdating(userId);
        setOpenDropdown(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId, role: newRole }),
            });
            if (res.ok) {
                const updated = await res.json();
                setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, role: updated.role } : u));
            }
        } catch (e) {
            console.error('Erreur modification rôle:', e);
        } finally {
            setUpdating(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId: deleteConfirm.id }),
            });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== deleteConfirm.id));
                setDeleteConfirm(null);
            }
        } catch (e) {
            console.error('Erreur suppression:', e);
        } finally {
            setDeleting(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.firstName && u.firstName.toLowerCase().includes(search.toLowerCase())) ||
        (u.lastName && u.lastName.toLowerCase().includes(search.toLowerCase()))
    );

    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === 'ADMIN').length,
        superAdmins: users.filter(u => u.role === 'SUPER_ADMIN').length,
        regular: users.filter(u => u.role === 'USER').length,
    };

    const canModify = (u: UserItem) =>
        (u.role !== 'SUPER_ADMIN' || currentUser?.email === 'alexalix58@gmail.com') && u.id !== currentUser?.id;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
            <Navbar />

            <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-sky-600 mb-4 sm:mb-6 font-medium transition-colors text-sm">
                    <ArrowLeft className="h-4 w-4" />
                    Retour
                </Link>

                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-2 sm:p-2.5 rounded-xl shadow-lg">
                            <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Gestion utilisateurs</h1>
                    </div>
                    <p className="text-gray-500 text-sm sm:text-base">Gérez les rôles et comptes de vos utilisateurs</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6">
                    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 text-center">
                        <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mt-0.5">Total</p>
                    </div>
                    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 text-center">
                        <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.regular}</p>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mt-0.5">Users</p>
                    </div>
                    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 text-center">
                        <p className="text-xl sm:text-3xl font-bold text-sky-600">{stats.admins}</p>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mt-0.5">Admins</p>
                    </div>
                    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 text-center">
                        <p className="text-xl sm:text-3xl font-bold text-amber-500">{stats.superAdmins}</p>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mt-0.5">S.Admin</p>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-4 sm:mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher..."
                            className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 font-medium placeholder-gray-400 transition-all text-sm sm:text-base"
                        />
                    </div>
                </div>

                {/* Users list */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {filteredUsers.map((u) => {
                            const badge = roleBadge(u.role);
                            const BadgeIcon = badge.icon;
                            const displayName = u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.name;
                            const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

                            return (
                                <div key={u.id} className="px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        {u.photo ? (
                                            <img src={u.photo} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shrink-0" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center shrink-0 border-2 border-gray-200">
                                                <span className="text-xs font-bold text-sky-700">{initials}</span>
                                            </div>
                                        )}

                                        {/* Info */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <p className="font-bold text-gray-900 text-sm truncate max-w-[140px] sm:max-w-none">{displayName}</p>
                                                {u.role === 'SUPER_ADMIN' && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold ${badge.bg} ${badge.text}`}>
                                                    <BadgeIcon className="h-3 w-3" />
                                                    <span className="hidden sm:inline">{badge.label}</span>
                                                    <span className="sm:hidden">{badge.shortLabel}</span>
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">
                                                Inscrit le {new Date(u.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        {canModify(u) && (
                                            <div className="relative shrink-0">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === u.id ? null : u.id); }}
                                                    disabled={updating === u.id}
                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {updating === u.id ? (
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                                                    ) : (
                                                        <MoreVertical className="h-5 w-5" />
                                                    )}
                                                </button>

                                                {openDropdown === u.id && (
                                                    <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50" onClick={e => e.stopPropagation()}>
                                                        {u.role !== 'ADMIN' && (
                                                            <button
                                                                onClick={() => handleRoleChange(u.id, 'ADMIN')}
                                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-sky-700 hover:bg-sky-50 transition-colors text-left"
                                                            >
                                                                <ShieldCheck className="h-4 w-4" />
                                                                Passer Admin
                                                            </button>
                                                        )}
                                                        {u.role !== 'USER' && (
                                                            <button
                                                                onClick={() => handleRoleChange(u.id, 'USER')}
                                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors text-left"
                                                            >
                                                                <Users className="h-4 w-4" />
                                                                {u.role === 'SUPER_ADMIN' ? 'Retirer Super Admin' : 'Retirer Admin'}
                                                            </button>
                                                        )}
                                                        <div className="border-t border-gray-100 mt-1 pt-1">
                                                            <button
                                                                onClick={() => { setOpenDropdown(null); setDeleteConfirm(u); }}
                                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Supprimer le compte
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">Aucun utilisateur trouvé</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de confirmation de suppression */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !deleting && setDeleteConfirm(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => !deleting && setDeleteConfirm(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>

                        <div className="text-center mb-5">
                            <div className="bg-red-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="h-7 w-7 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Supprimer ce compte ?</h3>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 mb-5">
                            <p className="font-bold text-gray-900 text-sm">
                                {deleteConfirm.firstName && deleteConfirm.lastName
                                    ? `${deleteConfirm.firstName} ${deleteConfirm.lastName}`
                                    : deleteConfirm.name}
                            </p>
                            <p className="text-xs text-gray-500">{deleteConfirm.email}</p>
                            <p className="text-xs text-gray-400 mt-1">Rôle : {roleBadge(deleteConfirm.role).label}</p>
                        </div>

                        <p className="text-xs text-red-500 text-center mb-5 font-medium">
                            Cette action est irréversible. Toutes les données de l'utilisateur seront supprimées.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={deleting}
                                className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4" />
                                        Supprimer
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
