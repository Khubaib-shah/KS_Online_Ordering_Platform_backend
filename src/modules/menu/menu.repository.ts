// ─── Menu Repository ────────────────────────────────────────────────

import { prisma } from '../../config/database';

const CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  imageUrl: true,
  cardStyle: true,
  sortOrder: true,
  isActive: true,
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
  sortOrder: true,
  category: {
    select: { name: true }
  },
};

const VARIANT_INCLUDE = {
  variantGroups: {
    select: {
      id: true,
      title: true,
      minSelect: true,
      maxSelect: true,
      options: {
        select: {
          id: true,
          name: true,
          priceModifier: true,
          isDefault: true,
        },
        orderBy: { createdAt: 'asc' as const },
      },
    },
    orderBy: { createdAt: 'asc' as const },
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

  async updateCategory(id: string, data: any) {
    return prisma.category.update({
      where: { id },
      data,
      select: CATEGORY_SELECT,
    });
  },

  async deleteCategory(id: string) {
    return prisma.category.delete({ where: { id } });
  },

  // ── Menu Items ──
  async getPublicCatalog(tenantId: string) {
    const categories = await prisma.category.findMany({
      where: { tenantId, isActive: true },
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
    return categories;
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

  async getMenuItemById(id: string) {
    return prisma.menuItem.findUnique({
      where: { id },
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
          create: variantGroups.map((vg: any) => ({
            title: vg.title,
            minSelect: vg.minSelect || 0,
            maxSelect: vg.maxSelect || 1,
            options: {
              create: vg.options.map((opt: any) => ({
                name: opt.name,
                priceModifier: opt.priceModifier || 0,
                isDefault: opt.isDefault || false,
              })),
            },
          })),
        } : undefined,
      },
      select: { ...MENU_ITEM_SELECT, ...VARIANT_INCLUDE },
    });
  },

  async updateMenuItem(id: string, data: any) {
    const { variantGroups, ...itemData } = data;

    // If variant groups are provided, delete old ones and recreate
    if (variantGroups) {
      await prisma.variantGroup.deleteMany({ where: { menuItemId: id } });

      for (const vg of variantGroups) {
        await prisma.variantGroup.create({
          data: {
            menuItemId: id,
            title: vg.title,
            minSelect: vg.minSelect || 0,
            maxSelect: vg.maxSelect || 1,
            options: {
              create: vg.options.map((opt: any) => ({
                name: opt.name,
                priceModifier: opt.priceModifier || 0,
                isDefault: opt.isDefault || false,
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

  async deleteMenuItem(id: string) {
    return prisma.menuItem.delete({ where: { id } });
  },

  async toggleAvailability(id: string, isAvailable: boolean) {
    return prisma.menuItem.update({
      where: { id },
      data: { isAvailable },
      select: { id: true, isAvailable: true },
    });
  },

  async toggleOnlineAvailability(id: string, availableOnline: boolean) {
    return prisma.menuItem.update({
      where: { id },
      data: { availableOnline },
      select: { id: true, availableOnline: true },
    });
  },
};
