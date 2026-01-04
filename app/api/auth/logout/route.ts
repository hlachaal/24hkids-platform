// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { destroySessionResponse } from '@/src/lib/auth';

export async function POST() {
  try {
    const response = await destroySessionResponse();

    // Optionnel : cohérence API
    response.headers.set('Content-Type', 'application/json');
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
