// ─── Order Service ──────────────────────────────────────────────────
// Server-side price recalculation — NEVER trust client prices.

import { orderRepository } from './order.repository';
import { NotFoundError, ValidationError } from '../../lib/errors';
import { Decimal } from '@prisma/client/runtime/library';
import { generateOrderNumber, recalculateLineItems, createOrderWithRetry, OrderItemInput } from './order.helper';
import { printJobService } from '../printer/print-job.service';



export const orderService = {
  /**
   * Create a website order with server-side price verification.
   */
  async createWebsiteOrder(tenantId: string, data: {
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
    areaId?: string | null;
  }) {
    const order = await orderRepository.transaction(async (tx) => {
      // 1. Resolve branch
      let branchId = data.branchId;

      if (branchId) {
        // Verify the requested branch actually belongs to this tenant
        const branch = await tx.branch.findFirst({
          where: { id: branchId, tenantId, isActive: true },
          select: { id: true },
        });
        if (!branch) throw new NotFoundError('Branch', branchId);
      }

      if (!branchId && data.fulfillmentType === 'DELIVERY' && data.areaId) {
        const coverage = await tx.branchCoverage.findFirst({
          where: {
            areaId: data.areaId,
            branch: { tenantId, deliveryEnabled: true, isActive: true }
          },
          select: { branchId: true }
        });
        if (!coverage) throw new NotFoundError('Delivery coverage for selected area');
        branchId = coverage.branchId;
      }

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
      const { orderItems, subtotal } = await recalculateLineItems(tx, data.items, {
        tenantId,
        requireAvailableOnline: true,
      });

      // 4. Calculate tax, delivery fee, promo discount
      const taxAmount = subtotal.mul(settings.taxRate).div(100);
      let deliveryFee = new Decimal(0);
      let discountAmount = new Decimal(0);

      // Delivery fee from zone (simplified — uses first matching zone or default 0)
      if (data.fulfillmentType === 'DELIVERY' && data.areaId) {
        const coverage = await tx.branchCoverage.findUnique({
          where: { branchId_areaId: { branchId, areaId: data.areaId } },
          select: { deliveryFee: true, minimumOrder: true },
        });
        if (coverage) {
          deliveryFee = new Decimal(coverage.deliveryFee.toString());
          if (subtotal.lt(coverage.minimumOrder)) {
            throw new Error(`Minimum order amount is ${coverage.minimumOrder}`);
          }
        }
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

            // Increment usage counter atomically — the WHERE clause makes the
            // limit check-and-increment race-free under concurrent orders.
            if (promo.usageLimit) {
              const claimed = await tx.promotion.updateMany({
                where: { id: promo.id, timesUsed: { lt: promo.usageLimit } },
                data: { timesUsed: { increment: 1 } },
              });
              if (claimed.count === 0) {
                throw new ValidationError(`Promo code '${promo.code}' has reached its usage limit`);
              }
            } else {
              await tx.promotion.update({
                where: { id: promo.id },
                data: { timesUsed: { increment: 1 } },
              });
            }
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

      // 6. Create order (retry on order-number collision)
      const order = await createOrderWithRetry(tx, tenantId, (orderNumber) => ({
        orderNumber,
        tenantId,
        branchId,
        customerId: customer.id,
        channel: 'WEBSITE',
        fulfillmentType: data.fulfillmentType,
        status: 'PENDING',
        paymentMethod: data.paymentMethod,
        // No online gateway is integrated yet — no order can be considered paid at
        // creation. Staff marks it PAID (PATCH /orders/:id/payment) once payment is
        // received or when the gateway is implemented later.
        paymentStatus: 'UNPAID',
        subtotal,
        taxAmount,
        discountAmount,
        deliveryFee,
        grandTotal,
        deliveryAddress: data.deliveryAddress,
        nearestLandmark: data.nearestLandmark,
        deliveryInstructions: data.deliveryInstructions,
        specialInstructions: data.specialInstructions,
        areaId: data.areaId,
        statusTimeline: [{ status: 'PENDING', timestamp: new Date().toISOString(), author: `Customer (${data.customer.name})` }],
        items: { create: orderItems },
      }));

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

    // 8. Dispatch kitchen docket to branch printers (never fails the order)
    if (order?.branch?.id) {
      await printJobService.dispatchForOrder(tenantId, order.branch.id, order, ['KITCHEN_DOCKET']);
    }

    return order;
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
    orderNumber?: string;
    createdById?: string;
    author?: string;
  }) {
    const order = await orderRepository.transaction(async (tx) => {
      // Verify the branch belongs to this tenant
      const branch = await tx.branch.findFirst({
        where: { id: data.branchId, tenantId },
        select: { id: true },
      });
      if (!branch) throw new NotFoundError('Branch', data.branchId);

      const settings = await tx.tenantSettings.findUnique({
        where: { tenantId },
        select: { taxRate: true },
      });
      if (!settings) throw new NotFoundError('Tenant settings');

      // Server-side price recalculation
      const { orderItems, subtotal } = await recalculateLineItems(tx, data.items, { tenantId });

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

      const orderData = (orderNumber: string) => ({
        orderNumber,
        tenantId,
        branchId: data.branchId,
        customerId,
        channel: 'POS',
        fulfillmentType: data.fulfillmentType,
        // status: 'PENDING',
        status: data.fulfillmentType === 'TAKEAWAY' ? 'COMPLETED' : 'PENDING',
        paymentMethod: data.paymentMethod,
        paymentStatus: data.fulfillmentType === 'DINE_IN' ? 'UNPAID' : 'PAID', // Dine-in orders are paid later
        subtotal,
        taxAmount,
        discountAmount: 0,
        deliveryFee: 0,
        grandTotal,
        tableNumber: data.tableNumber,
        specialInstructions: data.specialInstructions,
        privateKitchenNotes: data.privateKitchenNotes,
        statusTimeline: [{ status: data.fulfillmentType === 'TAKEAWAY' ? 'COMPLETED' : 'PENDING', timestamp: new Date().toISOString(), author: data.author || 'Staff' }],
        createdById: data.createdById,
        items: { create: orderItems },
      });

      // Retry with a fresh number only when the number is auto-generated;
      // an explicit offline-recovery orderNumber must collide or it surfaces as a genuine duplicate.
      const order = data.orderNumber
        ? await tx.order.create({
            data: orderData(data.orderNumber),
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
            },
          })
        : await createOrderWithRetry(tx, tenantId, orderData);

      // Cash change calculation
      let change = null;
      if (data.cashReceived && data.paymentMethod === 'CASH') {
        const received = new Decimal(data.cashReceived);
        if (received.lt(grandTotal)) {
          throw new ValidationError('Cash received is less than the order total');
        }
        change = received.sub(grandTotal).toNumber();
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

    // Dispatch receipt + kitchen docket to branch printers (never fails the order)
    if (order?.branch?.id) {
      await printJobService.dispatchForOrder(tenantId, order.branch.id, order, ['RECEIPT', 'KITCHEN_DOCKET']);
    }

    return order;
  },

  async getOrderById(id: string, tenantId: string) {
    const order = await orderRepository.findById(id, tenantId);
    if (!order) throw new NotFoundError('Order', id);
    return order;
  },

  async getOrderByNumber(orderNumber: string, phone: string, tenantId: string) {
    const order = await orderRepository.findByOrderNumber(orderNumber, tenantId);
    if (!order) throw new NotFoundError('Order', orderNumber);

    // Phone verification for guest tracking
    if (order.customer && order.customer.phone !== phone) {
      throw new NotFoundError('Order', orderNumber);
    }

    return order;
  },

  async deleteOrder(id: string, tenantId: string) {
    const order = await orderRepository.findById(id, tenantId);
    if (!order) throw new NotFoundError('Order', id);
    return orderRepository.delete(id, tenantId);
  },

  async listOrders(tenantId: string, filters: any, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return orderRepository.list(tenantId, filters, skip, limit);
  },

  async updateStatus(id: string, tenantId: string, status: string, notes?: string, author?: string) {
    const order = await orderRepository.findById(id, tenantId);
    if (!order) throw new NotFoundError('Order', id);

    // Build timeline
    const timeline = Array.isArray(order.statusTimeline) ? [...(order.statusTimeline as any[])] : [];
    timeline.push({
      status,
      timestamp: new Date().toISOString(),
      notes: notes || undefined,
      author: author || 'System',
    });

    const updated = await orderRepository.updateStatus(order.id, tenantId, status, timeline);

    // Print the customer receipt when a website order is accepted (never fails the order)
    if (status === 'ACCEPTED' && order.channel === 'WEBSITE' && updated?.branch?.id) {
      await printJobService.dispatchForOrder(tenantId, updated.branch.id, updated, ['RECEIPT']);
    }

    return updated;
  },

  async updatePaymentStatus(
    id: string,
    tenantId: string,
    data: { paymentStatus: 'PAID' | 'UNPAID'; paymentMethod?: string }
  ) {
    const order = await orderRepository.findById(id, tenantId);
    if (!order) throw new NotFoundError('Order', id);

    // Record the payment change in the status timeline for auditability
    const timeline = Array.isArray(order.statusTimeline) ? [...(order.statusTimeline as any[])] : [];
    timeline.push({
      status: order.status,
      timestamp: new Date().toISOString(),
      notes: data.paymentMethod
        ? `Payment marked ${data.paymentStatus} (${data.paymentMethod})`
        : `Payment marked ${data.paymentStatus}`,
      author: 'Staff',
    });

    const updated = await orderRepository.updatePayment(order.id, tenantId, { ...data, timeline });
    return updated;
  },

  async getKitchenOrders(tenantId: string, branchId?: string) {
    return orderRepository.getActiveKitchenOrders(tenantId, branchId);
  },
};
