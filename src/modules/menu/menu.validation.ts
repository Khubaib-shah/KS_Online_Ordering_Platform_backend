// ─── Menu Validation Schemas ────────────────────────────────────────

import { z } from 'zod';

// ── Category ──
export const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  imageUrl: z.string().url().optional().nullable(),
  cardStyle: z.enum(['default', 'minimal', 'list', 'list-alt']).optional().nullable(),
  sortOrder: z.number().int().optional(),
  posSortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  availableOnline: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ── Menu Item ──
const variantOptionSchema = z.object({
  name: z.string().min(1).max(255),
  priceModifier: z.number().min(0),
  isDefault: z.boolean().optional(),
});

const variantGroupSchema = z.object({
  title: z.string().min(1).max(255),
  minSelect: z.number().int().min(0).optional(),
  maxSelect: z.number().int().min(1).optional(),
  options: z.array(variantOptionSchema).min(1),
});

export const createMenuItemSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  basePrice: z.number().min(0),
  discountedPrice: z.number().min(0).optional().nullable(),
  badgeText: z.string().max(100).optional().nullable(),
  badgeColor: z.string().max(20).optional().nullable(),
  metaNote: z.string().max(255).optional().nullable(),
  pricePrefix: z.string().max(50).optional().nullable(),
  dealLayout: z.boolean().optional(),
  calories: z.number().int().optional().nullable(),
  preparationTimeMins: z.number().int().optional(),
  isAvailable: z.boolean().optional(),
  availableOnline: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  variantGroups: z.array(variantGroupSchema).optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

// ── Query Params ──
export const listMenuItemsQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  isAvailable: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
});

export const catalogQuerySchema = z.object({
  tenantId: z.string().uuid().optional(),
});
