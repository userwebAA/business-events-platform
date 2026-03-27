'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, LogOut, User, LayoutDashboard, Ticket, ChevronDown, Settings, Crown, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import LogoutModal from './LogoutModal';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogoutClick = useCallback(() => {
        setShowUserMenu(false);
        setShowLogoutModal(true);
    }, []);

    const handleLogoutConfirm = useCallback(async () => {
        await logout();
    }, [logout]);

    const handleLogoutCancel = useCallback(() => {
        setShowLogoutModal(false);
    }, []);

    // Fermer le menu utilisateur quand on clique ailleurs
    useEffect(() => {
        if (!showUserMenu) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showUserMenu]);

    const isActive = useCallback((path: string) => pathname === path || pathname?.startsWith(path + '/'), [pathname]);

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-lg bg-opacity-90">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
                        <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-2 rounded-xl group-hover:shadow-lg transition-all">
                            <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">TAFF <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">Events</span></span>
                    </Link>

                    {/* Navigation Links - Visible uniquement si connecté */}
                    {user && (
                        <div className="hidden md:flex items-center gap-1">
                            <Link
                                href="/events"
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${isActive('/events')
                                    ? 'bg-sky-50 text-sky-700'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <Ticket className="h-4 w-4" />
                                Événements
                            </Link>
                            <Link
                                href="/dashboard"
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${isActive('/dashboard')
                                    ? 'bg-sky-50 text-sky-700'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Tableau de bord
                            </Link>
                            <Link
                                href={`/profile/${user.id}`}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${pathname?.startsWith('/profile/' + user.id)
                                    ? 'bg-sky-50 text-sky-700'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <User className="h-4 w-4" />
                                Mon profil
                            </Link>
                        </div>
                    )}

                    {/* Right Side */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                <NotificationCenter />

                                {/* User Menu */}
                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                            {user.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="hidden sm:block text-left">
                                            <p className="text-sm font-semibold text-gray-900 leading-tight">{user.name}</p>
                                            {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                                                <p className="text-xs text-sky-600 font-medium leading-tight">
                                                    {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                                                </p>
                                            )}
                                        </div>
                                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                            </div>

                                            {/* Mobile nav links */}
                                            <div className="md:hidden py-1 border-b border-gray-100">
                                                <Link href="/events" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setShowUserMenu(false)}>
                                                    <Ticket className="h-4 w-4 text-gray-400" />
                                                    Événements
                                                </Link>
                                                <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setShowUserMenu(false)}>
                                                    <LayoutDashboard className="h-4 w-4 text-gray-400" />
                                                    Tableau de bord
                                                </Link>
                                                <Link href={`/profile/${user.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setShowUserMenu(false)}>
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    Mon profil
                                                </Link>
                                            </div>

                                            <div className="py-1">
                                                <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setShowUserMenu(false)}>
                                                    <Settings className="h-4 w-4 text-gray-400" />
                                                    Paramètres
                                                </Link>
                                                {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                                                    <Link href="/dashboard/admin/stripe-review" className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition-colors" onClick={() => setShowUserMenu(false)}>
                                                        <BarChart3 className="h-4 w-4 text-blue-500" />
                                                        Statistiques Stripe
                                                    </Link>
                                                )}
                                                {user.role === 'SUPER_ADMIN' && (
                                                    <Link href="/dashboard/admin/users" className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition-colors" onClick={() => setShowUserMenu(false)}>
                                                        <Crown className="h-4 w-4 text-amber-500" />
                                                        Gestion utilisateurs
                                                    </Link>
                                                )}
                                            </div>

                                            <div className="border-t border-gray-100 pt-1">
                                                <button
                                                    onClick={handleLogoutClick}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    Déconnexion
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                                >
                                    Connexion
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:from-sky-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                                >
                                    Inscription
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de déconnexion */}
            <LogoutModal
                isOpen={showLogoutModal}
                onClose={handleLogoutCancel}
                onConfirm={handleLogoutConfirm}
            />
        </nav>
    );
}
