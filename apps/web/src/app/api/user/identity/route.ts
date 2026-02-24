import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// GET - Récupérer le statut de vérification d'identité
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

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                identityStatus: true,
                identitySubmittedAt: true,
                identityReviewedAt: true,
                identityRejectReason: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Erreur récupération statut identité:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// POST - Soumettre une carte d'identité
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const { document } = await request.json();

        if (!document) {
            return NextResponse.json({ error: 'Document requis' }, { status: 400 });
        }

        // Vérifier que l'utilisateur n'a pas déjà une demande en cours ou validée
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { identityStatus: true },
        });

        if (user?.identityStatus === 'verified') {
            return NextResponse.json({ error: 'Votre identité est déjà vérifiée' }, { status: 400 });
        }

        if (user?.identityStatus === 'pending') {
            return NextResponse.json({ error: 'Une demande de vérification est déjà en cours' }, { status: 400 });
        }

        // Permettre la resoumission si le statut est 'rejected' ou 'none'

        await prisma.user.update({
            where: { id: decoded.userId },
            data: {
                identityDocument: document,
                identityStatus: 'pending',
                identitySubmittedAt: new Date(),
                identityRejectReason: null,
            },
        });

        return NextResponse.json({ message: 'Document soumis avec succès. Votre demande sera examinée sous 24-48h.' });
    } catch (error) {
        console.error('Erreur soumission identité:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
