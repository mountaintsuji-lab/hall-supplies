/** 式場マスタ（ペイン1・DB の Hall と同期） */
export const HALLS = [
  { id: "yamate", name: "山手", shortName: "山手" },
  { id: "maehira", name: "前平", shortName: "前平" },
  { id: "minokamo", name: "美濃加茂", shortName: "美濃加茂" },
  { id: "yaotsu", name: "八百津", shortName: "八百津" },
  { id: "higashikani", name: "東可児", shortName: "東可児" },
  { id: "imawatari", name: "今渡", shortName: "今渡" },
  { id: "nishikani", name: "西可児", shortName: "西可児" },
] as const;

export type HallId = (typeof HALLS)[number]["id"];

/** パイロット運用の式場（SKU 実データ整備の起点） */
export const PILOT_HALL_ID: HallId = "yamate";
