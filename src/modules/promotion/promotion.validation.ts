import { z } from 'zod';

export const createPromoSchema = z.object({
  code: z.string().min(1).max(50).transform(v => v.toUpperCase()),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_DELIVERY']),
  discountValue: z.number().min(0),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountCap: z.number().min(0).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const validatePromoSchema = z.object({
  promoCode: z.string().min(1),
  subtotal: z.number().min(0),
});
