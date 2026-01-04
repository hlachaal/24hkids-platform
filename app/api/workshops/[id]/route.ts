// app/api/workshops/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/auth';

// GET /api/workshops/[id] - Récupérer un atelier par son ID
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const resolvedParams = await context.params;
  const id = parseInt(resolvedParams.id, 10);

  if (isNaN(id)) {
    return new NextResponse('Invalid ID', { status: 400 });
  }

  try {
    const workshop = await prisma.workshop.findUnique({
      where: { id },
    });

    if (!workshop) {
      return new NextResponse('Workshop not found', { status: 404 });
    }

    return NextResponse.json(workshop);
  } catch (error) {
    console.error('[API_WORKSHOP_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PUT /api/workshops/[id] - Mettre à jour un atelier
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();

    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    const body = await req.json();
    const { name, description, startTime, endTime, minAge, maxAge, capacity, location, status } = body;

    // Validation (only for provided fields)
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return new NextResponse('Name must be a non-empty string', { status: 400 });
    }
    if (startTime !== undefined && !startTime) {
      return new NextResponse('Start time is required', { status: 400 });
    }
    if (endTime !== undefined && !endTime) {
      return new NextResponse('End time is required', { status: 400 });
    }
    if (minAge !== undefined && (minAge === null || isNaN(Number(minAge)) || Number(minAge) < 0)) {
      return new NextResponse('Valid minimum age is required', { status: 400 });
    }
    if (maxAge !== undefined && (maxAge === null || isNaN(Number(maxAge)) || Number(maxAge) < 0)) {
      return new NextResponse('Valid maximum age is required', { status: 400 });
    }
    if (capacity !== undefined && (capacity === null || isNaN(Number(capacity)) || Number(capacity) <= 0)) {
      return new NextResponse('Valid capacity greater than 0 is required', { status: 400 });
    }

    // Cross-field validation
    const minAgeNum = minAge !== undefined ? Number(minAge) : undefined;
    const maxAgeNum = maxAge !== undefined ? Number(maxAge) : undefined;
    if (minAgeNum !== undefined && maxAgeNum !== undefined && minAgeNum >= maxAgeNum) {
      return new NextResponse('Minimum age must be less than maximum age', { status: 400 });
    }

    // Date validation
    let startDate, endDate;
    if (startTime) {
      startDate = new Date(startTime);
      if (isNaN(startDate.getTime())) {
        return new NextResponse('Invalid start time format', { status: 400 });
      }
    }
    if (endTime) {
      endDate = new Date(endTime);
      if (isNaN(endDate.getTime())) {
        return new NextResponse('Invalid end time format', { status: 400 });
      }
    }
    if (startDate && endDate && startDate >= endDate) {
      return new NextResponse('Start time must be before end time', { status: 400 });
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (startTime !== undefined) updateData.startTime = startDate;
    if (endTime !== undefined) updateData.endTime = endDate;
    if (minAge !== undefined) updateData.minAge = minAgeNum;
    if (maxAge !== undefined) updateData.maxAge = maxAgeNum;
    if (capacity !== undefined) updateData.capacity = Number(capacity);
    if (location !== undefined) updateData.location = location?.trim() || null;
    if (status !== undefined) updateData.status = status;

    const workshop = await prisma.workshop.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(workshop);
  } catch (error: any) {
    console.error('[API_WORKSHOP_PUT]', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (error.code === 'P2025') { // Code d'erreur Prisma pour "enregistrement non trouvé"
      return new NextResponse('Workshop not found', { status: 404 });
    }
    console.error('[API_WORKSHOP_PUT]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/workshops/[id] - Supprimer un atelier
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();

    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    await prisma.workshop.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error: any) {
    console.error('[API_WORKSHOP_DELETE]', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (error.code === 'P2025') { // Code d'erreur Prisma pour "enregistrement non trouvé"
      return new NextResponse('Workshop not found', { status: 404 });
    }
    console.error('[API_WORKSHOP_DELETE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
