import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // Validation basique
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email et mot de passe requis' },
                { status: 400 }
            );
        }

        // Test hardcodé pour le compte admin
        if (email === 'alexalix58@gmail.com' && password === 'Pozerty321') {
            const token = signToken({
                userId: '3bf4322f-838f-46a2-a720-afb14829ede9',
                email: 'alexalix58@gmail.com',
                role: 'SUPER_ADMIN',
            });

            return NextResponse.json({
                user: {
                    id: '3bf4322f-838f-46a2-a720-afb14829ede9',
                    email: 'alexalix58@gmail.com',
                    name: 'Alex Admin',
                    role: 'SUPER_ADMIN',
                },
                token,
            });
        }

        return NextResponse.json(
            { error: 'Email ou mot de passe incorrect' },
            { status: 401 }
        );
    } catch (error: unknown) {
        return NextResponse.json(
            { error: 'Erreur lors de la connexion' },
            { status: 500 }
        );
    }
}
