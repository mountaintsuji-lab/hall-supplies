# 引き継ぎ — 備品発注・管理ツール「ポチっとな」

> 作業の引き継ぎ用メモ。**仕様の正**は [`requirements-decisions.md`](./requirements-decisions.md) を参照。
>
> 最終更新: 2026-06-02

---

## このファイルの使い方

1. 新しいチャットで開発を続けるとき、最初にこのファイルと `requirements-decisions.md` を読ませる
2. 大きな変更（デプロイ・仕様転換・主要機能の完了）のたびに **§6・§7・§8** を短く更新する
3. 仕様を変えるときは先に **grill-me** で合意 → `requirements-decisions.md` を更新 → 実装

---

## 1. プロジェクト概要

| 項目 | 内容 |
|------|------|
| 製品名 | **備品発注・管理ツール「ポチっとな」**（旧名: 葬祭備品管理 / Hall Supplies） |
| 目的 | 葬儀式場の備品を 4ペインで管理。SKU は現数入力→自動発注、個体は QR 管理 |
| 技術 | Next.js 16 + shadcn/ui + Prisma 7 + SQLite（ローカル） |
| 講義 | AI-Driven School 月次課題。第5・6回の芯は **4ペインUI・GitHub/Vercel 公開**。Prisma/現数発注は **4ヶ月目の先取り** |

---

## 2. パス・URL

| 種別 | 場所 |
|------|------|
| ローカル | `c:\Users\mount\OneDrive\Desktop\src2\hall-supplies\` |
| Git | https://github.com/mountaintsuji-lab/hall-supplies |
| Vercel（閲覧デモ） | https://hall-supplies.vercel.app |
| 図解（講義提出） | https://diagram-hall-supplies-4pane.surge.sh |
| 要件・決定 | `docs/requirements-decisions.md` |
| 図解 HTML（編集元） | 親 `src2` の `.claude/skills/creating-visual-explainers/output/hall-supplies-4pane.html` |

**注意**: 親リポ `src2` の `.gitignore` に `hall-supplies/` が入っている。**Git 操作は `hall-supplies` フォルダ内で行う**。

---

## 3. ローカル開発

```powershell
cd c:\Users\mount\OneDrive\Desktop\src2\hall-supplies
npm install
npm run dev
```

| 環境 | 現数保存 | 備考 |
|------|----------|------|
| ローカル `npm run dev` | ✅ | SQLite + Prisma |
| Vercel 本番 | ❌ | `VERCEL=1` 時は閲覧専用フォールバック |

ビルドコマンド: `prisma generate` → `migrate deploy` → `db seed` → `next build`

---

## 4. コア仕様（要約）

詳細は `requirements-decisions.md` §7・付録A。

- **SKU**: 式場×SKU×現数+定数（`HallSkuSetting`）
- **発注式**: `発注数 = max(0, 定数 - 現数 - 発注中合計)`
- **確定**: 現数上書き + 確認モーダル必須。発注0なら `COUNT` のみ
- **4ペイン**: 式場 → 一覧 → 詳細 → 操作（左→右で細かくなる）
- **個体**: 静的モック（`src/lib/individual-items.ts`）、QR は UI のみ
- **v1 外**: ロケーション別在庫、+/- 入出庫、認証、オフライン

---

## 5. 主要ファイル

| ファイル | 役割 |
|----------|------|
| `src/components/hall-supplies/supplies-main-mockup.tsx` | メイン UI（4ペイン） |
| `src/app/actions/inventory.ts` | `confirmCount` Server Action |
| `src/lib/inventory-queries.ts` | ページデータ取得 |
| `src/lib/inventory-fallback-data.ts` | Vercel 閲覧専用データ |
| `src/lib/individual-items.ts` | 個体の静的データ |
| `prisma/schema.prisma` | DB スキーマ |
| `prisma/seed.ts` | 初期データ |

---

## 6. 実装状況

| 領域 | 状態 |
|------|------|
| 4ペイン UI | ✅ |
| SKU 現数グリッド・確認モーダル | ✅ |
| SKU 詳細（現数/定数/発注中） | ✅ |
| Prisma + SQLite（ローカル） | ✅ |
| `confirmCount` + InventoryEvent | ✅ COUNT / ORDER |
| 個体 | 🔶 静的モック |
| RECEIVE / CANCEL UI | ❌ |
| 認証・権限 | ❌ |
| Vercel 本番での永続化 | ❌ |
| 本番 DB（Postgres 等） | ❌ 未決 |

---

## 7. Git 状態

```
branch: main
ahead of origin/main by 1 commit（0716595 — push 未確認）
未コミット:
  - src/app/layout.tsx（タイトル → ポチっとな）
  - src/components/hall-supplies/supplies-main-mockup.tsx（ブランド名）
```

直近コミット:

- `0716595` docs: 全体決定一覧を更新
- `0048219` Vercel 閲覧専用フォールバック
- `b6333e2` 現数入力ベースの自動発注と Prisma 永続化

---

## 8. 次にやりそうなこと

1. タイトル変更（ポチっとな）を commit + push → Vercel 反映
2. 本番 DB 移行（Neon/Postgres）— Vercel で現数保存を動かすには必須
3. 個体の Prisma 化 + QR スキャン
4. RECEIVE（入庫確定）UI
5. 認証・権限（現場 / 管理）
6. `requirements-decisions.md` の表記を「ポチっとな」に統一

---

## 9. 図解（講義提出）

| SECTION | 内容 |
|---------|------|
| 1 | 実スクリーンショット + 4ペイン説明 |
| 2 | 解決する課題（3視点・高齢者向け直観性） |
| 3 | 工夫①〜④（④=SKUと個体の両方） |
| 4 | 苦戦①欲張りすぎ ②理解不足 |

再デプロイ:

```powershell
Copy-Item "c:\Users\mount\OneDrive\Desktop\src2\.claude\skills\creating-visual-explainers\output\hall-supplies-4pane.html" "c:\Users\mount\OneDrive\Desktop\src2\.claude\skills\creating-visual-explainers\output\diagram-hall-supplies-4pane\index.html" -Force
npx --yes surge "c:\Users\mount\OneDrive\Desktop\src2\.claude\skills\creating-visual-explainers\output\diagram-hall-supplies-4pane" --domain diagram-hall-supplies-4pane.surge.sh
```

---

## 10. 設計上の学び

開発で意識すべき点（図解 SECTION 4 にも記載）:

1. **欲張りすぎ** — 機能を足しすぎて複雑・直観的に使えなくなる
2. **理解不足** — AI の提案を「なんとなく」で進め、思いとの乖離が生じる

→ **何を作らないか** を先に決める。仕様変更は grill-me → `requirements-decisions.md` → 実装。

---

## 11. 新チャットへの依頼例

```
c:\Users\mount\OneDrive\Desktop\src2\hall-supplies の「ポチっとな」を開発続行。
docs/handoff.md と docs/requirements-decisions.md を読んでから [タスク] を実装して。
```
