// app/api/admin/parents/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =====================================================
// GET /api/admin/parents
// =====================================================
export async function GET() {
  try {
    const parents = await prisma.parent.findMany({
      include: {
        children: true,
      },
      orderBy: { lastName: 'asc' },
    });

    return NextResponse.json(parents);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des parents' },
      { status: 500 }
    );
  }
}

// =====================================================
// POST /api/admin/parents
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parent = await prisma.parent.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || null,
        password: body.password || null, // ⚠️ à hasher en prod
      },
    });

    return NextResponse.json(parent);
  } catch (error: any) {
    console.error(error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Impossible de créer ce parent : cet email est déjà utilisé.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du parent' },
      { status: 500 }
    );
  }
}
