// Script temporaire pour vérifier les données
import prisma from './src/lib/prisma.ts';

async function checkData() {
  console.log('🔍 Vérification des données dans la base...');

  try {
    const parents = await prisma.parent.findMany();
    console.log('👥 Parents dans la base:', parents.length);

    parents.forEach(parent => {
      console.log(`👤 ${parent.id}: ${parent.firstName} ${parent.lastName} - ${parent.email}`);
      console.log(`🔐 Hash: ${parent.password}`);
    });

    const alice = await prisma.parent.findUnique({
      where: { email: 'alice.martin@example.com' }
    });

    if (alice) {
      console.log('✅ Alice trouvée:', alice);
    } else {
      console.log('❌ Alice non trouvée');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();