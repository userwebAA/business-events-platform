import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 secondes max pour l'upload
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20 Mo max pour stockage en base64

export async function POST(request: NextRequest) {
    try {
        console.log('🎥 [API] Début traitement upload vidéo');

        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            console.log('❌ [API] Token manquant');
            return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || !decoded.userId) {
            console.log('❌ [API] Token invalide');
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        console.log('✅ [API] Authentification OK, userId:', decoded.userId);

        const formData = await request.formData();
        const file = formData.get('video') as File | null;

        if (!file) {
            console.log('❌ [API] Aucun fichier fourni');
            return NextResponse.json({ error: 'Aucun fichier vidéo fourni' }, { status: 400 });
        }

        console.log('📦 [API] Fichier reçu:', {
            name: file.name,
            type: file.type,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
        });

        // Vérifier le type
        if (!file.type.startsWith('video/')) {
            console.log('❌ [API] Type de fichier invalide:', file.type);
            return NextResponse.json({ error: 'Le fichier doit être une vidéo' }, { status: 400 });
        }

        // Limiter à 20MB pour stockage en DB
        if (file.size > MAX_VIDEO_SIZE) {
            console.log('❌ [API] Fichier trop volumineux:', file.size);
            return NextResponse.json({ error: 'La vidéo ne doit pas dépasser 20 Mo' }, { status: 400 });
        }

        console.log('🔄 [API] Conversion en base64...');
        // Convertir en base64 Data URL
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        const videoUrl = `data:${file.type};base64,${base64}`;

        console.log('✅ [API] Conversion terminée, taille base64:', `${(videoUrl.length / 1024 / 1024).toFixed(2)} MB`);

        console.log('💾 [API] Mise à jour base de données...');
        // Mettre à jour le profil
        await prisma.user.update({
            where: { id: decoded.userId },
            data: { profileVideo: videoUrl },
        });

        console.log('✅ [API] Upload vidéo terminé avec succès');
        return NextResponse.json({ success: true, videoUrl });
    } catch (error) {
        console.error('❌ [API] Erreur upload vidéo:', error);
        console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
        return NextResponse.json({
            error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Unknown'),
            details: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
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