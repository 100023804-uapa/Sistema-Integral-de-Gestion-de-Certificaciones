import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedInternalUser } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const auth = await requireAuthenticatedInternalUser(request);
    if (auth.response) {
        return auth.response;
    }

    const env = {
        NODE_ENV: process.env.NODE_ENV,
        FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? '✅ Presente' : '❌ Ausente',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        APP_URL: process.env.APP_URL,
    };

    return NextResponse.json(env);
}
