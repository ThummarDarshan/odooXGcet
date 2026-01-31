-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "status" "ContactStatus" NOT NULL DEFAULT 'DRAFT';
