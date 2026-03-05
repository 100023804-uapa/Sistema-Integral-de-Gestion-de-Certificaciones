import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // TEMPORAL: Logout simple sin Firebase Admin
        console.log('⚠️ Logout temporal sin Firebase Admin');

        const response = NextResponse.json({ success: true });

        // Eliminar cookie
        response.cookies.set('session', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        });

        return response;

    } catch (error) {
        console.error('Logout session error:', error);
        return NextResponse.json(
            { error: 'No fue posible cerrar la sesión. Inténtelo de nuevo.' },
            { status: 500 }
        );
    }
}
