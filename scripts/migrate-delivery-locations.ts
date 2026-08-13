import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log(`Starting delivery location migration...${isDryRun ? ' [DRY RUN]' : ''}`);

  const tenants = await prisma.tenant.findMany({
    include: {
      settings: true,
      branches: true,
    }
  });

  let totalProcessed = 0;
  let totalMigrated = 0;
  let locationsMatched = 0;
  let locationsNotMatched = 0;
  let errors = 0;

  for (const tenant of tenants) {
    if (!tenant.settings?.deliveryAreas) continue;
    
    totalProcessed++;
    let deliveryAreasRaw = tenant.settings.deliveryAreas;
    let areasToProcess: string[] = [];
    
    if (typeof deliveryAreasRaw === 'string') {
      areasToProcess = deliveryAreasRaw.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(deliveryAreasRaw)) {
      areasToProcess = deliveryAreasRaw.map(s => String(s).trim()).filter(Boolean);
    } else {
       console.warn(`[!] Skipping tenant ${tenant.slug}: deliveryAreas is not a string or array`);
       continue;
    }

    if (areasToProcess.length === 0) continue;

    console.log(`\nProcessing tenant: ${tenant.slug} (${areasToProcess.length} areas to process)`);

    // Get canonical cities/zones/areas to match against
    const allCities = await prisma.city.findMany({ include: { zones: { include: { areas: true } } } });

    let migratedSomething = false;
    const branch = tenant.branches.length > 0 ? tenant.branches.find(b => b.isDefault) || tenant.branches[0] : null;

    for (const areaStr of areasToProcess) {
      const parts = areaStr.split(' - ').map(p => p.trim());
      
      let cityName, zoneName, areaName;
      if (parts.length >= 3) {
        cityName = parts[0];
        zoneName = parts[1];
        areaName = parts.slice(2).join(' - ');
      } else if (parts.length === 2) {
        cityName = 'Karachi'; // Fallback per old behavior
        zoneName = parts[0];
        areaName = parts[1];
      } else {
        cityName = 'Karachi';
        zoneName = 'Unknown';
        areaName = parts[0];
      }

      // Find canonical models
      const city = allCities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
      if (!city) {
        console.log(`  [NOT MATCHED] City not found: ${cityName}`);
        locationsNotMatched++;
        continue;
      }

      const zone = city.zones.find(z => z.name.toLowerCase() === zoneName?.toLowerCase());
      const area = zone?.areas.find(a => a.name.toLowerCase() === areaName?.toLowerCase());

      try {
        if (!isDryRun) {
          // Assign City
          await prisma.tenantLocation.upsert({
            where: {
              tenantId_locationType_cityId_zoneId_areaId: {
                tenantId: tenant.id,
                locationType: 'CITY',
                cityId: city.id,
                zoneId: null,
                areaId: null
              }
            },
            create: { tenantId: tenant.id, locationType: 'CITY', cityId: city.id, isAssigned: true, isEnabled: true },
            update: {}
          });

          // Assign Zone if found
          if (zone) {
            await prisma.tenantLocation.upsert({
              where: {
                tenantId_locationType_cityId_zoneId_areaId: {
                  tenantId: tenant.id,
                  locationType: 'ZONE',
                  cityId: city.id,
                  zoneId: zone.id,
                  areaId: null
                }
              },
              create: { tenantId: tenant.id, locationType: 'ZONE', cityId: city.id, zoneId: zone.id, isAssigned: true, isEnabled: true },
              update: {}
            });
          }

          // Assign Area if found
          if (area) {
             await prisma.tenantLocation.upsert({
              where: {
                tenantId_locationType_cityId_zoneId_areaId: {
                  tenantId: tenant.id,
                  locationType: 'AREA',
                  cityId: city.id,
                  zoneId: zone?.id || null,
                  areaId: area.id
                }
              },
              create: { tenantId: tenant.id, locationType: 'AREA', cityId: city.id, zoneId: zone?.id, areaId: area.id, isAssigned: true, isEnabled: true },
              update: {}
            });
            
            // Add BranchCoverage
            if (branch) {
              await prisma.branchCoverage.upsert({
                where: { branchId_areaId: { branchId: branch.id, areaId: area.id } },
                create: {
                  branchId: branch.id,
                  areaId: area.id,
                  deliveryFee: tenant.settings?.deliveryFee || 0,
                  estimatedMinutes: 45
                },
                update: {}
              });
            }
          }
        }

        console.log(`  [MATCHED] ${cityName} -> ${zone?.name || zoneName} -> ${area?.name || areaName}`);
        locationsMatched++;
        migratedSomething = true;
      } catch (e: any) {
         console.error(`  [ERROR] Failed to process ${areaStr}: ${e.message}`);
         errors++;
      }
    }

    if (migratedSomething) totalMigrated++;
  }

  console.log('\n--- Migration Report ---');
  console.log(`Tenants processed:     ${totalProcessed}`);
  console.log(`Successfully migrated: ${totalMigrated}`);
  console.log(`Locations matched:     ${locationsMatched}`);
  console.log(`Locations not matched: ${locationsNotMatched}`);
  console.log(`Errors:                ${errors}`);

  if (isDryRun) {
    console.log('\n[DRY RUN] No changes were saved to the database.');
  } else {
    console.log('\nMigration complete.');
  }
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
