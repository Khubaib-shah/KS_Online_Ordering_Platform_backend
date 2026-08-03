// ─── Database Seed Script ───────────────────────────────────────────
// Creates only the super admin user and base platform plans.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create a platform plan
  const starterPlan = await prisma.platformPlan.upsert({
    where: { id: 'plan-starter' },
    update: {},
    create: {
      id: 'plan-starter',
      name: 'Starter',
      monthlyPrice: 0,
      maxBranches: 1,
      maxMenuItems: 50,
      transactionFeePct: 2.5,
      featuresJson: {
        features: ['1 Branch', '50 Menu Items', 'POS Terminal', 'Online Ordering', 'Basic Reports'],
      },
    },
  });

  const proPlan = await prisma.platformPlan.upsert({
    where: { id: 'plan-pro' },
    update: {},
    create: {
      id: 'plan-pro',
      name: 'Pro',
      monthlyPrice: 4999,
      maxBranches: 5,
      maxMenuItems: 500,
      transactionFeePct: 1.5,
      featuresJson: {
        features: ['5 Branches', '500 Menu Items', 'POS Terminal', 'Online Ordering', 'Advanced Reports', 'Staff Management', 'Delivery Zones'],
      },
    },
  });

  // 2. Create Super Admin
  const superAdminPassword = await bcrypt.hash('Password123!', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'syedkhubaibshah@icloud.com' },
    update: {},
    create: {
      email: 'syedkhubaibshah@icloud.com',
      passwordHash: superAdminPassword,
      name: 'Super Admin',
      globalRole: 'SUPER_ADMIN',
      tenantId: null,
    },
  });
  console.log(`  ✅ Super Admin: syedkhubaibshah@icloud.com / Password123!`);

  console.log('\n🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
