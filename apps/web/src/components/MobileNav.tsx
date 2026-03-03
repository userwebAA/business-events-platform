'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, LayoutDashboard, User, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function MobileNav() {
    const { user } = useAuth();
    const pathname = usePathname();

    if (!user) return null;

    const navItems = [
        {
            href: '/',
            label: 'Accueil',
            icon: Home,
            isActive: pathname === '/',
        },
        {
            href: '/events',
            label: 'Événements',
            icon: Calendar,
            isActive: pathname === '/events' || (pathname?.startsWith('/events/') ?? false),
        },
        {
            href: '/dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            isActive: pathname === '/dashboard' || (pathname?.startsWith('/dashboard/') ?? false),
        },
        {
            href: `/profile/${user.id}`,
            label: 'Profil',
            icon: User,
            isActive: pathname?.startsWith('/profile/') ?? false,
        },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden safe-area-bottom">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-all ${
                                item.isActive
                                    ? 'text-sky-600'
                                    : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <div className={`relative ${item.isActive ? '' : ''}`}>
                                {item.isActive && (
                                    <div className="absolute -inset-2 bg-sky-100 rounded-xl" />
                                )}
                                <Icon className={`h-5 w-5 relative z-10 ${item.isActive ? 'stroke-[2.5]' : ''}`} />
                            </div>
                            <span className={`text-[10px] mt-0.5 ${item.isActive ? 'font-bold' : 'font-medium'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
