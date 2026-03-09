import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;

        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            include: {
                following: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        position: true,
                        company: true,
                        photo: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedFollowing = following.map(f => ({
            id: f.following.id,
            name: f.following.firstName && f.following.lastName 
                ? `${f.following.firstName} ${f.following.lastName}`
                : f.following.name,
            position: f.following.position,
            company: f.following.company,
            photo: f.following.photo,
        }));

        return NextResponse.json({ following: formattedFollowing });
    } catch (error) {
        console.error('Error fetching following:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
