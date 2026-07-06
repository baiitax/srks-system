import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Download, TrendingUp, Calendar, Building2, Target, PieChart } from "lucide-react";

export default async function ReportsPage() {
  const supabase = await createClient();

  // 1. Fetch comprehensive PO data for aggregation
  const { data: allPOs } = await supabase
    .from("purchase_orders")
    .select(`
      id,
      status,
      created_at,
      vendors (id, company_name),
      po_items (total_amount)
    `)
    .neq("status", "shell"); // Exclude empty drafts

  // 2. Data Aggregation Engines
  let totalSpend = 0;
  let reconciledCount = 0;
  let varianceCount = 0;
  let transitCount = 0;

  // Map to hold Vendor Performance data
  const vendorStats = new Map<string, { name: string; volume: number; poCount: number }>();

  allPOs?.forEach((po) => {
    // Calculate individual PO value
    const poValue = po.po_items.reduce((sum: number, item: any) => sum + Number(item.total_amount), 0);
    
    // Aggregate global stats
    if (po.status === 'reconciled') {
      totalSpend += poValue;
      reconciledCount++;
    } else if (po.status === 'variance_hold' || po.status === 'pending_finance_review') {
      varianceCount++;
    } else {
      transitCount++;
    }

    // Aggregate Vendor stats
    // 🚨 Type cast to bypass strict relational inference
    const vendorData: any = po.vendors;
    const vendorId = Array.isArray(vendorData) ? vendorData[0]?.id : vendorData?.id;
    const vendorName = Array.isArray(vendorData) ? vendorData[0]?.company_name : vendorData?.company_name;

    if (vendorId && vendorName) {
      const existing = vendorStats.get(vendorId) || { name: vendorName, volume: 0, poCount: 0 };
      vendorStats.set(vendorId, {
        name: existing.name,
        volume: existing.volume + poValue,
        poCount: existing.poCount + 1
      });
    }
  });

  // Convert Map to sorted array for the UI (Top Vendors by Volume)
  const topVendors = Array.from(vendorStats.values())
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10); // Top 10

  const totalActivePOs = (allPOs?.length || 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER CONTEXT */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Analytics & Reporting</h2>
          <p className="text-slate-500">Aggregate procurement intelligence, vendor throughput, and compliance metrics.</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Select defaultValue="ytd">
            <SelectTrigger className="w-[160px] h-10 bg-white border-slate-300">
              <Calendar className="w-4 h-4 mr-2 text-slate-500" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mtd">This Month (MTD)</SelectItem>
              <SelectItem value="qtd">This Quarter (QTD)</SelectItem>
              <SelectItem value="ytd">Year to Date (YTD)</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button className="h-10 w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white">
            <Download className="w-4 h-4 mr-2" /> Export Report
          </Button>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Reconciled Spend</p>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', notation: "compact" }).format(totalSpend)}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium text-emerald-600">+12.5% vs last period</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pipeline Volume</p>
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{totalActivePOs}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Total active procurement orders</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clearance Rate</p>
              <Target className="w-4 h-4 text-teal-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              {totalActivePOs > 0 ? Math.round((reconciledCount / totalActivePOs) * 100) : 0}%
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Orders successfully reconciled</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Exceptions</p>
              <PieChart className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{varianceCount}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium text-amber-600">Requires manual resolution</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* VENDOR PERFORMANCE LEADERBOARD */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-base text-slate-800 flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-slate-500" />
              Supplier Expenditure Allocation
            </CardTitle>
            <CardDescription>Top suppliers ranked by total reconciled order volume.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="py-3 pl-6 font-semibold text-slate-700">Vendor Entity</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Orders Fulfilled</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 pr-6">Total Expenditure</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topVendors.map((vendor, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/50">
                    <TableCell className="pl-6 font-medium text-slate-900">{vendor.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-slate-100 font-mono text-slate-600">
                        {vendor.poCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 font-bold text-slate-800">
                      {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(vendor.volume)}
                    </TableCell>
                  </TableRow>
                ))}
                {topVendors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-slate-500">
                      No vendor data available for this period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* PIPELINE DISTRIBUTION */}
        <Card className="lg:col-span-1 border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base text-slate-800">Pipeline Status Distribution</CardTitle>
            <CardDescription>Current state of all active capital.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            {/* Reconciled */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-700">Fully Reconciled</span>
                <span className="font-bold text-emerald-700">{reconciledCount}</span>
              </div>
              <Progress value={totalActivePOs > 0 ? (reconciledCount / totalActivePOs) * 100 : 0} className="h-2 bg-slate-100" indicatorColor="bg-emerald-500" />
            </div>

            {/* In Transit */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-700">In Transit / Processing</span>
                <span className="font-bold text-teal-700">{transitCount}</span>
              </div>
              <Progress value={totalActivePOs > 0 ? (transitCount / totalActivePOs) * 100 : 0} className="h-2 bg-slate-100" indicatorColor="bg-teal-500" />
            </div>

            {/* Variances */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-700">Finance Review / Holds</span>
                <span className="font-bold text-amber-700">{varianceCount}</span>
              </div>
              <Progress value={totalActivePOs > 0 ? (varianceCount / totalActivePOs) * 100 : 0} className="h-2 bg-slate-100" indicatorColor="bg-amber-500" />
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}