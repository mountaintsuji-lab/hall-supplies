"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Maximize2, Minimize2, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  MOCK_ITEMS,
  categoryHealth,
  isReorderCandidate,
  suggestedOrderQty,
  type SupplyItem,
} from "@/lib/inventory-data";

function formatYen(n: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(n);
}

export function FourPaneBoard() {
  const shellRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const syncFullscreen = useCallback(() => {
    setFullscreen(Boolean(document.fullscreenElement));
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, [syncFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    const root = shellRef.current;
    if (!root) return;
    try {
      if (!document.fullscreenElement) {
        await root.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* ブラウザが拒否した場合は無視 */
    }
  }, []);

  const candidates = useMemo(
    () => MOCK_ITEMS.filter(isReorderCandidate),
    [],
  );
  const health = useMemo(() => categoryHealth(MOCK_ITEMS), []);
  const totalReorder = candidates.length;

  const defaultId = candidates[0]?.id ?? MOCK_ITEMS[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(defaultId);

  const selected: SupplyItem | undefined = useMemo(
    () => MOCK_ITEMS.find((i) => i.id === selectedId),
    [selectedId],
  );

  const [draftQty, setDraftQty] = useState(() => {
    const initial = MOCK_ITEMS.find((i) => i.id === defaultId);
    return initial ? String(suggestedOrderQty(initial)) : "0";
  });

  useEffect(() => {
    const row = MOCK_ITEMS.find((i) => i.id === selectedId);
    if (row) setDraftQty(String(suggestedOrderQty(row)));
  }, [selectedId]);

  const qtyNum = Number.parseInt(draftQty, 10);
  const lineTotal =
    selected && Number.isFinite(qtyNum) ? qtyNum * selected.unitPriceYen : 0;

  return (
    <div
      ref={shellRef}
      className="flex min-h-0 flex-1 flex-col bg-muted/30"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b bg-card px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold tracking-tight">
            ホール備品 — 在庫連動・発注
          </h1>
          <p className="text-muted-foreground text-xs">
            左から右へ、全体像 → 候補 → 根拠 → 発注ドラフト
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            aria-pressed={fullscreen}
            onClick={() => void toggleFullscreen()}
          >
            {fullscreen ? (
              <Minimize2 className="size-3.5" aria-hidden />
            ) : (
              <Maximize2 className="size-3.5" aria-hidden />
            )}
            {fullscreen ? "全画面を終了" : "全画面"}
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 divide-y overflow-hidden md:grid-cols-2 md:divide-y-0 md:divide-x lg:grid-cols-4">
        {/* Pane 1: 全体像 */}
        <section className="flex min-h-0 min-w-0 flex-col bg-card">
          <div className="shrink-0 border-b px-3 py-2">
            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
              ペイン 1 · 大きな地図
            </p>
            <p className="text-sm font-medium">在庫の健康状態</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="space-y-3 p-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">要対応サマリ</CardTitle>
                  <CardDescription>
                    発注点を下回っている SKU の件数
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tabular-nums">
                      {totalReorder}
                    </span>
                    <span className="text-muted-foreground text-sm">件</span>
                  </div>
                  {totalReorder > 0 ? (
                    <p className="text-muted-foreground flex items-start gap-2 text-xs">
                      <AlertTriangle
                        className="text-destructive mt-0.5 size-3.5 shrink-0"
                        aria-hidden
                      />
                      右のリストから優先度の高いものから処理できます。
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      現在、発注点を下回っている SKU はありません。
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">カテゴリ別</CardTitle>
                  <CardDescription>SKU 数 / 要発注</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {health.map((h) => (
                    <div
                      key={h.category}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate">{h.category}</span>
                      <span className="text-muted-foreground shrink-0 tabular-nums">
                        {h.skuCount} SKU
                        {h.reorderCount > 0 ? (
                          <Badge variant="destructive" className="ml-2">
                            {h.reorderCount}
                          </Badge>
                        ) : (
                          <span className="ml-2 text-green-600 dark:text-green-400">
                            0
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    全SKU一覧（{MOCK_ITEMS.length} 件）
                  </CardTitle>
                  <CardDescription>
                    全件を表示します。行を選択すると右のペインに詳細を表示します。
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-3">品名</TableHead>
                        <TableHead className="text-right">在庫</TableHead>
                        <TableHead className="pr-3 text-right">発注点</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_ITEMS.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.id === selectedId ? "selected" : undefined}
                          className={cn(
                            "cursor-pointer text-xs",
                            row.id === selectedId && "bg-muted/80",
                          )}
                          onClick={() => setSelectedId(row.id)}
                        >
                          <TableCell className="max-w-[10rem] truncate pl-3 font-medium">
                            {row.name}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.onHand}
                          </TableCell>
                          <TableCell className="pr-3 text-right text-muted-foreground tabular-nums">
                            {row.reorderPoint}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pane 2: 候補リスト */}
        <section className="flex min-h-0 min-w-0 flex-col bg-card">
          <div className="shrink-0 border-b px-3 py-2">
            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
              ペイン 2
            </p>
            <p className="text-sm font-medium">発注候補</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[44%]">品目</TableHead>
                    <TableHead className="text-right">在庫</TableHead>
                    <TableHead className="text-right">発注点</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.id === selectedId ? "selected" : undefined}
                      className={cn(
                        "cursor-pointer",
                        row.id === selectedId && "bg-muted/80",
                      )}
                      onClick={() => setSelectedId(row.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="line-clamp-2">{row.name}</div>
                        <div className="text-muted-foreground mt-0.5 text-xs">
                          {row.sku}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.onHand}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.reorderPoint}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {candidates.length === 0 && (
                <p className="text-muted-foreground p-4 text-center text-sm">
                  候補はありません
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Pane 3: 品目根拠 */}
        <section className="flex min-h-0 min-w-0 flex-col bg-card">
          <div className="shrink-0 border-b px-3 py-2">
            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
              ペイン 3 · 小さな地図
            </p>
            <p className="text-sm font-medium">根拠・属性</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="space-y-4 p-3">
              {selected ? (
                <>
                  <div>
                    <h2 className="text-sm font-semibold leading-snug">
                      {selected.name}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {selected.sku} · {selected.category}
                    </p>
                  </div>
                  <Separator />
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">現在庫</dt>
                    <dd className="text-right font-medium tabular-nums">
                      {selected.onHand}
                    </dd>
                    <dt className="text-muted-foreground">最低在庫</dt>
                    <dd className="text-right tabular-nums">{selected.minStock}</dd>
                    <dt className="text-muted-foreground">発注点</dt>
                    <dd className="text-right tabular-nums">
                      {selected.reorderPoint}
                    </dd>
                    <dt className="text-muted-foreground">発注単位</dt>
                    <dd className="text-right tabular-nums">{selected.orderUnit}</dd>
                    <dt className="text-muted-foreground">標準単価</dt>
                    <dd className="text-right tabular-nums">
                      {formatYen(selected.unitPriceYen)}
                    </dd>
                    <dt className="text-muted-foreground">納期目安</dt>
                    <dd className="text-right tabular-nums">
                      {selected.leadTimeDays} 日
                    </dd>
                    <dt className="text-muted-foreground">直近入庫</dt>
                    <dd className="text-right text-xs tabular-nums">
                      {selected.lastReceivedAt}
                    </dd>
                    <dt className="text-muted-foreground">発注先</dt>
                    <dd className="text-right text-xs leading-snug">
                      {selected.supplier}
                    </dd>
                  </dl>
                  <Separator />
                  <div className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
                    <span className="font-medium">推奨発注数量（自動）</span>
                    ：最低在庫の2倍まで埋める想定で、発注単位に切り上げています。
                    実運用では季節変動や式件数を足すと精度が上がります。
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  左のリストで品目を選択してください。
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Pane 4: 発注ドラフト */}
        <section className="flex min-h-0 min-w-0 flex-col bg-card">
          <div className="shrink-0 border-b px-3 py-2">
            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
              ペイン 4
            </p>
            <p className="text-sm font-medium">発注ドラフト</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="space-y-4 p-3">
              {selected ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="qty">発注数量</Label>
                    <Input
                      id="qty"
                      inputMode="numeric"
                      className="tabular-nums"
                      value={draftQty}
                      onChange={(e) => setDraftQty(e.target.value)}
                    />
                    <p className="text-muted-foreground text-xs">
                      発注単位 {selected.orderUnit} の倍数にすると現場と齟齬が減ります。
                    </p>
                  </div>
                  <div className="rounded-md border p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">行金額（概算）</span>
                      <span className="font-medium tabular-nums">
                        {formatYen(Number.isFinite(qtyNum) ? lineTotal : 0)}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Truck className="size-3.5 shrink-0" aria-hidden />
                      {selected.supplier} · 納期 {selected.leadTimeDays} 日
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button type="button">発注依頼を下書き保存</Button>
                    <Button type="button" variant="outline">
                      メール文案をコピー
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">品目未選択</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
