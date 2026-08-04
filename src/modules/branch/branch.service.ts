// ─── Branch Service ─────────────────────────────────────────────────
import { branchRepository } from './branch.repository';

export const branchService = {
  async list(tenantId: string) {
    return branchRepository.list(tenantId);
  },

  async create(tenantId: string, data: any) {
    return branchRepository.create(tenantId, data);
  },

  async update(id: string, data: any) {
    return branchRepository.update(id, data);
  },

  async delete(id: string) {
    return branchRepository.delete(id);
  },

  async listZones(branchId: string) {
    return branchRepository.findZonesByBranch(branchId);
  },

  async createZone(branchId: string, data: any) {
    return branchRepository.createZone(branchId, data);
  },

  async updateZone(id: string, data: any) {
    return branchRepository.updateZone(id, data);
  },

  async deleteZone(id: string) {
    return branchRepository.deleteZone(id);
  },

  async listWebsiteZones(tenantId: string) {
    return branchRepository.listWebsiteZones(tenantId);
  },
};
