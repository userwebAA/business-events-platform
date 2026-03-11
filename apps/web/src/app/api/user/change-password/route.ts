import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';
import { applyRateLimit } from '@/lib/rate-limiter';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

export async function PUT(request: NextRequest) {
    // Rate limiting: 3 req / 15 min
    const rateLimited = applyRateLimit(request, 'change-password', 3, 900000);
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

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Mot de passe actuel et nouveau mot de passe requis' }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentValid) {
            return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 403 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        await prisma.user.update({
            where: { id: decoded.userId },
            data: { password: hashedPassword }
        });

        return NextResponse.json({ message: 'Mot de passe modifié avec succès' });
    } catch (error) {
        console.error('Erreur changement mot de passe:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
