// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Déclare une variable globale pour stocker le client Prisma.
// Ceci est nécessaire pour éviter de créer de nouvelles connexions à la base de données
// à chaque rechargement à chaud (hot-reloading) en environnement de développement.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Initialise le client Prisma.
// Si `global.prisma` existe déjà, on le réutilise.
// Sinon, on crée une nouvelle instance.
const prisma =
  global.prisma ||
  new PrismaClient({
    // Optionnel : active le logging pour le développement.
    // Vous pouvez commenter les lignes que vous ne souhaitez pas voir.
    log: ['query', 'info', 'warn', 'error'],
  });

// En environnement de non-production, on assigne l'instance à la variable globale.
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
