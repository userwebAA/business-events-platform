import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

const MAX_VIDEO_SIZE = 5 * 1024 * 1024; // 5 Mo max pour stockage en base64

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || !decoded.userId) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('video') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'Aucun fichier vidéo fourni' }, { status: 400 });
        }

        // Vérifier le type
        if (!file.type.startsWith('video/')) {
            return NextResponse.json({ error: 'Le fichier doit être une vidéo' }, { status: 400 });
        }

        // Limiter à 5MB pour stockage en DB
        if (file.size > MAX_VIDEO_SIZE) {
            return NextResponse.json({ error: 'La vidéo ne doit pas dépasser 5 Mo' }, { status: 400 });
        }

        // Convertir en base64 Data URL
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        const videoUrl = `data:${file.type};base64,${base64}`;

        // Mettre à jour le profil
        await prisma.user.update({
            where: { id: decoded.userId },
            data: { profileVideo: videoUrl },
        });

        return NextResponse.json({ success: true, videoUrl });
    } catch (error) {
        console.error('❌ Erreur upload vidéo:', error instanceof Error ? error.message : error);
        return NextResponse.json({ error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Unknown') }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || !decoded.userId) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        await prisma.user.update({
            where: { id: decoded.userId },
            data: { profileVideo: null },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur suppression vidéo:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
