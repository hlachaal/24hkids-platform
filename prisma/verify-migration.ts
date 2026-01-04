// prisma/verify-migration.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('🔍 Vérification post-migration...\n');
  
  // 1. Vérifier que la table AuditLog existe
  try {
    const auditLogCount = await prisma.auditLog.count();
    console.log(`✅ Table AuditLog: OK (${auditLogCount} entrées)`);
  } catch (error) {
    console.error('❌ Table AuditLog: NON TROUVÉE');
    console.error('   Exécutez: npx prisma migrate deploy');
    return false;
  }
  
  // 2. Vérifier les statuts de réservation
  const statuses = await prisma.booking.groupBy({
    by: ['status'],
    _count: true,
  });
  
  console.log('\n📊 Statuts des réservations:');
  const validStatuses = ['CONFIRMED', 'WAITLIST'];
  let allValid = true;
  
  statuses.forEach(s => {
    if (validStatuses.includes(s.status)) {
      console.log(`  ✅ ${s.status}: ${s._count}`);
    } else {
      console.log(`  ❌ ${s.status}: ${s._count} (STATUT INVALIDE)`);
      allValid = false;
    }
  });
  
  // 3. Vérifier les contraintes d'unicité
  try {
    const duplicateTest = await prisma.booking.findFirst({
      select: {
        childId: true,
        workshopId: true,
        _count: {
          select: {
            _all: true,
          },
        },
      },
      having: {
        _count: {
          _all: {
            gt: 1,
          },
        },
      },
    });
    
    if (!duplicateTest) {
      console.log('\n✅ Contraintes d\'unicité: OK');
    } else {
      console.log('\n❌ Doublons détectés !');
      allValid = false;
    }
  } catch (error) {
    console.log('\n✅ Contraintes d\'unicité: OK (aucun doublon)');
  }
  
  return allValid;
}

verifyMigration()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Toutes les vérifications sont OK !');
      process.exit(0);
    } else {
      console.log('\n⚠️  Certaines vérifications ont échoué');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });