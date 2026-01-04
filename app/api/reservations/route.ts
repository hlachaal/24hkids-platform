// app/api/reservations/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { BookingService } from '@/src/services/bookingService';
import { requireAuth } from '@/src/lib/auth';

// GET /api/reservations - Récupérer les réservations
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const workshopId = searchParams.get('workshopId');

    let whereClause: any = workshopId ? { workshopId: parseInt(workshopId, 10) } : {};

    if (session.type !== 'admin') {
      // Parents voient seulement les réservations de leurs enfants
      const childrenIds = await prisma.child.findMany({
        where: { parentId: session.id },
        select: { id: true }
      });
      whereClause.childId = { in: childrenIds.map(c => c.id) };
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        child: {
          include: {
            parent: true,
          },
        },
        workshop: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('[API_RESERVATIONS_GET]', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/reservations - Créer une nouvelle réservation
export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { childId, workshopId } = body;

    if (!childId || !workshopId) {
      return new NextResponse('childId and workshopId are required', { status: 400 });
    }

    // Vérifier que l'enfant appartient au parent (sauf admin)
    if (session.type !== 'admin') {
      const child = await prisma.child.findUnique({ where: { id: parseInt(childId, 10) } });
      if (!child || child.parentId !== session.id) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    const booking = await BookingService.createBooking(parseInt(childId, 10), parseInt(workshopId, 10));

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error('[API_RESERVATIONS_POST]', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (error.message.includes('not found')) {
      return new NextResponse(error.message, { status: 404 });
    }
    if (error.message.toLowerCase().includes('tranche d\'âge') || error.message.toLowerCase().includes('complet') || error.message.toLowerCase().includes('chevauchement') || error.message.toLowerCase().includes('déjà inscrit')) {
      return new NextResponse(error.message, { status: 409 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
