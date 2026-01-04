import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw) {
    console.error('No ADMIN_EMAILS provided. Set ADMIN_EMAILS=admin1@example.com,admin2@example.com');
    process.exit(1);
  }

  const emails = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  console.log(`Will migrate admins for emails: ${emails.join(', ')}`);

  for (const email of emails) {
    const parent = await prisma.parent.findUnique({ where: { email } });
    if (!parent) {
      console.log(`- Parent not found for ${email}, skipping.`);
      continue;
    }

    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
      console.log(`- Admin already exists for ${email}, deleting parent duplicate.`);
      await prisma.parent.delete({ where: { id: parent.id } });
      continue;
    }

    // Create admin record preserving password (if exists)
    await prisma.admin.create({
      data: {
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email,
        password: parent.password || '',
        phone: parent.phone,
      },
    });

    // Delete the parent record to avoid duplicates
    await prisma.parent.delete({ where: { id: parent.id } });
    console.log(`- Migrated ${email} to Admin and removed from Parent table.`);
  }

  console.log('Migration completed.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
