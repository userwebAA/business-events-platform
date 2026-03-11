import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

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

        const currentUser = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                photo: true,
                firstName: true,
                lastName: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Erreur admin users:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
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

        const currentUser = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 });
        }

        const { userId, role } = await request.json();

        if (!userId || !role) {
            return NextResponse.json({ error: 'userId et role requis' }, { status: 400 });
        }

        const MEGA_ADMIN_EMAIL = 'alexalix58@gmail.com';
        const isMegaAdmin = currentUser.email === MEGA_ADMIN_EMAIL;

        // Seul le mega admin peut modifier son propre rôle
        if (userId === currentUser.id && !isMegaAdmin) {
            return NextResponse.json({ error: 'Vous ne pouvez pas modifier votre propre rôle' }, { status: 400 });
        }

        // Rôles autorisés
        if (role !== 'USER' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
        }

        // Seul le mega admin peut toucher aux SUPER_ADMIN
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }
        if (targetUser.role === 'SUPER_ADMIN' && !isMegaAdmin) {
            return NextResponse.json({ error: 'Seul le propriétaire peut modifier un Super Admin' }, { status: 403 });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: { id: true, name: true, email: true, role: true },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Erreur modification rôle:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
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

        const currentUser = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 });
        }

        const { userId } = await request.json();
        if (!userId) {
            return NextResponse.json({ error: 'userId requis' }, { status: 400 });
        }

        const MEGA_ADMIN_EMAIL = 'alexalix58@gmail.com';
        const isMegaAdmin = currentUser.email === MEGA_ADMIN_EMAIL;

        if (userId === currentUser.id) {
            return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
        }

        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }
        if (targetUser.role === 'SUPER_ADMIN' && !isMegaAdmin) {
            return NextResponse.json({ error: 'Seul le propriétaire peut supprimer un Super Admin' }, { status: 403 });
        }

        // Détacher les paiements des payouts avant suppression
        await prisma.payment.updateMany({
            where: { userId },
            data: { payoutId: null },
        });

        // Supprimer les données liées puis l'utilisateur
        await prisma.$transaction([
            prisma.eventBadge.deleteMany({ where: { userId } }),
            prisma.pushSubscription.deleteMany({ where: { userId } }),
            prisma.notification.deleteMany({ where: { userId } }),
            prisma.payment.deleteMany({ where: { userId } }),
            prisma.payout.deleteMany({ where: { organizerId: userId } }),
            prisma.user.delete({ where: { id: userId } }),
        ]);

        return NextResponse.json({ success: true, deletedUserId: userId });
    } catch (error) {
        console.error('Erreur suppression utilisateur:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
