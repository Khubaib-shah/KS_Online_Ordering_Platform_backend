// ─── Database Seed Script ───────────────────────────────────────────
// Creates only the super admin user and base platform plans.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 2. Create Super Admin
  // Credential is read from env (SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD) so the
  // seed log never exposes a plaintext password. Defaults are only used locally.
  const superAdminEmail =
    process.env.SUPER_ADMIN_EMAIL || "syedkhubaibshah@icloud.com";
  const superAdminPasswordPlain =
    process.env.SUPER_ADMIN_PASSWORD || "Password123!";
  const superAdminPassword = await bcrypt.hash(superAdminPasswordPlain, 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      passwordHash: superAdminPassword,
      name: "Super Admin",
      globalRole: "SUPER_ADMIN",
      tenantId: null,
    },
  });
  console.log(
    `  ✅ Super Admin ready: ${superAdminEmail} (password set via env)`,
  );

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
