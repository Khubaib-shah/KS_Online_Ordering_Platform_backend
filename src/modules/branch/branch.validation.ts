import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(1).max(255),
  address: z.string().min(1),
  phone: z.string().max(50).optional(),
  mapsUrl: z.string().optional(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
});

export const createDeliveryZoneSchema = z.object({
  areaName: z.string().min(1).max(255),
  city: z.string().min(1).max(255),
  deliveryFee: z.number().min(0),
  estimatedMinutes: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});
