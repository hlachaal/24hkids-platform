// app/api/admin/children/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =====================================================
// GET /api/admin/children
// =====================================================
export async function GET(request: NextRequest) {
  try {
    // Récupération des query params pour les filtres
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const search = searchParams.get('search');

    // Construction de la requête avec filtres
    const where: any = {};

    if (parentId) {
      where.parentId = parseInt(parentId);
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const children = await prisma.child.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        bookings: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    // Transformation des données pour inclure l'âge et le comptage
    const childrenWithAge = children.map(child => {
      const age = calculateAge(child.birthDate);
      const bookingCount = child.bookings.filter(b => b.status === 'CONFIRMED').length;
      
      return {
        ...child,
        age,
        bookingCount,
        parentName: `${child.parent.firstName} ${child.parent.lastName}`,
      };
    });

    return NextResponse.json(childrenWithAge);
  } catch (error) {
    console.error('Erreur GET /api/admin/children:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des enfants' },
      { status: 500 }
    );
  }
}

// =====================================================
// POST /api/admin/children
// =====================================================
export async function POST(request: NextRequest) {
  try {
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

    const child = await prisma.child.create({
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

    return NextResponse.json(child);
  } catch (error: any) {
    console.error('Erreur POST /api/admin/children:', error);

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Erreur de clé étrangère : parent invalide' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'enfant' },
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