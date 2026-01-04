// app/api/admin/workshops/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Récupère et valide l'id depuis les params async (Next.js 15+)
 */
async function getId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numericId = Number(id);

  if (Number.isNaN(numericId)) {
    throw new Error('ID invalide');
  }

  return numericId;
}

/**
 * Convertit un datetime-local en Date UTC
 * ex: "2025-01-10T10:00"
 */
function localToUTC(dateString?: string) {
  if (!dateString) return null;

  const [date, time] = dateString.split('T');
  if (!date || !time) return null;

  return new Date(`${date}T${time}:00`);
}

// =====================================================
// GET /api/admin/workshops/[id]
// =====================================================
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getId(context);

    const workshop = await prisma.workshop.findUnique({
      where: { id },
    });

    if (!workshop) {
      return NextResponse.json(
        { error: 'Atelier non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(workshop);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// =====================================================
// PUT /api/admin/workshops/[id]
// =====================================================
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getId(context);
    const body = await request.json();

    const updated = await prisma.workshop.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,

        startTime: localToUTC(body.startTime),
        endTime: localToUTC(body.endTime),

        minAge: Number(body.minAge),
        maxAge: Number(body.maxAge),
        capacity: Number(body.capacity),

        location: body.location || null,
        status: body.status,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l’atelier' },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE /api/admin/workshops/[id]
// =====================================================
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getId(context);

    await prisma.workshop.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);

    // Contrainte FK (réservations existantes)
    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          error:
            'Impossible de supprimer cet atelier : des réservations existent.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l’atelier' },
      { status: 500 }
    );
  }
}
