import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        await prisma.notification.deleteMany({
            where: { userId: decoded.userId }
        });

        return NextResponse.json({ 
            success: true,
            message: 'Toutes les notifications ont été supprimées'
        });
    } catch (error) {
        console.error('Erreur suppression notifications:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}