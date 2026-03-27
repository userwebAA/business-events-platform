import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        // Vérifier que l'utilisateur est admin
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { role: true },
        });

        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        // Récupérer tous les paiements
        const allPayments = await prisma.payment.findMany({
            orderBy: { createdAt: 'desc' },
        });

        // Statistiques globales
        const totalPayments = allPayments.length;
        const succeededPayments = allPayments.filter(p => p.status === 'SUCCEEDED');
        const refundedPayments = allPayments.filter(p => p.status === 'REFUNDED');
        const failedPayments = allPayments.filter(p => p.status === 'FAILED');

        const totalRevenue = succeededPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalPlatformFees = succeededPayments.reduce((sum, p) => sum + p.platformFee, 0);
        const totalCreatorAmount = succeededPayments.reduce((sum, p) => sum + p.creatorAmount, 0);
        const totalRefunded = refundedPayments.reduce((sum, p) => sum + p.amount, 0);

        // Statistiques par mois (6 derniers mois)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const recentPayments = allPayments.filter(p => new Date(p.createdAt) >= sixMonthsAgo);
        
        const monthlyStats = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date();
            monthDate.setMonth(monthDate.getMonth() - i);
            const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

            const monthPayments = recentPayments.filter(p => {
                const paymentDate = new Date(p.createdAt);
                return paymentDate >= monthStart && paymentDate <= monthEnd && p.status === 'SUCCEEDED';
            });

            const monthRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
            const monthFees = monthPayments.reduce((sum, p) => sum + p.platformFee, 0);

            monthlyStats.push({
                month: monthDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
                revenue: Math.round(monthRevenue * 100) / 100,
                fees: Math.round(monthFees * 100) / 100,
                count: monthPayments.length,
            });
        }

        // Récupérer les payouts
        const allPayouts = await prisma.payout.findMany({
            orderBy: { createdAt: 'desc' },
        });

        const completedPayouts = allPayouts.filter(p => p.status === 'COMPLETED');
        const totalPayouts = completedPayouts.reduce((sum, p) => sum + p.amount, 0);

        // Transactions récentes (20 dernières)
        const recentTransactions = await prisma.payment.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Top organisateurs par revenus
        const organizerStats = allPayments
            .filter(p => p.status === 'SUCCEEDED')
            .reduce((acc, payment) => {
                if (!acc[payment.organizerId]) {
                    acc[payment.organizerId] = {
                        organizerId: payment.organizerId,
                        totalRevenue: 0,
                        totalFees: 0,
                        count: 0,
                    };
                }
                acc[payment.organizerId].totalRevenue += payment.amount;
                acc[payment.organizerId].totalFees += payment.platformFee;
                acc[payment.organizerId].count += 1;
                return acc;
            }, {} as Record<string, any>);

        const topOrganizers = Object.values(organizerStats)
            .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
            .slice(0, 10);

        // Récupérer les noms des organisateurs
        const organizerIds = topOrganizers.map((o: any) => o.organizerId);
        const organizers = await prisma.user.findMany({
            where: { id: { in: organizerIds } },
            select: { id: true, name: true, email: true },
        });

        const topOrganizersWithNames = topOrganizers.map((org: any) => {
            const organizer = organizers.find(o => o.id === org.organizerId);
            return {
                ...org,
                name: organizer?.name || 'Inconnu',
                email: organizer?.email || '',
            };
        });

        return NextResponse.json({
            overview: {
                totalPayments,
                succeededPayments: succeededPayments.length,
                refundedPayments: refundedPayments.length,
                failedPayments: failedPayments.length,
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                totalPlatformFees: Math.round(totalPlatformFees * 100) / 100,
                totalCreatorAmount: Math.round(totalCreatorAmount * 100) / 100,
                totalRefunded: Math.round(totalRefunded * 100) / 100,
                totalPayouts: Math.round(totalPayouts * 100) / 100,
                averageTransactionValue: succeededPayments.length > 0 
                    ? Math.round((totalRevenue / succeededPayments.length) * 100) / 100 
                    : 0,
                platformFeePercentage: totalRevenue > 0 
                    ? Math.round((totalPlatformFees / totalRevenue) * 10000) / 100 
                    : 0,
            },
            monthlyStats,
            recentTransactions: recentTransactions.map(t => ({
                id: t.id,
                amount: t.amount,
                platformFee: t.platformFee,
                status: t.status,
                createdAt: t.createdAt,
                userName: t.user?.name || 'Inconnu',
                userEmail: t.user?.email || '',
            })),
            topOrganizers: topOrganizersWithNames,
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des stats Stripe:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
