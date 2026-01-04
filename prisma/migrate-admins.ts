// prisma/migrate-admins.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateAdmins() {
  console.log('🔄 Migration des administrateurs vers la table Admin séparée...');

  // La migration a déjà été faite manuellement
  console.log('ℹ️ Migration déjà effectuée lors de la séparation des tables');
  console.log('📊 Aucun administrateur à migrer (migration manuelle terminée)');

  console.log('🎉 Migration terminée avec succès !');
}

migrateAdmins();