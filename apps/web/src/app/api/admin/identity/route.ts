import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// GET - Lister les demandes de vérification (admin only)
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        // Vérifier que c'est un admin
        const admin = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { role: true },
        });

        if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'pending';

        const requests = await prisma.user.findMany({
            where: { identityStatus: status },
            select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                photo: true,
                identityStatus: true,
                identityDocument: true,
                identitySubmittedAt: true,
                identityReviewedAt: true,
                identityRejectReason: true,
                createdAt: true,
            },
            orderBy: { identitySubmittedAt: 'asc' },
        });

        return NextResponse.json({ requests });
    } catch (error) {
        console.error('Erreur récupération demandes identité:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// PUT - Valider ou refuser une demande (admin only)
export async function PUT(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const admin = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { role: true },
        });

        if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const { userId, action, reason } = await request.json();

        if (!userId || !action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
        }

        if (action === 'reject' && !reason) {
            return NextResponse.json({ error: 'Motif de refus requis' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { identityStatus: true },
        });

        if (!user || user.identityStatus !== 'pending') {
            return NextResponse.json({ error: 'Aucune demande en attente pour cet utilisateur' }, { status: 400 });
        }

        if (action === 'approve') {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    identityStatus: 'verified',
                    identityReviewedAt: new Date(),
                    identityRejectReason: null,
                },
            });

            // Envoyer une notification
            await prisma.notification.create({
                data: {
                    userId,
                    type: 'SYSTEM',
                    title: 'Identité vérifiée ✅',
                    message: 'Votre identité a été vérifiée avec succès. Vous pouvez maintenant organiser des événements.',
                    link: '/events/create',
                },
            });
        } else {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    identityStatus: 'rejected',
                    identityReviewedAt: new Date(),
                    identityRejectReason: reason,
                    identityDocument: null,
                },
            });

            await prisma.notification.create({
                data: {
                    userId,
                    type: 'SYSTEM',
                    title: 'Vérification refusée',
                    message: `Votre demande de vérification d'identité a été refusée. Motif : ${reason}`,
                    link: '/dashboard/settings',
                },
            });
        }

        return NextResponse.json({ message: action === 'approve' ? 'Identité validée' : 'Demande refusée' });
    } catch (error) {
        console.error('Erreur validation identité:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
