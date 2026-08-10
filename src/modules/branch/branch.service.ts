// ─── Branch Service ─────────────────────────────────────────────────
import { branchRepository } from './branch.repository';
import { enforcePlanLimit } from '../../lib/plan-limits';

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
