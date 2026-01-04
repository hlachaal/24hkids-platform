// app/api/workshops/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { WorkshopStatus } from '@prisma/client';
import { requireAdmin } from '@/src/lib/auth';

// GET /api/workshops - Récupérer tous les ateliers avec filtres
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const dateParam = searchParams.get('date');
    const minAgeParam = searchParams.get('minAge');
    const maxAgeParam = searchParams.get('maxAge');
    const themeParam = searchParams.get('theme');

    const where: any = {};

    // Filtrer par date
    if (dateParam) {
      const startOfDay = new Date(dateParam);
      startOfDay.setUTCHours(0, 0, 0, 0); // Début du jour en UTC

      const endOfDay = new Date(dateParam);
      endOfDay.setUTCHours(23, 59, 59, 999); // Fin du jour en UTC

      where.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Filtrer par âge minimum
    if (minAgeParam) {
      const minAge = parseInt(minAgeParam, 10);
      if (!isNaN(minAge)) {
        where.minAge = { gte: minAge };
      }
    }

    // Filtrer par âge maximum
    if (maxAgeParam) {
      const maxAge = parseInt(maxAgeParam, 10);
      if (!isNaN(maxAge)) {
        where.maxAge = { lte: maxAge };
      }
    }

    // Filtrer par thème (recherche dans le nom ou la description)
    if (themeParam) {
      where.OR = [
        { name: { contains: themeParam, mode: 'insensitive' } },
        { description: { contains: themeParam, mode: 'insensitive' } },
      ];
    }

    const workshops = await prisma.workshop.findMany({
      where,
      orderBy: {
        startTime: 'asc',
      },
    });
    return NextResponse.json(workshops);
  } catch (error) {
    console.error('[API_WORKSHOPS_GET]', error);    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/workshops - Créer un nouvel atelier
export async function POST(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { 
        name, 
        description, 
        startTime, 
        endTime, 
        minAge, 
        maxAge, 
        capacity,
        location,
        status 
    } = body;

    // Validation simple
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return new NextResponse('Name is required and must be a non-empty string', { status: 400 });
    }
    if (!startTime) {
        return new NextResponse('Start time is required', { status: 400 });
    }
    if (!endTime) {
        return new NextResponse('End time is required', { status: 400 });
    }
    if (minAge === undefined || minAge === null || isNaN(Number(minAge)) || Number(minAge) < 0) {
        return new NextResponse('Valid minimum age is required', { status: 400 });
    }
    if (maxAge === undefined || maxAge === null || isNaN(Number(maxAge)) || Number(maxAge) < 0) {
        return new NextResponse('Valid maximum age is required', { status: 400 });
    }
    if (capacity === undefined || capacity === null || isNaN(Number(capacity)) || Number(capacity) <= 0) {
        return new NextResponse('Valid capacity greater than 0 is required', { status: 400 });
    }

    const minAgeNum = Number(minAge);
    const maxAgeNum = Number(maxAge);
    const capacityNum = Number(capacity);

    if (minAgeNum >= maxAgeNum) {
        return new NextResponse('Minimum age must be less than maximum age', { status: 400 });
    }

    // Validate dates
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    if (isNaN(startDate.getTime())) {
        return new NextResponse('Invalid start time format', { status: 400 });
    }
    if (isNaN(endDate.getTime())) {
        return new NextResponse('Invalid end time format', { status: 400 });
    }
    if (startDate >= endDate) {
        return new NextResponse('Start time must be before end time', { status: 400 });
    }

    const workshop = await prisma.workshop.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        startTime: startDate,
        endTime: endDate,
        minAge: minAgeNum,
        maxAge: maxAgeNum,
        capacity: capacityNum,
        location: location?.trim() || null,
        status: status as WorkshopStatus,
      },
    });

    return NextResponse.json(workshop, { status: 201 });
  } catch (error) {
    console.error('[API_WORKSHOPS_POST]', error);
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
