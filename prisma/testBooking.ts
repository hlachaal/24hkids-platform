// prisma/testBooking.ts
import { differenceInYears } from "date-fns";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Test des réservations...");

  const bookings = await prisma.booking.findMany({
    include: {
      child: true,
      workshop: true,
    },
  });

  let hasError = false;

  // On stocke les réservations par enfant pour vérifier chevauchement
  const reservationsByChild: Record<number, { start: Date; end: Date; workshopId: number }[]> = {};

  for (const booking of bookings) {
    const { child, workshop } = booking;

    // --- 1️⃣ Vérification tranche d’âge ---
    const age = differenceInYears(workshop.startTime, child.birthDate);
    if (age < workshop.minAge || age > workshop.maxAge) {
      console.error(`❌ Erreur âge : ${child.firstName} ${child.lastName} (${age} ans) ne correspond pas à ${workshop.name} [${workshop.minAge}-${workshop.maxAge}]`);
      hasError = true;
    }

    // --- 2️⃣ Vérification chevauchement ---
    if (!reservationsByChild[child.id]) reservationsByChild[child.id] = [];

    const overlapping = reservationsByChild[child.id].some(r =>
      (workshop.startTime < r.end && workshop.endTime > r.start)
    );

    if (overlapping) {
      console.error(`❌ Erreur chevauchement : ${child.firstName} ${child.lastName} a déjà une réservation qui chevauche ${workshop.name}`);
      hasError = true;
    }

    reservationsByChild[child.id].push({ start: workshop.startTime, end: workshop.endTime, workshopId: workshop.id });
  }

  if (!hasError) {
    console.log("✅ Toutes les réservations sont valides !");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
