// ─── Tenant Repository ──────────────────────────────────────────────
// Database access layer — only place that imports Prisma.

import { prisma } from '../../config/database';

// Safe select: never return stripe_secret_key_enc in any query
const TENANT_PUBLIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  customDomain: true,
  businessType: true,
  status: true,
  createdAt: true,
};

const SETTINGS_PUBLIC_SELECT = {
  currencySymbol: true,
  currencyCode: true,
  taxRate: true,
  serviceFee: true,
  enableDineIn: true,
  enableTakeaway: true,
  enableDelivery: true,
  enabledPaymentMethods: true,
  phone: true,
  email: true,
  address: true,
  receiptHeader: true,
  receiptFooter: true,
  deliveryFee: true,
  minOrderValue: true,
  operatingHours: true,
  deliveryAreas: true,
  // EXCLUDED: stripePublicKey, stripeSecretKeyEnc
};

const THEME_SELECT = {
  primaryColor: true,
  accentColor: true,
  bgColor: true,
  logoUrl: true,
  faviconUrl: true,
  fontFamily: true,
  defaultCardStyle: true,
  popularCardStyle: true,
  categoryBackground: true,
  backgroundImage: true,
  backgroundMode: true,
};

const CONTENT_SELECT = {
  announcementText: true,
  footerConfig: true,
  copyConfig: true,
  heroSlides: true,
  faqs: true,
  privacyPolicy: true,
  seoTitle: true,
  seoDescription: true,
  activePromo: true,
};

const TENANT_COMPLETE_SELECT = {
  ...TENANT_PUBLIC_SELECT,
  settings: { select: SETTINGS_PUBLIC_SELECT },
  theme: { select: THEME_SELECT },
  content: { select: CONTENT_SELECT },
  users: {
    select: {
      name: true,
      email: true,
      globalRole: true,
      staffProfile: {
        select: {
          designation: true,
        },
      },
    },
  },
};

export const tenantRepository = {
  async resolveBySlug(slug: string) {
    return prisma.tenant.findUnique({
      where: { slug },
      select: TENANT_COMPLETE_SELECT,
    });
  },

  async resolveByDomain(domain: string) {
    return prisma.tenant.findUnique({
      where: { customDomain: domain },
      select: TENANT_COMPLETE_SELECT,
    });
  },

  async findById(id: string) {
    return prisma.tenant.findUnique({
      where: { id },
      select: TENANT_COMPLETE_SELECT,
    });
  },

  async create(data: {
    name: string;
    slug: string;
    businessType: any;
    planId?: string;
  }) {
    return prisma.tenant.create({
      data: {
        ...data,
        settings: { create: {} },  // defaults
        theme: { create: {} },     // defaults
        content: { create: {} },   // defaults
      },
      select: TENANT_COMPLETE_SELECT,
    });
  },

  async updateSettings(tenantId: string, data: Record<string, any>) {
    // Delivery zone synchronization is now handled via the branch/delivery-zones API.
    // Legacy deliveryAreas string logic has been removed to prevent wiping out DeliveryZone records.
    return prisma.tenantSettings.upsert({
      where: { tenantId },
      update: data,
      create: { tenantId, ...data },
      select: SETTINGS_PUBLIC_SELECT,
    });
  },

  async updateTheme(tenantId: string, data: Record<string, any>) {
    return prisma.tenantTheme.upsert({
      where: { tenantId },
      update: data,
      create: { tenantId, ...data },
      select: THEME_SELECT,
    });
  },

  async updateContent(tenantId: string, data: Record<string, any>) {
    return prisma.tenantContent.upsert({
      where: { tenantId },
      update: data,
      create: { tenantId, ...data },
      select: CONTENT_SELECT,
    });
  },

  async listAll(skip: number, take: number) {
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        skip,
        take,
        select: {
          ...TENANT_COMPLETE_SELECT,
          _count: { select: { branches: true, orders: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tenant.count(),
    ]);
    return { tenants, total };
  },

  async updateStatus(id: string, status: any) {
    return prisma.tenant.update({
      where: { id },
      data: { status },
      select: TENANT_COMPLETE_SELECT,
    });
  },

  async delete(id: string) {
    return prisma.tenant.delete({
      where: { id },
      select: TENANT_PUBLIC_SELECT,
    });
  },

  async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return prisma.$transaction(fn);
  },
};
