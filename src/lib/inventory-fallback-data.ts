import { YAMATE_SKUS } from "@/data/yamate-skus";
import { HALLS, PILOT_HALL_ID } from "@/lib/halls";
import type { InventoryPageData } from "@/lib/inventory-types";

/** Vercel 本番用：DB 障害時の読み取り専用データ（山手消耗品マスタと同期） */
export function getFallbackInventoryPageData(): InventoryPageData {
  return {
    halls: HALLS.map((h) => ({ ...h })),
    skuSettings: YAMATE_SKUS.map((sku) => ({
      hallId: PILOT_HALL_ID,
      skuId: sku.id,
      name: sku.name,
      unit: sku.unit,
      category: sku.category,
      imageEmoji: sku.imageEmoji,
      parLevel: sku.parLevel,
      currentQty: 0,
      version: 0,
      pendingQty: 0,
    })),
    events: [],
  };
}

/** DATABASE_URL 未設定時のみ閲覧専用（Neon 接続後は読み書き可能） */
export function isReadOnlyDeploy(): boolean {
  return !process.env.DATABASE_URL;
}
