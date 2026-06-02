-- CreateTable
CREATE TABLE "Hall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Sku" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageEmoji" TEXT
);

-- CreateTable
CREATE TABLE "HallSkuSetting" (
    "hallId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "parLevel" INTEGER NOT NULL,
    "currentQty" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("hallId", "skuId"),
    CONSTRAINT "HallSkuSetting_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "Hall" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HallSkuSetting_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "countedQty" INTEGER NOT NULL,
    "parLevel" INTEGER NOT NULL,
    "orderedQty" INTEGER,
    "status" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryEvent_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "Hall" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryEvent_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "InventoryEvent_hallId_skuId_createdAt_idx" ON "InventoryEvent"("hallId", "skuId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryEvent_hallId_skuId_type_status_idx" ON "InventoryEvent"("hallId", "skuId", "type", "status");
