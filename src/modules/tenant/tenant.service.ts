// ─── Tenant Service ─────────────────────────────────────────────────
// Business logic — never touches req/res.

import { tenantRepository } from './tenant.repository';
import { cacheGetOrSet, cacheInvalidateByTag } from '../../lib/cache';
import { NotFoundError, ConflictError } from '../../lib/errors';
import bcrypt from 'bcryptjs';

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

    return tenant;
  },

  async getFaqs(slug: string) {
    const cacheKey = `tenant:faqs:${slug}`;
    return cacheGetOrSet(cacheKey, async () => {
      const faqs = await tenantRepository.getFaqsBySlug(slug);
      return faqs || null;
    }, 300);
  },

  async getPrivacyPolicy(slug: string) {
    const cacheKey = `tenant:privacy:${slug}`;
    return cacheGetOrSet(cacheKey, async () => {
      const policy = await tenantRepository.getPrivacyPolicyBySlug(slug);
      return policy || null;
    }, 300);
  },

  async getById(id: string) {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw new NotFoundError('Tenant', id);
    return tenant;
  },

  async createWithOwner(data: {
    name: string;
    slug: string;
    businessType: any;
    planId?: string;
    ownerEmail: string;
    ownerName: string;
    ownerPassword: string;
    settings?: Record<string, any>;
    theme?: Record<string, any>;
    content?: Record<string, any>;
  }) {
    // Check slug uniqueness
    const existing = await tenantRepository.resolveBySlug(data.slug);
    if (existing) throw new ConflictError(`Tenant slug '${data.slug}' is already taken`);

    // Transaction: create tenant + owner user + staff profile + default branch
    const result = await tenantRepository.transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          businessType: data.businessType,
          planId: data.planId,
          settings: { create: data.settings || {} },
          theme: { create: data.theme || {} },
          content: { create: data.content || {} },
        },
      });

      // Auto-create "Main Branch"
      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: 'Main Branch',
          address: 'Primary location',
        },
      });

      // Sync Delivery Zones if deliveryAreas provided
      if (data.settings?.deliveryAreas && typeof data.settings.deliveryAreas === 'string') {
        const areas = data.settings.deliveryAreas.split(',').map(s => s.trim()).filter(Boolean);
        const zonesToCreate = areas.map(areaStr => {
          const parts = areaStr.split(' - ');
          let city = parts.length > 1 ? parts[0].trim() : 'Karachi';
          let areaName = parts.length > 1 ? parts.slice(1).join(' - ').trim() : areaStr.trim();
          return {
            branchId: branch.id,
            city,
            areaName,
            deliveryFee: data.settings?.deliveryFee || 0,
            estimatedMinutes: 45,
          };
        });
        if (zonesToCreate.length > 0) {
          await tx.deliveryZone.createMany({ data: zonesToCreate });
        }
      }

      // Create owner user
      const passwordHash = await bcrypt.hash(data.ownerPassword, 12);
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
    return result;
  },

  async updateTheme(tenantId: string, data: Record<string, any>) {
    const result = await tenantRepository.updateTheme(tenantId, data);
    await cacheInvalidateByTag(`tenant:*:${tenantId}*`);
    await cacheInvalidateByTag(`tenant:resolve:*`);
    return result;
  },

  async updateContent(tenantId: string, data: Record<string, any>) {
    const result = await tenantRepository.updateContent(tenantId, data);
    await cacheInvalidateByTag(`tenant:*:${tenantId}*`);
    await cacheInvalidateByTag(`tenant:resolve:*`);
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
    const result = await tenantRepository.transaction(async (tx: any) => {
      // 1. Update Tenant core info
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.slug) updateData.slug = data.slug;
      if (data.businessType) updateData.businessType = data.businessType;

      const tenant = await tx.tenant.update({
        where: { id },
        data: updateData,
      });

      // 2. Find and update the OWNER user
      const ownerUser = await tx.user.findFirst({
        where: {
          tenantId: id,
          staffProfile: {
            isOwner: true,
          },
        },
      });

      if (ownerUser) {
        const userUpdateData: any = {};
        if (data.ownerName) userUpdateData.name = data.ownerName;
        if (data.ownerEmail) userUpdateData.email = data.ownerEmail;
        if (data.ownerPassword) {
          userUpdateData.passwordHash = await bcrypt.hash(data.ownerPassword, 12);
        }

        if (Object.keys(userUpdateData).length > 0) {
          await tx.user.update({
            where: { id: ownerUser.id },
            data: userUpdateData,
          });
        }
      }

      return tenant;
    });

    await cacheInvalidateByTag(`tenant:*`);
    return this.getById(id);
  },
};
