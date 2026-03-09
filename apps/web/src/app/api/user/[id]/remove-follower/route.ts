import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const currentUserId = decoded.userId;
        const followerUserId = params.id; // L'utilisateur à retirer de nos abonnés

        // Supprimer la relation où followerUserId suit currentUserId
        await prisma.follow.deleteMany({
            where: {
                followerId: followerUserId,
                followingId: currentUserId,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing follower:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
