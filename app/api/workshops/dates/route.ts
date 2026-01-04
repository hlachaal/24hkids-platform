// app/api/workshops/dates/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

// GET /api/workshops/dates - Récupérer les dates uniques des ateliers
export async function GET() {
  try {
    // Récupérer les dates distinctes des ateliers en utilisant groupBy
    const dates = await prisma.workshop.groupBy({
      by: ['startTime'],
      orderBy: {
        startTime: 'asc',
      },
    });

    // Formater les dates pour l'affichage (YYYY-MM-DD) et supprimer les doublons
    const dateMap = new Map<string, {value: string, label: string}>();
    
    dates.forEach(workshop => {
      const value = workshop.startTime.toISOString().split('T')[0];
      if (!dateMap.has(value)) {
        dateMap.set(value, {
          value,
          label: workshop.startTime.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        });
      }
    });

    const uniqueDates = Array.from(dateMap.values()).sort((a, b) => a.value.localeCompare(b.value));

    return NextResponse.json(uniqueDates);
  } catch (error) {
    console.error('[API_WORKSHOPS_DATES_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}