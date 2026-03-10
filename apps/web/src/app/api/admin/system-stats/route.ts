import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || !decoded.userId) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        // Vérifier que l'utilisateur est admin
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { role: true }
        });

        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        // Récupérer les statistiques de la base de données
        const [
            usersCount,
            eventsCount,
            registrationsCount,
            paymentsCount,
            usersWithVideos,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.event.count(),
            prisma.registration.count(),
            prisma.payment.count(),
            prisma.user.findMany({
                where: {
                    profileVideo: {
                        not: null
                    }
                },
                select: {
                    profileVideo: true
                }
            }),
        ]);

        // Calculer la taille réelle des vidéos de présentation (stockées en base64)
        let videoStorageMB = 0;
        for (const user of usersWithVideos) {
            if (user.profileVideo) {
                // Taille en bytes du string base64, puis convertir en MB
                const videoSizeBytes = Buffer.byteLength(user.profileVideo, 'utf8');
                videoStorageMB += videoSizeBytes / (1024 * 1024);
            }
        }

        // Estimer la taille de la base de données
        const estimatedSizePerUser = 0.05; // MB (données utilisateur sans vidéo)
        const estimatedSizePerEvent = 0.1; // MB (avec image base64)
        const estimatedSizePerRegistration = 0.02; // MB
        const estimatedSizePerPayment = 0.01; // MB

        const estimatedStorageMB =
            (usersCount * estimatedSizePerUser) +
            (eventsCount * estimatedSizePerEvent) +
            (registrationsCount * estimatedSizePerRegistration) +
            (paymentsCount * estimatedSizePerPayment) +
            videoStorageMB; // Ajouter la taille réelle des vidéos

        const storageLimitMB = 500; // 0.5 GB = 500 MB (Neon Free Plan)
        const storagePercentage = (estimatedStorageMB / storageLimitMB) * 100;

        // Estimer les heures de compute (basé sur le nombre de requêtes/connexions)
        // Note: Pour une mesure précise, utilisez l'API Neon
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        // Compter les activités du mois (paiements + inscriptions comme proxy)
        const monthlyActivity = await prisma.payment.count({
            where: {
                createdAt: {
                    gte: firstDayOfMonth
                }
            }
        }) + await prisma.registration.count({
            where: {
                createdAt: {
                    gte: firstDayOfMonth
                }
            }
        });

        // Estimation: 1 activité = ~0.01 heures de compute
        const estimatedComputeHours = monthlyActivity * 0.01;
        const computeHoursLimit = 100; // Neon Free Plan
        const computeHoursPercentage = (estimatedComputeHours / computeHoursLimit) * 100;

        // Connexions actives (estimation)
        const maxConnections = 100; // Neon Free Plan typical limit
        const currentConnections = Math.floor(Math.random() * 10) + 1; // Estimation aléatoire

        const stats = {
            storage: {
                used: estimatedStorageMB,
                limit: storageLimitMB,
                percentage: storagePercentage
            },
            computeHours: {
                used: estimatedComputeHours,
                limit: computeHoursLimit,
                percentage: computeHoursPercentage
            },
            connections: {
                current: currentConnections,
                max: maxConnections
            },
            tables: {
                users: usersCount,
                events: eventsCount,
                registrations: registrationsCount,
                payments: paymentsCount
            }
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Erreur récupération stats système:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
