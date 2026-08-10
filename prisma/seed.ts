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
  // Credential is read from env (SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD) so the
  // seed log never exposes a plaintext password. Defaults are only used locally.
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'syedkhubaibshah@icloud.com';
  const superAdminPasswordPlain = process.env.SUPER_ADMIN_PASSWORD || 'Password123!';
  const superAdminPassword = await bcrypt.hash(superAdminPasswordPlain, 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      passwordHash: superAdminPassword,
      name: 'Super Admin',
      globalRole: 'SUPER_ADMIN',
      tenantId: null,
    },
  });
  console.log(`  ✅ Super Admin ready: ${superAdminEmail} (password set via env)`);

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
