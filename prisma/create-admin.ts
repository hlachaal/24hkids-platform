import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createInitialAdmin() {
  console.log('👑 Création de l\'administrateur initial...');

  try {
    // Vérifier si un admin existe déjà
    const existingAdmin = await prisma.admin.findFirst();
    if (existingAdmin) {
      console.log('ℹ️ Un administrateur existe déjà:', existingAdmin.email);
      return;
    }

    // Créer l'admin initial
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const admin = await prisma.admin.create({
      data: {
        firstName: 'Admin',
        lastName: 'Principal',
        email: 'admin@24hkids.com',
        password: hashedPassword,
        phone: '+33123456789',
      },
    });

    console.log('✅ Administrateur initial créé avec succès:');
    console.log('   Email: admin@24hkids.com');
    console.log('   Mot de passe: admin123');
    console.log('   ID:', admin.id);

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
    throw error;
  }
}

async function main() {
  try {
    await createInitialAdmin();
    console.log('🎉 Script terminé avec succès !');
  } catch (error) {
    console.error('💥 Erreur dans le script:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();