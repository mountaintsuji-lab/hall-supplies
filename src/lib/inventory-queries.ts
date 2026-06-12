import type {
  InventoryPageData,
  InventoryPageLoadResult,
} from "@/lib/inventory-types";
import {
  getFallbackInventoryPageData,
  isReadOnlyDeploy,
} from "@/lib/inventory-fallback-data";

async function pendingQtyByKey(
  prisma: typeof import("@/lib/prisma").prisma,
): Promise<Map<string, number>> {
  const aggregates = await prisma.inventoryEvent.groupBy({
    by: ["hallId", "skuId"],
    where: { type: "ORDER", status: "REQUESTED" },
    _sum: { orderedQty: true },
  });

  const map = new Map<string, number>();
  for (const row of aggregates) {
    map.set(`${row.hallId}:${row.skuId}`, row._sum.orderedQty ?? 0);
  }
  return map;
}

async function loadFromDatabase(): Promise<InventoryPageData> {
  const { prisma } = await import("@/lib/prisma");
  const [halls, settings, events, pendingMap] = await Promise.all([
    prisma.hall.findMany({ orderBy: { id: "asc" } }),
    prisma.hallSkuSetting.findMany({
      include: { sku: true },
      orderBy: [{ hallId: "asc" }, { skuId: "asc" }],
    }),
    prisma.inventoryEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    pendingQtyByKey(prisma),
  ]);

  return {
    halls,
    skuSettings: settings.map((s) => ({
      hallId: s.hallId,
      skuId: s.skuId,
      name: s.sku.name,
      unit: s.sku.unit,
      category: s.sku.category,
      imageEmoji: s.sku.imageEmoji,
      parLevel: s.parLevel,
      currentQty: s.currentQty,
      version: s.version,
      pendingQty: pendingMap.get(`${s.hallId}:${s.skuId}`) ?? 0,
    })),
    events: events.map((e) => ({
      id: e.id,
      hallId: e.hallId,
      skuId: e.skuId,
      type: e.type,
      countedQty: e.countedQty,
      parLevel: e.parLevel,
      orderedQty: e.orderedQty,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

export async function getInventoryPageData(): Promise<InventoryPageLoadResult> {
  if (isReadOnlyDeploy()) {
    return {
      data: getFallbackInventoryPageData(),
      readOnly: true,
      banner: "no-database-url",
    };
  }

  try {
    return {
      data: await loadFromDatabase(),
      readOnly: false,
      banner: "none",
    };
  } catch (error) {
    console.error("DB unavailable, using fallback data:", error);
    return {
      data: getFallbackInventoryPageData(),
      readOnly: true,
      banner: "db-error",
    };
  }
}
