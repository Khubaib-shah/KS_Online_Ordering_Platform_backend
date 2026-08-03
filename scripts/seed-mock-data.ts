import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as mockMenu from '../../Restaurant-Template/src/data/mock-menu';
import { restaurants } from '../../Restaurant-Template/src/restaurants/index';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Data Migration from Frontend Mocks...');

  // 1. Ensure a platform plan exists for these
  const proPlan = await prisma.platformPlan.upsert({
    where: { id: 'plan-pro' },
    update: {},
    create: {
      id: 'plan-pro',
      name: 'Pro',
      monthlyPrice: 4999,
      maxBranches: 5,
      maxMenuItems: 500,
      transactionFeePct: 1.5,
      featuresJson: {
        features: ['5 Branches', '500 Menu Items', 'POS Terminal', 'Online Ordering', 'Advanced Reports'],
      },
    },
  });

  const restaurantKeys = Object.keys(restaurants);
  console.log(`Found ${restaurantKeys.length} restaurant configurations:`, restaurantKeys);

  for (const key of restaurantKeys) {
    const config = (restaurants as any)[key];
    console.log(`\n=========================================`);
    console.log(`🚀 Migrating Tenant: ${config.name} (${config.slug})`);

    // 2. Map frontend Config to backend Tenant & Settings
    const tenant = await prisma.tenant.upsert({
      where: { slug: config.slug },
      update: {},
      create: {
        name: config.name,
        slug: config.slug,
        businessType: 'RESTAURANT',
        planId: proPlan.id,
        status: 'ACTIVE',
        settings: {
          create: {
            currencySymbol: 'Rs.',
            currencyCode: 'PKR',
            taxRate: config.taxPercent || 0,
            serviceFee: 0,
            enableDineIn: true,
            enableTakeaway: true,
            enableDelivery: true,
            enabledPaymentMethods: ['CASH', 'COD', 'CARD'],
            phone: config.contact?.phone || '',
            email: config.contact?.email || '',
            address: config.contact?.address || '',
          },
        },
        theme: {
          create: {
            primaryColor: config.theme?.colors?.primary || '#000000',
            accentColor: config.theme?.colors?.accent || '#000000',
            bgColor: config.theme?.colors?.background?.page || '#ffffff',
            fontFamily: 'Inter',
            defaultCardStyle: config.theme?.cardStyle || 'default',
            popularCardStyle: config.theme?.cardStyle || 'default',
            logoUrl: config.logo || '',
          },
        },
        content: {
          create: {
            announcementText: config.announcementText || null,
            heroSlides: config.heroSlides || [],
            faqs: config.faqs?.items || [],
            seoTitle: config.seoText ? config.name : null,
            seoDescription: config.seoText || null,
            footerConfig: config.footer || null,
          },
        },
      },
    });

    console.log(`  ✅ Tenant created: ${tenant.id}`);

    // 3. Create Main Branch
    const branch = await prisma.branch.upsert({
      where: { id: `branch-${config.slug}-main` },
      update: {},
      create: {
        id: `branch-${config.slug}-main`,
        tenantId: tenant.id,
        name: 'Main Branch',
        address: config.contact?.address || 'Main Location',
        phone: config.contact?.phone || '',
        openingTime: '11:00',
        closingTime: '23:00',
      },
    });

    // 4. Create Owner user for the tenant
    const ownerPassword = await bcrypt.hash('admin', 12);
    const ownerEmail = `admin@${config.slug}.com`;
    await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {},
      create: {
        tenantId: tenant.id,
        email: ownerEmail,
        passwordHash: ownerPassword,
        name: `${config.name} Owner`,
        globalRole: 'TENANT_USER',
        staffProfile: {
          create: {
            branchId: branch.id,
            designation: 'OWNER',
            permissionOrders: 'MANAGE',
            permissionMenu: 'MANAGE',
            permissionReports: 'MANAGE',
            permissionSettings: 'MANAGE',
          },
        },
      },
    });
    console.log(`  ✅ Owner created: ${ownerEmail} / admin`);

    // 5. Migrate Menu Data
    // We need to match the mock key. e.g., 'azfoodcorner' -> azFoodCornerCategories
    // The keys in `restaurants` are: ghalib, pizza, azfoodcorner, marhababbq, demo
    // The mock data has specific naming. We'll try a few heuristics or direct mappings.
    const mockMapping: Record<string, { cats: string; items: string }> = {
      ghalib: { cats: 'ghalibCategories', items: 'ghalibItems' }, // Will be empty
      pizza: { cats: 'pizzaCategories', items: 'pizzaItems' },
      azfoodcorner: { cats: 'azFoodCornerCategories', items: 'azFoodCornerItems' },
      marhababbq: { cats: 'marhababbqCategories', items: 'marhababbqItems' },
      demo: { cats: 'iceCreamCategories', items: 'iceCreamItems' },
    };

    const map = mockMapping[key];
    if (map) {
      const categories: any[] = (mockMenu as any)[map.cats] || [];
      const items: any[] = (mockMenu as any)[map.items] || [];

      console.log(`  🍽️ Found ${categories.length} categories, ${items.length} items`);

      // 5a. Upsert Categories
      const insertedCategories = new Set<string>();
      for (const cat of categories) {
        await prisma.category.upsert({
          where: { id: cat.id },
          update: {}, // Avoid overriding existing to save time, or we can force update
          create: {
            id: cat.id,
            tenantId: tenant.id,
            name: cat.name,
            slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
            imageUrl: cat.imageUrl || null,
            sortOrder: cat.sortOrder || 0,
            isActive: cat.isAvailable !== false,
          },
        });
        insertedCategories.add(cat.id);
      }

      // 5b. Upsert Items
      for (const item of items) {
        let catId = item.categoryId;
        if (!insertedCategories.has(catId)) {
          // If category is missing, create a placeholder to avoid FK error
          await prisma.category.upsert({
            where: { id: catId },
            update: {},
            create: {
              id: catId,
              tenantId: tenant.id,
              name: catId.replace('cat-', '').replace(/-/g, ' '),
              slug: catId,
              sortOrder: 99,
              isActive: true,
            },
          });
          insertedCategories.add(catId);
        }

        const createdItem = await prisma.menuItem.upsert({
          where: { id: item.id },
          update: {},
          create: {
            id: item.id,
            tenantId: tenant.id,
            categoryId: item.categoryId,
            name: item.name,
            description: item.description || null,
            imageUrl: item.imageUrl || null,
            basePrice: item.basePrice,
            discountedPrice: item.discountedPrice || null,
            badgeText: item.badge?.text || null,
            badgeColor: item.badge?.color || null,
            metaNote: item.servingNote || null,
            isFeatured: item.isFeatured || false,
            isAvailable: item.isAvailable !== false,
            dealLayout: item.dealLayout || false,
          },
        });

        // 5c. Upsert Variant Groups (modifierGroups)
        if (item.modifierGroups && item.modifierGroups.length > 0) {
          for (const group of item.modifierGroups) {
            const vg = await prisma.variantGroup.upsert({
              where: { id: group.id },
              update: {},
              create: {
                id: group.id,
                menuItemId: createdItem.id,
                title: group.name,
                minSelect: group.minSelect || (group.required ? 1 : 0),
                maxSelect: group.maxSelect || 1,
              },
            });

            if (group.options) {
              for (let i = 0; i < group.options.length; i++) {
                const opt = group.options[i];
                await prisma.variantOption.upsert({
                  where: { id: opt.id },
                  update: {},
                  create: {
                    id: opt.id,
                    variantGroupId: vg.id,
                    name: opt.name,
                    priceModifier: opt.additionalPrice || 0,
                    isDefault: i === 0 && group.required,
                  },
                });
              }
            }
          }
        }
      }
      console.log(`  ✅ Menu imported successfully`);
    } else {
      console.log(`  ⚠️ No mock menu mapping found for ${key}`);
    }
  }

  console.log('\n🎉 Data Migration Completed!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
