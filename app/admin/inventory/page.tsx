import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Package, AlertTriangle, MapPin, Layers, TrendingDown } from "lucide-react";

export default async function InventoryPage() {
  const supabase = await createClient();

  // Fetch the active products from the master catalog
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  // Simulate Inventory Ledger calculations (Deterministic mock based on SKU for UI stability)
  // In production, this would be a Supabase View or RPC aggregating goods_received against consumption
  let totalSkus = 0;
  let lowStockAlerts = 0;

  const inventoryData = products?.map((product) => {
    totalSkus++;
    
    // Generate a deterministic pseudo-random stock level based on the SKU string
    const charCodeSum = product.sku.split('').reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0);
    const availableStock = (charCodeSum * 13) % 2500; 
    const reorderPoint = 300;
    
    const isLowStock = availableStock > 0 && availableStock <= reorderPoint;
    const isOutOfStock = availableStock === 0;
    
    if (isLowStock || isOutOfStock) lowStockAlerts++;

    return {
      ...product,
      available_stock: availableStock,
      reorder_point: reorderPoint,
      status: isOutOfStock ? 'depleted' : isLowStock ? 'low_stock' : 'optimal',
      location: charCodeSum % 2 === 0 ? 'Zone A - Main Warehouse' : 'Zone B - Chemical Storage'
    };
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER CONTEXT */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Warehouse Inventory</h2>
          <p className="text-slate-500">Real-time stock monitoring, storage routing, and reorder alerts.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="h-10 border-slate-300 text-slate-700 bg-white">
            <Filter className="w-4 h-4 mr-2" /> Export Stock Report
          </Button>
        </div>
      </div>

      {/* KPI METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Tracked SKUs</CardTitle>
            <Layers className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalSkus}</div>
            <p className="text-xs text-slate-500 mt-1">Active items in master catalog</p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${lowStockAlerts > 0 ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${lowStockAlerts > 0 ? 'text-amber-800' : 'text-slate-600'}`}>
              Action Required: Low Stock
            </CardTitle>
            <AlertTriangle className={`h-4 w-4 ${lowStockAlerts > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lowStockAlerts > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
              {lowStockAlerts} Alerts
            </div>
            <p className={`text-xs mt-1 ${lowStockAlerts > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
              Items near or below reorder threshold
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Recent Outbound Activity</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">Healthy</div>
            <p className="text-xs text-slate-500 mt-1">Consumption rates nominal</p>
          </CardContent>
        </Card>
      </div>

      {/* INVENTORY TRACKING TABLE */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-slate-800">Live Stock Ledger</CardTitle>
              <CardDescription>Current available volumes across all storage facilities.</CardDescription>
            </div>
            
            {/* Filter / Search Bar */}
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search by SKU or Name..." 
                  className="pl-9 h-10 bg-white border-slate-300 focus-visible:ring-emerald-600"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px] h-10 bg-white border-slate-300 focus:ring-emerald-600">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="raw_materials">Raw Materials</SelectItem>
                  <SelectItem value="chemicals">Chemicals</SelectItem>
                  <SelectItem value="mro_spares">MRO / Spares</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="py-4 pl-6 font-semibold text-slate-700">SKU</TableHead>
                <TableHead className="font-semibold text-slate-700">Product Nomenclature</TableHead>
                <TableHead className="font-semibold text-slate-700">Storage Zone</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Available Stock</TableHead>
                <TableHead className="text-right pr-6 font-semibold text-slate-700">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryData?.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="pl-6 font-mono font-medium text-slate-900">
                    {item.sku}
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-medium text-slate-800">{item.name}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">
                      {item.category.replace('_', ' ')}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className="flex items-center text-sm text-slate-600">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      {item.location}
                    </span>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="font-bold text-slate-900 text-base">
                      {new Intl.NumberFormat('en-US').format(item.available_stock)}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {item.uom.replace('_', ' ').toUpperCase()}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right pr-6">
                    <Badge variant="outline" className={
                      item.status === 'optimal' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' :
                      item.status === 'low_stock' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm' :
                      'bg-red-50 text-red-700 border-red-200 shadow-sm font-bold'
                    }>
                      <span className="flex items-center uppercase tracking-wider text-[10px] font-bold">
                        {item.status === 'low_stock' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {item.status.replace('_', ' ')}
                      </span>
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              
              {(!inventoryData || inventoryData.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Package className="w-10 h-10 text-slate-300" />
                      <span>No products found in the active catalog.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}