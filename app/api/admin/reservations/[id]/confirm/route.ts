// app/api/admin/reservations/[id]/confirm/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { emailService } from '@/app/lib/email/sender-nodemailer';

const prisma = new PrismaClient();

async function getId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return Number(id);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getId(context);
    
    const waitlistBooking = await prisma.booking.findUnique({
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

    if (!waitlistBooking) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    if (waitlistBooking.status !== 'WAITLIST') {
      return NextResponse.json(
        { error: 'Cette réservation n\'est pas en liste d\'attente' },
        { status: 400 }
      );
    }

    const confirmedCount = await prisma.booking.count({
      where: {
        workshopId: waitlistBooking.workshopId,
        status: 'CONFIRMED',
      },
    });

    if (confirmedCount >= waitlistBooking.workshop.capacity) {
      return NextResponse.json(
        { 
          error: 'Plus de places disponibles',
          remainingCapacity: 0,
        },
        { status: 400 }
      );
    }

    // Confirmer la réservation
    const confirmedBooking = await prisma.booking.update({
      where: { id },
      data: { 
        status: 'CONFIRMED',
        updatedAt: new Date(),
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

    // Envoyer email de confirmation
    let emailSent = false;
    let emailError = null;
    
    if (confirmedBooking.child?.parent?.email) {
      try {
        // Vérifier que la méthode existe
        if (emailService && typeof emailService.sendWaitlistPromotedEmail === 'function') {
          emailSent = await emailService.sendWaitlistPromotedEmail(
            confirmedBooking.child.parent.email,
            confirmedBooking.child.parent.firstName,
            `${confirmedBooking.child.firstName} ${confirmedBooking.child.lastName}`,
            confirmedBooking.workshop.name,
            new Date(confirmedBooking.workshop.startTime).toLocaleDateString('fr-FR'),
            new Date(confirmedBooking.workshop.startTime).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          );
        } else {
          console.warn('Méthode sendWaitlistPromotedEmail non disponible');
          emailError = 'Service email non configuré';
        }
      } catch (emailErr) {
        console.warn('Erreur envoi email:', emailErr);
        emailError = emailErr instanceof Error ? emailErr.message : 'Erreur email';
      }
    }

    // Mettre à jour le statut de l'atelier si complet
    const newConfirmedCount = confirmedCount + 1;
    let workshopStatusUpdated = false;
    
    if (newConfirmedCount >= confirmedBooking.workshop.capacity) {
      await prisma.workshop.update({
        where: { id: confirmedBooking.workshopId },
        data: { status: 'FULL' },
      });
      workshopStatusUpdated = true;
    }

    const response = {
      success: true,
      message: 'Réservation confirmée avec succès',
      booking: {
        id: confirmedBooking.id,
        status: confirmedBooking.status,
        childName: `${confirmedBooking.child.firstName} ${confirmedBooking.child.lastName}`,
        workshopName: confirmedBooking.workshop.name,
      },
      remainingCapacity: confirmedBooking.workshop.capacity - newConfirmedCount,
      emailSent,
      workshopStatusUpdated,
    };

    // Ajouter warning si email échoue
    if (emailError) {
      return NextResponse.json({
        ...response,
        warning: `Réservation confirmée mais email non envoyé: ${emailError}`,
      });
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Erreur POST /api/admin/reservations/[id]/confirm:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la confirmation' },
      { status: 500 }
    );
  }
}