import { prisma } from "../../config/database";

import { tenantLocationService } from './tenant-location.service';

export class LocationService {
  async getTenantCities(tenantId: string) {
    const access = await tenantLocationService.getTenantEffectiveLocationAccess(tenantId);
    
    // Find all active branch coverages to know which cities actually have delivery
    const activeCoverages = await prisma.branchCoverage.findMany({
      where: {
        isActive: true,
        branch: {
          tenantId,
          isActive: true,
        }
      },
      select: {
        areaId: true,
        area: {
          select: {
            zone: {
              select: {
                cityId: true
              }
            }
          }
        }
      }
    });

    // Extract a flat set of all area IDs the tenant currently has access to
    const allowedAreaIds = new Set<string>();
    access.cities.forEach((city: any) => {
      city.zones?.forEach((zone: any) => {
        zone.areas?.forEach((area: any) => allowedAreaIds.add(area.id));
      });
    });

    const activeCityIds = new Set(
      activeCoverages
        .filter((c: any) => allowedAreaIds.has(c.areaId))
        .map((c: any) => c.area?.zone?.cityId)
        .filter(Boolean)
    );

    // Filter effective cities to only those that have at least one active branch coverage
    const filteredCities = access.cities.filter((c: any) => activeCityIds.has(c.id));

    return filteredCities.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug
    })).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }

  async getTenantCityAreas(tenantId: string, cityId: string) {
    const access = await tenantLocationService.getTenantEffectiveLocationAccess(tenantId);
    const city = access.cities.find((c: any) => c.id === cityId);
    
    if (!city) return [];

    // Pre-fetch all branch coverages for this tenant in this city to avoid N+1 queries
    const activeCoverages = await prisma.branchCoverage.findMany({
      where: {
        isActive: true,
        branch: {
          tenantId,
          isActive: true,
        },
        area: {
          zone: {
            cityId
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const coverageMap = new Map();
    for (const cov of activeCoverages) {
      if (!coverageMap.has(cov.areaId)) {
        coverageMap.set(cov.areaId, cov);
      }
    }

    const resultZones = [];

    for (const zone of city.zones || []) {
      const resultAreas = [];

      for (const area of zone.areas || []) {
        const coverage = coverageMap.get(area.id);
        
        // Only return the area if there is an active branch coverage for it!
        if (!coverage) continue;

        resultAreas.push({
          id: area.id,
          name: area.name,
          slug: area.slug,
          branchId: coverage.branchId,
          deliveryFee: coverage.deliveryFee || 0,
          minimumOrder: coverage.minimumOrder || 0,
          estimatedMinutes: coverage.estimatedMinutes || 45
        });
      }

      if (resultAreas.length > 0) {
        resultZones.push({
          zoneId: zone.id,
          zone: zone.name,
          areas: resultAreas
        });
      }
    }

    return resultZones.sort((a, b) => a.zone.localeCompare(b.zone));
  }

  // --- Super Admin Methods ---

  async getAllCities() {
    return prisma.city.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async createCity(data: { name: string; slug: string; isActive?: boolean }) {
    return prisma.city.create({ data });
  }

  async updateCity(id: string, data: { name?: string; slug?: string; isActive?: boolean }) {
    return prisma.city.update({ where: { id }, data });
  }

  async deleteCity(id: string) {
    return prisma.city.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async restoreCity(id: string) {
    return prisma.city.update({ where: { id }, data: { deletedAt: null } });
  }

  async getCityZones(cityId: string) {
    return prisma.zone.findMany({
      where: { cityId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async createZone(data: { name: string; slug: string; cityId: string; isActive?: boolean }) {
    return prisma.zone.create({ data });
  }

  async updateZone(id: string, data: { name?: string; slug?: string; isActive?: boolean }) {
    return prisma.zone.update({ where: { id }, data });
  }

  async deleteZone(id: string) {
    return prisma.zone.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async restoreZone(id: string) {
    return prisma.zone.update({ where: { id }, data: { deletedAt: null } });
  }

  async getZoneAreas(zoneId: string) {
    return prisma.area.findMany({
      where: { zoneId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async createArea(data: { name: string; slug: string; zoneId: string; polygon?: any; isActive?: boolean }) {
    const area = await prisma.area.create({ data });
    // Run in background to avoid blocking the API response
    tenantLocationService.syncBranchCoveragesForAllTenants().catch(err => 
      console.error('Failed to sync branch coverages after area creation:', err)
    );
    return area;
  }

  async updateArea(id: string, data: { name?: string; slug?: string; polygon?: any; isActive?: boolean }) {
    return prisma.area.update({ where: { id }, data });
  }

  async deleteArea(id: string) {
    return prisma.area.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async restoreArea(id: string) {
    const area = await prisma.area.update({ where: { id }, data: { deletedAt: null } });
    tenantLocationService.syncBranchCoveragesForAllTenants().catch(err => 
      console.error('Failed to sync branch coverages after area restore:', err)
    );
    return area;
  }
}
