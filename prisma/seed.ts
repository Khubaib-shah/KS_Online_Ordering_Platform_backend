import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  karachiZones,
  normalizeLocationName,
  slugifyLocation,
} from "./karachi-locations";

const prisma = new PrismaClient();
const nodeProcess = (
  globalThis as unknown as {
    process: {
      argv: string[];
      env: Record<string, string | undefined>;
      exit: (code: number) => never;
    };
  }
).process;

async function main() {
  console.log("Seeding database...");

  const resetLocations = nodeProcess.argv.includes("--reset-locations");
  const report = {
    cityCreated: 0,
    cityExisting: 0,
    zonesCreated: 0,
    zonesExisting: 0,
    areasCreated: 0,
    areasExisting: 0,
    duplicatesSkipped: 0,
    potentialConflicts: 0,
  };

  const uniqueZones = new Map<string, { name: string; areas: string[] }>();
  for (const rawZone of karachiZones) {
    const name = normalizeLocationName(rawZone.name);
    const key = slugifyLocation(name);
    const existing = uniqueZones.get(key);
    if (existing) {
      report.duplicatesSkipped++;
      existing.areas.push(...(rawZone.areas || []).map(normalizeLocationName));
    } else {
      uniqueZones.set(key, {
        name,
        areas: (rawZone.areas || []).map(normalizeLocationName),
      });
    }
  }

  for (const zone of uniqueZones.values()) {
    const seenAreas = new Set<string>();
    zone.areas = zone.areas.filter((area) => {
      const key = slugifyLocation(area);
      if (!area || seenAreas.has(key)) {
        report.duplicatesSkipped++;
        return false;
      }
      seenAreas.add(key);
      return true;
    });
  }

  const tx = prisma;
  {
    if (resetLocations) {
      const existingCity = await tx.city.findUnique({
        where: { slug: "karachi" },
      });
      if (existingCity) {
        await tx.order.updateMany({
          where: { cityId: existingCity.id },
          data: { cityId: null, zoneId: null, areaId: null },
        });
        await tx.branch.updateMany({
          where: { cityId: existingCity.id },
          data: { cityId: null },
        });
        await tx.tenant.updateMany({
          where: { cityId: existingCity.id },
          data: { cityId: null },
        });
        await tx.tenantLocation.deleteMany({
          where: { cityId: existingCity.id },
        });
        await tx.city.delete({ where: { id: existingCity.id } });
      }
    }

    const existingCity = await tx.city.findUnique({
      where: { slug: "karachi" },
    });
    const city = await tx.city.upsert({
      where: { slug: "karachi" },
      update: { name: "Karachi", isActive: true, deletedAt: null },
      create: { name: "Karachi", slug: "karachi", isActive: true },
    });
    if (existingCity) report.cityExisting++;
    else report.cityCreated++;

    for (const zoneSeed of uniqueZones.values()) {
      const zoneSlug = slugifyLocation(zoneSeed.name);
      const existingZone = await tx.zone.findUnique({
        where: { cityId_slug: { cityId: city.id, slug: zoneSlug } },
      });
      const zone = await tx.zone.upsert({
        where: { cityId_slug: { cityId: city.id, slug: zoneSlug } },
        update: { name: zoneSeed.name, isActive: true, deletedAt: null },
        create: {
          cityId: city.id,
          name: zoneSeed.name,
          slug: zoneSlug,
          isActive: true,
        },
      });
      if (existingZone) report.zonesExisting++;
      else report.zonesCreated++;

      for (const areaName of zoneSeed.areas) {
        const areaSlug = slugifyLocation(areaName);
        const existingArea = await tx.area.findUnique({
          where: { zoneId_slug: { zoneId: zone.id, slug: areaSlug } },
        });
        const area = await tx.area.upsert({
          where: { zoneId_slug: { zoneId: zone.id, slug: areaSlug } },
          update: { name: areaName, isActive: true, deletedAt: null },
          create: {
            zoneId: zone.id,
            name: areaName,
            slug: areaSlug,
            isActive: true,
          },
        });
        if (existingArea) report.areasExisting++;
        else report.areasCreated++;
      }
    }
  }

  // 2. Create Super Admin
  // Credential is read from env (SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD) so the
  // seed log never exposes a plaintext password. Defaults are only used locally.
  const superAdminEmail =
    nodeProcess.env.SUPER_ADMIN_EMAIL || "syedkhubaibshah@icloud.com";
  const superAdminPasswordPlain =
    nodeProcess.env.SUPER_ADMIN_PASSWORD || "Password123!";
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
  console.log(`  Super Admin ready: ${superAdminEmail} (password set via env)`);
  const counts = await prisma.city.findUnique({
    where: { slug: "karachi" },
    select: { zones: { select: { _count: { select: { areas: true } } } } },
  });
  const areaCount =
    counts?.zones.reduce((total, zone) => total + zone._count.areas, 0) || 0;
  console.log("\nKarachi Seed Completed");
  console.log("\nCity:\nKarachi");
  console.log(
    `\nZones:\n${report.zonesCreated} created\n${report.zonesExisting} already existed`,
  );
  console.log(
    `\nAreas:\n${report.areasCreated} created\n${report.areasExisting} already existed`,
  );
  console.log(`\nDuplicates skipped: ${report.duplicatesSkipped}`);
  console.log(`Potential conflicts: ${report.potentialConflicts}`);
  console.log(
    `Verified hierarchy: ${counts?.zones.length || 0} zones, ${areaCount} areas`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    nodeProcess.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
