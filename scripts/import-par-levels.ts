/**
 * Excel「数」列から定数（parLevel）だけ一括更新する。
 * 棚卸・発注履歴は消さない。
 *
 * 使い方:
 *   npx tsx scripts/import-par-levels.ts "C:\Users\mount\OneDrive\Desktop\山手ホール.xlsm"
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { PILOT_HALL_ID } from "../src/lib/halls";
import { parseYamateParLevelsFromExcel } from "../src/lib/yamate/parse-excel";

const excelPath = process.argv[2];
if (!excelPath) {
  console.error("Usage: npx tsx scripts/import-par-levels.ts <path-to-山手ホール.xlsm>");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const updates = parseYamateParLevelsFromExcel(excelPath);
  if (updates.length === 0) {
    console.log("Excel に有効な「数」がありません。列を埋めてから再実行してください。");
    return;
  }

  let updated = 0;
  let missing = 0;

  for (const row of updates) {
    const result = await prisma.hallSkuSetting.updateMany({
      where: { hallId: PILOT_HALL_ID, skuId: row.id },
      data: { parLevel: row.parLevel },
    });
    if (result.count > 0) {
      updated += 1;
    } else {
      missing += 1;
      console.warn(`未登録 SKU: ${row.category} / ${row.name} (${row.id})`);
    }
  }

  console.log(`定数更新: ${updated} 件 / Excel 有効行 ${updates.length} 件 / 未登録 ${missing} 件`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
