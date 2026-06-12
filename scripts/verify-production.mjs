/**
 * 本番 URL で現数保存 → リロード後も残ることを検証しスクリーンショットを保存する。
 * 使い方: node scripts/verify-production.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "docs", "screenshots", "verification-2026-06-05");
const URL = "https://hall-supplies.vercel.app";
const NEW_QTY = 14;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log("1. 本番を開く...");
  await page.goto(URL, { waitUntil: "networkidle" });

  const readOnlyBanner = page.getByText("閲覧専用");
  if (await readOnlyBanner.isVisible().catch(() => false)) {
    throw new Error("閲覧専用バナーが表示されています。DATABASE_URL 未設定の可能性があります。");
  }

  await page.screenshot({ path: path.join(OUT_DIR, "01-before-change.png"), fullPage: true });
  console.log("   → 01-before-change.png");

  // 操作ペイン（右端）の数字グリッドから選択（短寸線香は初期選択済み）
  const actionPane = page.locator("aside").last();
  console.log(`2. 現数 ${NEW_QTY} をタップして確定...`);
  await actionPane.getByRole("button", { name: String(NEW_QTY), exact: true }).click();
  await page.getByRole("button", { name: "確定" }).click();

  await page.getByText(/記録しました|発注しました/).waitFor({ timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, "02-after-save.png"), fullPage: true });
  console.log("   → 02-after-save.png");

  console.log("3. リロード...");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const pageContent = await page.content();
  const has14 = pageContent.includes(`>${NEW_QTY}<`) || pageContent.includes(`${NEW_QTY}箱`);

  await page.screenshot({ path: path.join(OUT_DIR, "03-after-reload.png"), fullPage: true });
  console.log("   → 03-after-reload.png");

  await browser.close();

  const result = {
    url: URL,
    newQty: NEW_QTY,
    persistedAfterReload: has14,
    screenshots: OUT_DIR,
    timestamp: new Date().toISOString(),
  };

  console.log("\n=== 検証結果 ===");
  console.log(JSON.stringify(result, null, 2));

  if (!has14) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
