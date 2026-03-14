import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

// GET - Récupérer toutes les listes de contacts de l'utilisateur
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

        const contactLists = await prisma.contactList.findMany({
            where: { userId: decoded.userId },
            orderBy: { updatedAt: 'desc' },
        });

        return NextResponse.json(contactLists);
    } catch (error) {
        console.error('Erreur récupération contacts:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// POST - Créer une nouvelle liste de contacts
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { name, emails } = body;

        if (!name || !emails || !Array.isArray(emails)) {
            return NextResponse.json({ error: 'Nom et liste d\'emails requis' }, { status: 400 });
        }

        // Nettoyer et valider les emails
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const cleanEmails = [...new Set(
            emails
                .map((e: string) => e.trim().toLowerCase())
                .filter((e: string) => emailRegex.test(e))
        )];

        if (cleanEmails.length === 0) {
            return NextResponse.json({ error: 'Aucun email valide trouvé' }, { status: 400 });
        }

        const contactList = await prisma.contactList.create({
            data: {
                userId: decoded.userId,
                name,
                emails: cleanEmails,
            },
        });

        return NextResponse.json(contactList, { status: 201 });
    } catch (error) {
        console.error('Erreur création liste contacts:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
