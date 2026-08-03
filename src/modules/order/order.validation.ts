// ─── Order Validation Schemas ───────────────────────────────────────

import { z } from 'zod';

const orderItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1),
  selectedVariants: z.array(z.object({
    variantGroupId: z.string().uuid(),
    optionId: z.string().uuid(),
  })).optional(),
  itemNote: z.string().optional().nullable(),
});

export const createStorefrontOrderSchema = z.object({
  branchId: z.string().uuid().optional(), // optional if single-branch tenant
  customer: z.object({
    name: z.string().min(1).max(255),
    phone: z.string().min(10).max(15),
    email: z.string().email().optional().nullable(),
  }),
  items: z.array(orderItemSchema).min(1),
  fulfillmentType: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']),
  paymentMethod: z.enum(['CASH', 'COD', 'CARD', 'ONLINE', 'WALLET', 'BANK_TRANSFER']),
  deliveryAddress: z.string().optional().nullable(),
  nearestLandmark: z.string().optional().nullable(),
  deliveryInstructions: z.string().optional().nullable(),
  specialInstructions: z.string().optional().nullable(),
  promoCode: z.string().optional().nullable(),
});

export const createPosOrderSchema = z.object({
  branchId: z.string().uuid(),
  items: z.array(orderItemSchema).min(1),
  fulfillmentType: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']),
  paymentMethod: z.enum(['CASH', 'CARD', 'ONLINE', 'LOYALTY_POINTS']),
  cashReceived: z.number().optional(),
  tableNumber: z.string().optional().nullable(),
  customerId: z.string().uuid().optional().nullable(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  specialInstructions: z.string().optional().nullable(),
  privateKitchenNotes: z.string().optional().nullable(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional(),
});

export const listOrdersQuerySchema = z.object({
  branchId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED']).optional(),
  channel: z.enum(['POS', 'STOREFRONT', 'KITCHEN_MANUAL', 'THIRD_PARTY']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const guestOrderTrackingSchema = z.object({
  phone: z.string().min(10).max(15),
});
