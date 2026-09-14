// ─── Menu Repository ────────────────────────────────────────────────

import { prisma } from '../../config/database';

const CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  imageUrl: true,
  cardStyle: true,
  sortOrder: true,
  posSortOrder: true,
  isActive: true,
  availableOnline: true,
  isAddonCategory: true,
};

const MENU_ITEM_SELECT = {
  id: true,
  categoryId: true,
  name: true,
  description: true,
  imageUrl: true,
  basePrice: true,
  discountedPrice: true,
  badgeText: true,
  badgeColor: true,
  metaNote: true,
  pricePrefix: true,
  dealLayout: true,
  calories: true,
  preparationTimeMins: true,
  isAvailable: true,
  availableOnline: true,
  isFeatured: true,
  recommendedItemIds: true,
  sortOrder: true,
  updatedAt: true,
  category: {
    select: { name: true }
  },
  // Include branch overrides so the consumer template can filter without extra API calls
  branchOverrides: {
    select: { branchId: true, isAvailable: true },
  },
};

const VARIANT_INCLUDE = {
  variantGroups: {
    select: {
      id: true,
      title: true,
      minSelect: true,
      maxSelect: true,
      sortOrder: true,
      options: {
        select: {
          id: true,
          name: true,
          priceModifier: true,
          isDefault: true,
          sortOrder: true,
        },
        orderBy: [
          { sortOrder: 'asc' as const },
          { createdAt: 'asc' as const },
        ],
      },
    },
    orderBy: [
      { sortOrder: 'asc' as const },
      { createdAt: 'asc' as const },
    ],
  },
};

