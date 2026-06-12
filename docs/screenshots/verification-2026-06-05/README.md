# 本番 DB 永続化の検証（2026-06-05）

## 確認結果

| 項目 | 結果 |
|------|------|
| Vercel `DATABASE_URL` | ✅ Production / Preview / Development に設定済み |
| Neon seed | ✅ Hall 3 / Sku 4 / HallSkuSetting 4 / InventoryEvent 3 |
| 閲覧専用バナー | ✅ 非表示（DB 接続あり） |
| 本番 URL | https://hall-supplies.vercel.app |
| 操作 | 山手 × 短寸線香の現数を **12 → 14** に変更（当時は旧式場名） |
| リロード後 | ✅ **14** のまま表示 |

## スクリーンショット

| ファイル | 内容 |
|---------|------|
| `01-before-change.png` | 変更前（現数 12） |
| `02-after-save.png` | 確定直後（現数 14・成功メッセージ） |
| `03-after-reload.png` | ブラウザリロード後（現数 14 が維持） |

## 再実行

```powershell
cd hall-supplies
node scripts/verify-production.mjs
```
