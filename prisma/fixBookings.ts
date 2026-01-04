// prisma/fixBookings.ts
import { differenceInYears } from "date-fns";
import fs from "fs";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const reportPath = "prisma/booking-report.txt";

async function main() {
  const report: string[] = [];
  report.push("📅 Rapport complet des réservations\n");

  const workshops = await prisma.workshop.findMany({
    include: { bookings: { include: { child: true } } },
    orderBy: { startTime: 'asc' }
  });

  for (const workshop of workshops) {
    report.push(`\n🏫 Atelier: ${workshop.name} [${workshop.startTime.toLocaleString()} - ${workshop.endTime.toLocaleString()}]`);
    const sortedBookings = workshop.bookings.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Capacité max
    for (let i = 0; i < sortedBookings.length; i++) {
      const booking = sortedBookings[i];
      if (i >= workshop.capacity) {
        await prisma.booking.update({ where: { id: booking.id }, data: { status: "WAITLIST" } });
        report.push(`⚠️ ${booking.child.firstName} ${booking.child.lastName} placé en WAITLIST (capacité dépassée)`);
      }
    }

    // Tranche d'âge
    for (const booking of sortedBookings) {
      const child = booking.child;
      const age = differenceInYears(workshop.startTime, child.birthDate);
      if (age < workshop.minAge || age > workshop.maxAge) {
        await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });
        report.push(`❌ ${child.firstName} ${child.lastName} CANCELLED (âge ${age} hors [${workshop.minAge}-${workshop.maxAge}])`);
      }
    }

    // Chevauchements
    const reservationsByChild: Record<number, { start: Date; end: Date; bookingId: number }[]> = {};
    for (const booking of sortedBookings) {
      const child = booking.child;
      if (!reservationsByChild[child.id]) reservationsByChild[child.id] = [];
      const overlapping = reservationsByChild[child.id].some(r =>
        booking.status === "CONFIRMED" &&
        (workshop.startTime < r.end && workshop.endTime > r.start)
      );
      if (overlapping && booking.status === "CONFIRMED") {
        await prisma.booking.update({ where: { id: booking.id }, data: { status: "WAITLIST" } });
        report.push(`⚠️ ${child.firstName} ${child.lastName} placé en WAITLIST (chevauchement)`);
      }
      reservationsByChild[child.id].push({ start: workshop.startTime, end: workshop.endTime, bookingId: booking.id });
    }
  }

  fs.writeFileSync(reportPath, report.join("\n"));
  console.log(`✅ Rapport généré : ${reportPath}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
