// ─── Tenant Validation Schemas ──────────────────────────────────────

import { z } from 'zod';

export const resolveTenantQuerySchema = z.object({
  slug: z.string().optional(),
  domain: z.string().optional(),
}).refine(data => data.slug || data.domain, {
  message: 'Either slug or domain must be provided',
});

export const createTenantSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  businessType: z.enum([
    'RESTAURANT', 'FAST_FOOD', 'CAFE', 'ICE_CREAM_PARLOUR', 'BAKERY', 'CLOUD_KITCHEN', 'RETAIL',
  ]),
  planId: z.string().min(1).optional(),
  customDomain: z.string().max(255).optional().nullable(),
  domainVerified: z.boolean().optional(),
  ownerEmail: z.string().email(),
  ownerName: z.string().min(1).max(255),
  ownerPassword: z.string().min(8),
  settings: z.any().optional(),
  theme: z.any().optional(),
  content: z.any().optional(),
  faqPage: z.any().optional(),
  privacyPolicy: z.any().optional(),
  locationAssignments: z.any().optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
  businessType: z.enum([
    'RESTAURANT', 'FAST_FOOD', 'CAFE', 'ICE_CREAM_PARLOUR', 'BAKERY', 'CLOUD_KITCHEN', 'RETAIL',
  ]).optional(),
  planId: z.string().min(1).optional().nullable(),
  customDomain: z.string().max(255).optional().nullable(),
  domainVerified: z.boolean().optional(),
  defaultLocale: z.string().min(2).max(10).optional(),
  supportedLocales: z.array(z.string().min(2).max(10)).optional(),
  isRtl: z.boolean().optional(),
  ownerEmail: z.string().email().optional(),
  ownerName: z.string().min(1).max(255).optional(),
  ownerPassword: z.string().min(8).optional(),
  settings: z.any().optional(),
  theme: z.any().optional(),
  content: z.any().optional(),
  locationAssignments: z.any().optional(),
});

export const updateTenantSettingsSchema = z.object({
  currencySymbol: z.string().max(10).optional(),
  currencyCode: z.string().max(10).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  serviceFee: z.number().min(0).optional(),
  enableDineIn: z.boolean().optional(),
  enableTakeaway: z.boolean().optional(),
  enableDelivery: z.boolean().optional(),
  enabledPaymentMethods: z.array(z.enum([
    'CASH', 'COD', 'CARD', 'ONLINE', 'WALLET', 'BANK_TRANSFER', 'LOYALTY_POINTS',
  ])).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  receiptHeader: z.string().optional(),
  receiptFooter: z.string().optional(),
  deliveryFee: z.number().min(0).optional(),
  minOrderValue: z.number().min(0).optional(),
  operatingHours: z.any().optional(),
  deliveryAreas: z.any().optional(),
});

export const updateTenantThemeSchema = z.object({
  primaryColor: z.string().max(20).optional(),
  accentColor: z.string().max(20).optional(),
  bgColor: z.string().max(20).optional(),
  logoUrl: z.string().optional().nullable(),
  faviconUrl: z.string().optional().nullable(),
  fontFamily: z.string().max(100).optional(),
  defaultCardStyle: z.enum(['default', 'minimal', 'list', 'list-alt']).optional(),
  popularCardStyle: z.enum(['default', 'minimal', 'list', 'list-alt']).optional(),
  categoryBackground: z.string().optional().nullable(),
  backgroundImage: z.string().optional().nullable(),
  backgroundMode: z.string().optional().nullable(),
});

export const updateTenantContentSchema = z.object({
  announcementText: z.string().optional().nullable(),
  footerConfig: z.any().optional(),
  copyConfig: z.any().optional(),
  heroSlides: z.array(z.object({
    id: z.string().optional(),
    image_url: z.string(),
    promo_label: z.string().optional(),
    promo_headline: z.string().optional(),
    promo_sub: z.string().optional(),
    sort_order: z.number().optional(),
  })).optional(),
  faqs: z.any().optional(),
  privacyPolicy: z.any().optional(),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  noIndex: z.boolean().optional(),
  ogImageUrl: z.string().optional().nullable(),
  gaMeasurementId: z.string().optional().nullable(),
  gscVerification: z.string().optional().nullable(),
  activePromo: z.any().optional(),
});
