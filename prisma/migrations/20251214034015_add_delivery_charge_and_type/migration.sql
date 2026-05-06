-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "deliveryChargeTypeAtPurchase" TEXT;

-- AlterTable
ALTER TABLE "product_listings" ADD COLUMN     "deliveryChargeType" TEXT NOT NULL DEFAULT 'per_unit';
