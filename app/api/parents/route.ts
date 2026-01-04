// app/api/parents/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { requireAdmin, hashPassword } from '@/src/lib/auth';

// GET /api/parents - Récupérer tous les parents (admin seulement)
export async function GET() {
  try {
    const session = await requireAdmin();
    // Exclude any records that are marked as ADMIN in the parents table
    const parents = await prisma.parent.findMany({
      include: {
        children: true
      },
      orderBy: {
        lastName: 'asc'
      }
    });

    return NextResponse.json(parents);
  } catch (error) {
    console.error('[API_PARENTS_GET]', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/parents - Créer un nouveau parent (inscription publique)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, password, phone, notifyEmail, notifySMS } = body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return new NextResponse('First name, last name, email, and password are required', { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const parent = await prisma.parent.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        notifyEmail,
        notifySMS,
      },
    });

    return NextResponse.json(parent, { status: 201 });
  } catch (error: any) {
    console.error('[API_PARENTS_POST]', error);
    // Gérer la contrainte d'unicité de l'email
    if (error.code === 'P2002') {
      return new NextResponse('A parent with this email already exists', { status: 409 }); // 409 Conflict
    }
    console.error('[API_PARENTS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
