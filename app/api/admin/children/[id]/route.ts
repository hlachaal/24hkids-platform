// app/api/admin/children/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Utilitaire pour récupérer l'id correctement (même pattern que parents)
 */
async function getId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return Number(id);
}

// =====================================================
// GET /api/admin/children/[id]
// =====================================================
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getId(context);

    const child = await prisma.child.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        bookings: {
          include: {
            workshop: {
              select: {
                id: true,
                name: true,
                startTime: true,
                endTime: true,
              },
            },
          },
        },
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: 'Enfant non trouvé' },
        { status: 404 }
      );
    }

    // Calcul de l'âge
    const age = calculateAge(child.birthDate);

    return NextResponse.json({
      ...child,
      age,
    });
  } catch (error) {
    console.error('Erreur GET /api/admin/children/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// =====================================================
// PUT /api/admin/children/[id]
// =====================================================
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getId(context);
    const body = await request.json();

    // Validation basique
    if (!body.firstName || !body.lastName || !body.birthDate || !body.parentId) {
      return NextResponse.json(
        { error: 'Prénom, nom, date de naissance et parent sont requis' },
        { status: 400 }
      );
    }

    // Vérification que le parent existe
    const parent = await prisma.parent.findUnique({
      where: { id: parseInt(body.parentId) },
    });

    if (!parent) {
      return NextResponse.json(
        { error: 'Le parent spécifié n\'existe pas' },
        { status: 404 }
      );
    }

    const updatedChild = await prisma.child.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        birthDate: new Date(body.birthDate),
        parentId: parseInt(body.parentId),
        allergies: body.allergies || null,
        medicalNote: body.medicalNote || null,
      },
      include: {
        parent: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(updatedChild);
  } catch (error: any) {
    console.error('Erreur PUT /api/admin/children/[id]:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Enfant non trouvé' },
        { status: 404 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Erreur de clé étrangère : parent invalide' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE /api/admin/children/[id]
// =====================================================
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getId(context);

    // Vérifier s'il y a des réservations actives
    const bookings = await prisma.booking.findMany({
      where: {
        childId: id,
        status: 'CONFIRMED',
      },
    });

    if (bookings.length > 0) {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer cet enfant car il a des réservations actives',
          bookingsCount: bookings.length 
        },
        { status: 400 }
      );
    }

    await prisma.child.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Enfant supprimé avec succès'
    });
  } catch (error: any) {
    console.error('Erreur DELETE /api/admin/children/[id]:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Enfant non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}

// =====================================================
// Fonction utilitaire : calcul de l'âge
// =====================================================
function calculateAge(birthDate: Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}