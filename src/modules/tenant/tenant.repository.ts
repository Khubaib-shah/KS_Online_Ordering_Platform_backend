// ─── Tenant Repository ──────────────────────────────────────────────
// Database access layer — only place that imports Prisma.

import { prisma } from '../../config/database';

// Safe select: never return stripe_secret_key_enc in any query
const TENANT_PUBLIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  customDomain: true,
  domainVerified: true,
  businessType: true,
  planId: true,
  status: true,
  defaultLocale: true,
  supportedLocales: true,
  isRtl: true,
  createdAt: true,
  updatedAt: true,
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
  seoTitle: true,
  seoDescription: true,
  seoKeywords: true,
  ogImageUrl: true,
  gaMeasurementId: true,
  gscVerification: true,
  noIndex: true,
  activePromo: true,
};

const TENANT_COMPLETE_SELECT = {
  ...TENANT_PUBLIC_SELECT,
  settings: { select: SETTINGS_PUBLIC_SELECT },
  theme: { select: THEME_SELECT },
  content: { select: CONTENT_SELECT },
  users: {
    where: { staffProfile: { isOwner: true } },
    select: {
      name: true,
      email: true,
      globalRole: true,
      staffProfile: {
        select: {
          isOwner: true,
          role: true,
        },
      },
    },
  },
  faqPage: {
    select: {
      title: true,
      description: true,
      faqs: {
        orderBy: { sortOrder: 'asc' as const },
        select: {
          id: true,
          question: true,
          answer: true,
          sortOrder: true,
          isActive: true,
        },
      },
    },
  },
  privacyPolicy: {
    select: {
      title: true,
      description: true,
      sections: {
        orderBy: { sortOrder: 'asc' as const },
        select: {
          id: true,
          title: true,
          content: true,
          sortOrder: true,
        },
      },
    },
  },
  branches: {
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      mapsUrl: true,
    },
  },
  tenantLocations: {
    select: {
      locationType: true,
      cityId: true,
      zoneId: true,
      areaId: true,
    },
  },
};

const TENANT_RESOLVE_SELECT = {
  ...TENANT_PUBLIC_SELECT,
  settings: { select: SETTINGS_PUBLIC_SELECT },
  theme: { select: THEME_SELECT },
  content: { select: CONTENT_SELECT },
  branches: {
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      mapsUrl: true,
    },
  },
  tenantLocations: {
    select: {
      locationType: true,
      cityId: true,
      zoneId: true,
      areaId: true,
    },
  },
};

export const tenantRepository = {
  async resolveBySlug(slug: string) {
    return prisma.tenant.findUnique({
      where: { slug },
      select: TENANT_RESOLVE_SELECT,
    });
  },

  async resolveByDomain(domain: string) {
    return prisma.tenant.findUnique({
      where: { customDomain: domain },
      select: TENANT_RESOLVE_SELECT,
    });
  },

  async getFaqsBySlug(slug: string) {
    return prisma.tenantFaqPage.findFirst({
      where: { tenant: { slug } },
      include: {
        faqs: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
  },

  async getPrivacyPolicyBySlug(slug: string) {
    return prisma.tenantPrivacyPolicy.findFirst({
      where: { tenant: { slug } },
      include: {
        sections: {
          orderBy: { sortOrder: 'asc' }
        }
      }
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
    const { faqs, privacyPolicy, ...contentData } = data;
    return prisma.tenantContent.upsert({
      where: { tenantId },
      update: contentData,
      create: { tenantId, ...contentData },
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

  async findPlanById(planId: string) {
    return prisma.platformPlan.findUnique({
      where: { id: planId },
      select: { id: true },
    });
  },

  async upsertFaqPage(tenantId: string, faqs: any, client: any = prisma) {
    const title = faqs?.title;
    const description = faqs?.intro;
    const items = Array.isArray(faqs?.items) ? faqs.items : [];

    const page = await client.tenantFaqPage.upsert({
      where: { tenantId },
      update: {
        title: title ?? undefined,
        description: description ?? undefined,
      },
      create: { tenantId, title: title ?? undefined, description: description ?? undefined },
    });

    if (items.length > 0 || faqs?.items) {
      await client.tenantFaqItem.deleteMany({ where: { pageId: page.id } });
      if (items.length > 0) {
        await client.tenantFaqItem.createMany({
          data: items.map((item: any, index: number) => ({
            pageId: page.id,
            question: item.question || '',
            answer: item.answer || '',
            sortOrder: item.sortOrder ?? index,
            isActive: item.isActive ?? true,
          })),
        });
      }
    }

    return page;
  },

  async upsertPrivacyPolicy(tenantId: string, policy: any, client: any = prisma) {
    const title = policy?.title;
    const description = policy?.intro;
    const sections = Array.isArray(policy?.sections) ? policy.sections : [];

    const page = await client.tenantPrivacyPolicy.upsert({
      where: { tenantId },
      update: {
        title: title ?? undefined,
        description: description ?? undefined,
      },
      create: { tenantId, title: title ?? undefined, description: description ?? undefined },
    });

    if (sections.length > 0 || policy?.sections) {
      await client.tenantPrivacyPolicySection.deleteMany({ where: { policyId: page.id } });
      if (sections.length > 0) {
        await client.tenantPrivacyPolicySection.createMany({
          data: sections.map((section: any, index: number) => ({
            policyId: page.id,
            title: section.title || '',
            content: section.content || '',
            sortOrder: section.sortOrder ?? index,
          })),
        });
      }
    }

    return page;
  },

  async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return prisma.$transaction(fn, {
      maxWait: 5000,
      timeout: 20000,
    });
  },
};
