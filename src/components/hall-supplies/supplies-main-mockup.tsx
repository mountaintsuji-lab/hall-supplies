"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  History,
  Package,
  QrCode,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { confirmCount } from "@/app/actions/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  INDIVIDUAL_HISTORY,
  INDIVIDUAL_ITEMS,
  type IndividualItem,
} from "@/lib/individual-items";
import {
  calcOrderQty,
  formatEventText,
  type InventoryPageBanner,
  type InventoryPageData,
  type SkuSettingRow,
} from "@/lib/inventory-types";
import { cn } from "@/lib/utils";

type ListItem =
  | { kind: "sku"; sku: SkuSettingRow }
  | { kind: "individual"; item: IndividualItem };

type SuppliesMainMockupProps = {
  data: InventoryPageData;
  readOnly?: boolean;
  banner?: InventoryPageBanner;
};

function isSkuShortage(sku: SkuSettingRow): boolean {
  return sku.currentQty < sku.parLevel;
}

function needsOrder(sku: SkuSettingRow): boolean {
  return sku.currentQty + sku.pendingQty < sku.parLevel;
}

function isOverdue(item: IndividualItem): boolean {
  if (!item.returnDueDate || item.status !== "away") return false;
  const due = new Date(item.returnDueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return iso.replace(/-/g, "/");
}

function formatEventTime(iso: string) {
  return iso.slice(0, 16).replace("T", " ");
}

function listItemName(entry: ListItem): string {
  return entry.kind === "sku" ? entry.sku.name : entry.item.name;
}

function listItemCategory(entry: ListItem): string {
  return entry.kind === "sku" ? entry.sku.category : entry.item.category;
}

function buildCategoryOrder(items: ListItem[]): Map<string, number> {
  const order = new Map<string, number>();
  for (const entry of items) {
    const category = listItemCategory(entry);
    if (!order.has(category)) {
      order.set(category, order.size);
    }
  }
  return order;
}

function compareListItems(
  a: ListItem,
  b: ListItem,
  categoryOrder: Map<string, number>,
): number {
  const catA = categoryOrder.get(listItemCategory(a)) ?? Number.MAX_SAFE_INTEGER;
  const catB = categoryOrder.get(listItemCategory(b)) ?? Number.MAX_SAFE_INTEGER;
  if (catA !== catB) return catA - catB;
  return listItemName(a).localeCompare(listItemName(b), "ja");
}

function matchesSearch(entry: ListItem, query: string): boolean {
  if (!query) return true;
  const haystack = `${listItemName(entry)} ${listItemCategory(entry)}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

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
              <p className="mt-1 text-sm text-slate-500">{description}</p>
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

function StatBlock({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: number;
  unit?: string;
  accent?: "default" | "amber" | "blue" | "green";
}) {
  const colors = {
    default: "text-slate-900",
    amber: "text-amber-600",
    blue: "text-blue-600",
    green: "text-emerald-600",
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-2xl font-bold tabular-nums",
          colors[accent ?? "default"],
        )}
      >
        {value}
        {unit ? (
          <span className="ml-0.5 text-sm font-normal text-slate-400">
            {unit}
          </span>
        ) : null}
      </p>
    </div>
  );
}

export function SuppliesMainMockup({
  data,
  readOnly = false,
  banner = "none",
}: SuppliesMainMockupProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { halls, skuSettings, events } = data;

  const defaultSku = skuSettings.find((s) => s.hallId === halls[0]?.id);
  const defaultItemId = defaultSku
    ? `sku:${defaultSku.skuId}`
    : INDIVIDUAL_ITEMS[0]
      ? `ind:${INDIVIDUAL_ITEMS[0].id}`
      : "";

  const [selectedHallId, setSelectedHallId] = useState(halls[0]?.id ?? "");
  const [selectedKey, setSelectedKey] = useState(defaultItemId);
  const [shortageOnly, setShortageOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const hallSkus = useMemo(
    () => skuSettings.filter((s) => s.hallId === selectedHallId),
    [skuSettings, selectedHallId],
  );

  const hallIndividuals = useMemo(
    () => INDIVIDUAL_ITEMS.filter((i) => i.hallId === selectedHallId),
    [selectedHallId],
  );

  const listItems: ListItem[] = useMemo(() => {
    const skus: ListItem[] = hallSkus.map((sku) => ({ kind: "sku", sku }));
    const inds: ListItem[] = hallIndividuals.map((item) => ({
      kind: "individual",
      item,
    }));
    return [...skus, ...inds];
  }, [hallSkus, hallIndividuals]);

  const categoryOrder = useMemo(() => buildCategoryOrder(listItems), [listItems]);

  const categories = useMemo(
    () =>
      [...categoryOrder.entries()]
        .sort((a, b) => a[1] - b[1])
        .map(([category]) => category),
    [categoryOrder],
  );

  const visibleItems = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    let items = listItems;

    if (shortageOnly) {
      items = items.filter((entry) => {
        if (entry.kind === "sku") return isSkuShortage(entry.sku);
        return entry.item.status === "away";
      });
    }

    if (categoryFilter) {
      items = items.filter(
        (entry) => listItemCategory(entry) === categoryFilter,
      );
    }

    if (trimmedQuery) {
      items = items.filter((entry) => matchesSearch(entry, trimmedQuery));
    }

    return [...items].sort((a, b) => compareListItems(a, b, categoryOrder));
  }, [listItems, shortageOnly, categoryFilter, searchQuery, categoryOrder]);

  const emptyListMessage = useMemo(() => {
    if (shortageOnly) return "在庫不足の備品はありません";
    if (searchQuery.trim() || categoryFilter) {
      return "条件に一致する備品はありません";
    }
    return "備品がありません";
  }, [shortageOnly, searchQuery, categoryFilter]);

  const selectedEntry = useMemo(() => {
    const found = listItems.find((entry) => {
      const key =
        entry.kind === "sku"
          ? `sku:${entry.sku.skuId}`
          : `ind:${entry.item.id}`;
      return key === selectedKey;
    });
    return found ?? visibleItems[0] ?? listItems[0] ?? null;
  }, [listItems, visibleItems, selectedKey]);

  const selectedSku =
    selectedEntry?.kind === "sku" ? selectedEntry.sku : null;
  const selectedIndividual =
    selectedEntry?.kind === "individual" ? selectedEntry.item : null;

  const previewOrderQty =
    selectedSku && pendingCount !== null
      ? calcOrderQty(
          selectedSku.parLevel,
          pendingCount,
          selectedSku.pendingQty,
        )
      : null;

  const itemHistory = useMemo(() => {
    if (selectedIndividual) {
      return INDIVIDUAL_HISTORY.filter((h) => h.itemId === selectedIndividual.id);
    }
    if (selectedSku) {
      return events
        .filter(
          (e) =>
            e.hallId === selectedSku.hallId && e.skuId === selectedSku.skuId,
        )
        .map((e) => ({
          id: e.id,
          at: formatEventTime(e.createdAt),
          text: formatEventText(e, selectedSku.unit),
        }));
    }
    return [];
  }, [selectedIndividual, selectedSku, events]);

  const gridMax = selectedSku
    ? Math.max(selectedSku.parLevel, 20)
    : 20;

  const selectedHall = halls.find((h) => h.id === selectedHallId)!;
  const overdue = selectedIndividual ? isOverdue(selectedIndividual) : false;

  function itemKey(entry: ListItem): string {
    return entry.kind === "sku"
      ? `sku:${entry.sku.skuId}`
      : `ind:${entry.item.id}`;
  }

  function selectHall(id: string) {
    setSelectedHallId(id);
    setSearchQuery("");
    setCategoryFilter("");
    const firstSku = skuSettings.find((s) => s.hallId === id);
    const firstInd = INDIVIDUAL_ITEMS.find((i) => i.hallId === id);
    if (firstSku) setSelectedKey(`sku:${firstSku.skuId}`);
    else if (firstInd) setSelectedKey(`ind:${firstInd.id}`);
  }

  function selectItem(entry: ListItem) {
    setSelectedKey(itemKey(entry));
    setActionMessage(null);
    setActionError(null);
  }

  function handleCountTap(n: number) {
    if (!selectedSku || readOnly) return;
    setPendingCount(n);
    setConfirmOpen(true);
  }

  function handleConfirmClose() {
    setConfirmOpen(false);
    setPendingCount(null);
  }

  function handleConfirmSubmit() {
    if (!selectedSku || pendingCount === null) return;

    startTransition(async () => {
      setActionError(null);
      const result = await confirmCount(
        selectedSku.hallId,
        selectedSku.skuId,
        pendingCount,
        selectedSku.version,
      );

      if (!result.ok) {
        setActionError(result.error);
        handleConfirmClose();
        return;
      }

      const unit = selectedSku.unit;
      setActionMessage(
        result.eventType === "ORDER"
          ? `現数 ${result.currentQty}${unit} を記録し、${result.orderQty}${unit} を発注しました`
          : `現数 ${result.currentQty}${unit} を記録しました（発注不要）`,
      );
      handleConfirmClose();
      router.refresh();
    });
  }

  function handleScanStart() {
    setScanMessage("カメラ起動（モック）— QRを読み取ってください");
    window.setTimeout(() => setScanMessage(null), 3200);
  }

  const hallItemCount =
    hallSkus.length +
    INDIVIDUAL_ITEMS.filter((i) => i.hallId === selectedHallId).length;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50 text-slate-900">
      {banner === "db-error" ? (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-center text-xs text-red-900">
          データベースに接続できません。表示はサンプルデータです。現数は保存できません。
        </div>
      ) : banner === "no-database-url" ? (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
          閲覧専用 — DATABASE_URL を設定すると現数を保存できます
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* ペイン1: 拠点 */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-100">
        <div className="border-b border-slate-800 px-4 py-5">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-slate-300" />
            <div>
              <p className="text-[10px] font-medium tracking-wider text-slate-400">
                備品発注・管理ツール
              </p>
              <h1 className="text-sm font-semibold text-white">ポチっとな</h1>
              <p className="text-xs text-slate-500">拠点選択</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-1">
            {halls.map((hall) => {
              const active = hall.id === selectedHallId;
              const count =
                skuSettings.filter((s) => s.hallId === hall.id).length +
                INDIVIDUAL_ITEMS.filter((i) => i.hallId === hall.id).length;
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
          現数発注 · v0.2
        </div>
      </aside>

      {/* ペイン2: 備品一覧 */}
      <section className="flex w-96 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="shrink-0 border-b border-slate-100 px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">備品一覧</h2>
              <p className="mt-0.5 text-xs text-slate-500">{selectedHall.name}</p>
            </div>
            <Badge variant="secondary" className="shrink-0 tabular-nums">
              {visibleItems.length} 件
            </Badge>
          </div>
          <div className="mt-3 space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="名称で検索…"
                aria-label="備品名称で検索"
                className="h-8 bg-slate-50 pl-8 pr-8 text-sm"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="検索をクリア"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="カテゴリで絞り込み"
              className="h-8 w-full rounded-lg border border-input bg-slate-50 px-2.5 text-sm text-slate-700 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">すべてのカテゴリ</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
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
              <p className="text-sm text-slate-500">{emptyListMessage}</p>
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
                {visibleItems.map((entry) => {
                  const key = itemKey(entry);
                  const active = key === selectedKey;

                  if (entry.kind === "sku") {
                    const { sku } = entry;
                    const shortage = isSkuShortage(sku);
                    const ordering = sku.pendingQty > 0;

                    return (
                      <tr
                        key={key}
                        onClick={() => selectItem(entry)}
                        className={cn(
                          "cursor-pointer border-b border-slate-50 transition-colors",
                          active ? "bg-slate-100/80" : "hover:bg-slate-50",
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-900">
                              {sku.name}
                            </span>
                            {shortage ? (
                              <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
                            ) : null}
                            {ordering ? (
                              <ShoppingCart className="size-3.5 shrink-0 text-blue-500" />
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {sku.category}
                          </p>
                        </td>
                        <td className="px-2 py-3">
                          <Badge
                            variant="outline"
                            className="border-blue-200 bg-blue-50 text-[10px] font-medium text-blue-700"
                          >
                            SKU
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                          <span
                            className={cn(
                              shortage && "font-semibold text-amber-600",
                            )}
                          >
                            {sku.currentQty}
                            <span className="ml-0.5 text-xs text-slate-400">
                              / {sku.parLevel}
                            </span>
                          </span>
                          {ordering ? (
                            <p className="mt-0.5 text-[10px] text-blue-600">
                              発注中 {sku.pendingQty}
                            </p>
                          ) : null}
                        </td>
                      </tr>
                    );
                  }

                  const { item } = entry;
                  return (
                    <tr
                      key={key}
                      onClick={() => selectItem(entry)}
                      className={cn(
                        "cursor-pointer border-b border-slate-50 transition-colors",
                        active ? "bg-slate-100/80" : "hover:bg-slate-50",
                      )}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">
                          {item.name}
                        </span>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {item.category}
                        </p>
                      </td>
                      <td className="px-2 py-3">
                        <Badge
                          variant="outline"
                          className="border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-600"
                        >
                          個体
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Badge
                          variant="secondary"
                          className={cn(
                            item.status === "away" &&
                              "bg-amber-50 text-amber-700",
                          )}
                        >
                          {item.status === "away" ? "在庫外" : "在庫"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ペイン3: 詳細 */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            備品詳細
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-slate-900">
            {selectedSku?.name ?? selectedIndividual?.name ?? "—"}
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {!selectedEntry ? (
            <p className="text-sm text-slate-500">備品を選択してください</p>
          ) : selectedIndividual ? (
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
                      返却予定日 {formatDate(selectedIndividual.returnDueDate)}{" "}
                      を過ぎています。行先:{" "}
                      {selectedIndividual.awayDestination}
                    </p>
                  </div>
                </div>
              ) : null}

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-3xl">
                      {selectedIndividual.imageEmoji ?? "📦"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">
                        {selectedIndividual.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {selectedIndividual.category} · {selectedHall.name}
                      </CardDescription>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">個体管理</Badge>
                        <Badge
                          variant="secondary"
                          className={cn(
                            selectedIndividual.status === "away" &&
                              "bg-amber-50 text-amber-800",
                          )}
                        >
                          {selectedIndividual.status === "away"
                            ? "在庫外"
                            : "在庫あり"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <dt className="text-xs text-slate-500">シリアル</dt>
                      <dd className="mt-0.5 font-mono text-slate-900">
                        {selectedIndividual.serial}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">購入日</dt>
                      <dd className="mt-0.5 text-slate-900">
                        {formatDate(selectedIndividual.purchaseDate)}
                      </dd>
                    </div>
                    {selectedIndividual.status === "away" ? (
                      <>
                        <div>
                          <dt className="text-xs text-slate-500">在庫外理由</dt>
                          <dd className="mt-0.5 text-slate-900">
                            {selectedIndividual.awayReason}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-slate-500">行先</dt>
                          <dd className="mt-0.5 text-slate-900">
                            {selectedIndividual.awayDestination}
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
                            {formatDate(selectedIndividual.returnDueDate)}
                          </dd>
                        </div>
                      </>
                    ) : null}
                    {selectedIndividual.maintenanceNote ? (
                      <div className="col-span-2">
                        <dt className="text-xs text-slate-500">メンテナンス</dt>
                        <dd className="mt-0.5 text-slate-700">
                          {selectedIndividual.maintenanceNote}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </CardContent>
              </Card>

              <HistoryCard items={itemHistory} />
            </div>
          ) : selectedSku ? (
            <div className="mx-auto max-w-2xl space-y-4">
              {actionMessage ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {actionMessage}
                </p>
              ) : null}
              {actionError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {actionError}
                </p>
              ) : null}

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-3xl">
                      {selectedSku.imageEmoji ?? "📦"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">
                        {selectedSku.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {selectedSku.category} · {selectedHall.name}
                      </CardDescription>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">SKU在庫</Badge>
                        {isSkuShortage(selectedSku) ? (
                          <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                            定数未満
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-emerald-700"
                          >
                            定数充足
                          </Badge>
                        )}
                        {selectedSku.pendingQty > 0 ? (
                          <Badge className="bg-blue-500 text-white hover:bg-blue-500">
                            発注中 {selectedSku.pendingQty}
                            {selectedSku.unit}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    <StatBlock
                      label="現数"
                      value={selectedSku.currentQty}
                      unit={selectedSku.unit}
                      accent={
                        isSkuShortage(selectedSku) ? "amber" : "default"
                      }
                    />
                    <StatBlock
                      label="定数"
                      value={selectedSku.parLevel}
                      unit={selectedSku.unit}
                    />
                    <StatBlock
                      label="発注中"
                      value={selectedSku.pendingQty}
                      unit={selectedSku.unit}
                      accent={selectedSku.pendingQty > 0 ? "blue" : "default"}
                    />
                    <StatBlock
                      label="不足分"
                      value={Math.max(
                        0,
                        selectedSku.parLevel -
                          selectedSku.currentQty -
                          selectedSku.pendingQty,
                      )}
                      unit={selectedSku.unit}
                      accent={
                        needsOrder(selectedSku) ? "amber" : "green"
                      }
                    />
                  </div>
                  <p className="mt-3 text-center text-xs text-slate-500">
                    発注数 = max(0, 定数 − 現数 − 発注中)
                  </p>
                </CardContent>
              </Card>

              <HistoryCard items={itemHistory} />
            </div>
          ) : null}
        </div>
      </main>

      {/* ペイン4: 操作 */}
      <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-slate-50">
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-4">
          <h2 className="text-sm font-semibold text-slate-900">操作</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {selectedSku ? "現数入力 · 自動発注" : "スキャン操作"}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {selectedSku ? (
              <>
                <div>
                  <Label className="text-xs text-slate-500">
                    棚の残り数をタップ
                  </Label>
                  <p className="mt-1 text-xs text-slate-400">
                    0 〜 {gridMax}（定数 {selectedSku.parLevel}）
                  </p>
                  <div className="mt-3 grid grid-cols-5 gap-1.5">
                    {Array.from({ length: gridMax + 1 }, (_, n) => (
                      <Button
                        key={n}
                        variant="outline"
                        size="sm"
                        disabled={isPending || readOnly}
                        onClick={() => handleCountTap(n)}
                        className={cn(
                          "h-10 tabular-nums font-semibold",
                          n === selectedSku.currentQty &&
                            "border-slate-800 bg-slate-100 ring-1 ring-slate-800",
                        )}
                      >
                        {n}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
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

                <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-center">
                  <p className="text-xs text-slate-500">
                    個体管理品は QRスキャンで
                    <br />
                    返却・在庫外操作を行います
                  </p>
                  {selectedIndividual?.status === "away" ? (
                    <Button variant="secondary" size="sm" className="mt-3">
                      返却スキャン（モック）
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      </div>

      {/* 確認モーダル */}
      <Modal
        open={confirmOpen}
        title="現数を確定"
        description="内容を確認してから記録します"
        onClose={handleConfirmClose}
      >
        {selectedSku && pendingCount !== null ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <StatBlock label="入力現数" value={pendingCount} unit={selectedSku.unit} />
              <StatBlock label="定数" value={selectedSku.parLevel} unit={selectedSku.unit} />
              <StatBlock
                label="今回発注"
                value={previewOrderQty ?? 0}
                unit={selectedSku.unit}
                accent={(previewOrderQty ?? 0) > 0 ? "blue" : "green"}
              />
            </div>

            {(previewOrderQty ?? 0) >= 1 ? (
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
                現数 <strong>{pendingCount}</strong>
                {selectedSku.unit} を記録し、
                <strong> {previewOrderQty}</strong>
                {selectedSku.unit} を発注します。
                {selectedSku.pendingQty > 0 ? (
                  <>
                    {" "}
                    （発注中 {selectedSku.pendingQty}
                    {selectedSku.unit} を差し引き済み）
                  </>
                ) : null}
              </p>
            ) : (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                現数 <strong>{pendingCount}</strong>
                {selectedSku.unit} を記録します。発注は不要です。
                {selectedSku.pendingQty > 0 ? (
                  <>
                    {" "}
                    （発注中 {selectedSku.pendingQty}
                    {selectedSku.unit} あり）
                  </>
                ) : null}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleConfirmClose} disabled={isPending}>
                キャンセル
              </Button>
              <Button
                className="bg-slate-900 hover:bg-slate-800"
                disabled={isPending}
                onClick={handleConfirmSubmit}
              >
                {isPending ? "記録中…" : "確定"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function HistoryCard({
  items,
}: {
  items: { id: string; at: string; text: string }[];
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="size-4 text-slate-400" />
          直近の履歴
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">履歴はありません</p>
        ) : (
          <ul className="space-y-3">
            {items.map((h) => (
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
  );
}
