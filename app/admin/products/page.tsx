import { createClient } from "@/lib/supabase/server";
import { createProduct } from "@/lib/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function ProductsPage() {
  const supabase = await createClient();
  
  // Fetch existing products directly on the server
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      {/* ADD NEW PRODUCT FORM */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-100 border-b border-slate-200 rounded-t-lg">
          <CardTitle className="text-lg text-slate-800">Add Master Product Configuration</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form action={createProduct} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: Identity */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" required placeholder="e.g. Granulated Urea" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">Unique SKU</Label>
                <Input id="sku" name="sku" required placeholder="PROD-001" className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select id="category" name="category" defaultValue="raw_materials" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="raw_materials">Raw Materials</option>
                  <option value="chemicals">Chemicals</option>
                  <option value="mro_spares">MRO / Spares</option>
                  <option value="packaging">Packaging</option>
                </select>
              </div>
            </div>

            {/* Column 2: Logistics */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="uom">Unit of Measure (UoM)</Label>
                <select id="uom" name="uom" defaultValue="metric_tons" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="metric_tons">Metric Tons (MT)</option>
                  <option value="kilograms">Kilograms (KG)</option>
                  <option value="liters">Liters (L)</option>
                  <option value="pieces">Pieces (PCS)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="size_spec">Sizing / Specification</Label>
                <Input id="size_spec" name="size_spec" required placeholder="e.g. Purity > 88%" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packaging_type">Packaging Type</Label>
                <select id="packaging_type" name="packaging_type" defaultValue="bulk" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="bulk">Bulk / Loose</option>
                  <option value="jumbo_bag">Jumbo Bag (1 MT)</option>
                  <option value="standard_bag">Standard Bag (50kg)</option>
                </select>
              </div>
            </div>

            {/* Column 3: Tax Compliance */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default_currency">Base Currency</Label>
                <select id="default_currency" name="default_currency" defaultValue="NGN" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="NGN">NGN (Naira)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wht_rate">Withholding Tax (WHT) Rate</Label>
                <select id="wht_rate" name="wht_rate" defaultValue="5.00" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="5.00">5.0% (Standard Supply)</option>
                  <option value="10.00">10.0% (Technical Services)</option>
                  <option value="0.00">Exempt</option>
                </select>
              </div>
              <div className="pt-6">
                <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800">
                  Save Product to Catalog
                </Button>
              </div>
            </div>
            
            {/* Hidden Input for VAT (Hardcoded to true for this spec) */}
            <input type="hidden" name="is_vat_applicable" value="true" />
          </form>
        </CardContent>
      </Card>

      {/* LIVE PRODUCT CATALOG TABLE */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">Live Product Vault</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Specs</TableHead>
                <TableHead>UoM</TableHead>
                <TableHead>WHT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium text-slate-900">{product.sku}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="text-slate-500 text-sm">{product.size_spec}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-100">{product.uom}</Badge>
                  </TableCell>
                  <TableCell>{product.wht_rate}%</TableCell>
                </TableRow>
              ))}
              {products?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                    No products found. Add one above.
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