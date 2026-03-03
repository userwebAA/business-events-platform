import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import CookieBanner from '@/components/CookieBanner'
import MobileNav from '@/components/MobileNav'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: '#2563eb',
}

export const metadata: Metadata = {
    title: {
        default: 'Business Events - Plateforme de Soirées Business',
        template: '%s | Business Events',
    },
    description: 'Organisez et participez à des événements business professionnels. Créez, gérez et monétisez vos soirées networking.',
    keywords: ['événements business', 'soirées networking', 'événements professionnels', 'inscription événement', 'billetterie'],
    authors: [{ name: 'Business Events' }],
    manifest: '/manifest.json',
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://business-events.fr'),
    openGraph: {
        type: 'website',
        locale: 'fr_FR',
        siteName: 'Business Events',
        title: 'Business Events - Plateforme de Soirées Business',
        description: 'Organisez et participez à des événements business professionnels. Créez, gérez et monétisez vos soirées networking.',
        images: [{ url: '/icons/icon-512x512.png', width: 512, height: 512, alt: 'Business Events' }],
    },
    twitter: {
        card: 'summary',
        title: 'Business Events - Plateforme de Soirées Business',
        description: 'Organisez et participez à des événements business professionnels.',
        images: ['/icons/icon-512x512.png'],
    },
    robots: {
        index: true,
        follow: true,
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Business Events',
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: [
            { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        apple: [
            { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
        ],
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="fr">
            <head>
                <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
                <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content="Business Events" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="msapplication-config" content="/browserconfig.xml" />
                <meta name="msapplication-TileColor" content="#2563eb" />
            </head>
            <body className={inter.className}>
                <AuthProvider>
                    <div className="pb-16 md:pb-0">
                        {children}
                    </div>
                    <MobileNav />
                    <CookieBanner />
                </AuthProvider>
            </body>
        </html>
    )
}
