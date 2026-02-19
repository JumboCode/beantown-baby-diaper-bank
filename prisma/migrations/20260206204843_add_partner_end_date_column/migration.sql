/*
  Warnings:

  - The `month` column on the `Distributions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[id]` on the table `Yearly Data` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id` to the `Yearly Data` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "status" AS ENUM ('active', 'waitlisted', 'inactive');

-- CreateEnum
CREATE TYPE "month" AS ENUM ('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');

-- DropForeignKey
ALTER TABLE "Distributions" DROP CONSTRAINT "Distributions_city_id_fkey";

-- DropForeignKey
ALTER TABLE "Distributions" DROP CONSTRAINT "Distributions_partner_id_fkey";

-- DropForeignKey
ALTER TABLE "partner_regions" DROP CONSTRAINT "partner_regions_city_id_fkey";

-- DropForeignKey
ALTER TABLE "partner_regions" DROP CONSTRAINT "partner_regions_partner_id_fkey";

-- AlterTable
ALTER TABLE "Distributions" DROP COLUMN "month",
ADD COLUMN     "month" "month" DEFAULT 'January';

-- AlterTable
ALTER TABLE "Partners" ADD COLUMN     "active" BOOLEAN,
ADD COLUMN     "end_partner" DATE,
ADD COLUMN     "status" "status" NOT NULL DEFAULT 'inactive';

-- AlterTable
ALTER TABLE "Yearly Data" ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "Yearly Data_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "partner_regions" ADD COLUMN     "percentage" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Monthly Data" (
    "partner_id" BIGINT NOT NULL,
    "year" TEXT NOT NULL,
    "month" "month" NOT NULL,
    "num_diapers" BIGINT,
    "num_babies" BIGINT,
    "id" UUID NOT NULL,

    CONSTRAINT "Monthly Data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Monthly Data_id_key" ON "Monthly Data"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Yearly Data_id_key" ON "Yearly Data"("id");

-- AddForeignKey
ALTER TABLE "Distributions" ADD CONSTRAINT "Distributions_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "Cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distributions" ADD CONSTRAINT "Distributions_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "Partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_regions" ADD CONSTRAINT "partner_regions_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "Cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_regions" ADD CONSTRAINT "partner_regions_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "Partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Yearly Data" ADD CONSTRAINT "Yearly Data_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "Cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monthly Data" ADD CONSTRAINT "Monthly Data_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "Partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
