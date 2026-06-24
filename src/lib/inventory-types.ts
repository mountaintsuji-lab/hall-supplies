export type SkuSettingRow = {
  hallId: string;
  skuId: string;
  name: string;
  unit: string;
  category: string;
  imageEmoji: string | null;
  parLevel: number;
  currentQty: number;
  version: number;
  pendingQty: number;
};

export type InventoryEventRow = {
  id: string;
  hallId: string;
  skuId: string;
  type: "COUNT" | "ORDER" | "RECEIVE" | "CANCEL";
  countedQty: number;
  parLevel: number;
  orderedQty: number | null;
  status: "REQUESTED" | "RECEIVED" | "CANCELLED" | null;
  createdAt: string;
};

export type HallRow = {
  id: string;
  name: string;
  shortName: string;
};

export type InventoryPageData = {
  halls: HallRow[];
  skuSettings: SkuSettingRow[];
  events: InventoryEventRow[];
};

/** ページ読み込み時のデータソース（バナー表示用） */
export type InventoryPageBanner = "none" | "no-database-url" | "db-error";

export type InventoryPageLoadResult = {
  data: InventoryPageData;
  readOnly: boolean;
  banner: InventoryPageBanner;
};

export function formatEventText(
  event: InventoryEventRow,
  unit: string,
): string {
  switch (event.type) {
    case "COUNT":
      return `現数記録 ${event.countedQty}${unit}`;
    case "ORDER":
      return `${event.orderedQty}${unit} 発注（現数 ${event.countedQty}）`;
    case "RECEIVE":
      return `入庫確定 +${event.orderedQty ?? 0}${unit}（現数 ${event.countedQty}${unit}）`;
    case "CANCEL":
      return `発注取消 ${event.orderedQty ?? 0}${unit}`;
    default:
      return "記録";
  }
}

export function calcOrderQty(
  parLevel: number,
  countedQty: number,
  pendingQty: number,
): number {
  return Math.max(0, parLevel - countedQty - pendingQty);
}
