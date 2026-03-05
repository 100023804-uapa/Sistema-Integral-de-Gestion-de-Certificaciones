import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('session')?.value;

        // TEMPORAL: Verificar simple sin Firebase Admin
        if (sessionCookie && sessionCookie === 'temp-session') {
            return NextResponse.json({ 
                valid: true, 
                message: 'Sesión temporal válida' 
            });
        }

        return NextResponse.json({ 
            valid: false, 
            message: 'Sesión inválida' 
        });

    } catch (error) {
        console.error('Verify session error:', error);
        return NextResponse.json(
            { valid: false, message: 'Error verificando sesión' },
            { status: 500 }
        );
    }
}
