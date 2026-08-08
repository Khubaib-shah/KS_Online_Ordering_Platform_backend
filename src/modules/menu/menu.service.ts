// ─── Menu Service ───────────────────────────────────────────────────

import { menuRepository } from './menu.repository';
import { cacheGetOrSet, cacheInvalidateByTag } from '../../lib/cache';
import { NotFoundError } from '../../lib/errors';

export const menuService = {
  // ── Public Catalog (cached) ──
  async getPublicCatalog(tenantId: string) {
    return cacheGetOrSet(
      `catalog:${tenantId}`,
      () => menuRepository.getPublicCatalog(tenantId),
      300 // 5 minutes
    );
  },

  // ── Categories ──
  async listCategories(tenantId: string) {
    return menuRepository.listCategories(tenantId);
  },

  async listAllCategories(tenantId: string) {
    return menuRepository.listAllCategories(tenantId);
  },

  async createCategory(tenantId: string, data: any) {
    const result = await menuRepository.createCategory(tenantId, data);
    await cacheInvalidateByTag(`catalog:${tenantId}`);
    return result;
  },

  async updateCategory(id: string, tenantId: string, data: any) {
    const result = await menuRepository.updateCategory(id, tenantId, data);
    await cacheInvalidateByTag(`catalog:${tenantId}`);
    return result;
  },

  async deleteCategory(id: string, tenantId: string) {
    await menuRepository.deleteCategory(id, tenantId);
    await cacheInvalidateByTag(`catalog:${tenantId}`);
  },

  // ── Menu Items ──
  async listMenuItems(tenantId: string, filters: any, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return menuRepository.listMenuItems(tenantId, filters, skip, limit);
  },

  async getMenuItemById(id: string, tenantId: string) {
    const item = await menuRepository.getMenuItemById(id, tenantId);
    if (!item) throw new NotFoundError('Menu item', id);
    return item;
  },

  async createMenuItem(tenantId: string, data: any) {
    const result = await menuRepository.createMenuItem(tenantId, data);
    await cacheInvalidateByTag(`catalog:${tenantId}`);
    return result;
  },

  async updateMenuItem(id: string, tenantId: string, data: any) {
    const result = await menuRepository.updateMenuItem(id, tenantId, data);
    await cacheInvalidateByTag(`catalog:${tenantId}`);
    return result;
  },

  async deleteMenuItem(id: string, tenantId: string) {
    await menuRepository.deleteMenuItem(id, tenantId);
    await cacheInvalidateByTag(`catalog:${tenantId}`);
  },

  async toggleAvailability(id: string, tenantId: string, isAvailable: boolean) {
    const result = await menuRepository.toggleAvailability(id, tenantId, isAvailable);
    await cacheInvalidateByTag(`catalog:${tenantId}`);
    return result;
  },

  async toggleOnlineAvailability(id: string, tenantId: string, availableOnline: boolean) {
    const result = await menuRepository.toggleOnlineAvailability(id, tenantId, availableOnline);
    await cacheInvalidateByTag(`catalog:${tenantId}`);
    return result;
  },
};
