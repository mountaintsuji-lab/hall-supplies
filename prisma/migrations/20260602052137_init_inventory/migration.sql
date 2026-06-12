-- CreateEnum
CREATE TYPE "InventoryEventType" AS ENUM ('COUNT', 'ORDER', 'RECEIVE', 'CANCEL');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('REQUESTED', 'RECEIVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Hall" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,

    CONSTRAINT "Hall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sku" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageEmoji" TEXT,

    CONSTRAINT "Sku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HallSkuSetting" (
    "hallId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "parLevel" INTEGER NOT NULL,
    "currentQty" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HallSkuSetting_pkey" PRIMARY KEY ("hallId","skuId")
);

-- CreateTable
CREATE TABLE "InventoryEvent" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "type" "InventoryEventType" NOT NULL,
    "countedQty" INTEGER NOT NULL,
    "parLevel" INTEGER NOT NULL,
    "orderedQty" INTEGER,
    "status" "OrderStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryEvent_hallId_skuId_createdAt_idx" ON "InventoryEvent"("hallId", "skuId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryEvent_hallId_skuId_type_status_idx" ON "InventoryEvent"("hallId", "skuId", "type", "status");

-- AddForeignKey
ALTER TABLE "HallSkuSetting" ADD CONSTRAINT "HallSkuSetting_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "Hall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallSkuSetting" ADD CONSTRAINT "HallSkuSetting_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryEvent" ADD CONSTRAINT "InventoryEvent_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "Hall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryEvent" ADD CONSTRAINT "InventoryEvent_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
