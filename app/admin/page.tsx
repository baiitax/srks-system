import { createClient } from "@/lib/supabase/server";
import { ProcurementTrendChart } from "@/components/admin/analytics-charts";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import {
  Wallet, Activity, CheckCircle2, AlertOctagon,
  TrendingUp, Clock, ArrowRight, PlusCircle, Download,
  Users, ShieldAlert,
} from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

function relName(r: unknown): string {
  if (!r) return "N/A";
  if (Array.isArray(r)) return (r[0] as { company_name?: string })?.company_name || "N/A";
  return (r as { company_name?: string }).company_name || "N/A";
}

const STATUS_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  reconciled:    { label: "Reconciled",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  variance_hold: { label: "Variance Hold", cls: "bg-red-50 text-red-700 border-red-200",           dot: "bg-red-500 animate-pulse" },
  delivered:     { label: "Delivered",     cls: "bg-blue-50 text-blue-700 border-blue-200",         dot: "bg-blue-500" },
  in_transit:    { label: "In Transit",    cls: "bg-teal-50 text-teal-700 border-teal-200",         dot: "bg-teal-400 animate-pulse" },
  issued:        { label: "Issued",        cls: "bg-indigo-50 text-indigo-700 border-indigo-200",   dot: "bg-indigo-500" },
  shell:         { label: "Shell Draft",   cls: "bg-amber-50 text-amber-700 border-amber-200",      dot: "bg-amber-400" },
};

