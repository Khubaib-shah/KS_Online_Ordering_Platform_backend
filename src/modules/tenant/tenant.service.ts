// ─── Tenant Service ─────────────────────────────────────────────────
// Business logic — never touches req/res.

import { tenantRepository } from './tenant.repository';
import { prisma } from '../../config/database';
import { cacheGetOrSet, cacheInvalidateByTag } from '../../lib/cache';
import { NotFoundError, ConflictError, ValidationError } from '../../lib/errors';
import bcrypt from 'bcryptjs';

// ─── Shared Helpers ─────────────────────────────────────────────────

/**
 * Normalise the raw DB tenant into the shape the API consumers expect.
 * Renames `tenantLocations` → `locationAssignments` so the frontend
 * doesn't need to know about the internal Prisma relation name.
 */
function normaliseTenant(tenant: any): any {
  if (!tenant) return tenant;
  const { tenantLocations, faqPage, privacyPolicy, ...rest } = tenant;
  
  return {
    ...rest,
    locationAssignments: tenantLocations ?? [],
    faqPage: faqPage ? {
      ...faqPage,
    } : null,
    privacyPolicy: privacyPolicy ? {
      ...privacyPolicy,
      
      sections: privacyPolicy.sections?.map((sec: any) => ({
        ...sec,
      }))
    } : null,
  };
}

/**
 * Resolve all concrete area IDs from a set of location assignments.
 * If a CITY is assigned, all areas in that city are included.
 * If a ZONE is assigned, all areas in that zone are included.
 * Individual AREA assignments are included directly.
 */
async function resolveAreaIds(
  tx: any,
  locationAssignments: any[]
): Promise<string[]> {
  const cityIds = locationAssignments
    .filter((l: any) => l.locationType === 'CITY')
    .map((l: any) => l.cityId)
    .filter(Boolean);
  const zoneIds = locationAssignments
    .filter((l: any) => l.locationType === 'ZONE')
    .map((l: any) => l.zoneId)
    .filter(Boolean);
  const directAreaIds = locationAssignments
    .filter((l: any) => l.locationType === 'AREA')
    .map((l: any) => l.areaId)
    .filter(Boolean);

  const [areasFromCities, areasFromZones] = await Promise.all([
    cityIds.length > 0
      ? tx.area.findMany({ where: { zone: { cityId: { in: cityIds } } }, select: { id: true } })
      : [],
    zoneIds.length > 0
      ? tx.area.findMany({ where: { zoneId: { in: zoneIds } }, select: { id: true } })
      : [],
  ]);

  const allIds = new Set([
    ...directAreaIds,
    ...areasFromCities.map((a: any) => a.id),
    ...areasFromZones.map((a: any) => a.id),
  ]);

  return [...allIds];
}

/**
 * Persist TenantLocation records and sync BranchCoverage for ALL active
 * branches of the tenant. Idempotent — deletes existing records first.
 */
async function syncLocationCoverage(
  tx: any,
  tenantId: string,
  locationAssignments: any[],
  deliveryFee: number = 0
): Promise<void> {
  // 1. Replace tenant-level location assignments
  await tx.tenantLocation.deleteMany({ where: { tenantId } });

  const records = locationAssignments.map((loc: any) => ({
    tenantId,
    locationType: loc.locationType,
    cityId: loc.cityId || null,
    zoneId: loc.zoneId || null,
    areaId: loc.areaId || null,
    isAssigned: true,
    isEnabled: true,
  }));

  if (records.length > 0) {
    await tx.tenantLocation.createMany({ data: records });
  }

  // 2. Resolve all concrete area IDs
  const allAreaIds = await resolveAreaIds(tx, locationAssignments);
  if (allAreaIds.length === 0) return;

  // 3. Sync coverage for ALL active branches (not just the first one)
  const branches = await tx.branch.findMany({
    where: { tenantId, isActive: true },
    select: { id: true },
  });

  for (const branch of branches) {
    const coverages = allAreaIds.map((areaId: string) => ({
      branchId: branch.id,
      areaId,
      deliveryFee,
      estimatedMinutes: 45,
    }));
    await tx.branchCoverage.createMany({ data: coverages, skipDuplicates: true });
  }
}

// ─── Service ────────────────────────────────────────────────────────

