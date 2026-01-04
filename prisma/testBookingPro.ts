// prisma/testBookingPro.ts
import { differenceInYears } from "date-fns";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Test complet des réservations...");

  const workshops = await prisma.workshop.findMany({
    include: { bookings: { include: { child: true } } },
  });

  let hasError = false;
  const report: string[] = [];

  for (const workshop of workshops) {
    // --- 1️⃣ Vérification capacité max ---
    if (workshop.bookings.length > workshop.capacity) {
      report.push(`❌ ${workshop.name} dépasse la capacité max (${workshop.bookings.length}/${workshop.capacity})`);
      hasError = true;
    }

    // --- 2️⃣ Vérification pour chaque enfant ---
    const reservationsByChild: Record<number, { start: Date; end: Date; workshopId: number }[]> = {};

    for (const booking of workshop.bookings) {
      const child = booking.child;
      const age = differenceInYears(workshop.startTime, child.birthDate);

      // 🔹 Vérification tranche d'âge
      if (age < workshop.minAge || age > workshop.maxAge) {
        report.push(`❌ ${child.firstName} ${child.lastName} (${age} ans) n'est pas dans la tranche d'âge de ${workshop.name} [${workshop.minAge}-${workshop.maxAge}]`);
        hasError = true;
      }

      // 🔹 Vérification chevauchement
      if (!reservationsByChild[child.id]) reservationsByChild[child.id] = [];
      const overlapping = reservationsByChild[child.id].some(r =>
        (workshop.startTime < r.end && workshop.endTime > r.start)
      );

      if (overlapping) {
        report.push(`❌ Chevauchement détecté : ${child.firstName} ${child.lastName} a déjà une réservation qui chevauche ${workshop.name}`);
        hasError = true;
      }

      reservationsByChild[child.id].push({ start: workshop.startTime, end: workshop.endTime, workshopId: workshop.id });
    }
  }

  // --- 3️⃣ Vérification doublons via Prisma (juste pour info) ---
  const allBookings = await prisma.booking.findMany({
    select: { childId: true, workshopId: true },
  });

  const bookingSet = new Set<string>();
  for (const b of allBookings) {
    const key = `${b.childId}-${b.workshopId}`;
    if (bookingSet.has(key)) {
      report.push(`❌ Doublon détecté : Child ${b.childId} dans Workshop ${b.workshopId}`);
      hasError = true;
    } else {
      bookingSet.add(key);
    }
  }

  // --- 4️⃣ Résultat final ---
  if (hasError) {
    console.log("⚠️ Problèmes détectés dans les réservations :");
    report.forEach(line => console.log(line));
  } else {
    console.log("✅ Toutes les réservations sont valides !");
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