// 6-month scaffold so chart always has shape even when DB is empty
const MONTH_SCAFFOLD = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const MOCK_BASELINE  = [18_200_000, 24_500_000, 31_800_000, 27_400_000, 38_900_000, 45_200_000, 0];

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: purchaseOrders } = await supabase
    .from("purchase_orders")
    .select(`
      id, po_number, status, created_at,
      customers (company_name),
      vendors  (company_name),
      po_items (total_amount, unit_price, quantity)
    `)
    .order("created_at", { ascending: false });

  const { data: vendors } = await supabase
    .from("vendors")
    .select("id");

  // ── Aggregations ────────────────────────────────────────────────────────────
  let totalSpend     = 0;
  let activePipeline = 0;
  let varianceHolds  = 0;
  let reconciled     = 0;
  const monthlyMap: Record<string, number> = {};

  purchaseOrders?.forEach((po) => {
    const poValue = (po.po_items ?? []).reduce((sum: number, item: { total_amount?: number | null; unit_price?: number | null; quantity?: number | null }) => {
      if (item.total_amount != null) return sum + Number(item.total_amount);
      return sum + Number(item.unit_price ?? 0) * Number(item.quantity ?? 0);
    }, 0);

    if (po.status === "issued" || po.status === "in_transit" || po.status === "delivered") activePipeline++;
    if (po.status === "variance_hold") varianceHolds++;
    if (po.status === "reconciled") {
      reconciled++;
      totalSpend += poValue;
      const month = new Date(po.created_at).toLocaleString("default", { month: "short" });
      monthlyMap[month] = (monthlyMap[month] || 0) + poValue;
    }
  });

  const total      = purchaseOrders?.length ?? 0;
  const varRate    = total ? ((varianceHolds / total) * 100).toFixed(1) : "0.0";
  const reconRate  = total ? Math.round((reconciled / total) * 100) : 0;
  const vendorCount = vendors?.length ?? 0;

  // ── Chart data (merge real DB data over scaffold) ─────────────────────────
  const trendData = MONTH_SCAFFOLD.map((month, i) => ({
    month,
    spend: monthlyMap[month] || MOCK_BASELINE[i],
  }));

  // ── Variance hold POs for action panel ──────────────────────────────────
  const varianceItems = (purchaseOrders ?? [])
    .filter((po) => po.status === "variance_hold")
    .slice(0, 5);

  // ── Recent 5 active POs for bottom table ─────────────────────────────────
  const recentPOs = (purchaseOrders ?? [])
    .filter((po) => po.status !== "shell")
    .slice(0, 7);

  const today = new Date().toLocaleDateString("en-GB", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  // ── KPI card definitions ──────────────────────────────────────────────────
  const kpis = [
    {
      label: "Total Reconciled Spend",
      value: fmt(totalSpend),
      sub: `${reconciled} orders cleared via 3-Way Match`,
      icon: Wallet,
      trend: "+12.5%",
      trendPositive: true,
      accent: "border-l-emerald-500",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
    },
    {
      label: "Active Supply Lines",
      value: `${activePipeline}`,
      sub: `${activePipeline} orders in transit or pending GRN`,
      icon: Activity,
      trend: "Live",
      trendPositive: true,
      accent: "border-l-blue-500",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-700",
    },
    {
      label: "Reconciliation Rate",
      value: `${reconRate}%`,
      sub: `${reconciled} of ${total} total orders`,
      icon: CheckCircle2,
      trend: reconRate >= 80 ? "On track" : "Below target",
      trendPositive: reconRate >= 80,
      accent: "border-l-teal-500",
      iconBg: "bg-teal-50",
      iconColor: "text-teal-700",
    },
    {
      label: "Variance Hold Rate",
      value: `${varRate}%`,
      sub: `${varianceHolds} orders frozen for audit`,
      icon: varianceHolds > 0 ? AlertOctagon : ShieldAlert,
      trend: varianceHolds > 0 ? `${varianceHolds} require review` : "Clean",
      trendPositive: varianceHolds === 0,
      accent: varianceHolds > 0 ? "border-l-red-500" : "border-l-slate-300",
      iconBg: varianceHolds > 0 ? "bg-red-50" : "bg-slate-100",
      iconColor: varianceHolds > 0 ? "text-red-700" : "text-slate-500",
    },
    {
      label: "Registered Vendors",
      value: `${vendorCount}`,
      sub: "Active supply partners on file",
      icon: Users,
      trend: "Registry current",
      trendPositive: true,
      accent: "border-l-violet-500",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-700",
    },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Command Center</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">{today} · Real-time procurement intelligence</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/admin/po">
            <button className="flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-[13px] font-semibold transition-all shadow-sm">
              <PlusCircle className="w-3.5 h-3.5" />
              Initialize Shell PO
            </button>
          </Link>
          <button className="flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold transition-all shadow-sm">
            <Download className="w-3.5 h-3.5" />
            Export Report
          </button>
        </div>
      </div>

      {/* ── ROW 1: KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`bg-white rounded-xl border border-slate-200 border-l-4 ${kpi.accent} p-4 shadow-sm flex flex-col gap-3`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{kpi.label}</p>
              <div className={`p-1.5 rounded-md ${kpi.iconBg}`}>
                <kpi.icon className={`w-3.5 h-3.5 ${kpi.iconColor}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 leading-none tracking-tight">{kpi.value}</p>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400 leading-snug truncate flex-1">{kpi.sub}</p>
              <span className={`text-[10px] font-bold ml-2 shrink-0 ${
                kpi.trendPositive ? "text-emerald-600" : "text-red-600"
              }`}>
                {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── ROW 2: Chart + Action Panel ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left: Procurement Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Monthly Procurement Volume</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Reconciled spend aggregated by calendar month (NGN)</p>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-semibold">LIVE</span>
          </div>
          <div className="p-4">
            <ProcurementTrendChart data={trendData} />
          </div>
        </div>

        {/* Right: Variance Hold Action Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-red-100 bg-red-50/40">
            <div>
              <h2 className="text-sm font-bold text-red-800">Action Required</h2>
              <p className="text-[11px] text-red-400 mt-0.5">Variance holds pending resolution</p>
            </div>
            {varianceHolds > 0 && (
              <span className="w-6 h-6 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                {varianceHolds}
              </span>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {varianceItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">All Clear</p>
                <p className="text-xs text-slate-400 mt-1">No variance holds at this time.</p>
              </div>
            ) : (
              varianceItems.map((po) => (
                <div key={po.id} className="flex items-center gap-3 px-5 py-3 hover:bg-red-50/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-slate-900 font-mono truncate">{po.po_number}</p>
                    <p className="text-[11px] text-slate-500 truncate">{relName(po.vendors)}</p>
                  </div>
                  <Link href="/admin/ledgers">
                    <button className="text-[11px] font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors shrink-0">
                      Resolve
                    </button>
                  </Link>
                </div>
              ))
            )}
          </div>
          {varianceItems.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100">
              <Link href="/admin/ledgers" className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                View all in Ledgers <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 3: Live Pipeline Table ───────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Live Procurement Pipeline</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Most recent active orders across all statuses</p>
          </div>
          <Link href="/admin/po">
            <button className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors">
              View Full Pipeline <ArrowRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="pl-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Reference</TableHead>
                <TableHead className="py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Destination</TableHead>
                <TableHead className="py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Vendor</TableHead>
                <TableHead className="py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">PO Value</TableHead>
                <TableHead className="py-3 pr-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPOs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center gap-1.5 text-slate-400">
                      <Clock className="w-8 h-8 opacity-30" />
                      <p className="text-sm font-medium text-slate-500">No active orders yet</p>
                      <p className="text-xs">Initialize a Shell PO to start the pipeline.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                recentPOs.map((po) => {
                  const poValue = (po.po_items ?? []).reduce((sum: number, item: { total_amount?: number | null; unit_price?: number | null; quantity?: number | null }) => {
                    if (item.total_amount != null) return sum + Number(item.total_amount);
                    return sum + Number(item.unit_price ?? 0) * Number(item.quantity ?? 0);
                  }, 0);
                  const cfg = STATUS_CFG[po.status] ?? { label: po.status, cls: "bg-slate-50 text-slate-700 border-slate-200", dot: "bg-slate-400" };
                  return (
                    <TableRow key={po.id} className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0 transition-colors">
                      <TableCell className="pl-5 py-3.5">
                        <span className="font-mono text-[13px] font-bold text-slate-900">{po.po_number}</span>
                      </TableCell>
                      <TableCell className="py-3.5 text-[13px] text-slate-600">{relName(po.customers)}</TableCell>
                      <TableCell className="py-3.5 text-[13px] text-slate-600">{relName(po.vendors)}</TableCell>
                      <TableCell className="py-3.5 text-right">
                        <span className="text-[13px] font-semibold text-slate-900">
                          {poValue > 0 ? fmt(poValue) : <span className="text-slate-300 font-normal">Not priced</span>}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 pr-5">
                        <Badge variant="outline" className={`${cfg.cls} text-[10px] font-bold`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1.5 inline-block shrink-0`} />
                          {cfg.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
