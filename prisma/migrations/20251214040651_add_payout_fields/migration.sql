-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "payoutSettledAt" TIMESTAMP(3),
ADD COLUMN     "payoutSettledBy" TEXT,
ADD COLUMN     "payoutStatus" TEXT NOT NULL DEFAULT 'PENDING';
