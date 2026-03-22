"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ChefHat, CircleDollarSign, Search, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";
import { FoodCostItem, FoodCostStatus, veryAcai2024 } from "@/lib/data/very-acai-2024";

const currency = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const integer = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });

type ScenarioItem = {
  base: FoodCostItem;
  unitSellPrice: number;
  unitFoodCost: number | null;
  unitProfit: number | null;
  foodCostPct: number | null;
  totalSales: number;
  totalFoodCost: number | null;
  totalContribution: number | null;
  status: FoodCostStatus;
};

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return currency.format(value);
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function statusMeta(status: FoodCostStatus) {
  if (status === "loss") return { label: "Loss", variant: "danger" as const };
  if (status === "high_cost") return { label: "High cost", variant: "warning" as const };
  if (status === "missing_cost") return { label: "Missing cost", variant: "neutral" as const };
  return { label: "Healthy", variant: "default" as const };
}

function scenarioStatus(item: FoodCostItem, unitProfit: number | null, foodCostPct: number | null, targetPct: number) {
  if (item.unitFoodCost === null) return "missing_cost" as const;
  if (unitProfit !== null && unitProfit < 0) return "loss" as const;
  if (foodCostPct !== null && foodCostPct > targetPct) return "high_cost" as const;
  return "ok" as const;
}

function buildScenarioItem(
  item: FoodCostItem,
  inflationPct: number,
  priceChangePct: number,
  estimatedMissingPct: number,
  targetPct: number,
): ScenarioItem {
  const units = item.unitsSold ?? 0;
  const unitSellPrice = (item.sellPrice ?? 0) * (1 + priceChangePct / 100);

  const baseCost = item.unitFoodCost ?? (item.sellPrice !== null ? item.sellPrice * estimatedMissingPct : null);
  const unitFoodCost = baseCost === null ? null : baseCost * (1 + inflationPct / 100);
  const unitProfit = unitFoodCost === null ? null : unitSellPrice - unitFoodCost;
  const foodCostPct = unitFoodCost === null || unitSellPrice <= 0 ? null : unitFoodCost / unitSellPrice;

  const totalSales = unitSellPrice * units;
  const totalFoodCost = unitFoodCost === null ? null : unitFoodCost * units;
  const totalContribution = totalFoodCost === null ? null : totalSales - totalFoodCost;

  return {
    base: item,
    unitSellPrice,
    unitFoodCost,
    unitProfit,
    foodCostPct,
    totalSales,
    totalFoodCost,
    totalContribution,
    status: scenarioStatus(item, unitProfit, foodCostPct, targetPct),
  };
}

