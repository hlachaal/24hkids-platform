// app/api/admin/reservations/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { emailService } from '@/app/lib/email/sender-nodemailer';
import { auditLogger } from '@/app/lib/audit/logger';

const prisma = new PrismaClient();

/**
 * Utilitaire pour récupérer l'id correctement
 */
async function getId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return Number(id);
}

// =====================================================
// GET /api/admin/reservations/[id]
// =====================================================
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getId(context);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        child: {
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
          },
        },
        workshop: {
          select: {
            id: true,
            name: true,
            description: true,
            startTime: true,
            endTime: true,
            minAge: true,
            maxAge: true,
            capacity: true,
            location: true,
            status: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    // Calcul de l'âge de l'enfant au moment de l'atelier
    const childAge = calculateAge(booking.workshop.startTime, booking.child.birthDate);

    // Calcul des places restantes pour cet atelier
    const confirmedCount = await prisma.booking.count({
      where: {
        workshopId: booking.workshopId,
        status: 'CONFIRMED',
      },
    });

    const remainingCapacity = Math.max(0, booking.workshop.capacity - confirmedCount);

    return NextResponse.json({
      ...booking,
      childAge,
      remainingCapacity,
    });
  } catch (error) {
    console.error('Erreur GET /api/admin/reservations/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// =====================================================
// PUT /api/admin/reservations/[id]
// Principalement pour changer le statut
// =====================================================
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getId(context);
    const body = await request.json();

    // Récupérer la réservation actuelle
    const currentBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        workshop: true,
      },
    });

    if (!currentBooking) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    // Seul le statut peut être modifié
    if (!body.status) {
      return NextResponse.json(
        { error: 'Seul le statut peut être modifié' },
        { status: 400 }
      );
    }

    const newStatus = body.status;
    const oldStatus = currentBooking.status;
    const workshopId = currentBooking.workshopId;

    // Mise à jour de la réservation
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: newStatus },
      include: {
        child: {
          include: {
            parent: true,
          },
        },
        workshop: true,
      },
    });

    // Gestion des changements de statut qui affectent la capacité
    if (oldStatus === 'CONFIRMED' && newStatus !== 'CONFIRMED') {
      // On libère une place
      await updateWorkshopCapacity(workshopId, -1);
    } else if (oldStatus !== 'CONFIRMED' && newStatus === 'CONFIRMED') {
      // On prend une place
      await updateWorkshopCapacity(workshopId, 1);
    }

    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    console.error('Erreur PUT /api/admin/reservations/[id]:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE /api/admin/reservations/[id]
// =====================================================
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getId(context);
    
    // 1. Récupérer la réservation à supprimer
    const bookingToDelete = await prisma.booking.findUnique({
      where: { id },
      include: {
        workshop: true,
        child: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!bookingToDelete) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    // 2. Chercher le premier WAITLIST si on supprime un CONFIRMED
    let nextWaitlist: any = null;
    if (bookingToDelete.status === 'CONFIRMED') {
      nextWaitlist = await prisma.booking.findFirst({
        where: {
          workshopId: bookingToDelete.workshopId,
          status: 'WAITLIST',
        },
        orderBy: { createdAt: 'asc' },
        include: {
          child: {
            include: {
              parent: true,
            },
          },
        },
      });

      // 3. Promouvoir le premier WAITLIST si existe
      if (nextWaitlist) {
        await prisma.booking.update({
          where: { id: nextWaitlist.id },
          data: { status: 'CONFIRMED' },
        });

        // Envoyer email de promotion
        if (nextWaitlist.child?.parent?.email) {
          await emailService.sendWaitlistPromotedEmail(
            nextWaitlist.child.parent.email,
            nextWaitlist.child.parent.firstName,
            `${nextWaitlist.child.firstName} ${nextWaitlist.child.lastName}`,
            bookingToDelete.workshop.name,
            new Date(bookingToDelete.workshop.startTime).toLocaleDateString('fr-FR'),
            new Date(bookingToDelete.workshop.startTime).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          );
        }
      }
    }

    // 4. Envoyer email de regret si on supprime
    if (bookingToDelete.child?.parent?.email) {
      const body = await request.json().catch(() => ({}));
      const reason = body?.reason;
      
      await emailService.sendReservationDeletedEmail(
        bookingToDelete.child.parent.email,
        bookingToDelete.child.parent.firstName,
        `${bookingToDelete.child.firstName} ${bookingToDelete.child.lastName}`,
        bookingToDelete.workshop.name,
        new Date(bookingToDelete.workshop.startTime).toLocaleDateString('fr-FR'),
        new Date(bookingToDelete.workshop.startTime).toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        reason
      );
    }

    // 5. Logger (simplifié sans session)
    await auditLogger.logReservationDeletion(
      id,
      { id: 1, email: 'admin@system', type: 'ADMIN' },
      bookingToDelete,
      nextWaitlist,
      request.ip || request.headers.get('x-forwarded-for') || 'N/A',
      request.headers.get('user-agent') || 'N/A'
    );

    // 6. Supprimer la réservation
    await prisma.booking.delete({
      where: { id },
    });

    // 7. Mettre à jour le statut de l'atelier
    const confirmedCount = await prisma.booking.count({
      where: {
        workshopId: bookingToDelete.workshopId,
        status: 'CONFIRMED',
      },
    });

    let newStatus = bookingToDelete.workshop.status;
    if (confirmedCount < bookingToDelete.workshop.capacity) {
      newStatus = 'ACTIVE';
    }

    await prisma.workshop.update({
      where: { id: bookingToDelete.workshopId },
      data: { status: newStatus },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Réservation supprimée',
      promotedFromWaitlist: nextWaitlist ? {
        id: nextWaitlist.id,
        childName: `${nextWaitlist.child.firstName} ${nextWaitlist.child.lastName}`,
      } : null
    });
    
  } catch (error: any) {
    console.error('Erreur DELETE /api/admin/reservations/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}

// =====================================================
// Fonctions utilitaires
// =====================================================

// Calcul de l'âge à une date donnée
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

// Mettre à jour la capacité et le statut d'un atelier
async function updateWorkshopCapacity(workshopId: number, change: number) {
  // Compter les réservations CONFIRMED actuelles
  const confirmedCount = await prisma.booking.count({
    where: {
      workshopId,
      status: 'CONFIRMED',
    },
  });

  // Récupérer l'atelier
  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
    select: { capacity: true, status: true },
  });

  if (!workshop) return;

  // Déterminer le nouveau statut
  let newStatus = workshop.status;
  if (confirmedCount >= workshop.capacity) {
    newStatus = 'FULL';
  } else if (workshop.status === 'FULL' && confirmedCount < workshop.capacity) {
    newStatus = 'ACTIVE';
  }

  // Mettre à jour si nécessaire
  if (newStatus !== workshop.status) {
    await prisma.workshop.update({
      where: { id: workshopId },
      data: { status: newStatus },
    });
  }
}