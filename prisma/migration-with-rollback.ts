// prisma/migration-with-rollback.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface MigrationStep {
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

class MigrationManager {
  private steps: MigrationStep[] = [];
  private executedSteps: string[] = [];
  private logFile: string;

  constructor(logFile = 'migration-log.json') {
    this.logFile = path.join(process.cwd(), 'prisma', logFile);
    this.loadLog();
  }

  private loadLog() {
    if (fs.existsSync(this.logFile)) {
      const data = fs.readFileSync(this.logFile, 'utf-8');
      this.executedSteps = JSON.parse(data);
    }
  }

  private saveLog() {
    fs.writeFileSync(this.logFile, JSON.stringify(this.executedSteps, null, 2));
  }

  addStep(step: MigrationStep) {
    this.steps.push(step);
  }

  async migrate() {
    console.log('🚀 Début de la migration...');
    
    for (const step of this.steps) {
      if (this.executedSteps.includes(step.name)) {
        console.log(`⏭️  Étape "${step.name}" déjà exécutée, skipping...`);
        continue;
      }

      try {
        console.log(`🔄 Exécution: ${step.name}...`);
        await step.up();
        this.executedSteps.push(step.name);
        this.saveLog();
        console.log(`✅ ${step.name} terminé avec succès`);
      } catch (error) {
        console.error(`❌ Erreur lors de "${step.name}":`, error);
        console.log('⚠️  Rollback des étapes précédentes...');
        await this.rollback();
        throw error;
      }
    }
    
    console.log('🎉 Migration complète !');
  }

  async rollback() {
    console.log('↩️  Début du rollback...');
    
    for (let i = this.executedSteps.length - 1; i >= 0; i--) {
      const stepName = this.executedSteps[i];
      const step = this.steps.find(s => s.name === stepName);
      
      if (step) {
        try {
          console.log(`↩️  Rollback: ${step.name}...`);
          await step.down();
          this.executedSteps.splice(i, 1);
          this.saveLog();
          console.log(`✅ Rollback de ${step.name} terminé`);
        } catch (error) {
          console.error(`❌ Erreur lors du rollback de "${step.name}":`, error);
        }
      }
    }
    
    console.log('🔄 Rollback terminé');
  }
}

async function main() {
  const migration = new MigrationManager();

  // Étape 1: Vérifier et préparer
  migration.addStep({
    name: 'check_current_state',
    up: async () => {
      // Compter les réservations
      const bookingCount = await prisma.booking.count();
      console.log(`📊 Réservations totales: ${bookingCount}`);
      
      // Sauvegarder l'état actuel des statuts
      const statusCount = await prisma.booking.groupBy({
        by: ['status'],
        _count: true,
      });
      
      console.log('📈 Répartition des statuts:');
      statusCount.forEach(s => {
        console.log(`  ${s.status}: ${s._count}`);
      });
    },
    down: async () => {
      console.log('↩️  Rollback: Aucune action nécessaire pour check_current_state');
    }
  });

  // Étape 2: Mettre à jour les statuts CANCELLED (si existants)
  migration.addStep({
    name: 'handle_cancelled_bookings',
    up: async () => {
      // Vérifier s'il y a des CANCELLED
      const cancelledBookings = await prisma.booking.findMany({
        where: {
          // Note: Cette requête dépend de votre ancien schéma
          // Vous devrez peut-être l'adapter
          status: 'CANCELLED',
        },
        take: 1,
      });

      if (cancelledBookings.length > 0) {
        console.warn('⚠️  ATTENTION: Des réservations avec statut CANCELLED existent !');
        console.warn('   Vous devez décider quoi en faire avant de continuer.');
        console.warn('   Options:');
        console.warn('   1. Les supprimer définitivement');
        console.warn('   2. Les changer en WAITLIST');
        console.warn('   3. Garder les données mais sans statut CANCELLED');
        
        // Pour cet exemple, on les change en WAITLIST
        // Décommentez si vous voulez cette action
        /*
        console.log('   Conversion des CANCELLED en WAITLIST...');
        await prisma.booking.updateMany({
          where: { status: 'CANCELLED' },
          data: { status: 'WAITLIST' },
        });
        */
        
        throw new Error('Réservations CANCELLED détectées. Veuillez les gérer manuellement.');
      }
      
      console.log('✅ Aucune réservation CANCELLED trouvée');
    },
    down: async () => {
      // En cas de rollback, on ne peut pas restaurer les statuts
      console.log('↩️  Rollback: Impossible de restaurer les statuts CANCELLED');
    }
  });

  // Étape 3: Créer la table AuditLog (via Prisma migrate)
  migration.addStep({
    name: 'create_audit_log_table',
    up: async () => {
      console.log('📋 La table AuditLog sera créée par Prisma migrate');
      console.log('💡 Exécutez: npx prisma migrate dev --name add_audit_system');
    },
    down: async () => {
      console.log('↩️  Rollback: Suppression de la table AuditLog');
      // En production, vous ne devriez pas supprimer la table
      // Mais en développement:
      // await prisma.$executeRaw`DROP TABLE IF EXISTS "AuditLog" CASCADE`;
    }
  });

  try {
    await migration.migrate();
    console.log('\n🎉 Migration terminée avec succès !');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Exécutez: npx prisma migrate dev --name add_audit_system_and_remove_cancelled');
    console.log('2. Exécutez: npx prisma generate');
    console.log('3. Redémarrez votre application');
  } catch (error) {
    console.error('\n❌ Migration échouée:', error);
    process.exit(1);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });