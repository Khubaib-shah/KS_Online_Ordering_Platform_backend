import { prisma } from "../../config/database";

import { tenantLocationService } from './tenant-location.service';

export class LocationService {
  async getTenantCities(tenantId: string) {
    const access = await tenantLocationService.getTenantEffectiveLocationAccess(tenantId);
    
    // We also need to ensure at least one area in the city has branch coverage.
    // However, for simplicity of the city dropdown, we can just return the effective cities.
    // The storefront will handle empty zones/areas.
    return access.cities.map((c: any) => ({
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
        branch: {
          tenantId,
          cityId, // Optional filter if branches have cityId set
          isActive: true,
          deliveryEnabled: true,
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
        
        // Return the area if the tenant has access to it. If there is specific branch coverage,
        // use those delivery settings. Otherwise, provide default values.
        resultAreas.push({
          id: area.id,
          name: area.name,
          slug: area.slug,
          deliveryFee: coverage?.deliveryFee || 0,
          minimumOrder: coverage?.minimumOrder || 0,
          estimatedMinutes: coverage?.estimatedMinutes || 45
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
    return prisma.area.create({ data });
  }

  async updateArea(id: string, data: { name?: string; slug?: string; polygon?: any; isActive?: boolean }) {
    return prisma.area.update({ where: { id }, data });
  }

  async deleteArea(id: string) {
    return prisma.area.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async restoreArea(id: string) {
    return prisma.area.update({ where: { id }, data: { deletedAt: null } });
  }
}
