// app/api/admin/reservations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =====================================================
// GET /api/admin/reservations
// =====================================================
export async function GET(request: NextRequest) {
  try {
    // Récupération des query params pour les filtres
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const parentId = searchParams.get('parentId');
    const workshopId = searchParams.get('workshopId');
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const search = searchParams.get('search');

    // Construction de la requête avec filtres
    const where: any = {};

    if (childId) {
      where.childId = parseInt(childId);
    }

    if (workshopId) {
      where.workshopId = parseInt(workshopId);
    }

    if (status) {
      where.status = status;
    }

    // Filtre par date (atelier à cette date)
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      where.workshop = {
        startTime: {
          gte: targetDate,
          lt: nextDay,
        },
      };
    }

    // Filtre par parent (via l'enfant)
    if (parentId) {
      where.child = {
        parentId: parseInt(parentId),
      };
    }

    // Recherche GLOBALE dans tous les champs
    if (search) {
      const searchTerm = search.toLowerCase();
      where.OR = [
        // Recherche dans le nom/prénom de l'enfant
        { child: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
        { child: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
        // Recherche dans le nom/prénom du parent
        { child: { parent: { firstName: { contains: searchTerm, mode: 'insensitive' } } } },
        { child: { parent: { lastName: { contains: searchTerm, mode: 'insensitive' } } } },
        // Recherche dans l'email du parent
        { child: { parent: { email: { contains: searchTerm, mode: 'insensitive' } } } },
        // Recherche dans le nom de l'atelier
        { workshop: { name: { contains: searchTerm, mode: 'insensitive' } } },
        // Recherche dans le lieu de l'atelier
        { workshop: { location: { contains: searchTerm, mode: 'insensitive' } } },
        // Recherche dans la description de l'atelier
        { workshop: { description: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    // Récupérer les réservations avec les relations
    const reservations = await prisma.booking.findMany({
      where,
      include: {
        child: {
          include: {
            parent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        workshop: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            capacity: true,
            location: true,
            description: true,
          },
        },
      },
      // Tri initial par date de l'atelier (croissant)
      orderBy: {
        workshop: {
          startTime: 'asc',
        },
      },
    });

    // Calcul de la capacité restante pour chaque atelier
    const reservationsWithAvailability = await Promise.all(
      reservations.map(async (reservation) => {
        // Compter les réservations CONFIRMED pour cet atelier
        const confirmedCount = await prisma.booking.count({
          where: {
            workshopId: reservation.workshopId,
            status: 'CONFIRMED',
          },
        });

        return {
          ...reservation,
          workshop: {
            ...reservation.workshop,
            remainingCapacity: Math.max(0, reservation.workshop.capacity - confirmedCount),
          },
        };
      })
    );

    // Tri supplémentaire côté serveur pour respecter l'ordre spécifique
    const sortedReservations = reservationsWithAvailability.sort((a, b) => {
      // 1. Par date/heure de l'atelier (croissant)
      const dateA = new Date(a.workshop.startTime).getTime();
      const dateB = new Date(b.workshop.startTime).getTime();
      if (dateA !== dateB) return dateA - dateB;
      
      // 2. Par nom de l'atelier (alphabétique)
      const workshopNameA = a.workshop.name.toLowerCase();
      const workshopNameB = b.workshop.name.toLowerCase();
      if (workshopNameA !== workshopNameB) {
        return workshopNameA.localeCompare(workshopNameB);
      }
      
      // 3. Par nom du parent (alphabétique)
      const parentNameA = a.child.parent.lastName.toLowerCase();
      const parentNameB = b.child.parent.lastName.toLowerCase();
      if (parentNameA !== parentNameB) {
        return parentNameA.localeCompare(parentNameB);
      }
      
      // 4. Par prénom du parent (alphabétique)
      const parentFirstNameA = a.child.parent.firstName.toLowerCase();
      const parentFirstNameB = b.child.parent.firstName.toLowerCase();
      if (parentFirstNameA !== parentFirstNameB) {
        return parentFirstNameA.localeCompare(parentFirstNameB);
      }
      
      // 5. Par nom de l'enfant (alphabétique)
      const childNameA = a.child.lastName.toLowerCase();
      const childNameB = b.child.lastName.toLowerCase();
      if (childNameA !== childNameB) {
        return childNameA.localeCompare(childNameB);
      }
      
      // 6. Par prénom de l'enfant (alphabétique)
      const childFirstNameA = a.child.firstName.toLowerCase();
      const childFirstNameB = b.child.firstName.toLowerCase();
      return childFirstNameA.localeCompare(childFirstNameB);
    });

    return NextResponse.json(sortedReservations);
  } catch (error) {
    console.error('Erreur GET /api/admin/reservations:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des réservations' },
      { status: 500 }
    );
  }
}

// =====================================================
// POST /api/admin/reservations
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation basique
    if (!body.childId || !body.workshopId) {
      return NextResponse.json(
        { error: 'Enfant et atelier sont requis' },
        { status: 400 }
      );
    }

    const childId = parseInt(body.childId);
    const workshopId = parseInt(body.workshopId);

    // Vérifier que l'enfant existe
    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: { parent: true },
    });

    if (!child) {
      return NextResponse.json(
        { error: 'L\'enfant spécifié n\'existe pas' },
        { status: 404 }
      );
    }

    // Vérifier que l'atelier existe
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
    });

    if (!workshop) {
      return NextResponse.json(
        { error: 'L\'atelier spécifié n\'existe pas' },
        { status: 404 }
      );
    }

    // Vérifier que l'atelier est actif
    if (workshop.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `L'atelier n'est pas disponible (statut: ${workshop.status})` },
        { status: 400 }
      );
    }

    // Vérifier la tranche d'âge
    const childAge = calculateAge(workshop.startTime, child.birthDate);
    if (childAge < workshop.minAge || childAge > workshop.maxAge) {
      return NextResponse.json(
        { 
          error: `L'enfant a ${childAge} ans, mais l'atelier est pour ${workshop.minAge}-${workshop.maxAge} ans`,
          childAge,
          workshopMinAge: workshop.minAge,
          workshopMaxAge: workshop.maxAge,
        },
        { status: 400 }
      );
    }

    // Vérifier si l'enfant a déjà réservé cet atelier
    const existingBooking = await prisma.booking.findFirst({
      where: {
        childId,
        workshopId,
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Cet enfant est déjà inscrit à cet atelier' },
        { status: 400 }
      );
    }

    // Vérifier les chevauchements horaires
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        childId,
        status: 'CONFIRMED',
        workshop: {
          OR: [
            {
              startTime: { lt: workshop.endTime },
              endTime: { gt: workshop.startTime },
            },
          ],
        },
      },
    });

    if (overlappingBookings.length > 0) {
      const conflictingWorkshop = overlappingBookings[0].workshopId;
      const conflictingWorkshopInfo = await prisma.workshop.findUnique({
        where: { id: conflictingWorkshop },
        select: { name: true, startTime: true, endTime: true },
      });

      return NextResponse.json(
        { 
          error: 'L\'enfant a déjà une réservation qui chevauche cet atelier',
          conflictingWorkshop: conflictingWorkshopInfo,
        },
        { status: 400 }
      );
    }

    // Vérifier la capacité
    const confirmedCount = await prisma.booking.count({
      where: {
        workshopId,
        status: 'CONFIRMED',
      },
    });

    // Déterminer le statut (CONFIRMED ou WAITLIST)
    // Si un statut est spécifié dans le body, on l'utilise (pour l'admin)
    // Sinon, on calcule automatiquement selon la capacité
    let status = body.status;
    if (!status || (status !== 'CONFIRMED' && status !== 'WAITLIST' && status !== 'CANCELLED')) {
      status = confirmedCount < workshop.capacity ? 'CONFIRMED' : 'WAITLIST';
    }

    // Créer la réservation
    const booking = await prisma.booking.create({
      data: {
        childId,
        workshopId,
        status,
      },
      include: {
        child: {
          include: {
            parent: true,
          },
        },
        workshop: true,
      },
    });

    // Mettre à jour le statut de l'atelier si complet
    if (status === 'CONFIRMED') {
      const newConfirmedCount = confirmedCount + 1;
      if (newConfirmedCount >= workshop.capacity) {
        await prisma.workshop.update({
          where: { id: workshopId },
          data: { status: 'FULL' },
        });
      }
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error('Erreur POST /api/admin/reservations:', error);

    // Gestion des erreurs Prisma spécifiques
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Erreur de clé étrangère : enfant ou atelier invalide' },
        { status: 400 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Cette réservation existe déjà' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de la réservation' },
      { status: 500 }
    );
  }
}

// =====================================================
// Fonction utilitaire : calcul de l'âge à une date donnée
// =====================================================
function calculateAge(atDate: Date, birthDate: Date): number {
  const eventDate = new Date(atDate);
  const birth = new Date(birthDate);
  let age = eventDate.getFullYear() - birth.getFullYear();
  const monthDiff = eventDate.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && eventDate.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}