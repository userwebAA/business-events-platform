import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Générer un PDF d'étiquettes pour tous les participants
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Récupérer le token depuis les query params
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        // Récupérer l'événement
        const event = await prisma.event.findUnique({
            where: { id: params.id },
            select: {
                id: true,
                title: true,
                organizerId: true,
            },
        });

        if (!event) {
            return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
        }

        // Vérifier que l'utilisateur est l'organisateur
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { role: true },
        });

        const isOrganizer = event.organizerId === decoded.userId || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
        if (!isOrganizer) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        // Récupérer toutes les inscriptions
        const registrations = await prisma.registration.findMany({
            where: { eventId: params.id },
            orderBy: { createdAt: 'asc' },
        });

        // Préparer les données pour les étiquettes
        const labels = registrations.map((reg) => {
            const formData = reg.formData as any;
            return {
                name: formData.firstName && formData.lastName
                    ? `${formData.firstName} ${formData.lastName}`
                    : formData.name || 'Participant',
                firstName: formData.firstName || '',
                lastName: formData.lastName || '',
                company: formData.company || '',
                position: formData.position || '',
            };
        });

        // Générer le HTML pour les étiquettes (format Avery 5160 - 30 étiquettes par page)
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Étiquettes - ${event.title}</title>
    <style>
        @page {
            size: letter;
            margin: 0.5in 0.1875in;
        }
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }
        .page {
            width: 8.5in;
            height: 11in;
            display: grid;
            grid-template-columns: repeat(3, 2.625in);
            grid-template-rows: repeat(10, 1in);
            gap: 0;
            page-break-after: always;
        }
        .label {
            width: 2.625in;
            height: 1in;
            padding: 0.15in;
            box-sizing: border-box;
            border: 1px dashed #ccc;
            display: flex;
            flex-direction: column;
            justify-content: center;
            overflow: hidden;
        }
        .label-name {
            font-size: 16pt;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .label-position {
            font-size: 11pt;
            color: #374151;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .label-company {
            font-size: 10pt;
            color: #6b7280;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .event-title {
            font-size: 8pt;
            color: #9ca3af;
            margin-top: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        @media print {
            .label {
                border: none;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        ${labels.map((label, index) => `
            <div class="label">
                <div class="label-name">${label.name}</div>
                ${label.position ? `<div class="label-position">${label.position}</div>` : ''}
                ${label.company ? `<div class="label-company">${label.company}</div>` : ''}
                <div class="event-title">${event.title}</div>
            </div>
            ${(index + 1) % 30 === 0 && index !== labels.length - 1 ? '</div><div class="page">' : ''}
        `).join('')}
    </div>
</body>
</html>
        `;

        // Retourner le HTML pour impression
        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
            },
        });

    } catch (error) {
        console.error('Erreur lors de la génération des étiquettes:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
