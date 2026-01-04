// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seed...");

  const hashedPassword = await bcrypt.hash("password123", 12);
  const adminHashedPassword = await bcrypt.hash("parent123", 12);

  // =====================
  // Création des Parents
  // =====================
  const parent1 = await prisma.parent.create({
    data: {
      firstName: "Alice",
      lastName: "Martin",
      email: "alice.martin@example.com",
      password: hashedPassword,
      phone: "0600000001",
      notifyEmail: true,
      notifySMS: false,
    },
  });

  const parent2 = await prisma.parent.create({
    data: {
      firstName: "Caroline",
      lastName: "Lemoine",
      email: "caroline.lemoine@example.com",
      password: hashedPassword,
      phone: "0600000003",
    },
  });

  // =====================
  // Création des Enfants
  // =====================
  const child1 = await prisma.child.create({
    data: {
      firstName: "Léo",
      lastName: "Martin",
      birthDate: new Date("2016-03-12"),
      parentId: parent1.id,
    },
  });

  const child2 = await prisma.child.create({
    data: {
      firstName: "Emma",
      lastName: "Martin",
      birthDate: new Date("2018-06-20"),
      parentId: parent1.id,
      allergies: "Arachides",
    },
  });

  const child3 = await prisma.child.create({
    data: {
      firstName: "Lucas",
      lastName: "Dupont",
      birthDate: new Date("2017-11-05"),
      parentId: parent2.id,
    },
  });

  const child4 = await prisma.child.create({
    data: {
      firstName: "Chloé",
      lastName: "Lemoine",
      birthDate: new Date("2015-09-18"),
      parentId: parent2.id,
      medicalNote: "Asthme léger",
    },
  });

  const child5 = await prisma.child.create({
    data: {
      firstName: "Noah",
      lastName: "Dupont",
      birthDate: new Date("2019-01-22"),
      parentId: parent2.id,
    },
  });

  // =====================
  // Création des Ateliers
  // =====================
  const workshop1 = await prisma.workshop.create({
    data: {
      name: "Atelier Peinture",
      description: "Peinture créative pour enfants",
      startTime: new Date("2026-01-05T10:00:00"),
      endTime: new Date("2026-01-05T12:00:00"),
      minAge: 4,
      maxAge: 8,
      capacity: 10,
      location: "Salle A",
      status: "ACTIVE",
    },
  });

  const workshop2 = await prisma.workshop.create({
    data: {
      name: "Mini Foot",
      description: "Football adapté aux 5-8 ans",
      startTime: new Date("2026-01-05T14:00:00"),
      endTime: new Date("2026-01-05T16:00:00"),
      minAge: 5,
      maxAge: 8,
      capacity: 12,
      location: "Terrain extérieur",
    },
  });

  const workshop3 = await prisma.workshop.create({
    data: {
      name: "Atelier Lego",
      description: "Construction et créativité",
      startTime: new Date("2026-01-06T10:00:00"),
      endTime: new Date("2026-01-06T12:00:00"),
      minAge: 4,
      maxAge: 10,
      capacity: 8,
      location: "Salle B",
    },
  });

  const workshop4 = await prisma.workshop.create({
    data: {
      name: "Yoga Enfants",
      description: "Découverte du yoga pour les petits",
      startTime: new Date("2026-01-06T14:00:00"),
      endTime: new Date("2026-01-06T15:30:00"),
      minAge: 4,
      maxAge: 10,
      capacity: 15,
      location: "Salle C",
    },
  });

  const workshop5 = await prisma.workshop.create({
    data: {
      name: "Atelier Musique",
      description: "Découverte des instruments",
      startTime: new Date("2026-01-07T10:00:00"),
      endTime: new Date("2026-01-07T12:00:00"),
      minAge: 5,
      maxAge: 10,
      capacity: 10,
      location: "Salle D",
    },
  });

  // =====================
  // Création des Réservations
  // =====================
  await prisma.booking.createMany({
    data: [
      { childId: child1.id, workshopId: workshop1.id },
      { childId: child2.id, workshopId: workshop1.id },
      { childId: child3.id, workshopId: workshop2.id },
      { childId: child5.id, workshopId: workshop2.id },
      { childId: child4.id, workshopId: workshop4.id },
      { childId: child1.id, workshopId: workshop3.id },
    ],
  });

  console.log("✅ Seed terminé !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
