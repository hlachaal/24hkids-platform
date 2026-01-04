// app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/src/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    return NextResponse.json(session);
  } catch (error) {
    console.error('[API_AUTH_SESSION]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}