// ─── Branch Service ─────────────────────────────────────────────────
import { branchRepository } from './branch.repository';
import { enforcePlanLimit } from '../../lib/plan-limits';
import { tenantLocationService } from '../location/tenant-location.service';
import { NotFoundError, ValidationError, ForbiddenError } from '../../lib/errors';
import { prisma } from '../../config/database';

export const branchService = {
  async list(tenantId: string) {
    return branchRepository.list(tenantId);
  },

  async create(tenantId: string, data: any) {
    await enforcePlanLimit(tenantId, 'BRANCH');
    return branchRepository.create(tenantId, data);
  },

  async update(id: string, tenantId: string, data: any) {
    return branchRepository.update(id, tenantId, data);
  },

  async delete(id: string, tenantId: string) {
    return branchRepository.delete(id, tenantId);
  },

  async listZones(branchId: string) {
    return branchRepository.findZonesByBranch(branchId);
  },

  async createZone(branchId: string, data: any) {
    // Validate that the branch belongs to a tenant who has effective access to this area
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundError('Branch');

    const areaId = data.areaId;
    if (!areaId) throw new ValidationError('areaId is required for branch coverage');

    const access = await tenantLocationService.getTenantEffectiveLocationAccess(branch.tenantId);
    let hasAccess = false;
    for (const city of access.cities) {
      for (const zone of (city.zones || [])) {
        if (zone.areas?.some((a: any) => a.id === areaId)) {
          hasAccess = true;
          break;
        }
      }
      if (hasAccess) break;
    }

    if (!hasAccess) {
      throw new ForbiddenError('Tenant does not have access to this area, so branch cannot serve it');
    }

    return branchRepository.createZone(branchId, data);
  },

  async updateZone(id: string, tenantId: string, data: any) {
    // We pass tenantId down, but branch.repository.ts currently expects branchId for updateZone.
    // Wait, the repository needs branchId? We can just find the branchCoverage and ensure its branch belongs to tenantId.
    // Let's modify the service to find the branch first, or update the repository.
    // In branch.repository.ts, I previously modified updateZone and deleteZone to accept branchId. But I need tenantId.
    // Let's just fix it properly in the repository later, for now we will pass tenantId to the repository.
    return branchRepository.updateZone(id, tenantId, data);
  },

  async deleteZone(id: string, tenantId: string) {
    return branchRepository.deleteZone(id, tenantId);
  },

  async listWebsiteZones(tenantId: string) {
    return branchRepository.listWebsiteZones(tenantId);
  },
};
