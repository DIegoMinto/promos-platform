/*
  Warnings:

  - A unique constraint covering the columns `[cartId,promotionId,fulfillmentType]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CartItem_cartId_promotionId_key";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "fulfillmentType" "FulfillmentType" NOT NULL DEFAULT 'DELIVERY';

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_promotionId_fulfillmentType_key" ON "CartItem"("cartId", "promotionId", "fulfillmentType");
