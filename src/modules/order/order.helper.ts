import { NotFoundError, ValidationError } from '../../lib/errors';
import { Decimal } from '@prisma/client/runtime/library';

export function generateOrderNumber(tenantIdentifier?: string): string {
  let prefix = 'ORD';
  
  if (tenantIdentifier) {
    // Extract initials from words separated by space, hyphen, or underscore
    const words = tenantIdentifier.split(/[-_\s]+/);
    const initials = words.map(w => w.charAt(0)).join('').toUpperCase();
    if (initials.length > 0) {
      prefix = initials.substring(0, 5); // limit length just in case
    }
  }

  // Generate a random 6-digit number
  const randomPart = Math.floor(100000 + Math.random() * 900000).toString();
  
  return `${prefix}-${randomPart}`;
}

/**
 * Creates an order inside an existing transaction, retrying on order-number
 * collisions (Prisma P2002). Order numbers are random 6-digit suffixes, so a
 * collision is rare but possible at scale — never fail the customer's order.
 */
export async function createOrderWithRetry(
  tx: any,
  tenantId: string,
  buildData: (orderNumber: string) => Record<string, unknown>
) {
  const MAX_ATTEMPTS = 5;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const orderNumber = generateOrderNumber(tenantId);
    try {
      return await tx.order.create({
        data: buildData(orderNumber) as any,
      });
    } catch (error: any) {
      const isCollision =
        error?.code === 'P2002' &&
        Array.isArray(error?.meta?.target) &&
        error.meta.target.includes('orderNumber');
      if (!isCollision || attempt === MAX_ATTEMPTS) throw error;
    }
  }
  throw new Error('Could not allocate a unique order number');
}

export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  selectedVariants?: { variantGroupId: string; optionId: string }[];
  itemNote?: string | null;
}

export async function recalculateLineItems(
  tx: any,
  items: OrderItemInput[],
  options: { tenantId?: string; requireAvailableOnline?: boolean } = {}
) {
  const orderItems = [];
  let subtotal = new Decimal(0);

  for (const item of items) {
    const menuItem = await tx.menuItem.findFirst({
      where: {
        id: item.menuItemId,
        ...(options.tenantId ? { tenantId: options.tenantId } : {}),
      },
      select: {
        id: true,
        name: true,
        basePrice: true,
        discountedPrice: true,
        isAvailable: true,
        availableOnline: true,
        variantGroups: {
          select: {
            id: true,
            options: {
              select: { id: true, name: true, priceModifier: true },
            },
          },
        },
      },
    });

    if (!menuItem) throw new NotFoundError('Menu item', item.menuItemId);
    if (options.requireAvailableOnline && !menuItem.availableOnline) {
      throw new ValidationError(`Item '${menuItem.name}' is not available for online ordering`);
    }
    if (!menuItem.isAvailable) {
      throw new ValidationError(`Item '${menuItem.name}' is currently unavailable`);
    }

    let unitPrice = menuItem.discountedPrice
      ? new Decimal(menuItem.discountedPrice.toString())
      : new Decimal(menuItem.basePrice.toString());

    const selectedVariantsSnapshot: any[] = [];
    if (item.selectedVariants) {
      for (const sv of item.selectedVariants) {
        const group = menuItem.variantGroups.find((vg: any) => vg.id === sv.variantGroupId);
        if (!group) continue;
        const option = group.options.find((o: any) => o.id === sv.optionId);
        if (!option) continue;
        unitPrice = unitPrice.add(new Decimal(option.priceModifier.toString()));
        selectedVariantsSnapshot.push({
          groupId: sv.variantGroupId,
          optionId: sv.optionId,
          optionName: option.name,
          priceModifier: option.priceModifier,
        });
      }
    }

    const totalPrice = unitPrice.mul(item.quantity);
    subtotal = subtotal.add(totalPrice);

    orderItems.push({
      menuItemId: menuItem.id,
      itemName: menuItem.name,
      unitPrice,
      quantity: item.quantity,
      selectedVariants: selectedVariantsSnapshot.length > 0 ? selectedVariantsSnapshot : undefined,
      itemNote: item.itemNote,
      totalPrice,
    });
  }

  return { orderItems, subtotal };
}
