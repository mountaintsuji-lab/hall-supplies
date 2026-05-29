"use client";

import { Fragment, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  ChevronDown,
  ChevronRight,
  History,
  Minus,
  Package,
  Plus,
  QrCode,
  SlidersHorizontal,
  X,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

/* ── ダミーデータ（このファイル内に完結） ── */

type Hall = { id: string; name: string; shortName: string };

type SkuLocation = { id: string; name: string; qty: number; unit: string };

type ItemKind = "individual" | "sku";

type SupplyItem = {
  id: string;
  hallId: string;
  name: string;
  kind: ItemKind;
  category: string;
  status: "in_stock" | "away";
  totalQty?: number;
  minThreshold?: number;
  locations?: SkuLocation[];
  serial?: string;
  purchaseDate?: string;
  maintenanceNote?: string;
  awayReason?: string;
  awayDestination?: string;
  returnDueDate?: string;
  imageEmoji?: string;
};

const HALLS: Hall[] = [
  { id: "ichinomiya", name: "一宮斎場", shortName: "一宮" },
  { id: "minokamo", name: "美濃加茂斎場", shortName: "美濃加茂" },
  { id: "kani", name: "可児斎場", shortName: "可児" },
];

const INITIAL_ITEMS: SupplyItem[] = [
  {
    id: "sku-1",
    hallId: "ichinomiya",
    name: "短寸線香",
    kind: "sku",
    category: "消耗品",
    status: "in_stock",
    totalQty: 12,
    minThreshold: 20,
    imageEmoji: "🕯️",
    locations: [
      { id: "loc-a", name: "3階倉庫", qty: 10, unit: "箱" },
      { id: "loc-b", name: "1階作業室", qty: 2, unit: "箱" },
    ],
  },
  {
    id: "ind-1",
    hallId: "ichinomiya",
    name: "電子焼香机",
    kind: "individual",
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
    kind: "individual",
    category: "会場設営",
    status: "in_stock",
    serial: "EN-2019-0011",
    purchaseDate: "2019-03-22",
    maintenanceNote: "キャスター交換 2024-08",
    imageEmoji: "🎤",
  },
  {
    id: "sku-2",
    hallId: "ichinomiya",
    name: "HDMIケーブル（3m）",
    kind: "sku",
    category: "音響・映像",
    status: "in_stock",
    totalQty: 28,
    minThreshold: 15,
    imageEmoji: "🔌",
    locations: [
      { id: "loc-c", name: "音響室", qty: 18, unit: "本" },
      { id: "loc-d", name: "2階倉庫", qty: 10, unit: "本" },
    ],
  },
  {
    id: "sku-3",
    hallId: "ichinomiya",
    name: "会葬御礼ハンドタオル",
    kind: "sku",
    category: "消耗品",
    status: "in_stock",
    totalQty: 6,
    minThreshold: 24,
    imageEmoji: "🧻",
    locations: [{ id: "loc-e", name: "1階備品庫", qty: 6, unit: "箱" }],
  },
  {
    id: "ind-3",
    hallId: "minokamo",
    name: "モニター台（32型対応）",
    kind: "individual",
    category: "音響・映像",
    status: "in_stock",
    serial: "MN-2023-0088",
    purchaseDate: "2023-01-10",
    imageEmoji: "🖥️",
  },
  {
    id: "sku-4",
    hallId: "minokamo",
    name: "短寸線香",
    kind: "sku",
    category: "消耗品",
    status: "in_stock",
    totalQty: 30,
    minThreshold: 20,
    imageEmoji: "🕯️",
    locations: [
      { id: "loc-f", name: "地下倉庫", qty: 22, unit: "箱" },
      { id: "loc-g", name: "作業室", qty: 8, unit: "箱" },
    ],
  },
  {
    id: "ind-4",
    hallId: "kani",
    name: "焼香台（木製・大）",
    kind: "individual",
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

type HistoryEntry = {
  id: string;
  itemId: string;
  at: string;
  text: string;
};

const MOCK_HISTORY: HistoryEntry[] = [
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
  {
    id: "h3",
    itemId: "sku-1",
    at: "2026-05-12 11:05",
    text: "1階作業室 +2箱（入庫）",
  },
  {
    id: "h4",
    itemId: "sku-3",
    at: "2026-05-01 16:40",
    text: "出庫 -4箱（会葬御礼用）",
  },
];

/* ── ヘルパー ── */

function isShortage(item: SupplyItem, qtyMap: Record<string, number>): boolean {
  if (item.kind !== "sku") return false;
  const total = qtyMap[item.id] ?? item.totalQty ?? 0;
  return total < (item.minThreshold ?? 0);
}

function isOverdue(item: SupplyItem): boolean {
  if (!item.returnDueDate || item.status !== "away") return false;
  const due = new Date(item.returnDueDate);
  const today = new Date("2026-05-20");
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return iso.replace(/-/g, "/");
}

function sumLocations(
  item: SupplyItem,
  qtyMap: Record<string, number>,
): number {
  if (item.kind !== "sku") return 0;
  const base = item.locations ?? [];
  const delta = qtyMap[item.id] ?? 0;
  const baseTotal = base.reduce((s, l) => s + l.qty, 0);
  return baseTotal + delta;
}

/* ── インライン UI（1ファイル完結のため） ── */

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors",
          checked
            ? "border-slate-700 bg-slate-800"
            : "border-slate-300 bg-slate-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </button>
      <span className="font-medium text-slate-700">{label}</span>
    </label>
  );
}

function Modal({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ── メイン ── */

export function SuppliesMainMockup() {
  const [selectedHallId, setSelectedHallId] = useState(HALLS[0].id);
  const [selectedItemId, setSelectedItemId] = useState("sku-1");
  const [expandedSkuId, setExpandedSkuId] = useState<string | null>("sku-1");
  const [shortageOnly, setShortageOnly] = useState(false);
  const [qtyDelta, setQtyDelta] = useState<Record<string, number>>({});
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState(HALLS[1].id);
  const [adjustQty, setAdjustQty] = useState("0");
  const [adjustReason, setAdjustReason] = useState("");

  const hallItems = useMemo(
    () => INITIAL_ITEMS.filter((i) => i.hallId === selectedHallId),
    [selectedHallId],
  );

  const visibleItems = useMemo(() => {
    if (!shortageOnly) return hallItems;
    return hallItems.filter((item) => isShortage(item, qtyDelta));
  }, [hallItems, shortageOnly, qtyDelta]);

  const selectedItem = useMemo(
    () =>
      INITIAL_ITEMS.find((i) => i.id === selectedItemId) ??
      visibleItems[0] ??
      hallItems[0],
    [selectedItemId, visibleItems, hallItems],
  );

  const itemHistory = useMemo(
    () =>
      selectedItem
        ? MOCK_HISTORY.filter((h) => h.itemId === selectedItem.id)
        : [],
    [selectedItem],
  );

  const selectedTotalQty = selectedItem
    ? sumLocations(selectedItem, qtyDelta)
    : 0;

  function selectHall(id: string) {
    setSelectedHallId(id);
    const first = INITIAL_ITEMS.find((i) => i.hallId === id);
    if (first) {
      setSelectedItemId(first.id);
      setExpandedSkuId(first.kind === "sku" ? first.id : null);
    }
  }

  function selectItem(item: SupplyItem) {
    setSelectedItemId(item.id);
    if (item.kind === "sku") {
      setExpandedSkuId((prev) => (prev === item.id ? null : item.id));
    } else {
      setExpandedSkuId(null);
    }
  }

  function adjustSkuQty(delta: number) {
    if (!selectedItem || selectedItem.kind !== "sku") return;
    setQtyDelta((prev) => ({
      ...prev,
      [selectedItem.id]: (prev[selectedItem.id] ?? 0) + delta,
    }));
  }

  function handleScanStart() {
    setScanMessage("カメラ起動（モック）— QRを読み取ってください");
    window.setTimeout(() => setScanMessage(null), 3200);
  }

  function handleAdjustConfirm() {
    const n = Number.parseInt(adjustQty, 10);
    if (!selectedItem || selectedItem.kind !== "sku" || Number.isNaN(n)) return;
    setQtyDelta((prev) => ({
      ...prev,
      [selectedItem.id]: (prev[selectedItem.id] ?? 0) + n,
    }));
    setAdjustOpen(false);
    setAdjustQty("0");
    setAdjustReason("");
  }

  const selectedHall = HALLS.find((h) => h.id === selectedHallId)!;
  const overdue = selectedItem ? isOverdue(selectedItem) : false;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900">
      {/* ペイン1: 拠点 — 256px */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-100">
        <div className="border-b border-slate-800 px-4 py-5">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-slate-300" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Hall Supplies
              </p>
              <h1 className="text-sm font-semibold text-white">拠点選択</h1>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-1">
            {HALLS.map((hall) => {
              const active = hall.id === selectedHallId;
              const count = INITIAL_ITEMS.filter(
                (i) => i.hallId === hall.id,
              ).length;
              return (
                <li key={hall.id}>
                  <button
                    type="button"
                    onClick={() => selectHall(hall.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      active
                        ? "bg-white/10 font-semibold text-white ring-1 ring-white/20"
                        : "text-slate-300 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <span>{hall.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs tabular-nums",
                        active
                          ? "bg-white/15 text-slate-100"
                          : "bg-slate-800 text-slate-400",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-slate-800 px-4 py-3 text-xs text-slate-500">
          モックアップ · v0.1
        </div>
      </aside>

      {/* ペイン2: 備品一覧 — 384px */}
      <section className="flex w-96 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="shrink-0 border-b border-slate-100 px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                備品一覧
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">{selectedHall.name}</p>
            </div>
            <Badge variant="secondary" className="shrink-0 tabular-nums">
              {visibleItems.length} 件
            </Badge>
          </div>
          <div className="mt-3">
            <ToggleSwitch
              checked={shortageOnly}
              onChange={setShortageOnly}
              label="⚠️ 在庫不足のみ表示"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <Package className="size-8 text-slate-300" />
              <p className="text-sm text-slate-500">
                在庫不足の備品はありません
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur-sm">
                <tr className="text-left text-xs font-medium text-slate-500">
                  <th className="px-4 py-2.5 font-medium">名称</th>
                  <th className="px-2 py-2.5 font-medium">種別</th>
                  <th className="px-3 py-2.5 text-right font-medium">数量</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => {
                  const active = item.id === selectedItemId;
                  const expanded = expandedSkuId === item.id;
                  const shortage = isShortage(item, qtyDelta);
                  const total =
                    item.kind === "sku"
                      ? sumLocations(item, qtyDelta)
                      : undefined;

                  return (
                    <Fragment key={item.id}>
                      <tr
                        onClick={() => selectItem(item)}
                        className={cn(
                          "cursor-pointer border-b border-slate-50 transition-colors",
                          active
                            ? "bg-slate-100/80"
                            : "hover:bg-slate-50",
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {item.kind === "sku" ? (
                              expanded ? (
                                <ChevronDown className="size-3.5 shrink-0 text-slate-400" />
                              ) : (
                                <ChevronRight className="size-3.5 shrink-0 text-slate-400" />
                              )
                            ) : (
                              <span className="inline-block size-3.5 shrink-0" />
                            )}
                            <span className="font-medium text-slate-900">
                              {item.name}
                            </span>
                            {shortage ? (
                              <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
                            ) : null}
                          </div>
                          <p className="mt-0.5 pl-5 text-xs text-slate-400">
                            {item.category}
                          </p>
                        </td>
                        <td className="px-2 py-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-medium",
                              item.kind === "sku"
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-slate-50 text-slate-600",
                            )}
                          >
                            {item.kind === "sku" ? "SKU" : "個体"}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                          {item.kind === "sku" ? (
                            <span
                              className={cn(
                                shortage && "font-semibold text-amber-600",
                              )}
                            >
                              {total}
                              <span className="ml-0.5 text-xs text-slate-400">
                                / {item.minThreshold}
                              </span>
                            </span>
                          ) : (
                            <Badge
                              variant="secondary"
                              className={cn(
                                item.status === "away" &&
                                  "bg-amber-50 text-amber-700",
                              )}
                            >
                              {item.status === "away" ? "在庫外" : "在庫"}
                            </Badge>
                          )}
                        </td>
                      </tr>
                      {item.kind === "sku" && expanded ? (
                        <tr className="border-b border-slate-100">
                          <td colSpan={3} className="bg-slate-50/80 px-4 py-0">
                            <div className="overflow-hidden py-2 pl-5 animate-in slide-in-from-top-1 duration-200">
                              <ul className="space-y-1.5 border-l-2 border-slate-200 pl-3">
                                {(item.locations ?? []).map((loc) => (
                                  <li
                                    key={loc.id}
                                    className="flex items-center justify-between text-xs text-slate-600"
                                  >
                                    <span className="font-medium text-slate-700">
                                      {loc.name}
                                    </span>
                                    <span className="tabular-nums">
                                      {loc.qty}
                                      {loc.unit}
                                    </span>
                                  </li>
                                ))}
                                {(qtyDelta[item.id] ?? 0) !== 0 ? (
                                  <li className="flex items-center justify-between text-xs text-blue-600">
                                    <span>調整（未反映分）</span>
                                    <span className="tabular-nums font-medium">
                                      {(qtyDelta[item.id] ?? 0) > 0 ? "+" : ""}
                                      {qtyDelta[item.id]}
                                    </span>
                                  </li>
                                ) : null}
                              </ul>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ペイン3: 詳細 — 可変 */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            備品詳細
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-slate-900">
            {selectedItem?.name ?? "—"}
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {!selectedItem ? (
            <p className="text-sm text-slate-500">備品を選択してください</p>
          ) : (
            <div className="mx-auto max-w-2xl space-y-4">
              {overdue ? (
                <div
                  role="alert"
                  className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-900"
                >
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
                  <div>
                    <p className="text-sm font-semibold">返却期日超過</p>
                    <p className="mt-1 text-sm text-red-800">
                      返却予定日 {formatDate(selectedItem.returnDueDate)}{" "}
                      を過ぎています。行先: {selectedItem.awayDestination}
                    </p>
                  </div>
                </div>
              ) : null}

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-3xl">
                      {selectedItem.imageEmoji ?? "📦"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">
                        {selectedItem.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {selectedItem.category} · {selectedHall.name}
                      </CardDescription>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {selectedItem.kind === "sku" ? "SKU在庫" : "個体管理"}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={cn(
                            selectedItem.status === "away" &&
                              "bg-amber-50 text-amber-800",
                          )}
                        >
                          {selectedItem.status === "away" ? "在庫外" : "在庫あり"}
                        </Badge>
                        {selectedItem.kind === "sku" &&
                        isShortage(selectedItem, qtyDelta) ? (
                          <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                            在庫不足
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedItem.kind === "individual" ? (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div>
                        <dt className="text-xs text-slate-500">シリアル</dt>
                        <dd className="mt-0.5 font-mono text-slate-900">
                          {selectedItem.serial}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">購入日</dt>
                        <dd className="mt-0.5 text-slate-900">
                          {formatDate(selectedItem.purchaseDate)}
                        </dd>
                      </div>
                      {selectedItem.status === "away" ? (
                        <>
                          <div>
                            <dt className="text-xs text-slate-500">在庫外理由</dt>
                            <dd className="mt-0.5 text-slate-900">
                              {selectedItem.awayReason}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate-500">行先</dt>
                            <dd className="mt-0.5 text-slate-900">
                              {selectedItem.awayDestination}
                            </dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-xs text-slate-500">返却予定日</dt>
                            <dd
                              className={cn(
                                "mt-0.5 font-medium",
                                overdue ? "text-red-600" : "text-slate-900",
                              )}
                            >
                              {formatDate(selectedItem.returnDueDate)}
                            </dd>
                          </div>
                        </>
                      ) : null}
                      {selectedItem.maintenanceNote ? (
                        <div className="col-span-2">
                          <dt className="text-xs text-slate-500">メンテナンス</dt>
                          <dd className="mt-0.5 text-slate-700">
                            {selectedItem.maintenanceNote}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div>
                        <dt className="text-xs text-slate-500">合計在庫</dt>
                        <dd className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
                          {selectedTotalQty}
                          <span className="ml-1 text-sm font-normal text-slate-500">
                            / しきい値 {selectedItem.minThreshold}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">保管内訳</dt>
                        <dd className="mt-1 space-y-1">
                          {(selectedItem.locations ?? []).map((loc) => (
                            <div
                              key={loc.id}
                              className="flex justify-between text-slate-700"
                            >
                              <span>{loc.name}</span>
                              <span className="tabular-nums">
                                {loc.qty}
                                {loc.unit}
                              </span>
                            </div>
                          ))}
                        </dd>
                      </div>
                    </dl>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <History className="size-4 text-slate-400" />
                    直近の履歴
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {itemHistory.length === 0 ? (
                    <p className="text-sm text-slate-500">履歴はありません</p>
                  ) : (
                    <ul className="space-y-3">
                      {itemHistory.map((h) => (
                        <li
                          key={h.id}
                          className="flex gap-3 border-l-2 border-slate-200 pl-3"
                        >
                          <time className="shrink-0 text-xs tabular-nums text-slate-400">
                            {h.at}
                          </time>
                          <span className="text-sm text-slate-700">{h.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* ペイン4: 操作 — 320px */}
      <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-slate-50">
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-4">
          <h2 className="text-sm font-semibold text-slate-900">操作</h2>
          <p className="mt-0.5 text-xs text-slate-500">スキャン・在庫操作</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            <Button
              className="h-11 w-full bg-slate-900 text-white hover:bg-slate-800"
              onClick={handleScanStart}
            >
              <QrCode className="size-4" />
              QRスキャン開始
            </Button>

            {scanMessage ? (
              <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                {scanMessage}
              </p>
            ) : null}

            <Separator />

            {selectedItem?.kind === "sku" ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-slate-500">
                    クイック数量変更
                  </Label>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
                    {selectedTotalQty}
                    <span className="ml-1 text-sm font-normal text-slate-500">
                      合計
                    </span>
                  </p>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="col-span-1"
                      onClick={() => adjustSkuQty(-1)}
                    >
                      <Minus className="size-3.5" />
                      -1
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="col-span-1"
                      onClick={() => adjustSkuQty(1)}
                    >
                      <Plus className="size-3.5" />
                      +1
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="col-span-1"
                      onClick={() => adjustSkuQty(-5)}
                    >
                      -5
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="col-span-1"
                      onClick={() => adjustSkuQty(5)}
                    >
                      +5
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setTransferOpen(true)}
                  >
                    <ArrowRightLeft className="size-4 text-slate-500" />
                    拠点間恒久移動
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setAdjustQty("0");
                      setAdjustReason("");
                      setAdjustOpen(true);
                    }}
                  >
                    <SlidersHorizontal className="size-4 text-slate-500" />
                    数量調整
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-center">
                <p className="text-xs text-slate-500">
                  個体管理品は QRスキャンで
                  <br />
                  返却・在庫外操作を行います
                </p>
                {selectedItem?.status === "away" ? (
                  <Button variant="secondary" size="sm" className="mt-3">
                    返却スキャン（モック）
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* モーダル: 拠点間恒久移動 */}
      <Modal
        open={transferOpen}
        title="拠点間恒久移動"
        description="管理操作（モック）。出庫側の減算と入庫側の加算を記録します。"
        onClose={() => setTransferOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="transfer-target">移動先拠点</Label>
            <select
              id="transfer-target"
              value={transferTarget}
              onChange={(e) => setTransferTarget(e.target.value)}
              className="mt-1.5 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              {HALLS.filter((h) => h.id !== selectedHallId).map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {selectedItem?.name} · 合計 {selectedTotalQty} を{" "}
            {HALLS.find((h) => h.id === transferTarget)?.name} へ移動
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTransferOpen(false)}>
              キャンセル
            </Button>
            <Button
              className="bg-slate-900 hover:bg-slate-800"
              onClick={() => setTransferOpen(false)}
            >
              確定（モック）
            </Button>
          </div>
        </div>
      </Modal>

      {/* モーダル: 数量調整 */}
      <Modal
        open={adjustOpen}
        title="数量調整"
        description="管理操作（モック）。理由必須・履歴に追記されます。"
        onClose={() => setAdjustOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="adjust-qty">調整数量（±）</Label>
            <Input
              id="adjust-qty"
              type="number"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="adjust-reason">理由</Label>
            <Input
              id="adjust-reason"
              placeholder="例: 棚卸し差分・破損"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>
              キャンセル
            </Button>
            <Button
              className="bg-slate-900 hover:bg-slate-800"
              disabled={!adjustReason.trim()}
              onClick={handleAdjustConfirm}
            >
              確定
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
