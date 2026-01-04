# 🎒 2+4H Kids & Co — Plateforme de gestion des ateliers

## 🧭 Vision du projet

**2+4H Kids & Co** est une application web destinée à gérer une journée d’ateliers numériques
pour enfants, familles et adultes, dans le cadre de l’événement **24hKids**.

L’objectif est de proposer :

* une **expérience fluide pour les parents** (réservation enfant par enfant),
* une **gestion simple pour les administrateurs**,
* un système **fiable, robuste et orienté règles métier**.

Le projet privilégie la **simplicité**, la **lisibilité** et la **pérennité technique**.

---

## 🗓️ Contexte événementiel

* Événement sur **une journée unique**
* Horaires généraux :

  * **Matin** : 10h00 – 12h00
  * **Après-midi** : 13h30 – 17h30
* Ateliers répartis sur des **créneaux fixes**
* Ateliers **gratuits**, sans prérequis

---

## 👥 Publics concernés

### Enfants (5–13 ans)

* Programmation (Scratch, Ozobot, Lego WeDo)
* Robotique pédagogique
* Activités débranchées
* Sensibilisation au numérique (info/intox, cyberharcèlement, réseaux sociaux)

### Familles (à partir de 7 ans)

* Parentalité numérique
* Usages des écrans
* Impact environnemental du numérique
* Quiz et ateliers intergénérationnels

### Ados & adultes

* Programmation avancée (IA, Machine Learning, Arduino, drones)
* Conférences et ateliers de sensibilisation
* Découverte des métiers du numérique

---

## ⏱️ Durée des ateliers

* **Ateliers courts** : ~30 minutes
* **Ateliers moyens** : 35–40 minutes
* **Ateliers longs** : 45–50 minutes

Chaque atelier correspond à **une session unique**, réservable indépendamment.

---

## 🧩 Fonctionnalités principales

### Interface publique

* Présentation du concept
* Informations sur l’édition en cours
* Catalogue et calendrier des ateliers
* Filtres :

  * par date
  * par tranche d’âge
  * par thème
  * par enfant (si parent connecté)

---

### Comptes & rôles

#### Parent

* Création de compte
* Gestion des enfants (ajout / modification / suppression)
* Réservation des ateliers
* Consultation des réservations
* Annulation (option configurable)

#### Administrateur

* Gestion des ateliers (CRUD)
* Gestion des familles et enfants
* Modification des informations de l’événement
* Export des participants par atelier (CSV / Excel)

---

## 🧠 Règles métier (non négociables)

### Ateliers

* Un atelier possède :

  * un thème
  * une tranche d’âge
  * une capacité
  * un créneau horaire précis
* Les ateliers sont automatiquement visibles dans le calendrier public

### Réservations

* Un parent doit être connecté
* Une réservation est faite **pour un enfant précis**
* Contraintes :

  * tranche d’âge respectée
  * capacité disponible
  * **aucun chevauchement horaire pour un même enfant**
* Un parent peut réserver pour plusieurs enfants

👉 Toutes les règles sont **validées côté serveur**, jamais uniquement côté front.

---

## 🗄️ Modèle de données (conceptuel)

* **User** (Parent / Admin)
* **Child** (lié à un parent)
* **Workshop** (session d’atelier)
* **Reservation** (enfant ↔ atelier)
* **EventInfo** (date, lieu, horaires globaux)

---

## 🛠️ Stack technique (prévue)

* **Next.js** (App Router)
* **TypeScript**
* **Prisma**
* **PostgreSQL**
* **Auth.js** (email / mot de passe)
* **Tailwind CSS**

---

## 🚀 Philosophie de développement

* Métier d’abord, UI ensuite
* Backend robuste avant le front
* Règles métier centralisées
* Pas de sur-ingénierie
* Chaque étape validée avant la suivante

---

## 📍 Périmètre V1

✔️ Interface publique
✔️ Comptes parents
✔️ Réservation d’ateliers
✔️ Administration basique

❌ Pas de paiement
❌ Pas de multi-événements

---

## 📌 État du projet

> 📘 **Phase actuelle** : cadrage & fondations
> 🧱 Prochaine étape : définition du schéma Prisma
plan clair des entités et relations pour ton projet 24hkids-platform. On va intégrer :

1️⃣ Cartographie des entités principales

### Enfants (Child)
Nom, prénom, date de naissance, etc.
Relation avec les parents (Parent).
Parents (Parent)
Contact, email, téléphone.
Relation avec les enfants (un parent peut avoir plusieurs enfants).

### Ateliers (Workshop)
Nom, description, tranche d’âge, capacité max, horaire.
Relation avec les réservations.

### Réservations (Booking)
Quel enfant est inscrit à quel atelier.
Validation des règles métier :
Chevauchement horaire interdit.
Capacité max respectée.
Tranche d’âge.

### Règles métier
On ne mettra pas directement les règles dans Prisma, mais les contraintes de capacité et d’âge peuvent être exprimées via des champs (par exemple minAge, maxAge).
Chevauchement → validation côté backend au moment de créer la réservation.

