// app/api/children/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/auth';

// GET /api/children/[id] - Récupérer un enfant par son ID (si appartient au parent)
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    const child = await prisma.child.findUnique({
      where: { id },
      include: {
        parent: true,
        bookings: { // Inclure les réservations de l'enfant
          include: {
            workshop: true // Et les détails de l'atelier pour chaque réservation
          }
        }
      },
    });

    if (!child) {
      return new NextResponse('Child not found', { status: 404 });
    }

    if (child.parentId !== session.id && session.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    return NextResponse.json(child);
  } catch (error) {
    console.error('[API_CHILD_GET]', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PUT /api/children/[id] - Mettre à jour un enfant (si appartient au parent ou admin)
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    // Vérifier que l'enfant appartient au parent ou que l'utilisateur est admin
    const existingChild = await prisma.child.findUnique({ where: { id } });
    if (!existingChild) {
      return new NextResponse('Child not found', { status: 404 });
    }
    if (existingChild.parentId !== session.id && session.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const body = await req.json();
    console.log('[API_CHILD_PUT] Received body:', body);
    
    // Convert birthDate string to Date object if present
    const updateData: any = { ...body };
    if (updateData.birthDate) {
      const birthDate = new Date(updateData.birthDate);
      if (isNaN(birthDate.getTime())) {
        return new NextResponse('Invalid birth date format', { status: 400 });
      }
      updateData.birthDate = birthDate;
    }
    
    // Remove parentId from update data to prevent changing the parent
    delete updateData.parentId;
    
    console.log('[API_CHILD_PUT] Update data:', updateData);
    
    const child = await prisma.child.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(child);
  } catch (error: any) {
    console.error('[API_CHILD_PUT] Error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (error.code === 'P2025') {
      return new NextResponse('Child not found', { status: 404 });
    }
    if (error.code === 'P2003') {
        return new NextResponse('The specified parent does not exist', { status: 400 });
    }
    console.error('[API_CHILD_PUT]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/children/[id] - Supprimer un enfant (si appartient au parent ou admin)
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    // Vérifier que l'enfant appartient au parent ou que l'utilisateur est admin
    const existingChild = await prisma.child.findUnique({ where: { id } });
    if (!existingChild) {
      return new NextResponse('Child not found', { status: 404 });
    }
    if (existingChild.parentId !== session.id && session.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    await prisma.child.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error: any) {
    console.error('[API_CHILD_DELETE]', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (error.code === 'P2025') {
      return new NextResponse('Child not found', { status: 404 });
    }
    // Gère le cas où des réservations (bookings) empêchent la suppression
    if (error.code === 'P2003') {
        return new NextResponse('Cannot delete child. Please delete associated bookings first.', { status: 409 });
    }
    console.error('[API_CHILD_DELETE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
