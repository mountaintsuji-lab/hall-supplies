import { createHash } from "node:crypto";

/** 式場×カテゴリ×品名から安定した SKU ID を生成（Excel 再取込時の突合に使う） */
export function buildYamateSkuId(category: string, name: string): string {
  const key = `${category}\0${name}`.normalize("NFKC");
  const hash = createHash("sha256").update(key, "utf8").digest("hex").slice(0, 10);
  return `sku-yamate-${hash}`;
}
