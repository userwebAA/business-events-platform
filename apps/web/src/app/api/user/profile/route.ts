import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function PUT(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        console.log('Token reçu:', token ? 'Présent' : 'Absent');

        if (!token) {
            return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        console.log('Token décodé:', decoded);

        if (!decoded || !decoded.userId) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const body = await request.json();
        console.log('Body reçu:', body);

        const {
            firstName,
            lastName,
            phone,
            position,
            company,
            bio,
            location,
            skills,
            linkedin,
            photo
        } = body;

        console.log('Tentative de mise à jour pour userId:', decoded.userId);

        // Mettre à jour le profil utilisateur
        const updatedUser = await prisma.user.update({
            where: { id: decoded.userId },
            data: {
                firstName: firstName || null,
                lastName: lastName || null,
                phone: phone || null,
                position: position || null,
                company: company || null,
                bio: bio || null,
                location: location || null,
                skills: skills || [],
                linkedin: linkedin || null,
                photo: photo || null,
                profileCompleted: !!(firstName && lastName && position && phone)
            }
        });

        console.log('Profil mis à jour avec succès');

        return NextResponse.json({
            message: 'Profil mis à jour avec succès',
            user: updatedUser
        });

    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack');
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour du profil: ' + (error instanceof Error ? error.message : 'Unknown') },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || !decoded.userId) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                firstName: true,
                lastName: true,
                phone: true,
                position: true,
                company: true,
                bio: true,
                location: true,
                skills: true,
                linkedin: true,
                photo: true,
                profileCompleted: true,
                role: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        // Récupérer profileVideo séparément (résilient si colonne pas encore en DB)
        let profileVideo: string | null = null;
        try {
            const extraData = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { profileVideo: true },
            });
            profileVideo = (extraData as any)?.profileVideo || null;
        } catch (e) {
            // Colonne pas encore créée
        }

        return NextResponse.json({ user: { ...user, profileVideo } });

    } catch (error) {
        console.error('Erreur récupération profil:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération du profil' },
            { status: 500 }
        );
    }
}