export function FoodCostMvpClient() {
  const items = veryAcai2024.items;
  const categories = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.category))).sort((a, b) =>
        a.localeCompare(b, "it", { sensitivity: "base" }),
      ),
    [items],
  );

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [inflationPct, setInflationPct] = useState(0);
  const [priceChangePct, setPriceChangePct] = useState(0);
  const [estimatedMissingPct, setEstimatedMissingPct] = useState(35);
  const [targetFoodCostPct, setTargetFoodCostPct] = useState(30);
  const [selectedItemName, setSelectedItemName] = useState(items[0]?.item ?? "");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = query.trim().toLowerCase();
      const queryMatch = q.length === 0 || item.item.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      const categoryMatch = categoryFilter === "all" || item.category === categoryFilter;
      return queryMatch && categoryMatch;
    });
  }, [categoryFilter, items, query]);

  const scenarioItems = useMemo(
    () =>
      filteredItems.map((item) =>
        buildScenarioItem(item, inflationPct, priceChangePct, estimatedMissingPct / 100, targetFoodCostPct / 100),
      ),
    [estimatedMissingPct, filteredItems, inflationPct, priceChangePct, targetFoodCostPct],
  );

  const metrics = useMemo(() => {
    const knownCosts = filteredItems.filter((item) => item.unitFoodCost !== null).length;
    const total = filteredItems.length;
    const missing = total - knownCosts;

    const totalSales = scenarioItems.reduce((sum, item) => sum + item.totalSales, 0);
    const totalFoodCost = scenarioItems.reduce((sum, item) => sum + (item.totalFoodCost ?? 0), 0);
    const totalContribution = scenarioItems.reduce((sum, item) => sum + (item.totalContribution ?? 0), 0);
    const weightedFoodCostPct = totalSales > 0 ? totalFoodCost / totalSales : null;

    const lossItems = scenarioItems.filter((item) => item.status === "loss").length;
    const highCostItems = scenarioItems.filter((item) => item.status === "high_cost").length;

    return {
      total,
      knownCosts,
      missing,
      totalSales,
      totalFoodCost,
      totalContribution,
      weightedFoodCostPct,
      lossItems,
      highCostItems,
    };
  }, [filteredItems, scenarioItems]);

  const ranked = useMemo(() => {
    const withContribution = scenarioItems.filter((item) => item.totalContribution !== null);
    const top = [...withContribution]
      .sort((a, b) => (b.totalContribution ?? 0) - (a.totalContribution ?? 0))
      .slice(0, 5);
    const leak = [...withContribution]
      .sort((a, b) => (a.totalContribution ?? 0) - (b.totalContribution ?? 0))
      .slice(0, 5);
    return { top, leak };
  }, [scenarioItems]);

  const selected = useMemo(() => {
    const selectedFromScenario = scenarioItems.find((item) => item.base.item === selectedItemName);
    return selectedFromScenario ?? scenarioItems[0] ?? null;
  }, [scenarioItems, selectedItemName]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ecfccb_0%,#f8fafc_35%,#f8fafc_100%)] pb-10">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-5 py-6 md:px-8">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
              <ChefHat className="h-4 w-4 text-lime-700" />
              Food Cost MVP
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              {veryAcai2024.summary.store} Menu Economics
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Period {veryAcai2024.summary.period} · Prepared {veryAcai2024.summary.prepared}
            </p>
          </div>

          <div className="rounded-2xl border border-lime-200 bg-lime-50 px-4 py-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-lime-800">Workbook baseline</p>
            <p className="mt-1 text-sm font-bold text-lime-900">
              Sold {integer.format(veryAcai2024.summary.allItemsSold ?? 0)} items · Revenue{" "}
              {formatCurrency(veryAcai2024.summary.overallMenuSales)}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-6 md:px-8">
        <Card className="border-slate-200 bg-white/95">
          <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Search Item</span>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="e.g. protein, latte, detox"
                  className="pl-9"
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Category</span>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-lime-200"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Ingredient inflation ({inflationPct}%)
              </span>
              <input
                type="range"
                min={-20}
                max={30}
                step={1}
                value={inflationPct}
                onChange={(event) => setInflationPct(Number(event.target.value))}
                className="h-12 w-full accent-lime-600"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Price change ({priceChangePct}%)
              </span>
              <input
                type="range"
                min={-20}
                max={30}
                step={1}
                value={priceChangePct}
                onChange={(event) => setPriceChangePct(Number(event.target.value))}
                className="h-12 w-full accent-lime-600"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Estimated missing food cost ({estimatedMissingPct}% of price)
              </span>
              <input
                type="range"
                min={10}
                max={90}
                step={1}
                value={estimatedMissingPct}
                onChange={(event) => setEstimatedMissingPct(Number(event.target.value))}
                className="h-12 w-full accent-lime-600"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Target food cost ({targetFoodCostPct}%)
              </span>
              <input
                type="range"
                min={10}
                max={60}
                step={1}
                value={targetFoodCostPct}
                onChange={(event) => setTargetFoodCostPct(Number(event.target.value))}
                className="h-12 w-full accent-lime-600"
              />
            </label>
          </CardContent>
        </Card>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Scenario Sales</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-black tracking-tight text-slate-900">{formatCurrency(metrics.totalSales)}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Scenario Food Cost</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-black tracking-tight text-slate-900">{formatCurrency(metrics.totalFoodCost)}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">Weighted {formatPercent(metrics.weightedFoodCostPct)}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Scenario Contribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-black tracking-tight text-slate-900">{formatCurrency(metrics.totalContribution)}</p>
              <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-500">
                <TrendingUp className="h-4 w-4 text-lime-600" />
                {metrics.lossItems} loss items · {metrics.highCostItems} high-cost
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Cost Coverage</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-black tracking-tight text-slate-900">
                {metrics.knownCosts}/{metrics.total}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">{metrics.missing} items still missing cost inputs</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
                Top contribution items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {ranked.top.map((entry) => (
                <div key={entry.base.item} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="font-bold text-slate-900">{entry.base.item}</p>
                    <p className="text-xs font-semibold text-slate-500">{entry.base.category}</p>
                  </div>
                  <span className="text-sm font-extrabold text-lime-700">{formatCurrency(entry.totalContribution)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
                Biggest contribution leaks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {ranked.leak.map((entry) => (
                <div key={entry.base.item} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="font-bold text-slate-900">{entry.base.item}</p>
                    <p className="text-xs font-semibold text-slate-500">{entry.base.category}</p>
                  </div>
                  <span className="text-sm font-extrabold text-red-700">{formatCurrency(entry.totalContribution)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-slate-500">
              <CircleDollarSign className="h-4 w-4 text-lime-700" />
              Item economics table
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Sold</TableHead>
                    <TableHead className="text-right">Sell</TableHead>
                    <TableHead className="text-right">Food Cost</TableHead>
                    <TableHead className="text-right">Food Cost %</TableHead>
                    <TableHead className="text-right">Unit Profit</TableHead>
                    <TableHead className="text-right">Contribution</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scenarioItems.map((item) => {
                    const meta = statusMeta(item.status);
                    const isSelected = selected?.base.item === item.base.item;
                    return (
                      <TableRow
                        key={item.base.item}
                        className={cn("cursor-pointer transition-colors", isSelected && "bg-lime-50/80")}
                        onClick={() => setSelectedItemName(item.base.item)}
                      >
                        <TableCell className="pl-4">
                          <p className="font-bold text-slate-900">{item.base.item}</p>
                        </TableCell>
                        <TableCell>{item.base.category}</TableCell>
                        <TableCell className="text-right font-semibold text-slate-700">
                          {integer.format(item.base.unitsSold ?? 0)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-700">
                          {formatCurrency(item.unitSellPrice)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-700">
                          {formatCurrency(item.unitFoodCost)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-700">
                          {formatPercent(item.foodCostPct)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-extrabold",
                            (item.unitProfit ?? 0) < 0 ? "text-red-700" : "text-lime-700",
                          )}
                        >
                          {formatCurrency(item.unitProfit)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-extrabold",
                            (item.totalContribution ?? 0) < 0 ? "text-red-700" : "text-lime-700",
                          )}
                        >
                          {formatCurrency(item.totalContribution)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {selected ? (
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-wrap items-center gap-2 text-base font-black tracking-tight text-slate-900">
                {selected.base.item}
                <Badge variant={statusMeta(selected.status).variant}>{statusMeta(selected.status).label}</Badge>
              </CardTitle>
              <p className="text-sm font-semibold text-slate-500">{selected.base.description || "No description available."}</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Unit Food Cost</p>
                  <p className="mt-1 text-lg font-black text-slate-900">{formatCurrency(selected.unitFoodCost)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Food Cost %</p>
                  <p className="mt-1 text-lg font-black text-slate-900">{formatPercent(selected.foodCostPct)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Contribution</p>
                  <p
                    className={cn(
                      "mt-1 text-lg font-black",
                      (selected.totalContribution ?? 0) < 0 ? "text-red-700" : "text-lime-700",
                    )}
                  >
                    {formatCurrency(selected.totalContribution)}
                  </p>
                </div>
              </div>

              {selected.base.recipe.length > 0 ? (
                <div className="rounded-2xl border border-slate-200">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Recipe inputs</p>
                  </div>
                  <div className="overflow-x-auto">
                    <Table className="min-w-[720px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-4">Type</TableHead>
                          <TableHead>Ingredient</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead className="text-right">Amount/portion</TableHead>
                          <TableHead className="text-right">Cost/portion</TableHead>
                          <TableHead>Note</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selected.base.recipe.map((line, index) => (
                          <TableRow key={`${selected.base.item}-${line.ingredient}-${line.note}-${index}`}>
                            <TableCell className="pl-4 font-semibold text-slate-700">{line.type ?? "Part"}</TableCell>
                            <TableCell className="font-bold text-slate-900">{line.ingredient}</TableCell>
                            <TableCell>{line.unit ?? "—"}</TableCell>
                            <TableCell className="text-right font-semibold text-slate-700">
                              {line.amountPerPortion === null ? "—" : line.amountPerPortion}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-slate-700">
                              {formatCurrency(line.costPerPortion)}
                            </TableCell>
                            <TableCell>{line.note ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    No recipe lines found for this item. Fill recipe inputs in the source sheet to improve accuracy.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        <footer className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-500">
          Baseline dataset imported from <span className="font-bold">Very Acai Menu Economics_2024.xlsx</span> and exposed
          as a local MVP dashboard. Use the sliders to model inflation and pricing choices before changing the source
          spreadsheet.
        </footer>
      </main>
    </div>
  );
}