2️⃣ Relations clés
--- Parent 1:N Child → un parent peut avoir plusieurs enfants.
--- Child N:M Workshop via Booking → un enfant peut s’inscrire à plusieurs ateliers, un atelier peut avoir plusieurs enfants.
On ajoutera des timestamps pour le suivi (createdAt, updatedAt).

3️⃣ Ébauche du schema.prisma
On commence ligne par ligne, en partant des parents :
```
model Parent {
  id        Int      @id @default(autoincrement())
  firstName String
  lastName  String
  email     String   @unique
  phone     String?
  children  Child[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Child {
  id        Int       @id @default(autoincrement())
  firstName String
  lastName  String
  birthDate DateTime
  parent    Parent    @relation(fields: [parentId], references: [id])
  parentId  Int
  bookings  Booking[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Workshop {
  id          Int       @id @default(autoincrement())
  name        String
  description String?
  startTime   DateTime
  endTime     DateTime
  minAge      Int
  maxAge      Int
  capacity    Int
  bookings    Booking[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Booking {
  id         Int       @id @default(autoincrement())
  child      Child     @relation(fields: [childId], references: [id])
  childId    Int
  workshop   Workshop  @relation(fields: [workshopId], references: [id])
  workshopId Int
  createdAt  DateTime  @default(now())
}
```
✅ Avec ça, on a déjà :
--- Les parents et enfants liés.
--- Les ateliers et réservations.
--- Les champs pour règles métier (âge, capacité).
--- Les timestamps pour le suivi.

💡 Etapes logiques :
On va ajouter contraintes supplémentaires côté Prisma et préparer les triggers ou validations côté backend pour :
--- Interdire le chevauchement.
--- Respecter la capacité max.
--- Respecter la tranche d’âge.

On va maintenant ajouter des contraintes avancées dans Prisma pour renforcer la logique métier dès la base, sans tout coder côté backend.

L’objectif ici :
--- Éviter qu’un enfant réserve 2 fois le même atelier.
--- Poser les bases pour chevauchement futur (on pourra le gérer côté backend).
--- Unique par combinaison là où c’est logique.

Le chevauchement horaire est compliqué à gérer dans Prisma seul. ✅ On fera côté backend, mais les champs startTime et endTime dans Workshop suffisent pour calculer si une nouvelle réservation est compatible ou non.

De même, pour respecter l’âge :

const childAge = differenceInYears(workshop.startTime, child.birthDate)
if (childAge < workshop.minAge || childAge > workshop.maxAge) {
  throw new Error("L'enfant n'est pas dans la tranche d'âge de l'atelier")
}

C’est une logique backend simple qui utilise le minAge et maxAge déjà stockés dans le modèle Workshop.

✅ Avec ces contraintes :
--- La base bloque les doublons.
--- Les recherches sont plus rapides.
--- Les règles métier principales sont couvertes côté backend.
```
// =======================================
// 24hKids Platform - schema.prisma FINAL
// =======================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // ou "mysql" selon ton choix
  url      = env("DATABASE_URL")
}

// =====================
// Modèle Parent
// =====================
model Parent {
  id          Int      @id @default(autoincrement())
  firstName   String
  lastName    String
  email       String   @unique
  phone       String?
  children    Child[]
  notifyEmail Boolean  @default(true)
  notifySMS   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// =====================
// Modèle Child (Enfant)
// =====================
model Child {
  id          Int       @id @default(autoincrement())
  firstName   String
  lastName    String
  birthDate   DateTime
  parent      Parent    @relation(fields: [parentId], references: [id])
  parentId    Int
  bookings    Booking[]
  allergies   String?
  medicalNote String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([parentId])
}

// =====================
// Modèle Workshop (Atelier)
// =====================
model Workshop {
  id          Int       @id @default(autoincrement())
  name        String
  description String?
  startTime   DateTime
  endTime     DateTime
  minAge      Int
  maxAge      Int
  capacity    Int
  location    String?
  status      WorkshopStatus @default(ACTIVE)
  bookings    Booking[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([startTime, endTime])
}

// Statuts des ateliers
enum WorkshopStatus {
  ACTIVE
  CANCELLED
  FULL
}

// =====================
// Modèle Booking (Réservation)
// =====================
model Booking {
  id          Int       @id @default(autoincrement())
  child       Child     @relation(fields: [childId], references: [id])
  childId     Int
  workshop    Workshop  @relation(fields: [workshopId], references: [id])
  workshopId  Int
  status      BookingStatus @default(CONFIRMED)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Un enfant ne peut pas réserver deux fois le même atelier
  @@unique([childId, workshopId])

  // Index utiles pour les recherches
  @@index([childId])
  @@index([workshopId])
}

// Statuts des réservations
enum BookingStatus {
  CONFIRMED
  CANCELLED
  WAITLIST
}
```

✅ Points forts de ce schema

Relations claires :
--- Parent 1:N Child
--- Child N:M Workshop via Booking

Contraintes et intégrité :
--- @@unique([childId, workshopId]) → pas de doublons.
--- Index pour optimiser les recherches.

