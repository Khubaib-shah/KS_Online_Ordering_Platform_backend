import { NotFoundError, ValidationError } from '../../lib/errors';
import { Decimal } from '@prisma/client/runtime/library';

export async function createOrderAtomic(
  tx: any,
  tenantId: string,
  tenantName: string,
  buildData: (orderNumber: string) => Record<string, unknown>
) {
  let prefix = 'ORD';
  if (tenantName) {
    const words = tenantName.split(/[-_\s]+/);
    const initials = words.map(w => w.charAt(0)).join('').toUpperCase();
    if (initials.length > 0) {
      prefix = initials.substring(0, 5);
    }
  }

  const seq = await tx.orderSequence.upsert({
    where: { tenantId },
    update: { lastNumber: { increment: 1 } },
    create: { tenantId, lastNumber: 1 }
  });

  const paddedNum = seq.lastNumber.toString().padStart(7, '0');
  const orderNumber = `${prefix}-${paddedNum}`;

  return await tx.order.create({
    data: buildData(orderNumber) as any,
  });
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
