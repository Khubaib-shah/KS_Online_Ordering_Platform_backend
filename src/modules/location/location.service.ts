import { prisma } from "../../config/database";

export class LocationService {
  async getTenantCities(tenantId: string) {
    // A tenant is associated with cities through the many-to-many relationship
    // Since we just added this, we'll query cities where the tenants array includes this tenantId
    const cities = await prisma.city.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        tenants: {
          some: {
            id: tenantId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return cities;
  }

  async getTenantCityAreas(tenantId: string, cityId: string) {
    // Return areas grouped by zone, ONLY if the area is covered by at least one
    // delivery-enabled branch belonging to this tenant.

    // First, find all branch coverages for this tenant in the specified city
    const activeCoverages = await prisma.branchCoverage.findMany({
      where: {
        branch: {
          tenantId: tenantId,
          cityId: cityId,
          deliveryEnabled: true,
          isActive: true,
        },
        area: {
          isActive: true,
          deletedAt: null,
        }
      },
      include: {
        area: {
          include: {
            zone: true,
          }
        }
      }
    });

    // Group the results by zone
    const zonesMap = new Map();

    for (const coverage of activeCoverages) {
      const area = coverage.area;
      if (!area || !area.zone) continue;

      const zoneId = area.zoneId;
      if (!zonesMap.has(zoneId)) {
        zonesMap.set(zoneId, {
          zoneId: area.zone.id,
          zone: area.zone.name,
          areas: [],
        });
      }

      // Check if area already added to this zone
      const zoneGroup = zonesMap.get(zoneId);
      const existingArea = zoneGroup.areas.find((a: any) => a.id === area.id);

      if (!existingArea) {
        zoneGroup.areas.push({
          id: area.id,
          name: area.name,
          slug: area.slug,
          // Expose minimum order and delivery fee for frontend if needed, 
          // or frontend can just fetch this during checkout. We'll provide it.
          deliveryFee: coverage.deliveryFee,
          minimumOrder: coverage.minimumOrder,
          estimatedMinutes: coverage.estimatedMinutes
        });
      }
    }

    return Array.from(zonesMap.values()).sort((a, b) => a.zone.localeCompare(b.zone));
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
