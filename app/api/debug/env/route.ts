import { NextResponse } from 'next/server';

export async function GET() {
    const env = {
        NODE_ENV: process.env.NODE_ENV,
        FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? '✅ Presente' : '❌ Ausente',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        APP_URL: process.env.APP_URL,
    };

    console.log('🔍 Debug de variables de entorno:', env);

    return NextResponse.json(env);
}
