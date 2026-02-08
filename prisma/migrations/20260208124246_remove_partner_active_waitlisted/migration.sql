-- AlterTable
ALTER TABLE "Monthly Data" ALTER COLUMN "partner_id" DROP DEFAULT,
ALTER COLUMN "id" DROP DEFAULT;

-- Data Migration
UPDATE "Partners" SET "status" = 'active' WHERE "active" = true;
UPDATE "Partners" SET "status" = 'waitlisted' WHERE "waitlisted" = true AND "active" IS NOT true;
UPDATE "Partners" SET "status" = 'inactive' WHERE "active" IS NOT true AND "waitlisted" IS NOT true;

-- AlterTable
ALTER TABLE "Partners" DROP COLUMN "active",
DROP COLUMN "waitlisted";

