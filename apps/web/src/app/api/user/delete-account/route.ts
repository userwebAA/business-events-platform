import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';
import { applyRateLimit } from '@/lib/rate-limiter';

export async function DELETE(request: NextRequest) {
    // Rate limiting: 2 req / 15 min
    const rateLimited = applyRateLimit(request, 'delete-account', 2, 900000);
    if (rateLimited) return rateLimited;

    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || !decoded.userId) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const { password } = await request.json();

        if (!password) {
            return NextResponse.json({ error: 'Mot de passe requis pour confirmer la suppression' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 403 });
        }

        // Supprimer l'utilisateur (Notification et PushSubscription sont supprimés en cascade)
        await prisma.user.delete({ where: { id: decoded.userId } });

        // Supprimer le cookie
        const response = NextResponse.json({ message: 'Compte supprimé avec succès' });
        response.cookies.set('token', '', { path: '/', maxAge: 0 });
        return response;
    } catch (error) {
        console.error('Erreur suppression compte:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