export const menuRepository = {
  // ── Categories ──
  async listCategories(tenantId: string) {
    return prisma.category.findMany({
      where: { tenantId, isActive: true },
      select: CATEGORY_SELECT,
      orderBy: { sortOrder: 'asc' },
    });
  },

  async listAllCategories(tenantId: string) {
    return prisma.category.findMany({
      where: { tenantId },
      select: { ...CATEGORY_SELECT, _count: { select: { menuItems: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  },

  async createCategory(tenantId: string, data: any) {
    return prisma.category.create({
      data: { tenantId, ...data },
      select: CATEGORY_SELECT,
    });
  },

  async updateCategory(id: string, tenantId: string, data: any) {
    const existing = await prisma.category.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Category not found');
    return prisma.category.update({
      where: { id },
      data,
      select: CATEGORY_SELECT,
    });
  },

  async deleteCategory(id: string, tenantId: string) {
    const existing = await prisma.category.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Category not found');
    return prisma.category.delete({ where: { id } });
  },

  // ── Menu Items ──
  async getPublicCatalog(tenantId: string) {
    const categories = await prisma.category.findMany({
      where: { tenantId, isActive: true, availableOnline: true },
      select: {
        ...CATEGORY_SELECT,
        menuItems: {
          where: { isAvailable: true, availableOnline: true },
          select: { ...MENU_ITEM_SELECT, ...VARIANT_INCLUDE },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Transform: convert branchOverrides[] → disabledBranchIds[] for clean API response
    return categories.map((cat) => ({
      ...cat,
      menuItems: cat.menuItems.map((item: any) => {
        const disabledBranchIds = (item.branchOverrides || [])
          .filter((o: any) => !o.isAvailable)
          .map((o: any) => o.branchId);
        const { branchOverrides, ...rest } = item;
        return { ...rest, disabledBranchIds };
      }),
    }));
  },

  // ── Branch Availability (Admin) ──

  /**
   * Returns a map of { [branchId]: [disabledMenuItemId, ...] }
   * for display in the Branch Management > Product Availability tab.
   */
  async getBranchAvailabilityMap(tenantId: string): Promise<Record<string, string[]>> {
    const overrides = await prisma.branchMenuItem.findMany({
      where: { tenantId, isAvailable: false },
      select: { branchId: true, menuItemId: true },
    });

    const map: Record<string, string[]> = {};
    for (const row of overrides) {
      if (!map[row.branchId]) map[row.branchId] = [];
      map[row.branchId].push(row.menuItemId);
    }
    return map;
  },

  /**
   * Upserts a branch-item override. Pass isAvailable=false to disable,
   * isAvailable=true to re-enable (removes the override row for cleanliness).
   */
  async toggleBranchMenuItem(
    tenantId: string,
    branchId: string,
    menuItemId: string,
    isAvailable: boolean
  ) {
    if (isAvailable) {
      // Re-enabling: delete the override row so it inherits the global default
      await prisma.branchMenuItem.deleteMany({
        where: { tenantId, branchId, menuItemId },
      });
      return { branchId, menuItemId, isAvailable: true };
    } else {
      // Disabling: upsert the override row
      return prisma.branchMenuItem.upsert({
        where: { branchId_menuItemId: { branchId, menuItemId } },
        update: { isAvailable: false },
        create: { tenantId, branchId, menuItemId, isAvailable: false },
        select: { branchId: true, menuItemId: true, isAvailable: true },
      });
    }
  },

  async listMenuItems(tenantId: string, filters: {
    categoryId?: string;
    isAvailable?: boolean;
    isFeatured?: boolean;
    search?: string;
  }, skip: number, take: number) {
    const where: any = { tenantId };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.isAvailable !== undefined) where.isAvailable = filters.isAvailable;
    if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.menuItem.findMany({
        where,
        select: { ...MENU_ITEM_SELECT, ...VARIANT_INCLUDE, category: { select: { name: true } } },
        orderBy: { sortOrder: 'asc' },
        skip,
        take,
      }),
      prisma.menuItem.count({ where }),
    ]);

    return { items, total };
  },

  async getMenuItemById(id: string, tenantId: string) {
    return prisma.menuItem.findFirst({
      where: { id, tenantId },
      select: { ...MENU_ITEM_SELECT, ...VARIANT_INCLUDE, category: { select: { name: true } } },
    });
  },

  async createMenuItem(tenantId: string, data: any) {
    const { variantGroups, ...itemData } = data;

    return prisma.menuItem.create({
      data: {
        tenantId,
        ...itemData,
        variantGroups: variantGroups ? {
          create: variantGroups.map((vg: any, vgIdx: number) => ({
            title: vg.title,
            minSelect: vg.minSelect || 0,
            maxSelect: vg.maxSelect || 1,
            sortOrder: vg.sortOrder ?? (vgIdx + 1),
            options: {
              create: vg.options.map((opt: any, optIdx: number) => ({
                name: opt.name,
                priceModifier: opt.priceModifier || 0,
                isDefault: opt.isDefault || false,
                sortOrder: opt.sortOrder ?? (optIdx + 1),
              })),
            },
          })),
        } : undefined,
      },
      select: { ...MENU_ITEM_SELECT, ...VARIANT_INCLUDE },
    });
  },

  async updateMenuItem(id: string, tenantId: string, data: any) {
    const existing = await prisma.menuItem.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Menu item not found');

    const { variantGroups, ...itemData } = data;

    // If variant groups are provided, delete old ones and recreate
    if (variantGroups) {
      await prisma.variantGroup.deleteMany({ where: { menuItemId: id } });

      for (const [vgIdx, vg] of variantGroups.entries()) {
        await prisma.variantGroup.create({
          data: {
            menuItemId: id,
            title: vg.title,
            minSelect: vg.minSelect || 0,
            maxSelect: vg.maxSelect || 1,
            sortOrder: vg.sortOrder ?? (vgIdx + 1),
            options: {
              create: vg.options.map((opt: any, optIdx: number) => ({
                name: opt.name,
                priceModifier: opt.priceModifier || 0,
                isDefault: opt.isDefault || false,
                sortOrder: opt.sortOrder ?? (optIdx + 1),
              })),
            },
          },
        });
      }
    }

    return prisma.menuItem.update({
      where: { id },
      data: itemData,
      select: { ...MENU_ITEM_SELECT, ...VARIANT_INCLUDE },
    });
  },

  async deleteMenuItem(id: string, tenantId: string) {
    const existing = await prisma.menuItem.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Menu item not found');
    return prisma.menuItem.delete({ where: { id } });
  },

  async toggleAvailability(id: string, tenantId: string, isAvailable: boolean) {
    const existing = await prisma.menuItem.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Menu item not found');
    return prisma.menuItem.update({
      where: { id },
      data: { isAvailable },
      select: { id: true, isAvailable: true },
    });
  },

  async toggleOnlineAvailability(id: string, tenantId: string, availableOnline: boolean) {
    const existing = await prisma.menuItem.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Menu item not found');
    return prisma.menuItem.update({
      where: { id },
      data: { availableOnline },
      select: { id: true, availableOnline: true },
    });
  },
};
