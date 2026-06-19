import * as XLSX from "xlsx";
import { buildYamateSkuId } from "./sku-id";

/** 仮定数（B案）。Excel「数」列が埋まったら import-par-levels で一括差し替え */
export const DEFAULT_PAR_LEVEL = 10;

const BLOCKS = [
  { cat: 0, name: 1, sel: 3, qty: 4 },
  { cat: 5, name: 6, sel: 8, qty: 9 },
  { cat: 10, name: 11, sel: 13, qty: 14 },
  { cat: 15, name: 16, sel: 17, qty: 18 },
] as const;

const SKIP_NAMES = new Set([
  "品名",
  "名称（単位）",
  "子供用",
  "大人用（大）",
  "大人用 （小）",
  "スプーン",
  "フォーク",
  "大",
  "小",
]);

export type ParsedYamateSku = {
  id: string;
  name: string;
  unit: string;
  category: string;
  parLevel: number;
  imageEmoji: string | null;
};

function inferUnit(name: string, variant: string): string {
  const text = `${name} ${variant}`;
  if (/箱|（５箱）|箱入り/.test(text)) return "箱";
  if (/セット/.test(text)) return "セット";
  if (/巻|ロール/.test(text)) return "巻";
  if (/本|ペン|はし|箸/.test(text)) return "本";
  if (/袋|レジ袋|ゴミ袋/.test(text)) return "袋";
  if (/詰替|詰め替え/.test(text)) return "袋";
  if (/電池/.test(text)) return "個";
  if (/ℓ|リットル/.test(text)) return "本";
  return "個";
}

function categoryEmoji(category: string): string | null {
  if (category.includes("トイレ")) return "🚽";
  if (category.includes("キッチン")) return "🍽️";
  if (category.includes("事務")) return "📎";
  if (category.includes("ユニマット")) return "☕";
  if (category.includes("バス")) return "🛁";
  if (category.includes("洗濯")) return "🧺";
  if (category.includes("掃除")) return "🧹";
  if (category.includes("着付け")) return "👘";
  if (category.includes("乾電池")) return "🔋";
  if (category.includes("お寺") || category.includes("お茶")) return "🍵";
  if (category === "その他") return "📦";
  return null;
}

function parseParLevel(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const n = Number.parseInt(text, 10);
  return Number.isNaN(n) ? null : n;
}

function shouldSkipName(name: string): boolean {
  if (!name || name.length < 2) return true;
  if (SKIP_NAMES.has(name)) return true;
  if (/^[0-9]+$/.test(name)) return true;
  return false;
}

export function parseYamateConsumablesSheet(
  workbook: XLSX.WorkBook,
  defaultParLevel = DEFAULT_PAR_LEVEL,
): ParsedYamateSku[] {
  const sheet = workbook.Sheets["消耗品"];
  if (!sheet) {
    throw new Error('シート「消耗品」が見つかりません');
  }

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
  const items: ParsedYamateSku[] = [];
  const categoryByBlock = new Map<number, string>();

  for (let r = 2; r < data.length; r++) {
    const row = data[r];
    if (!row) continue;

    for (const block of BLOCKS) {
      const catCell = String(row[block.cat] ?? "").trim();
      const baseName = String(row[block.name] ?? "").trim();
      const variant = String(row[block.sel] ?? "").trim();
      const parFromSheet = parseParLevel(row[block.qty]);

      if (catCell && baseName) {
        categoryByBlock.set(block.cat, catCell);
      } else if (catCell && !baseName) {
        categoryByBlock.set(block.cat, catCell);
      }

      if (shouldSkipName(baseName)) continue;

      const category = categoryByBlock.get(block.cat) ?? catCell;
      if (!category) continue;

      const name = variant ? `${baseName}（${variant}）` : baseName;
      const id = buildYamateSkuId(category, name);

      items.push({
        id,
        name,
        unit: inferUnit(baseName, variant),
        category,
        parLevel: parFromSheet ?? defaultParLevel,
        imageEmoji: categoryEmoji(category),
      });
    }
  }

  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function parseYamateExcelFile(
  filePath: string,
  defaultParLevel = DEFAULT_PAR_LEVEL,
): ParsedYamateSku[] {
  const workbook = XLSX.readFile(filePath);
  return parseYamateConsumablesSheet(workbook, defaultParLevel);
}

export type ParLevelUpdate = {
  id: string;
  name: string;
  category: string;
  parLevel: number;
};

/** Excel「数」列のみ読み取り（既存 SKU への一括 parLevel 更新用） */
export function parseYamateParLevelsFromExcel(
  filePath: string,
): ParLevelUpdate[] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets["消耗品"];
  if (!sheet) {
    throw new Error('シート「消耗品」が見つかりません');
  }

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
  const updates: ParLevelUpdate[] = [];
  const categoryByBlock = new Map<number, string>();

  for (let r = 2; r < data.length; r++) {
    const row = data[r];
    if (!row) continue;

    for (const block of BLOCKS) {
      const catCell = String(row[block.cat] ?? "").trim();
      const baseName = String(row[block.name] ?? "").trim();
      const variant = String(row[block.sel] ?? "").trim();
      const parLevel = parseParLevel(row[block.qty]);

      if (catCell && baseName) categoryByBlock.set(block.cat, catCell);
      else if (catCell) categoryByBlock.set(block.cat, catCell);

      if (shouldSkipName(baseName) || parLevel == null) continue;

      const category = categoryByBlock.get(block.cat) ?? catCell;
      if (!category) continue;

      const name = variant ? `${baseName}（${variant}）` : baseName;
      updates.push({
        id: buildYamateSkuId(category, name),
        name,
        category,
        parLevel,
      });
    }
  }

  const seen = new Set<string>();
  return updates.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
