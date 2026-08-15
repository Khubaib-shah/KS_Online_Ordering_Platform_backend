import { prisma } from '../../config/database';
import { ValidationError, ForbiddenError } from '../../lib/errors';

export class TenantLocationService {
  /**
   * SUPER ADMIN ONLY: Assigns a location (usually City) to a tenant.
   * By default, assigning a City implies access to all its Zones and Areas.
   */
  async assignLocationToTenant(tenantId: string, locationType: 'CITY' | 'ZONE' | 'AREA', cityId?: string, zoneId?: string, areaId?: string) {
    if (locationType === 'CITY' && !cityId) throw new ValidationError('cityId is required for CITY assignment');
    if (locationType === 'ZONE' && !zoneId) throw new ValidationError('zoneId is required for ZONE assignment');
    if (locationType === 'AREA' && !areaId) throw new ValidationError('areaId is required for AREA assignment');

    const result = await prisma.tenantLocation.upsert({
      where: {
        tenantId_locationType_cityId_zoneId_areaId: {
          tenantId,
          locationType,
          cityId: cityId || null,
          zoneId: zoneId || null,
          areaId: areaId || null,
        }
      } as any, // Type bypass due to prisma optional unique constraint behavior
      update: {
        isAssigned: true,
        isEnabled: true,
      },
      create: {
        tenantId,
        locationType,
        cityId: cityId || null,
        zoneId: zoneId || null,
        areaId: areaId || null,
        isAssigned: true,
        isEnabled: true,
      }
    });

    // Auto-create branch coverages for this tenant based on their new access
    await this.syncBranchCoveragesForTenant(tenantId);

    return result;
  }

  /**
   * SUPER ADMIN ONLY: Unassign a location from a tenant.
   */
  async unassignLocationFromTenant(tenantId: string, locationType: 'CITY' | 'ZONE' | 'AREA', locationId: string) {
    const cityId = locationType === 'CITY' ? locationId : null;
    const zoneId = locationType === 'ZONE' ? locationId : null;
    const areaId = locationType === 'AREA' ? locationId : null;

    return prisma.tenantLocation.deleteMany({
      where: {
        tenantId,
        locationType,
        cityId,
        zoneId,
        areaId,
      }
    });
  }

