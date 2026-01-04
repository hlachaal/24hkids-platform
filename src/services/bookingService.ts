// src/services/bookingService.ts
import { PrismaClient } from "@prisma/client";
import { differenceInYears } from "date-fns";

const prisma = new PrismaClient();

export class BookingService {
  /**
   * Création d'une réservation avec validation des règles métier.
   */
  static async createBooking(childId: number, workshopId: number) {
    // Récupérer l'enfant et l'atelier
    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) throw new Error("Child not found");

    const workshop = await prisma.workshop.findUnique({ 
      where: { id: workshopId },
      include: { bookings: { where: { status: "CONFIRMED" } } }
    });
    if (!workshop) throw new Error("Workshop not found");

    // Vérification tranche d'âge
    const age = differenceInYears(workshop.startTime, child.birthDate);
    if (age < workshop.minAge || age > workshop.maxAge) {
      throw new Error(`L'enfant n'est pas dans la tranche d'âge (${workshop.minAge}-${workshop.maxAge} ans)`);
    }

    // Vérification capacité
    if (workshop.bookings.length >= workshop.capacity) {
      throw new Error("Atelier complet");
    }

    // Vérification chevauchement horaire
    const childBookings = await prisma.booking.findMany({
      where: { 
        childId, 
        status: "CONFIRMED",
        workshop: {
          startTime: { lt: workshop.endTime },
          endTime: { gt: workshop.startTime }
        }
      },
      include: { workshop: true }
    });

    if (childBookings.length > 0) {
      throw new Error("Chevauchement horaire avec une autre réservation");
    }

    // Créer la réservation
    return await prisma.booking.create({
      data: { 
        childId, 
        workshopId, 
        status: "CONFIRMED"
      },
    });
  }

  static async cancelBooking(bookingId: number) {
    try {
      return await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      });
    } catch (err: any) {
      throw new Error(`Échec de l'annulation : ${err.message}`);
    }
  }

  static async listBookings(childId?: number) {
    const where = childId ? { childId } : {};
    return prisma.booking.findMany({
      where,
      include: { child: true, workshop: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async checkAvailability(workshopId: number) {
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: { 
        bookings: { 
          where: { status: "CONFIRMED" } 
        } 
      },
    });

    if (!workshop) throw new Error("Workshop not found");

    const remaining = workshop.capacity - workshop.bookings.length;
    return { 
      remaining, 
      status: remaining > 0 ? "ACTIVE" : "FULL" 
    };
  }
}