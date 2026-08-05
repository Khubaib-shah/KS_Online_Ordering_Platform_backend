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

export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  selectedVariants?: { variantGroupId: string; optionId: string }[];
  itemNote?: string | null;
}

export async function recalculateLineItems(tx: any, items: OrderItemInput[]) {
  const orderItems = [];
  let subtotal = new Decimal(0);

  for (const item of items) {
    const menuItem = await tx.menuItem.findUnique({
      where: { id: item.menuItemId },
      select: {
        id: true,
        name: true,
        basePrice: true,
        discountedPrice: true,
        isAvailable: true,
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
