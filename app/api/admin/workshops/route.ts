import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =====================================================
// GET /api/admin/workshops
// =====================================================
export async function GET() {
  try {
    const workshops = await prisma.workshop.findMany({
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(workshops);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des ateliers' },
      { status: 500 }
    );
  }
}

// =====================================================
// POST /api/admin/workshops
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const workshop = await prisma.workshop.create({
      data: {
        name: body.name,
        description: body.description,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        minAge: body.minAge,
        maxAge: body.maxAge,
        capacity: body.capacity,
        location: body.location,
        status: body.status,
      },
    });

    return NextResponse.json(workshop);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l’atelier' },
      { status: 500 }
    );
  }
}