  /**
   * SUPER ADMIN ONLY: List all location assignments for a tenant.
   */
  async listTenantLocations(tenantId: string) {
    return prisma.tenantLocation.findMany({
      where: { tenantId },
      include: {
        city: { select: { id: true, name: true, slug: true } },
        zone: { select: { id: true, name: true, slug: true } },
        area: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * TENANT ADMIN: Enable or disable a location.
   * Can only disable/enable if it belongs to an assigned scope.
   */
  async updateTenantLocationStatus(tenantId: string, locationType: 'CITY' | 'ZONE' | 'AREA', locationId: string, isEnabled: boolean) {
    const cityId = locationType === 'CITY' ? locationId : null;
    const zoneId = locationType === 'ZONE' ? locationId : null;
    const areaId = locationType === 'AREA' ? locationId : null;

    // Check if there is an existing override/assignment record
    const existing = await prisma.tenantLocation.findFirst({
      where: {
        tenantId,
        locationType,
        cityId,
        zoneId,
        areaId
      }
    });

    if (existing) {
      return prisma.tenantLocation.update({
        where: { id: existing.id },
        data: { isEnabled }
      });
    }

    // If it doesn't exist, it means we are creating a specific override for a child location
    // (e.g. disabling a Zone within an assigned City). We must first verify they have access to the parent.
    const access = await this.getTenantEffectiveLocationAccess(tenantId);
    
    let hasAccess = false;
    if (locationType === 'CITY') hasAccess = access.cities.some((c: any) => c.id === locationId);
    if (locationType === 'ZONE') {
      for (const city of access.cities) {
        if (city.zones?.some((z: any) => z.id === locationId)) {
          hasAccess = true;
          break;
        }
      }
    }
    if (locationType === 'AREA') {
      for (const city of access.cities) {
        for (const zone of (city.zones || [])) {
          if (zone.areas?.some((a: any) => a.id === locationId)) {
            hasAccess = true;
            break;
          }
        }
      }
    }

    if (!hasAccess) {
      throw new ForbiddenError(`Tenant does not have access to this ${locationType}`);
    }

    // Create the override
    return prisma.tenantLocation.create({
      data: {
        tenantId,
        locationType,
        cityId,
        zoneId,
        areaId,
        isAssigned: false, // It's not explicitly assigned by superadmin, just an override
        isEnabled
      }
    });
  }

  /**
   * Calculates the full effective location tree for a tenant.
   * Hierarchy: Global Active -> Tenant Assigned -> Tenant Enabled
   */
  async getTenantEffectiveLocationAccess(tenantId: string) {
    // 1. Fetch all Global Active Locations
    const globalCities = await prisma.city.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        zones: {
          where: { isActive: true, deletedAt: null },
          include: {
            areas: {
              where: { isActive: true, deletedAt: null }
            }
          }
        }
      }
    });

    // 2. Fetch all Tenant Location Configurations (Assignments & Overrides)
    const tenantConfigs = await prisma.tenantLocation.findMany({
      where: { tenantId }
    });

    const assignedCityIds = tenantConfigs.filter((c: any) => c.locationType === 'CITY' && c.isAssigned).map((c: any) => c.cityId);
    const assignedZoneIds = tenantConfigs.filter((c: any) => c.locationType === 'ZONE' && c.isAssigned).map((c: any) => c.zoneId);
    const assignedAreaIds = tenantConfigs.filter((c: any) => c.locationType === 'AREA' && c.isAssigned).map((c: any) => c.areaId);

    const disabledCityIds = tenantConfigs.filter((c: any) => c.locationType === 'CITY' && !c.isEnabled).map((c: any) => c.cityId);
    const disabledZoneIds = tenantConfigs.filter((c: any) => c.locationType === 'ZONE' && !c.isEnabled).map((c: any) => c.zoneId);
    const disabledAreaIds = tenantConfigs.filter((c: any) => c.locationType === 'AREA' && !c.isEnabled).map((c: any) => c.areaId);

    // 3. Build the effective tree
    const resultCities = [];

    for (const city of globalCities) {
      // Is City inherently accessible? (Assigned directly)
      const hasCityAccess = assignedCityIds.includes(city.id);
      if (!hasCityAccess && !city.zones.some(z => assignedZoneIds.includes(z.id) || z.areas.some(a => assignedAreaIds.includes(a.id)))) {
        continue; // No access to this city or any of its children
      }

      if (disabledCityIds.includes(city.id)) {
        continue; // City explicitly disabled by tenant
      }

      const resultZones = [];
      for (const zone of city.zones) {
        const hasZoneAccess = hasCityAccess || assignedZoneIds.includes(zone.id);
        if (!hasZoneAccess && !zone.areas.some(a => assignedAreaIds.includes(a.id))) {
          continue; // No access to this zone
        }

        if (disabledZoneIds.includes(zone.id)) {
          continue; // Zone explicitly disabled by tenant
        }

        const resultAreas = [];
        for (const area of zone.areas) {
          const hasAreaAccess = hasZoneAccess || assignedAreaIds.includes(area.id);
          if (!hasAreaAccess) continue; // No access to this area

          if (disabledAreaIds.includes(area.id)) {
            continue; // Area explicitly disabled
          }

          resultAreas.push({
            id: area.id,
            name: area.name,
            slug: area.slug,
            postalCode: area.postalCode
          });
        }

        if (resultAreas.length > 0 || assignedZoneIds.includes(zone.id) || hasCityAccess) {
            resultZones.push({
                id: zone.id,
                name: zone.name,
                slug: zone.slug,
                areas: resultAreas
            });
        }
      }

      if (resultZones.length > 0 || hasCityAccess) {
          resultCities.push({
            id: city.id,
            name: city.name,
            slug: city.slug,
            zones: resultZones
          });
      }
    }

    return { cities: resultCities };
  }

  /**
   * Auto-creates BranchCoverage records for all branches of a tenant for all areas they have access to.
   * Skips areas that already have a coverage record.
   */
  async syncBranchCoveragesForTenant(tenantId: string) {
    const access = await this.getTenantEffectiveLocationAccess(tenantId);
    const allowedAreaIds: string[] = [];
    for (const city of access.cities) {
      for (const zone of (city.zones || [])) {
        for (const area of (zone.areas || [])) {
          allowedAreaIds.push(area.id);
        }
      }
    }

    if (allowedAreaIds.length === 0) return;

    const branches = await prisma.branch.findMany({ where: { tenantId } });
    if (branches.length === 0) return;

    const tenantSettings = await prisma.tenantSettings.findUnique({ where: { tenantId } });
    const defaultFee = tenantSettings?.deliveryFee || 0;

    const data = [];
    for (const branch of branches) {
      for (const areaId of allowedAreaIds) {
        data.push({
          branchId: branch.id,
          areaId,
          deliveryFee: defaultFee,
          isActive: true
        });
      }
    }

    if (data.length > 0) {
      await prisma.branchCoverage.createMany({
        data,
        skipDuplicates: true
      });
    }
  }

  async syncBranchCoveragesForAllTenants() {
    const tenants = await prisma.tenant.findMany({ select: { id: true } });
    await Promise.all(tenants.map(t => this.syncBranchCoveragesForTenant(t.id)));
  }
}

export const tenantLocationService = new TenantLocationService();
