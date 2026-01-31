/*
  Warnings:

  - The values [PORTAL_USER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `cost_price` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `unit_price` on the `products` table. All the data in the column will be lost.
  - Added the required column `sell_price` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'CUSTOMER');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "tag_id" TEXT;

-- AlterTable
ALTER TABLE "customer_invoice_items" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "products" DROP COLUMN "cost_price",
DROP COLUMN "unit_price",
ADD COLUMN     "purchase_price" DECIMAL(15,2),
ADD COLUMN     "sell_price" DECIMAL(15,2) NOT NULL;

-- AlterTable
ALTER TABLE "purchase_order_items" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "sales_order_items" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "vendor_bill_items" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(15,2);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_analytical_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "analytical_account_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_category" TEXT,
    "contact_id" TEXT,
    "contact_tag_id" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_analytical_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_analytical_rules" ADD CONSTRAINT "auto_analytical_rules_analytical_account_id_fkey" FOREIGN KEY ("analytical_account_id") REFERENCES "analytical_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_analytical_rules" ADD CONSTRAINT "auto_analytical_rules_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_analytical_rules" ADD CONSTRAINT "auto_analytical_rules_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_analytical_rules" ADD CONSTRAINT "auto_analytical_rules_contact_tag_id_fkey" FOREIGN KEY ("contact_tag_id") REFERENCES "tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;
