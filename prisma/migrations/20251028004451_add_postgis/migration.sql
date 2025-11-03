-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateTable
CREATE TABLE "Cities" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "boundary" geography,
    "centroid" geography,

    CONSTRAINT "Regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distributions" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partner_id" BIGINT,
    "city_id" BIGINT,
    "year" TEXT,
    "month" TEXT,
    "number_diapers" BIGINT,
    "number_children" BIGINT,
    "percentage" DOUBLE PRECISION,

    CONSTRAINT "Distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partners" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "description" TEXT,
    "start_partner" DATE,
    "waitlisted" BOOLEAN,
    "address" TEXT,
    "coords" JSON,
    "logo_url" TEXT,

    CONSTRAINT "Partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_regions" (
    "partner_id" BIGINT NOT NULL,
    "city_id" BIGINT NOT NULL,

    CONSTRAINT "partner_regions_pkey" PRIMARY KEY ("partner_id","city_id")
);

-- CreateTable
CREATE TABLE "Yearly Data" (
    "city_id" BIGSERIAL NOT NULL,
    "year" TEXT NOT NULL,
    "num_diapers" BIGINT,
    "num_babies" BIGINT
);

-- AddForeignKey
ALTER TABLE "Distributions" ADD CONSTRAINT "Distributions_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "Cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Distributions" ADD CONSTRAINT "Distributions_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "Partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "partner_regions" ADD CONSTRAINT "partner_regions_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "Cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "partner_regions" ADD CONSTRAINT "partner_regions_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "Partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
