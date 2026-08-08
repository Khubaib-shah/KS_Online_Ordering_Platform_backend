// ─── Promotion Service ──────────────────────────────────────────────
import { promotionRepository } from './promotion.repository';

export const promotionService = {
  async validate(tenantId: string, promoCode: string, subtotal: number) {
    const promo = await promotionRepository.findByCode(tenantId, promoCode);

    if (!promo) {
      return { valid: false, message: 'Invalid promo code' };
    }

    const now = new Date();
    if (promo.startDate && promo.startDate > now) {
      return { valid: false, message: 'This promo is not yet active' };
    }
    if (promo.endDate && promo.endDate < now) {
      return { valid: false, message: 'This promo has expired' };
    }
    if (promo.usageLimit && promo.timesUsed >= promo.usageLimit) {
      return { valid: false, message: 'This promo has reached its usage limit' };
    }
    if (subtotal < Number(promo.minOrderAmount)) {
      return { valid: false, message: `Minimum order of Rs. ${promo.minOrderAmount} required` };
    }

    // Calculate discount
    let discount = 0;
    if (promo.discountType === 'PERCENTAGE') {
      discount = subtotal * Number(promo.discountValue) / 100;
      if (promo.maxDiscountCap) {
        discount = Math.min(discount, Number(promo.maxDiscountCap));
      }
    } else if (promo.discountType === 'FIXED_AMOUNT') {
      discount = Number(promo.discountValue);
    } else if (promo.discountType === 'FREE_DELIVERY') {
      discount = 0; // Applied at order creation
    }

    return {
      valid: true,
      discountType: promo.discountType,
      discount,
      message: promo.discountType === 'FREE_DELIVERY'
        ? 'Free delivery applied!'
        : `Rs. ${discount.toFixed(0)} discount applied!`,
    };
  },

  async list(tenantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return promotionRepository.list(tenantId, skip, limit);
  },

  async create(tenantId: string, data: any) {
    return promotionRepository.create(tenantId, data);
  },

  async update(id: string, tenantId: string, data: any) {
    return promotionRepository.update(id, tenantId, data);
  },

  async delete(id: string, tenantId: string) {
    return promotionRepository.delete(id, tenantId);
  },
};
