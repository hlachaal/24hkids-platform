// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSessionResponse } from '@/src/lib/auth';

export async function POST(request: NextRequest) {
  console.log('🔐 [LOGIN] Début de la requête de connexion');

  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('📧 [LOGIN] Email reçu:', email);
    console.log('🔑 [LOGIN] Mot de passe fourni (longueur):', password ? password.length : 'null');

    if (!email || !password) {
      console.log('❌ [LOGIN] Email ou mot de passe manquant');
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    console.log('🔍 [LOGIN] Tentative d\'authentification...');
    const user = await authenticateUser(email, password);

    if (!user) {
      console.log('❌ [LOGIN] Authentification échouée - identifiants invalides');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log('✅ [LOGIN] Authentification réussie pour:', user.firstName, user.lastName, `(${user.type})`);

    const response = await createSessionResponse(user);
    console.log('🎉 [LOGIN] Session créée avec succès');
    return response;

  } catch (error) {
    console.error('💥 [LOGIN] Erreur lors de la connexion:', error);
    console.error('💥 [LOGIN] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}