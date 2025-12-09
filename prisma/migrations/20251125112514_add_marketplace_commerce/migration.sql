-- AlterTable
ALTER TABLE "product_listings" ADD COLUMN     "harvestDate" TIMESTAMP(3),
ADD COLUMN     "minOrderQuantity" DOUBLE PRECISION,
ADD COLUMN     "qualityGrade" TEXT,
ADD COLUMN     "shelfLife" TEXT,
ADD COLUMN     "variety" TEXT,
ADD COLUMN     "whatsappNumber" TEXT;
