// app/api/reservations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/auth';

// GET /api/reservations/[id] - Récupérer une réservation par son ID
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        child: {
          include: {
            parent: true,
          },
        },
        workshop: true,
      },
    });

    if (!booking) {
      return new NextResponse('Booking not found', { status: 404 });
    }

    // Vérifier accès
    if (session.type !== 'admin' && booking.child.parentId !== session.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('[API_RESERVATION_GET]', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PUT /api/reservations/[id] - Annuler une réservation
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    // Récupérer la réservation pour vérifier propriété
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { 
        child: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!booking) {
      return new NextResponse('Booking not found', { status: 404 });
    }

    // Vérifier accès
    if (session.type !== 'admin' && booking.child.parentId !== session.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || status !== 'CANCELLED') {
      return new NextResponse('Only cancellation is allowed', { status: 400 });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    console.error('[API_RESERVATION_PUT]', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (error.code === 'P2025') {
      return new NextResponse('Booking not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/reservations/[id] - Supprimer une réservation (parent pour ses enfants ou admin)
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    // Récupérer la réservation pour vérifier propriété
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { 
        child: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!booking) {
      return new NextResponse('Booking not found', { status: 404 });
    }

    // Vérifier accès
    if (session.type !== 'admin' && booking.child.parentId !== session.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    await prisma.booking.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error: any) {
    console.error('[API_RESERVATION_DELETE]', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (error.code === 'P2025') {
      return new NextResponse('Booking not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}