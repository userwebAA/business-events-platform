import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

        // Limiter à 50MB
        if (file.size > 50 * 1024 * 1024) {
            return NextResponse.json({ error: 'La vidéo ne doit pas dépasser 50 Mo' }, { status: 400 });
        }

        // Créer le dossier d'upload si nécessaire
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
        await mkdir(uploadDir, { recursive: true });

        // Générer un nom de fichier unique
        const ext = file.name.split('.').pop() || 'mp4';
        const fileName = `${decoded.userId}-${Date.now()}.${ext}`;
        const filePath = path.join(uploadDir, fileName);

        // Écrire le fichier
        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        // URL publique
        const videoUrl = `/uploads/videos/${fileName}`;

        // Mettre à jour le profil
        await prisma.user.update({
            where: { id: decoded.userId },
            data: { profileVideo: videoUrl },
        });

        return NextResponse.json({ success: true, videoUrl });
    } catch (error) {
        console.error('❌ Erreur upload vidéo:', error instanceof Error ? error.message : error);
        console.error('❌ Stack:', error instanceof Error ? error.stack : '');
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
