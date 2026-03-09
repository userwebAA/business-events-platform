import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;

        const followers = await prisma.follow.findMany({
            where: { followingId: userId },
            include: {
                follower: {
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

        const formattedFollowers = followers.map(f => ({
            id: f.follower.id,
            name: f.follower.firstName && f.follower.lastName 
                ? `${f.follower.firstName} ${f.follower.lastName}`
                : f.follower.name,
            position: f.follower.position,
            company: f.follower.company,
            photo: f.follower.photo,
        }));

        return NextResponse.json({ followers: formattedFollowers });
    } catch (error) {
        console.error('Error fetching followers:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
