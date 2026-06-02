import { prisma } from "@/lib/prisma";
import type { InventoryPageData } from "@/lib/inventory-types";

async function pendingQtyByKey(): Promise<Map<string, number>> {
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

export async function getInventoryPageData(): Promise<InventoryPageData> {
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
    pendingQtyByKey(),
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
