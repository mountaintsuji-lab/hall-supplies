export type IndividualItem = {
  id: string;
  hallId: string;
  name: string;
  category: string;
  status: "in_stock" | "away";
  serial?: string;
  purchaseDate?: string;
  maintenanceNote?: string;
  awayReason?: string;
  awayDestination?: string;
  returnDueDate?: string;
  imageEmoji?: string;
};

export const INDIVIDUAL_ITEMS: IndividualItem[] = [
  {
    id: "ind-1",
    hallId: "ichinomiya",
    name: "電子焼香机",
    category: "会場設営",
    status: "away",
    serial: "DK-2021-0042",
    purchaseDate: "2021-06-15",
    maintenanceNote: "2025-11 基板交換済み",
    awayReason: "修理預け",
    awayDestination: "中部機器サービス",
    returnDueDate: "2026-05-10",
    imageEmoji: "🔥",
  },
  {
    id: "ind-2",
    hallId: "ichinomiya",
    name: "演台（黒・可動式）",
    category: "会場設営",
    status: "in_stock",
    serial: "EN-2019-0011",
    purchaseDate: "2019-03-22",
    maintenanceNote: "キャスター交換 2024-08",
    imageEmoji: "🎤",
  },
  {
    id: "ind-3",
    hallId: "minokamo",
    name: "モニター台（32型対応）",
    category: "音響・映像",
    status: "in_stock",
    serial: "MN-2023-0088",
    purchaseDate: "2023-01-10",
    imageEmoji: "🖥️",
  },
  {
    id: "ind-4",
    hallId: "kani",
    name: "焼香台（木製・大）",
    category: "会場設営",
    status: "away",
    serial: "SK-2018-0003",
    purchaseDate: "2018-09-01",
    awayReason: "客先貸出",
    awayDestination: "可児市 A様ご葬儀",
    returnDueDate: "2026-05-25",
    imageEmoji: "⛩️",
  },
];

export const INDIVIDUAL_HISTORY: {
  id: string;
  itemId: string;
  at: string;
  text: string;
}[] = [
  {
    id: "h1",
    itemId: "ind-1",
    at: "2026-05-08 09:12",
    text: "修理預け（中部機器サービス）",
  },
  {
    id: "h2",
    itemId: "ind-1",
    at: "2026-04-20 14:30",
    text: "場内移動 → 音響室",
  },
];
