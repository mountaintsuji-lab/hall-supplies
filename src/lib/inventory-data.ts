export type SupplyCategory =
  | "会場設営"
  | "布・装飾"
  | "消耗品"
  | "音響・映像";

export type SupplyItem = {
  id: string;
  name: string;
  sku: string;
  category: SupplyCategory;
  onHand: number;
  minStock: number;
  reorderPoint: number;
  orderUnit: number;
  supplier: string;
  unitPriceYen: number;
  leadTimeDays: number;
  lastReceivedAt: string;
};

export const MOCK_ITEMS: SupplyItem[] = [
  {
    id: "1",
    name: "会葬御礼ハンドタオル（箱）",
    sku: "CNV-TWL-01",
    category: "消耗品",
    onHand: 8,
    minStock: 24,
    reorderPoint: 30,
    orderUnit: 12,
    supplier: "中部ギフト商事",
    unitPriceYen: 4200,
    leadTimeDays: 5,
    lastReceivedAt: "2026-04-28",
  },
  {
    id: "2",
    name: "献花台カバー（黒・L）",
    sku: "FAB-CVR-L",
    category: "布・装飾",
    onHand: 2,
    minStock: 4,
    reorderPoint: 5,
    orderUnit: 1,
    supplier: "京染織",
    unitPriceYen: 12800,
    leadTimeDays: 14,
    lastReceivedAt: "2026-03-02",
  },
  {
    id: "3",
    name: "マイク用単三電池",
    sku: "AV-BAT-AA",
    category: "音響・映像",
    onHand: 40,
    minStock: 48,
    reorderPoint: 60,
    orderUnit: 20,
    supplier: "電材プロ",
    unitPriceYen: 980,
    leadTimeDays: 2,
    lastReceivedAt: "2026-05-10",
  },
  {
    id: "4",
    name: "折りたたみ椅子（黒）",
    sku: "VEN-CHR-BK",
    category: "会場設営",
    onHand: 120,
    minStock: 80,
    reorderPoint: 100,
    orderUnit: 10,
    supplier: "イベント機材レンタル",
    unitPriceYen: 6200,
    leadTimeDays: 7,
    lastReceivedAt: "2026-01-15",
  },
  {
    id: "5",
    name: "焼香セット（紙箱）",
    sku: "CNV-KOU-10",
    category: "消耗品",
    onHand: 0,
    minStock: 20,
    reorderPoint: 24,
    orderUnit: 10,
    supplier: "仏壇堂ネットワーク",
    unitPriceYen: 3500,
    leadTimeDays: 3,
    lastReceivedAt: "2026-02-20",
  },
  {
    id: "6",
    name: "司会台用クリップライト",
    sku: "AV-LGT-01",
    category: "音響・映像",
    onHand: 3,
    minStock: 6,
    reorderPoint: 6,
    orderUnit: 1,
    supplier: "電材プロ",
    unitPriceYen: 4500,
    leadTimeDays: 2,
    lastReceivedAt: "2026-04-01",
  },
];

export function isReorderCandidate(item: SupplyItem): boolean {
  return item.onHand <= item.reorderPoint;
}

export function suggestedOrderQty(item: SupplyItem): number {
  const deficit = Math.max(0, item.minStock * 2 - item.onHand);
  if (deficit <= 0) return item.orderUnit;
  const packs = Math.ceil(deficit / item.orderUnit);
  return packs * item.orderUnit;
}

export type CategoryHealth = {
  category: SupplyCategory;
  skuCount: number;
  reorderCount: number;
};

export function categoryHealth(items: SupplyItem[]): CategoryHealth[] {
  const cats: SupplyCategory[] = [
    "会場設営",
    "布・装飾",
    "消耗品",
    "音響・映像",
  ];
  return cats.map((category) => {
    const inCat = items.filter((i) => i.category === category);
    const reorderCount = inCat.filter(isReorderCandidate).length;
    return {
      category,
      skuCount: inCat.length,
      reorderCount,
    };
  });
}
