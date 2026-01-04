// app/api/admin/parents/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Utilitaire pour récupérer l'id correctement
 */
async function getId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return Number(id);
}

// =====================================================
// GET /api/admin/parents/[id]
// =====================================================
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getId(context);

    const parent = await prisma.parent.findUnique({
      where: { id },
      include: {
        children: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(parent);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// =====================================================
// PUT /api/admin/parents/[id]
// =====================================================
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getId(context);
    const body = await request.json();

    const updatedParent = await prisma.parent.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        ...(body.password && { password: body.password }), // ⚠️ à hasher en prod
      },
    });

    return NextResponse.json(updatedParent);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE /api/admin/parents/[id]
// =====================================================
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getId(context);

    await prisma.parent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
