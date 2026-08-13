import { prisma } from '../../config/database';
import { tenantLocationService } from './tenant-location.service';
import { ValidationError } from '../../lib/errors';

export class DeliveryResolutionService {
  /**
   * Validates if the selected location is actually deliverable for the given tenant.
   * Checks:
   * 1. Hierarchy matches and is globally active
   * 2. Tenant has effective access (assigned and not disabled)
   * 3. At least one active branch covers this area
   */
  async validateDeliveryLocation(tenantId: string, cityId: string, zoneId: string, areaId: string) {
    // 1. Check Tenant Effective Access
    const access = await tenantLocationService.getTenantEffectiveLocationAccess(tenantId);
    
    const city = access.cities.find((c: any) => c.id === cityId);
    if (!city) throw new ValidationError('City is not available for delivery');
    
    const zone = city.zones.find((z: any) => z.id === zoneId);
    if (!zone) throw new ValidationError('Zone is not available for delivery');
    
    const area = zone.areas.find((a: any) => a.id === areaId);
    if (!area) throw new ValidationError('Area is not available for delivery');

    // 2. Resolve eligible branches
    const eligibleBranches = await this.getEligibleBranchesForArea(tenantId, areaId);
    if (eligibleBranches.length === 0) {
      throw new ValidationError('Currently no active branch delivers to this area');
    }

    return true;
  }

  /**
   * Finds all eligible, active branches for a tenant that cover a specific area.
   */
  async getEligibleBranchesForArea(tenantId: string, areaId: string) {
    return prisma.branchCoverage.findMany({
      where: {
        areaId,
        branch: {
          tenantId,
          isActive: true,
          deliveryEnabled: true,
        }
      },
      include: {
        branch: true
      },
      // In future: order by branch.priority or distance
      orderBy: {
        createdAt: 'asc' // Deterministic simple priority
      }
    });
  }

  /**
   * Resolves the single best branch to fulfill an order for a given area.
   */
  async resolveDeliveryBranch(tenantId: string, areaId: string) {
    const branches = await this.getEligibleBranchesForArea(tenantId, areaId);
    if (branches.length === 0) {
      throw new ValidationError('No active branch delivers to this area');
    }
    
    // Simple deterministic strategy: first active branch
    return branches[0];
  }
}

export const deliveryResolutionService = new DeliveryResolutionService();
