import { HALLS, PILOT_HALL_ID } from "@/lib/halls";
import type { InventoryPageData } from "@/lib/inventory-types";

/** Vercel 本番用：build 時 seed と同内容の読み取り専用データ */
export function getFallbackInventoryPageData(): InventoryPageData {
  return {
    halls: HALLS.map((h) => ({ ...h })),
    skuSettings: [
      {
        hallId: PILOT_HALL_ID,
        skuId: "sku-1",
        name: "短寸線香",
        unit: "箱",
        category: "消耗品",
        imageEmoji: "🕯️",
        parLevel: 20,
        currentQty: 12,
        version: 0,
        pendingQty: 10,
      },
      {
        hallId: PILOT_HALL_ID,
        skuId: "sku-2",
        name: "HDMIケーブル（3m）",
        unit: "本",
        category: "音響・映像",
        imageEmoji: "🔌",
        parLevel: 15,
        currentQty: 28,
        version: 0,
        pendingQty: 0,
      },
      {
        hallId: PILOT_HALL_ID,
        skuId: "sku-3",
        name: "会葬御礼ハンドタオル",
        unit: "箱",
        category: "消耗品",
        imageEmoji: "🧻",
        parLevel: 24,
        currentQty: 6,
        version: 0,
        pendingQty: 0,
      },
      {
        hallId: "minokamo",
        skuId: "sku-4",
        name: "短寸線香",
        unit: "箱",
        category: "消耗品",
        imageEmoji: "🕯️",
        parLevel: 20,
        currentQty: 30,
        version: 0,
        pendingQty: 0,
      },
    ],
    events: [
      {
        id: "evt-fallback-1",
        hallId: PILOT_HALL_ID,
        skuId: "sku-1",
        type: "ORDER",
        countedQty: 10,
        parLevel: 20,
        orderedQty: 10,
        status: "REQUESTED",
        createdAt: "2026-05-10T09:00:00.000Z",
      },
      {
        id: "evt-fallback-2",
        hallId: PILOT_HALL_ID,
        skuId: "sku-1",
        type: "COUNT",
        countedQty: 12,
        parLevel: 20,
        orderedQty: null,
        status: null,
        createdAt: "2026-05-12T11:05:00.000Z",
      },
      {
        id: "evt-fallback-3",
        hallId: PILOT_HALL_ID,
        skuId: "sku-3",
        type: "COUNT",
        countedQty: 6,
        parLevel: 24,
        orderedQty: null,
        status: null,
        createdAt: "2026-05-01T16:40:00.000Z",
      },
    ],
  };
}

/** DATABASE_URL 未設定時のみ閲覧専用（Neon 接続後は読み書き可能） */
export function isReadOnlyDeploy(): boolean {
  return !process.env.DATABASE_URL;
}
