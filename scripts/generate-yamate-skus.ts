/**
 * 山手ホール.xlsm から消耗品 SKU 一覧を生成し src/data/yamate-skus.ts に書き出す。
 *
 * 使い方:
 *   npx tsx scripts/generate-yamate-skus.ts "C:\Users\mount\OneDrive\Desktop\山手ホール.xlsm"
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseYamateExcelFile } from "../src/lib/yamate/parse-excel";

const excelPath = process.argv[2] ?? "C:/Users/mount/OneDrive/Desktop/山手ホール.xlsm";
const outPath = resolve(__dirname, "../src/data/yamate-skus.ts");

const skus = parseYamateExcelFile(excelPath);

const content = `/** 自動生成: scripts/generate-yamate-skus.ts — 手編集しない */
import type { ParsedYamateSku } from "@/lib/yamate/parse-excel";

export const YAMATE_SKUS: ParsedYamateSku[] = ${JSON.stringify(skus, null, 2)} as const;

export const YAMATE_SKU_COUNT = ${skus.length};
`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, content, "utf8");
console.log(`Wrote ${skus.length} SKUs to ${outPath}`);
