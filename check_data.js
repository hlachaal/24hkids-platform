import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    const parents = await prisma.parent.count();
    const children = await prisma.child.count();
    const workshops = await prisma.workshop.count();
    const bookings = await prisma.booking.count();

    console.log(`Parents: ${parents}`);
    console.log(`Children: ${children}`);
    console.log(`Workshops: ${workshops}`);
    console.log(`Bookings: ${bookings}`);
  } catch (err) {
    console.log('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();