export const tenantService = {
  async resolve(slug?: string, domain?: string) {
    const cacheKey = slug ? `tenant:resolve:${slug}` : `tenant:resolve:domain:${domain}`;

    const tenant = await cacheGetOrSet(cacheKey, async () => {
      if (slug) return tenantRepository.resolveBySlug(slug);
      if (domain) return tenantRepository.resolveByDomain(domain);
      return null;
    }, 300); // 5-minute TTL

    if (!tenant) {
      throw new NotFoundError('Tenant', slug || domain);
    }

    return normaliseTenant(tenant);
  },

  async bootstrap(slug?: string, domain?: string) {
    const cacheKey = slug ? `tenant:bootstrap:${slug}` : `tenant:bootstrap:domain:${domain}`;

    const tenant = await cacheGetOrSet(cacheKey, async () => {
      if (slug) return tenantRepository.bootstrapBySlug(slug);
      if (domain) return tenantRepository.bootstrapByDomain(domain);
      return null;
    }, 300); // 5-minute TTL

    if (!tenant) {
      throw new NotFoundError('Tenant', slug || domain);
    }

    return tenant; // No complex relations to normalise here
  },

  async getFaqs(slug: string) {
    const cacheKey = `tenant:faqs:${slug}`;
    return cacheGetOrSet(cacheKey, async () => {
      const faqs = await tenantRepository.getFaqsBySlug(slug);
      if (!faqs) return null;
      return {
        ...faqs,
      };
    }, 300);
  },

  async getPrivacyPolicy(slug: string) {
    const cacheKey = `tenant:privacy:${slug}`;
    return cacheGetOrSet(cacheKey, async () => {
      const policy = await tenantRepository.getPrivacyPolicyBySlug(slug);
      if (!policy) return null;
      return {
        ...policy,
        
        sections: policy.sections?.map((sec: any) => ({
          ...sec,
        }))
      };
    }, 300);
  },

  async getById(id: string) {
    const [
      tenant,
      orderAggregates,
      activeOrdersCount,
      recentOrders,
      last7DaysOrders,
    ] = await Promise.all([
      tenantRepository.findById(id),
      prisma.order.aggregate({
        where: {
          tenantId: id,
          status: { not: 'CANCELLED' },
        },
        _sum: { grandTotal: true },
        _count: { id: true },
      }),
      prisma.order.count({
        where: {
          tenantId: id,
          status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] },
        },
      }),
      prisma.order.findMany({
        where: { tenantId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          channel: true,
          fulfillmentType: true,
          status: true,
          paymentMethod: true,
          paymentStatus: true,
          grandTotal: true,
          createdAt: true,
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.order.findMany({
        where: {
          tenantId: id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          status: { not: 'CANCELLED' },
        },
        select: {
          createdAt: true,
          grandTotal: true,
          status: true,
        },
      }),
    ]);

    if (!tenant) throw new NotFoundError('Tenant', id);

    const totalRevenue = Number(orderAggregates._sum.grandTotal || 0);
    const totalOrders = orderAggregates._count.id || 0;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const velocityMap = new Map<string, { date: string; day: string; Revenue: number; Orders: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      velocityMap.set(dateKey, {
        date: dateKey,
        day: days[d.getDay()],
        Revenue: 0,
        Orders: 0,
      });
    }

    last7DaysOrders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      const entry = velocityMap.get(dateKey);
      if (entry) {
        entry.Revenue += Number(order.grandTotal || 0);
        entry.Orders += 1;
      }
    });

    const orderVelocity = Array.from(velocityMap.values());

    const normalised = normaliseTenant(tenant);
    return {
      ...normalised,
      stats: {
        totalRevenue,
        totalOrders,
        activeOrdersCount,
        averageOrderValue,
      },
      recentOrders: recentOrders.map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        placedAt: o.createdAt,
        customer: {
          name: o.customer?.name || 'Walk-in Guest',
          phone: o.customer?.phone || '-',
          email: o.customer?.email || '',
        },
        branchName: o.branch?.name || 'Main Branch',
        fulfillmentType: o.fulfillmentType,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        status: o.status.toLowerCase(),
        grandTotal: Number(o.grandTotal || 0),
      })),
      orderVelocity,
    };
  },

  async createWithOwner(data: {
    name: string;
    slug: string;
    businessType: any;
    planId?: string;
    customDomain?: string;
    domainVerified?: boolean;
    ownerEmail: string;
    ownerName: string;
    ownerPassword: string;
    settings?: Record<string, any>;
    theme?: Record<string, any>;
    content?: Record<string, any>;
    faqPage?: any;
    privacyPolicy?: any;
    locationAssignments?: any[];
  }) {
    // Check slug uniqueness
    const existing = await tenantRepository.resolveBySlug(data.slug);
    if (existing) throw new ConflictError(`Tenant slug '${data.slug}' is already taken`);

    // Validate plan existence up front for a clean 400 instead of a FK 500
    if (data.planId) {
      const plan = await tenantRepository.findPlanById(data.planId);
      if (!plan) {
        throw new ValidationError(`Plan '${data.planId}' does not exist`, { planId: ['Unknown plan id'] });
      }
    }

    // Hash password before transaction to prevent timeout
    const passwordHash = await bcrypt.hash(data.ownerPassword, 12);

    // Transaction: create tenant + owner user + staff profile + default branch
    const result = await tenantRepository.transaction(async (tx) => {
      // 1. Create tenant with all top-level fields
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          businessType: data.businessType,
          planId: data.planId,
          customDomain: data.customDomain || null,
          domainVerified: data.domainVerified ?? false,
          settings: { create: data.settings || {} },
          theme: { create: data.theme || {} },
          content: { create: data.content || {} },
        },
      });

      // 2. Persist FAQ page and privacy policy if provided
      if (data.faqPage) {
        await tx.tenantFaqPage.create({
          data: {
            tenantId: tenant.id,
            title: data.faqPage.title,
            description: data.faqPage.description,
            faqs: {
              create: (Array.isArray(data.faqPage.faqs) ? data.faqPage.faqs : []).map(
                (item: any, index: number) => ({
                  question: item.question || '',
                  answer: item.answer || '',
                  sortOrder: item.sortOrder ?? index,
                  isActive: item.isActive ?? true,
                })
              ),
            },
          },
        });
      }

      if (data.privacyPolicy) {
        await tx.tenantPrivacyPolicy.create({
          data: {
            tenantId: tenant.id,
            title: data.privacyPolicy.title,
            description: data.privacyPolicy.description,
            sections: {
              create: (
                Array.isArray(data.privacyPolicy.sections)
                  ? data.privacyPolicy.sections
                  : []
              ).map((section: any, index: number) => ({
                title: section.title || '',
                content: section.content || '',
                sortOrder: section.sortOrder ?? index,
              })),
            },
          },
        });
      }

      // 3. Create default branch using store name and contact address
      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: data.name,
          address: data.settings?.address || 'Primary location',
          phone: data.settings?.phone || null,
          isDefault: true,
        },
      });

      // 4. Sync delivery location assignments → branch coverage
      if (data.locationAssignments && Array.isArray(data.locationAssignments) && data.locationAssignments.length > 0) {
        await syncLocationCoverage(
          tx,
          tenant.id,
          data.locationAssignments,
          Number(data.settings?.deliveryFee) || 0
        );
      }

      // 5. Create owner user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: data.ownerEmail,
          passwordHash,
          name: data.ownerName,
          globalRole: 'TENANT_USER',
          staffProfile: {
            create: {
              branchId: branch.id,
              isOwner: true,
            },
          },
        },
      });

      return { tenantId: tenant.id, branch, userId: user.id };
    });

    const fullTenant = await this.getById(result.tenantId);
    return { tenant: fullTenant, branch: result.branch, userId: result.userId };
  },

  async updateSettings(tenantId: string, data: Record<string, any>) {
    const result = await tenantRepository.updateSettings(tenantId, data);
    await cacheInvalidateByTag(`tenant:*:${tenantId}*`);
    await cacheInvalidateByTag(`tenant:resolve:*`);
    await cacheInvalidateByTag(`tenant:bootstrap:*`);
    return result;
  },

  async updateTheme(tenantId: string, data: Record<string, any>) {
    const result = await tenantRepository.updateTheme(tenantId, data);
    await cacheInvalidateByTag(`tenant:*:${tenantId}*`);
    await cacheInvalidateByTag(`tenant:resolve:*`);
    await cacheInvalidateByTag(`tenant:bootstrap:*`);
    return result;
  },

  async updateContent(tenantId: string, data: Record<string, any>) {
    const result = await tenantRepository.updateContent(tenantId, data);
    if (data.faqs) {
      await tenantRepository.upsertFaqPage(tenantId, data.faqs);
    }
    if (data.privacyPolicy) {
      await tenantRepository.upsertPrivacyPolicy(tenantId, data.privacyPolicy);
    }
    await cacheInvalidateByTag(`tenant:*:${tenantId}*`);
    await cacheInvalidateByTag(`tenant:resolve:*`);
    await cacheInvalidateByTag(`tenant:bootstrap:*`);
    return result;
  },

  async listAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    return tenantRepository.listAll(skip, limit);
  },

  async updateStatus(id: string, status: any) {
    const result = await tenantRepository.updateStatus(id, status);
    await cacheInvalidateByTag(`tenant:*`);
    return result;
  },

  async delete(id: string) {
    const result = await tenantRepository.delete(id);
    await cacheInvalidateByTag(`tenant:*`);
    return result;
  },

  async updateTenantAndOwner(id: string, data: any) {
    // Validate plan existence up front for a clean 400 instead of a FK 500
    if (data.planId) {
      const plan = await tenantRepository.findPlanById(data.planId);
      if (!plan) {
        throw new ValidationError(`Plan '${data.planId}' does not exist`, { planId: ['Unknown plan id'] });
      }
    }

    let newPasswordHash: string | undefined;
    if (data.ownerPassword) {
      newPasswordHash = await bcrypt.hash(data.ownerPassword, 12);
    }

    const result = await tenantRepository.transaction(async (tx: any) => {
      // 1. Update Tenant core info
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.slug) updateData.slug = data.slug;
      if (data.businessType) updateData.businessType = data.businessType;
      if (data.planId !== undefined) updateData.planId = data.planId || null;
      if (data.customDomain !== undefined) updateData.customDomain = data.customDomain || null;
      if (typeof data.domainVerified === 'boolean') updateData.domainVerified = data.domainVerified;
      if (data.defaultLocale) updateData.defaultLocale = data.defaultLocale;
      if (Array.isArray(data.supportedLocales) && data.supportedLocales.length > 0) {
        updateData.supportedLocales = data.supportedLocales;
      }
      if (typeof data.isRtl === 'boolean') updateData.isRtl = data.isRtl;
      if (data.status) updateData.status = data.status;

      if (data.settings) {
        const { id: _sId, tenantId: _tId, createdAt: _sc, updatedAt: _su, ...settingsData } = data.settings;
        updateData.settings = { upsert: { create: settingsData, update: settingsData } };
      }
      if (data.theme) {
        const { id: _thId, tenantId: _thtId, createdAt: _thc, updatedAt: _thu, ...themeData } = data.theme;
        updateData.theme = { upsert: { create: themeData, update: themeData } };
      }
      if (data.content) {
        const { id: _cId, tenantId: _ctId, createdAt: _cc, updatedAt: _cu, faqs, privacyPolicy, ...contentData } = data.content;
        updateData.content = { upsert: { create: contentData, update: contentData } };
      }

      const tenant = await tx.tenant.update({
        where: { id },
        data: updateData,
      });

      // 2. Persist FAQ page and privacy policy when provided
      if (data.content?.faqs) {
        await tenantRepository.upsertFaqPage(id, data.content.faqs, tx);
      }
      if (data.content?.privacyPolicy) {
        await tenantRepository.upsertPrivacyPolicy(id, data.content.privacyPolicy, tx);
      }

      // 3. Find and update the OWNER user
      let ownerUser = await tx.user.findFirst({
        where: {
          tenantId: id,
          staffProfile: { isOwner: true },
        },
      });

      if (!ownerUser) {
        ownerUser = await tx.user.findFirst({
          where: { tenantId: id },
        });
      }

      if (ownerUser) {
        const userUpdateData: any = {};
        if (data.ownerName) userUpdateData.name = data.ownerName;
        if (data.ownerEmail) userUpdateData.email = data.ownerEmail;
        if (newPasswordHash) {
          userUpdateData.passwordHash = newPasswordHash;
        }

        if (Object.keys(userUpdateData).length > 0) {
          await tx.user.update({
            where: { id: ownerUser.id },
            data: userUpdateData,
          });
        }
      }

      // 4. Sync location assignments → branch coverage (shared helper)
      if (data.locationAssignments && Array.isArray(data.locationAssignments)) {
        await syncLocationCoverage(
          tx,
          id,
          data.locationAssignments,
          Number(data.settings?.deliveryFee) || 0
        );
      }

      return tenant;
    });

    await cacheInvalidateByTag(`tenant:*`);
    return this.getById(id);
  },

  async resetOwnerPassword(tenantId: string, newPassword = 'Password123!') {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true },
    });
    if (!tenant) {
      throw new NotFoundError('Tenant', tenantId);
    }

    // Find the owner user first, fallback to first user associated with this tenant
    let targetUser = await prisma.user.findFirst({
      where: {
        tenantId,
        staffProfile: { isOwner: true },
      },
      select: { id: true, email: true, name: true },
    });

    if (!targetUser) {
      targetUser = await prisma.user.findFirst({
        where: { tenantId },
        select: { id: true, email: true, name: true },
      });
    }

    if (!targetUser) {
      throw new NotFoundError('No user account found for this tenant', tenantId);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: targetUser.id },
      data: { passwordHash },
    });

    // Ensure staff profile is marked as owner
    await prisma.staffProfile.upsert({
      where: { userId: targetUser.id },
      create: {
        userId: targetUser.id,
        isOwner: true,
      },
      update: {
        isOwner: true,
      },
    });

    return {
      tenantId,
      tenantName: tenant.name,
      userId: targetUser.id,
      ownerEmail: targetUser.email,
      ownerName: targetUser.name,
      newPassword,
      message: `Password for ${targetUser.email} has been reset to "${newPassword}".`,
    };
  },
};
