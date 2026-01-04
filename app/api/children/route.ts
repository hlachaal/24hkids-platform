// app/api/children/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/auth';

// GET /api/children - Récupérer les enfants du parent connecté
export async function GET() {
  try {
    const session = await requireAuth();
    const children = await prisma.child.findMany({
      where: { parentId: session.id },
      include: {
        parent: true, // Inclure le parent lié
      },
      orderBy: {
        lastName: 'asc',
      },
    });
    return NextResponse.json(children);
  } catch (error) {
    console.error('[API_CHILDREN_GET]', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/children - Créer un nouvel enfant pour le parent connecté
export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { firstName, lastName, birthDate, allergies, medicalNote } = body;

    // Validation
    if (!firstName || !lastName || !birthDate) {
      return new NextResponse('First name, last name, and birth date are required', { status: 400 });
    }

    const child = await prisma.child.create({
      data: {
        firstName,
        lastName,
        birthDate: new Date(birthDate),
        parentId: session.id,
        allergies,
        medicalNote,
      },
    });

    return NextResponse.json(child, { status: 201 });
  } catch (error: any) {
    console.error('[API_CHILDREN_POST]', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    // Gérer l'erreur de clé étrangère (parentId n'existe pas)
    if (error.code === 'P2003') {
      return new NextResponse('The specified parent does not exist', { status: 400 });
    }
    console.error('[API_CHILDREN_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
