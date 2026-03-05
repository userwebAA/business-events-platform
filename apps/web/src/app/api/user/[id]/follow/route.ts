import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET: Vérifier si l'utilisateur suit ce profil + comptes followers/following
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const targetUserId = params.id;
        const authHeader = request.headers.get('authorization');
        let currentUserId: string | null = null;

        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const decoded = verifyToken(token);
            if (decoded) currentUserId = decoded.userId;
        }

        // Compter les followers et following
        const [followersCount, followingCount] = await Promise.all([
            prisma.follow.count({ where: { followingId: targetUserId } }),
            prisma.follow.count({ where: { followerId: targetUserId } }),
        ]);

        // Vérifier si l'utilisateur courant suit ce profil
        let isFollowing = false;
        if (currentUserId && currentUserId !== targetUserId) {
            const follow = await prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: currentUserId,
                        followingId: targetUserId,
                    },
                },
            });
            isFollowing = !!follow;
        }

        return NextResponse.json({
            followersCount,
            followingCount,
            isFollowing,
        });
    } catch (error) {
        console.error('Erreur follow GET:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// POST: Follow un utilisateur
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const targetUserId = params.id;
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const currentUserId = decoded.userId;
        if (currentUserId === targetUserId) {
            return NextResponse.json({ error: 'Vous ne pouvez pas vous suivre vous-même' }, { status: 400 });
        }

        // Vérifier que l'utilisateur cible existe
        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        // Créer le follow (ignore si déjà existant)
        await prisma.follow.upsert({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: targetUserId,
                },
            },
            create: {
                followerId: currentUserId,
                followingId: targetUserId,
            },
            update: {},
        });

        return NextResponse.json({ success: true, isFollowing: true });
    } catch (error) {
        console.error('Erreur follow POST:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// DELETE: Unfollow un utilisateur
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const targetUserId = params.id;
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const currentUserId = decoded.userId;

        await prisma.follow.deleteMany({
            where: {
                followerId: currentUserId,
                followingId: targetUserId,
            },
        });

        return NextResponse.json({ success: true, isFollowing: false });
    } catch (error) {
        console.error('Erreur follow DELETE:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
