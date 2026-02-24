import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount, registrationId } = body;

        const clientSecret = `mock_client_secret_${Date.now()}`;

        return NextResponse.json({
            clientSecret,
            message: 'Payment intent created (mock)'
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Erreur lors de la création du paiement' },
            { status: 400 }
        );
    }
}
