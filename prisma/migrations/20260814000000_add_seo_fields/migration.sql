-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "seo_description" TEXT,
ADD COLUMN     "seo_no_index" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seo_title" VARCHAR(255);

-- AlterTable
ALTER TABLE "tenant_content" ADD COLUMN     "seo_canonical_override" VARCHAR(255),
ADD COLUMN     "seo_title_template" VARCHAR(100);
