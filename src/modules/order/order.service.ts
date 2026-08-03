// ─── Order Service ──────────────────────────────────────────────────
// Server-side price recalculation — NEVER trust client prices.

import { orderRepository } from './order.repository';
import { NotFoundError } from '../../lib/errors';
import { Decimal } from '@prisma/client/runtime/library';
import { generateOrderNumber, recalculateLineItems, OrderItemInput } from './order.helper';



export const orderService = {
  /**
   * Create a storefront order with server-side price verification.
   */
  async createStorefrontOrder(tenantId: string, data: {
    branchId?: string;
    customer: { name: string; phone: string; email?: string | null };
    items: OrderItemInput[];
    fulfillmentType: string;
    paymentMethod: string;
    deliveryAddress?: string | null;
    nearestLandmark?: string | null;
    deliveryInstructions?: string | null;
    specialInstructions?: string | null;
    promoCode?: string | null;
  }) {
    return orderRepository.transaction(async (tx) => {
      // 1. Resolve branch (default to first active branch if not specified)
      let branchId = data.branchId;
      if (!branchId) {
        const defaultBranch = await tx.branch.findFirst({
          where: { tenantId, isActive: true },
          select: { id: true },
        });
        if (!defaultBranch) throw new NotFoundError('Active branch');
        branchId = defaultBranch.id;
      }

      // 2. Fetch tenant settings for tax/fee calculation
      const settings = await tx.tenantSettings.findUnique({
        where: { tenantId },
        select: { taxRate: true, serviceFee: true },
      });
      if (!settings) throw new NotFoundError('Tenant settings');

      // 3. Server-side price recalculation for each item
      const { orderItems, subtotal } = await recalculateLineItems(tx, data.items);

      // 4. Calculate tax, delivery fee, promo discount
      const taxAmount = subtotal.mul(settings.taxRate).div(100);
      let deliveryFee = new Decimal(0);
      let discountAmount = new Decimal(0);

      // Delivery fee from zone (simplified — uses first matching zone or default 0)
      if (data.fulfillmentType === 'DELIVERY') {
        const zone = await tx.deliveryZone.findFirst({
          where: { branchId, isActive: true },
          select: { deliveryFee: true },
          orderBy: { deliveryFee: 'asc' },
        });
        if (zone) deliveryFee = new Decimal(zone.deliveryFee.toString());
      }

      // Promo code validation
      if (data.promoCode) {
        const promo = await tx.promotion.findFirst({
          where: {
            tenantId,
            code: data.promoCode.toUpperCase(),
            isActive: true,
          },
        });

        if (promo) {
          const now = new Date();
          const isValid =
            (!promo.startDate || promo.startDate <= now) &&
            (!promo.endDate || promo.endDate >= now) &&
            (!promo.usageLimit || promo.timesUsed < promo.usageLimit) &&
            subtotal.gte(promo.minOrderAmount);

          if (isValid) {
            if (promo.discountType === 'PERCENTAGE') {
              discountAmount = subtotal.mul(promo.discountValue).div(100);
              if (promo.maxDiscountCap) {
                const cap = new Decimal(promo.maxDiscountCap.toString());
                if (discountAmount.gt(cap)) discountAmount = cap;
              }
            } else if (promo.discountType === 'FIXED_AMOUNT') {
              discountAmount = new Decimal(promo.discountValue.toString());
            } else if (promo.discountType === 'FREE_DELIVERY') {
              deliveryFee = new Decimal(0);
            }

            // Increment usage counter
            await tx.promotion.update({
              where: { id: promo.id },
              data: { timesUsed: { increment: 1 } },
            });
          }
        }
      }

      const grandTotal = subtotal.add(taxAmount).add(deliveryFee).sub(discountAmount);

      // 5. Upsert customer
      const customer = await tx.customer.upsert({
        where: {
          tenantId_phone: { tenantId, phone: data.customer.phone },
        },
        update: {
          name: data.customer.name,
          email: data.customer.email || undefined,
          totalOrders: { increment: 1 },
          totalSpent: { increment: grandTotal },
        },
        create: {
          tenantId,
          name: data.customer.name,
          phone: data.customer.phone,
          email: data.customer.email,
          isGuest: true,
          totalOrders: 1,
          totalSpent: grandTotal,
        },
      });

      // 6. Create order
      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          tenantId,
          branchId,
          customerId: customer.id,
          channel: 'STOREFRONT',
          fulfillmentType: data.fulfillmentType,
          status: 'PENDING',
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentMethod === 'COD' || data.paymentMethod === 'CASH' ? 'UNPAID' : 'PAID',
          subtotal,
          taxAmount,
          discountAmount,
          deliveryFee,
          grandTotal,
          deliveryAddress: data.deliveryAddress,
          nearestLandmark: data.nearestLandmark,
          deliveryInstructions: data.deliveryInstructions,
          specialInstructions: data.specialInstructions,
          statusTimeline: [{ status: 'PENDING', timestamp: new Date().toISOString() }],
          items: { create: orderItems },
        },
        select: {
          id: true,
          orderNumber: true,
          channel: true,
          fulfillmentType: true,
          status: true,
          paymentMethod: true,
          paymentStatus: true,
          subtotal: true,
          taxAmount: true,
          discountAmount: true,
          deliveryFee: true,
          grandTotal: true,
          deliveryAddress: true,
          nearestLandmark: true,
          deliveryInstructions: true,
          tableNumber: true,
          specialInstructions: true,
          privateKitchenNotes: true,
          statusTimeline: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: { id: true, name: true, phone: true, email: true },
          },
          branch: {
            select: { id: true, name: true },
          },
          items: {
            select: {
              id: true,
              itemName: true,
              unitPrice: true,
              quantity: true,
              selectedVariants: true,
              itemNote: true,
              totalPrice: true,
            },
          },
        }
      });

      // 7. Award loyalty points (1 point per 100 PKR)
      const pointsEarned = Math.floor(grandTotal.toNumber() / 100);
      if (pointsEarned > 0) {
        await tx.customer.update({
          where: { id: customer.id },
          data: { loyaltyPoints: { increment: pointsEarned } },
        });
      }

      return order;
    });
  },

  /**
   * Create a POS order.
   */
  async createPosOrder(tenantId: string, data: {
    branchId: string;
    items: OrderItemInput[];
    fulfillmentType: string;
    paymentMethod: string;
    cashReceived?: number;
    tableNumber?: string | null;
    customerId?: string | null;
    customerName?: string;
    customerPhone?: string;
    specialInstructions?: string | null;
    privateKitchenNotes?: string | null;
  }) {
    return orderRepository.transaction(async (tx) => {
      const settings = await tx.tenantSettings.findUnique({
        where: { tenantId },
        select: { taxRate: true },
      });
      if (!settings) throw new NotFoundError('Tenant settings');

      // Server-side price recalculation
      const { orderItems, subtotal } = await recalculateLineItems(tx, data.items);

      const taxAmount = subtotal.mul(settings.taxRate).div(100);
      const grandTotal = subtotal.add(taxAmount);

      // Resolve or create customer for POS
      let customerId = data.customerId;
      if (!customerId && data.customerPhone) {
        const customer = await tx.customer.upsert({
          where: { tenantId_phone: { tenantId, phone: data.customerPhone } },
          update: { name: data.customerName || 'Walk-in', totalOrders: { increment: 1 }, totalSpent: { increment: grandTotal } },
          create: { tenantId, name: data.customerName || 'Walk-in', phone: data.customerPhone, isGuest: false, totalOrders: 1, totalSpent: grandTotal },
        });
        customerId = customer.id;
      }

      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          tenantId,
          branchId: data.branchId,
          customerId,
          channel: 'POS',
          fulfillmentType: data.fulfillmentType,
          status: 'PENDING',
          paymentMethod: data.paymentMethod,
          paymentStatus: 'PAID', // POS orders are paid at counter
          subtotal,
          taxAmount,
          discountAmount: 0,
          deliveryFee: 0,
          grandTotal,
          tableNumber: data.tableNumber,
          specialInstructions: data.specialInstructions,
          privateKitchenNotes: data.privateKitchenNotes,
          statusTimeline: [{ status: 'PENDING', timestamp: new Date().toISOString() }],
          items: { create: orderItems },
        },
        select: {
          id: true,
          orderNumber: true,
          channel: true,
          fulfillmentType: true,
          status: true,
          paymentMethod: true,
          paymentStatus: true,
          subtotal: true,
          taxAmount: true,
          discountAmount: true,
          deliveryFee: true,
          grandTotal: true,
          deliveryAddress: true,
          nearestLandmark: true,
          deliveryInstructions: true,
          tableNumber: true,
          specialInstructions: true,
          privateKitchenNotes: true,
          statusTimeline: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: { id: true, name: true, phone: true, email: true },
          },
          branch: {
            select: { id: true, name: true },
          },
          items: {
            select: {
              id: true,
              itemName: true,
              unitPrice: true,
              quantity: true,
              selectedVariants: true,
              itemNote: true,
              totalPrice: true,
            },
          },
        }
      });

      // Cash change calculation
      let change = null;
      if (data.cashReceived && data.paymentMethod === 'CASH') {
        change = new Decimal(data.cashReceived).sub(grandTotal).toNumber();
      }

      // Loyalty points (1 pt / 100 PKR)
      if (customerId) {
        const pointsEarned = Math.floor(grandTotal.toNumber() / 100);
        if (pointsEarned > 0) {
          await tx.customer.update({
            where: { id: customerId },
            data: { loyaltyPoints: { increment: pointsEarned } },
          });
        }
      }

      return { ...order, change };
    });
  },

  async getOrderById(id: string) {
    const order = await orderRepository.findById(id);
    if (!order) throw new NotFoundError('Order', id);
    return order;
  },

  async getOrderByNumber(orderNumber: string, phone: string) {
    const order = await orderRepository.findByOrderNumber(orderNumber);
    if (!order) throw new NotFoundError('Order', orderNumber);

    // Phone verification for guest tracking
    if (order.customer && order.customer.phone !== phone) {
      throw new NotFoundError('Order', orderNumber);
    }

    return order;
  },

  async listOrders(tenantId: string, filters: any, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return orderRepository.list(tenantId, filters, skip, limit);
  },

  async updateStatus(id: string, status: string, notes?: string) {
    const order = await orderRepository.findById(id);
    if (!order) throw new NotFoundError('Order', id);

    // Build timeline
    const timeline = Array.isArray(order.statusTimeline) ? [...(order.statusTimeline as any[])] : [];
    timeline.push({
      status,
      timestamp: new Date().toISOString(),
      notes: notes || undefined,
    });

    return orderRepository.updateStatus(id, status, timeline);
  },

  async getKitchenOrders(tenantId: string, branchId?: string) {
    return orderRepository.getActiveKitchenOrders(tenantId, branchId);
  },
};
