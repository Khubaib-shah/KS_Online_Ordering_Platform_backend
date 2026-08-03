"use strict";
// ─── Database Seed Script ───────────────────────────────────────────
// Creates a demo tenant with auto-created "Main Branch" and owner user.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    // 1. Create a platform plan
    const starterPlan = await prisma.platformPlan.upsert({
        where: { id: 'plan-starter' },
        update: {},
        create: {
            id: 'plan-starter',
            name: 'Starter',
            monthlyPrice: 0,
            maxBranches: 1,
            maxMenuItems: 50,
            transactionFeePct: 2.5,
            featuresJson: {
                features: ['1 Branch', '50 Menu Items', 'POS Terminal', 'Online Ordering', 'Basic Reports'],
            },
        },
    });
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
                features: ['5 Branches', '500 Menu Items', 'POS Terminal', 'Online Ordering', 'Advanced Reports', 'Staff Management', 'Delivery Zones'],
            },
        },
    });
    // 2. Create Super Admin
    const superAdminPassword = await bcryptjs_1.default.hash('superadmin123', 12);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@indolj.com' },
        update: {},
        create: {
            email: 'admin@indolj.com',
            passwordHash: superAdminPassword,
            name: 'Super Admin',
            globalRole: 'SUPER_ADMIN',
            tenantId: null,
        },
    });
    console.log(`  ✅ Super Admin: admin@indolj.com / superadmin123`);
    // 3. Create Demo Restaurant Tenant
    const demoTenant = await prisma.tenant.upsert({
        where: { slug: 'demo-restaurant' },
        update: {},
        create: {
            name: 'Gourmet Haven',
            slug: 'demo-restaurant',
            businessType: 'RESTAURANT',
            planId: proPlan.id,
            status: 'ACTIVE',
            settings: {
                create: {
                    currencySymbol: 'Rs.',
                    currencyCode: 'PKR',
                    taxRate: 16,
                    serviceFee: 0,
                    enableDineIn: true,
                    enableTakeaway: true,
                    enableDelivery: true,
                    enabledPaymentMethods: ['CASH', 'COD', 'CARD', 'ONLINE'],
                    phone: '+92-300-1234567',
                    email: 'info@gourmethaven.pk',
                    address: 'Gulberg III, Lahore, Pakistan',
                    receiptHeader: 'Gourmet Haven — Fine Dining',
                    receiptFooter: 'Thank you for dining with us! 🍽️',
                },
            },
            theme: {
                create: {
                    primaryColor: '#1a1a2e',
                    accentColor: '#e94560',
                    bgColor: '#f8f9fa',
                    fontFamily: 'Inter',
                    defaultCardStyle: 'default',
                    popularCardStyle: 'default',
                },
            },
            content: {
                create: {
                    announcementText: '🎉 Free delivery on orders above Rs. 2000!',
                    heroSlides: [
                        {
                            image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
                            promo_label: 'Now Open',
                            promo_headline: 'Experience Fine Dining',
                            promo_sub: 'Authentic Pakistani cuisine with a modern twist',
                            sort_order: 0,
                        },
                    ],
                    faqs: [
                        { question: 'What are your delivery areas?', answer: 'We deliver across Lahore including DHA, Gulberg, Johar Town, and Model Town.', sort_order: 0 },
                        { question: 'What payment methods do you accept?', answer: 'We accept Cash on Delivery, Card payments, and online bank transfers.', sort_order: 1 },
                        { question: 'Do you offer dine-in?', answer: 'Yes! Visit us at our Gulberg III location for an amazing dining experience.', sort_order: 2 },
                    ],
                    seoTitle: 'Gourmet Haven — Fine Dining in Lahore',
                    seoDescription: 'Order authentic Pakistani cuisine online. Free delivery on orders above Rs. 2000.',
                },
            },
        },
    });
    // 4. Create Main Branch
    const mainBranch = await prisma.branch.upsert({
        where: { id: 'branch-demo-main' },
        update: {},
        create: {
            id: 'branch-demo-main',
            tenantId: demoTenant.id,
            name: 'Main Branch',
            address: 'Gulberg III, Main Boulevard, Lahore',
            phone: '+92-300-1234567',
            openingTime: '11:00',
            closingTime: '23:00',
        },
    });
    // 5. Create delivery zones
    await prisma.deliveryZone.createMany({
        data: [
            { branchId: mainBranch.id, areaName: 'Gulberg', city: 'Lahore', deliveryFee: 100, estimatedMinutes: 30 },
            { branchId: mainBranch.id, areaName: 'DHA Phase 5', city: 'Lahore', deliveryFee: 150, estimatedMinutes: 40 },
            { branchId: mainBranch.id, areaName: 'Johar Town', city: 'Lahore', deliveryFee: 200, estimatedMinutes: 45 },
            { branchId: mainBranch.id, areaName: 'Model Town', city: 'Lahore', deliveryFee: 150, estimatedMinutes: 35 },
        ],
        skipDuplicates: true,
    });
    // 6. Create Owner user for the demo tenant
    const ownerPassword = await bcryptjs_1.default.hash('owner123', 12);
    const owner = await prisma.user.upsert({
        where: { email: 'owner@gourmethaven.pk' },
        update: {},
        create: {
            tenantId: demoTenant.id,
            email: 'owner@gourmethaven.pk',
            passwordHash: ownerPassword,
            name: 'Ahmed Khan',
            globalRole: 'TENANT_USER',
            staffProfile: {
                create: {
                    branchId: mainBranch.id,
                    designation: 'OWNER',
                    permissionOrders: 'MANAGE',
                    permissionMenu: 'MANAGE',
                    permissionReports: 'MANAGE',
                    permissionSettings: 'MANAGE',
                },
            },
        },
    });
    console.log(`  ✅ Demo Owner: owner@gourmethaven.pk / owner123`);
    // 7. Create demo categories and menu items
    const appetizers = await prisma.category.upsert({
        where: { id: 'cat-appetizers' },
        update: {},
        create: {
            id: 'cat-appetizers',
            tenantId: demoTenant.id,
            name: 'Appetizers',
            slug: 'appetizers',
            sortOrder: 0,
        },
    });
    const mains = await prisma.category.upsert({
        where: { id: 'cat-mains' },
        update: {},
        create: {
            id: 'cat-mains',
            tenantId: demoTenant.id,
            name: 'Main Course',
            slug: 'main-course',
            sortOrder: 1,
        },
    });
    const drinks = await prisma.category.upsert({
        where: { id: 'cat-drinks' },
        update: {},
        create: {
            id: 'cat-drinks',
            tenantId: demoTenant.id,
            name: 'Drinks',
            slug: 'drinks',
            sortOrder: 2,
        },
    });
    // Menu Items
    await prisma.menuItem.upsert({
        where: { id: 'item-seekh-kebab' },
        update: {},
        create: {
            id: 'item-seekh-kebab',
            tenantId: demoTenant.id,
            categoryId: appetizers.id,
            name: 'Seekh Kebab',
            description: 'Succulent minced lamb kebabs, charcoal-grilled with signature spices',
            basePrice: 650,
            isFeatured: true,
            badgeText: 'Bestseller',
            badgeColor: '#e94560',
            metaNote: 'Serves 2',
            preparationTimeMins: 20,
            variantGroups: {
                create: {
                    title: 'Choose Size',
                    minSelect: 1,
                    maxSelect: 1,
                    options: {
                        create: [
                            { name: 'Half (3 pcs)', priceModifier: 0, isDefault: true },
                            { name: 'Full (6 pcs)', priceModifier: 450 },
                        ],
                    },
                },
            },
        },
    });
    await prisma.menuItem.upsert({
        where: { id: 'item-chicken-biryani' },
        update: {},
        create: {
            id: 'item-chicken-biryani',
            tenantId: demoTenant.id,
            categoryId: mains.id,
            name: 'Chicken Biryani',
            description: 'Aromatic basmati rice layered with tender chicken and saffron',
            basePrice: 550,
            isFeatured: true,
            badgeText: 'Chef Special',
            badgeColor: '#f39c12',
            metaNote: 'Serves 1-2',
            preparationTimeMins: 25,
            variantGroups: {
                create: {
                    title: 'Portion Size',
                    minSelect: 1,
                    maxSelect: 1,
                    options: {
                        create: [
                            { name: 'Regular', priceModifier: 0, isDefault: true },
                            { name: 'Family Pack', priceModifier: 600 },
                        ],
                    },
                },
            },
        },
    });
    await prisma.menuItem.upsert({
        where: { id: 'item-lassi' },
        update: {},
        create: {
            id: 'item-lassi',
            tenantId: demoTenant.id,
            categoryId: drinks.id,
            name: 'Mango Lassi',
            description: 'Creamy yogurt blended with fresh Chaunsa mangoes',
            basePrice: 250,
            calories: 180,
            preparationTimeMins: 5,
            variantGroups: {
                create: {
                    title: 'Size',
                    minSelect: 1,
                    maxSelect: 1,
                    options: {
                        create: [
                            { name: 'Regular', priceModifier: 0, isDefault: true },
                            { name: 'Large', priceModifier: 100 },
                        ],
                    },
                },
            },
        },
    });
    // 8. Create a demo promotion
    await prisma.promotion.upsert({
        where: { id: 'promo-welcome' },
        update: {},
        create: {
            id: 'promo-welcome',
            tenantId: demoTenant.id,
            code: 'WELCOME20',
            discountType: 'PERCENTAGE',
            discountValue: 20,
            minOrderAmount: 500,
            maxDiscountCap: 500,
            isActive: true,
        },
    });
    await prisma.promotion.upsert({
        where: { id: 'promo-freedelivery' },
        update: {},
        create: {
            id: 'promo-freedelivery',
            tenantId: demoTenant.id,
            code: 'FREEDEL',
            discountType: 'FREE_DELIVERY',
            discountValue: 0,
            minOrderAmount: 2000,
            isActive: true,
        },
    });
    console.log('  ✅ Demo categories, menu items, and promotions created');
    console.log('\n🎉 Seed complete!');
    console.log('\n📋 Login Credentials:');
    console.log('  Super Admin:  admin@indolj.com / superadmin123');
    console.log('  Demo Owner:   owner@gourmethaven.pk / owner123');
    console.log('  Demo Tenant:  slug = "demo-restaurant"');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map