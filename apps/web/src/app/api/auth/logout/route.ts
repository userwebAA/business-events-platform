import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true });
    // Supprimer le cookie token côté serveur
    response.cookies.set('token', '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0),
    });
    return response;
}
