import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

// PUT - Mettre à jour une liste de contacts
export async function PUT(
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

        // Vérifier que la liste appartient à l'utilisateur
        const existing = await (prisma as any).contactList.findUnique({
            where: { id: params.id },
        });

        if (!existing || existing.userId !== decoded.userId) {
            return NextResponse.json({ error: 'Liste non trouvée' }, { status: 404 });
        }

        const body = await request.json();
        const { name, emails } = body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const cleanEmails = emails ? [...new Set(
            emails
                .map((e: string) => e.trim().toLowerCase())
                .filter((e: string) => emailRegex.test(e))
        )] : existing.emails;

        const updated = await (prisma as any).contactList.update({
            where: { id: params.id },
            data: {
                ...(name && { name }),
                emails: cleanEmails,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Erreur mise à jour liste contacts:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// DELETE - Supprimer une liste de contacts
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

        const existing = await (prisma as any).contactList.findUnique({
            where: { id: params.id },
        });

        if (!existing || existing.userId !== decoded.userId) {
            return NextResponse.json({ error: 'Liste non trouvée' }, { status: 404 });
        }

        await (prisma as any).contactList.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur suppression liste contacts:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
