-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "deliveryChargeAtPurchase" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "product_listings" ADD COLUMN     "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0;
