import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from './prisma';

const SESSION_COOKIE = 'user_session';

export type UserType = 'parent' | 'admin';

export interface UserSession {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  type: UserType;
  role?: string; // For backward compatibility, but will be removed
}

export interface ParentSession extends UserSession {
  type: 'parent';
}

export interface AdminSession extends UserSession {
  type: 'admin';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionResponse(user: UserSession): Promise<NextResponse> {
  console.log('🍪 [SESSION] Création de la session pour:', user.firstName, user.lastName, `(${user.type})`);

  const sessionData = JSON.stringify(user);
  console.log('🍪 [SESSION] Données de session (longueur):', sessionData.length);

  const response = NextResponse.json({ success: true });
  console.log('🍪 [SESSION] Response créée');

  response.cookies.set(SESSION_COOKIE, sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  console.log('🍪 [SESSION] Cookie défini avec succès');
  return response;
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(sessionCookie.value) as UserSession;
    // Ensure type is set for backward compatibility
    if (!session.type) {
      session.type = 'parent'; // Default to parent for old sessions
    }
    return session;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function destroySessionResponse(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireParent(): Promise<ParentSession> {
  const session = await requireAuth();
  if (session.type !== 'parent') {
    throw new Error('Parent access required');
  }
  return session as ParentSession;
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await requireAuth();
  if (session.type !== 'admin') {
    throw new Error('Admin access required');
  }
  return session as AdminSession;
}

// Authentication functions for parents
export async function authenticateParent(email: string, password: string): Promise<ParentSession | null> {
  const parent = await prisma.parent.findUnique({
    where: { email },
  });

  if (!parent || !parent.password) {
    return null;
  }

  const isValid = await verifyPassword(password, parent.password);
  if (!isValid) {
    return null;
  }

  return {
    id: parent.id,
    email: parent.email,
    firstName: parent.firstName,
    lastName: parent.lastName,
    type: 'parent',
  };
}

// Authentication functions for admins
export async function authenticateAdmin(email: string, password: string): Promise<AdminSession | null> {
  const admin = await prisma.admin.findUnique({
    where: { email },
  });

  if (!admin) {
    return null;
  }

  const isValid = await verifyPassword(password, admin.password);
  if (!isValid) {
    return null;
  }

  return {
    id: admin.id,
    email: admin.email,
    firstName: admin.firstName,
    lastName: admin.lastName,
    type: 'admin',
  };
}

// Combined authentication function
export async function authenticateUser(email: string, password: string): Promise<UserSession | null> {
  // Try admin first
  const adminSession = await authenticateAdmin(email, password);
  if (adminSession) {
    return adminSession;
  }

  // Then try parent
  const parentSession = await authenticateParent(email, password);
  if (parentSession) {
    return parentSession;
  }

  return null;
}