Règles métier intégrées côté backend :
--- Chevauchement → validation à la réservation.
--- Tranche d’âge → validation à la réservation.
--- Capacité → backend peut vérifier le nombre de bookings.

Statuts et notifications :
--- WorkshopStatus et BookingStatus.
--- Notifications parent (notifyEmail, notifySMS).
--- Timestamps partout pour suivi et stats.

💡 Prochaine étape : on peut maintenant créer un seed initial pour :
--- 2-3 parents
--- 3-5 enfants
--- 5 ateliers réels
--- Quelques réservations test

Ça nous permettra de tester tout le moteur de réservation et règles métier directement.

Voici un seed complet prisma/seed.ts ou prisma/seed.js selon le setup TypeScript/JavaScript :
```
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seed...");

  // =====================
  // Création des Parents
  // =====================
  const parent1 = await prisma.parent.create({
    data: {
      firstName: "Alice",
      lastName: "Martin",
      email: "alice.martin@example.com",
      phone: "0600000001",
      notifyEmail: true,
      notifySMS: false,
    },
  });

  const parent2 = await prisma.parent.create({
    data: {
      firstName: "Bruno",
      lastName: "Dupont",
      email: "bruno.dupont@example.com",
      phone: "0600000002",
      notifyEmail: true,
      notifySMS: true,
    },
  });

  const parent3 = await prisma.parent.create({
    data: {
      firstName: "Caroline",
      lastName: "Lemoine",
      email: "caroline.lemoine@example.com",
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
      parentId: parent3.id,
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
```

💡 Points clés
--- createMany pour les bookings rapides.
--- Tranches d’âge et capacités sont déjà dans Workshop → backend vérifiera les règles.
--- On a des exemples de parents avec plusieurs enfants, et des enfants dans plusieurs ateliers.
--- Allergies et notes médicales inclus pour tests.

On va créer un script de test automatique pour valider tes règles métier de réservation.
Ce script va vérifier pour chaque réservation :
--- Pas de doublon (un enfant ne peut pas réserver deux fois le même atelier).
--- Pas de chevauchement (un enfant ne peut pas être sur deux ateliers en même temps).
--- Tranche d’âge respectée (l’enfant doit correspondre à minAge / maxAge de l’atelier).

Voici un exemple en TypeScript pour prisma/testBooking.ts :
```
import { PrismaClient } from "@prisma/client";
import { differenceInYears } from "date-fns";

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
```

💡 Comment ça marche
On récupère toutes les réservations avec child et workshop.
On calcule l’âge de l’enfant au moment de l’atelier (differenceInYears).
On vérifie que chaque réservation n’a aucun chevauchement avec les autres de l’enfant.
Les doublons sont déjà bloqués par Prisma (@@unique([childId, workshopId])).

🧭 Checkpoint validé

Repo clean ✅
Prisma version 6 OK ✅
Seed OK ✅
Push Github OK ✅

👉 Triggers PostgreSQL = choix backend mûr

C’est un choix avancé, et cohérent pour 24hKids.
Pourquoi c’est pertinent ici :
--- Règle	Trigger DB
--- Chevauchement ateliers	✅
--- Capacité max atelier	✅
--- Âge min / max	✅
--- Cohérence temporelle	✅
--- Sécurité multi-process	✅

👉 La DB devient la source de vérité, pas l’API.

C’est exactement ce qu’on veut pour :
--- réservations concurrentes
--- imports
--- batchs
--- futures apps mobiles

👉 Répartition des responsabilités (propre)

Très important :
--- Couche	: Rôle
--- Prisma	: Modélisation + relations
--- PostgreSQL	: Contraintes métier dures
--- Backend TS	: Orchestration / UX / messages
--- Front	: Affichage

👉 On passe en mode DB-first avancé.

### Étape A — Triggers PostgreSQL (concrets)
On écrit :
🔒 Trigger anti-chevauchement enfant
🔢 Trigger capacité atelier
🎂 Trigger contrôle âge
⏱️ Trigger cohérence dates

### Étape B — Prisma
--- Prisma consomme
--- Les erreurs DB remontent proprement
--- Aucun contournement possible

### backend
Vu notre schéma et triggers PostgreSQL, je propose de commencer par le service de réservation (Booking Service), car c’est le cœur du projet et là où toutes les règles critiques se rencontrent.

🔹 Booking Service – Fonctions clés :

👉 createBooking(childId, workshopId) : 
--- Vérifie l’existence child + workshop
--- Tente l’insertion (trigger vérifie chevauchement, âge, capacité)
--- Retourne succès / erreur claire

👉 cancelBooking(bookingId)
--- Annule réservation, ajuste statut atelier si FULL → ACTIVE

👉 listBookings(childId?)
--- Récupère bookings filtrées par enfant ou atelier

👉 checkAvailability(workshopId)
--- Retourne capacité restante et statut FULL / WAITLIST

💡 Avantage : avec triggers en place, le service est très simple, il n’a besoin que de gestion d’erreur et orchestration.


## Installation

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

---
© 24hKids — Projet éducatif autour du numérique
